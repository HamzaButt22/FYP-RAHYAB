"""Turn sessions/*.json into a training CSV (one row per session).
Usage: python analysis/build_dataset.py [sessions_dir] [out.csv]
Rows without a completed questionnaire are skipped (no ground truth)."""
import csv, glob, json, os, sys
sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))
import riasec_core as core

def main(sdir="sessions", out="dataset.csv"):
    rows = []
    for p in sorted(glob.glob(os.path.join(sdir, "session_*.json"))):
        d = json.load(open(p, encoding="utf-8"))
        q = d.get("questionnaire_scores")
        if not q or any(q.get(L) is None for L in core.LETTERS): continue
        row = {"participant_id": d["participant_id"], "age_band": d["meta"].get("age_band", ""),
               "gender": d["meta"].get("gender", ""), "language": d["meta"].get("language", ""),
               "device": d["meta"].get("device", {}).get("type", "")}
        row.update(d["features"]); row.update({f"q_{L}": q[L] for L in core.LETTERS})
        rows.append(row)
    if not rows: sys.exit("No sessions with a completed questionnaire found.")
    with open(out, "w", newline="", encoding="utf-8") as fh:
        w = csv.DictWriter(fh, fieldnames=list(rows[0])); w.writeheader(); w.writerows(rows)
    print(f"Wrote {len(rows)} rows to {out}")

if __name__ == "__main__":
    main(*sys.argv[1:3])
