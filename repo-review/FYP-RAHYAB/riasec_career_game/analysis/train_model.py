"""Train and validate the telemetry -> RIASEC model.

  python analysis/train_model.py dataset.csv          # real paired data
  python analysis/train_model.py --synthetic 600      # PIPELINE TEST ONLY (proves nothing about validity)

Reports: participant-grouped CV, per-scale r vs questionnaire, demographics-only baseline,
hexagon-structure check, test-retest (if participants have >=2 sessions).
Writes model.json (or model_SYNTHETIC.json for synthetic data) next to the game."""
import argparse, csv, json, os, random, sys
import numpy as np
from sklearn.ensemble import GradientBoostingRegressor
from sklearn.linear_model import RidgeCV
from sklearn.model_selection import GroupKFold, cross_val_predict
from sklearn.multioutput import MultiOutputRegressor
from sklearn.pipeline import make_pipeline
from sklearn.preprocessing import StandardScaler
sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))
import riasec_core as core
L6, FN = core.LETTERS, core.feature_names()

def synthetic(n, seed=0):
    rng = random.Random(seed); rows = []
    for i in range(n):
        true = core.random_true_profile(rng)
        for s in range(2 if i % 4 == 0 else 1):                     # some repeat sessions for test-retest
            f = core.features(core.simulate_session(true, rng).summary())
            r = {"participant_id": f"p{i}", "age_band": rng.choice(["18-24", "25-34", "35-44"]),
                 "gender": rng.choice(["Female", "Male"]), "language": "en", "device": "desktop", **f}
            r.update({f"q_{L}": min(100, max(0, true[L] + rng.gauss(0, 10))) for L in L6})
            rows.append(r)
    return rows

def read_csv(p):
    rows = list(csv.DictReader(open(p, encoding="utf-8")))
    for r in rows:
        for k in FN + [f"q_{L}" for L in L6]: r[k] = float(r[k])
    return rows

def onehot(rows, cols):
    cats = {c: sorted({r[c] for r in rows}) for c in cols}
    return np.array([[1.0 if r[c] == v else 0.0 for c in cols for v in cats[c]] for r in rows])

def per_scale_r(Y, P): return {L: float(np.corrcoef(Y[:, k], P[:, k])[0, 1]) if P[:, k].std() > 0 else 0.0 for k, L in enumerate(L6)}

def hexagon(M):                                   # mean r by hexagon distance 1,2,3 (expect decreasing)
    C = np.corrcoef(M.T); d = {1: [], 2: [], 3: []}
    for a in range(6):
        for b in range(a + 1, 6):
            d[min((b - a) % 6, (a - b) % 6)].append(C[a, b])
    return {k: round(float(np.mean(v)), 2) for k, v in d.items()}

def main():
    ap = argparse.ArgumentParser(); ap.add_argument("csv", nargs="?"); ap.add_argument("--synthetic", type=int)
    ap.add_argument("--gbr", action="store_true", help="also evaluate gradient boosting"); a = ap.parse_args()
    synth = bool(a.synthetic)
    rows = synthetic(a.synthetic) if synth else read_csv(a.csv)
    if synth: print("*** SYNTHETIC DATA: this tests the pipeline only. Results say NOTHING about real validity. ***\n")
    X = np.array([[r[f] for f in FN] for r in rows]); Y = np.array([[r[f"q_{L}"] for L in L6] for r in rows])
    groups = np.array([r["participant_id"] for r in rows]); ng = len(set(groups))
    if ng < 30: print(f"WARNING: only {ng} participants. Plan: a few hundred to choose features, 1000+ to trust a model.")
    cv = GroupKFold(n_splits=min(5, ng))
    ridge = make_pipeline(StandardScaler(), MultiOutputRegressor(RidgeCV(alphas=np.logspace(-2, 3, 12))))
    P = cross_val_predict(ridge, X, Y, cv=cv, groups=groups)
    print("Per-scale r (game-predicted vs questionnaire, grouped CV):"); R = per_scale_r(Y, P)
    for L in L6: print(f"  {L}: r = {R[L]:+.2f}")
    D = onehot(rows, ["age_band", "gender", "language", "device"])
    Pb = cross_val_predict(make_pipeline(StandardScaler(with_mean=False), MultiOutputRegressor(RidgeCV(alphas=np.logspace(-2, 3, 12)))), D, Y, cv=cv, groups=groups)
    Rb = per_scale_r(Y, Pb); print("Demographics-only baseline r:", {L: round(Rb[L], 2) for L in L6})
    print("Mean r game vs baseline:", round(np.mean(list(R.values())), 2), "vs", round(np.mean(list(Rb.values())), 2))
    print("Hexagon (mean r at distance 1/2/3) questionnaire:", hexagon(Y), " predicted:", hexagon(P))
    if a.gbr:
        Pg = cross_val_predict(MultiOutputRegressor(GradientBoostingRegressor(n_estimators=150, max_depth=2, learning_rate=0.05)), X, Y, cv=cv, groups=groups)
        print("Gradient boosting mean r:", round(np.mean(list(per_scale_r(Y, Pg).values())), 2))
    by = {}
    for i, g in enumerate(groups): by.setdefault(g, []).append(i)
    pairs = [v[:2] for v in by.values() if len(v) >= 2]
    if len(pairs) >= 10:
        print("Test-retest (game-predicted scores, 2 sessions):", {L: round(float(np.corrcoef(P[[p[0] for p in pairs], k], P[[p[1] for p in pairs], k])[0, 1]), 2) for k, L in enumerate(L6)})
    else: print("Test-retest: need >=10 participants with 2 sessions.")
    sc = StandardScaler().fit(X); Z = sc.transform(X)
    from sklearn.linear_model import Ridge
    coef, icpt, sd = {}, {}, {}
    for k, L in enumerate(L6):
        alpha = float(RidgeCV(alphas=np.logspace(-2, 3, 12)).fit(Z, Y[:, k]).alpha_)
        m = Ridge(alpha=alpha).fit(Z, Y[:, k]); coef[L] = m.coef_.tolist(); icpt[L] = float(m.intercept_)
        sd[L] = float(np.std(Y[:, k] - P[:, k]))
    out = os.path.join(os.path.dirname(__file__), "..", "model_SYNTHETIC.json" if synth else "model.json")
    json.dump({"features": FN, "mean": sc.mean_.tolist(), "std": sc.scale_.tolist(), "coef": coef, "intercept": icpt,
               "resid_sd": sd, "synthetic": synth, "n_participants": ng, "cv_r": R}, open(out, "w"), indent=1)
    print("\nSaved", os.path.abspath(out), "(rename to model.json to activate)" if synth else "(game will use it automatically)")

if __name__ == "__main__": main()
