"""Drive the web build through a full five-day game at phone size, screenshotting each new screen."""
import os, sys, time, subprocess, json
from playwright.sync_api import sync_playwright
DIST, OUT = sys.argv[1], sys.argv[2]
W, H = int(sys.argv[3]) if len(sys.argv) > 3 else 915, int(sys.argv[4]) if len(sys.argv) > 4 else 412
os.makedirs(OUT, exist_ok=True)
srv = subprocess.Popen([sys.executable, "-m", "http.server", "8765", "-d", DIST], stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
time.sleep(1)
seen, errors, log = set(), [], []
def shot(page, name):
    if name in seen: return
    seen.add(name); page.wait_for_timeout(700)
    page.screenshot(path=f"{OUT}/{len(seen):02d}_{name}.png")
try:
    with sync_playwright() as p:
        b = p.chromium.launch(executable_path="/usr/bin/google-chrome", args=["--no-sandbox", "--autoplay-policy=no-user-gesture-required"])
        page = b.new_page(viewport={"width": W, "height": H}, device_scale_factor=2)
        page.on("pageerror", lambda e: errors.append(str(e)))
        page.on("console", lambda m: errors.append(m.text) if m.type == "error" else None)
        page.goto("http://localhost:8765/"); page.wait_for_timeout(2500)
        def has(tid): return page.locator(f'[data-testid="{tid}"]').count() > 0
        def click(tid, idx=0):
            page.locator(f'[data-testid="{tid}"]').nth(idx).click(force=True); page.wait_for_timeout(250)
        def text(t): return page.get_by_text(t, exact=False).count() > 0
        steps = 0
        while steps < 600:
            steps += 1
            page.wait_for_timeout(150)
            if text("Your interests at the mela") and has("finish"):
                shot(page, "results"); click("finish"); continue
            if has("menu") and text("Thank you for volunteering"):
                shot(page, "ending"); click("menu"); page.wait_for_timeout(800); shot(page, "menu_after"); break
            if has("thats_me"): shot(page, "avatar"); page.locator("input").fill("Sitara"); click("thats_me"); continue
            if has("consent_yes"): shot(page, "before_start"); click("consent_yes"); click("ready"); continue
            if has("play") and not seen.intersection({"before_start"}): shot(page, "menu"); click("play"); continue
            if has("go") and text("Stall done!"):
                shot(page, "visit_complete"); click("go"); continue
            if has("stall_karigar"):
                shot(page, "stall_select")
                for sid in ["karigar","jugnu","rangmahal","madad","chatkhara","hisaab"]:
                    loc = page.locator(f'[data-testid="stall_{sid}"]')
                    if "visited" not in (loc.get_attribute("aria-label") or ""):
                        loc.click(force=True); break
                page.wait_for_timeout(200); click("go"); continue
            if has("choose"): shot(page, "map"); click("choose"); continue
            if has("job_board"): shot(page, "stall"); click("job_board"); page.wait_for_timeout(500); continue
            if has("heart_1"):
                shot(page, "loved"); click("heart_4"); click("confirm"); page.wait_for_timeout(700); continue
            if has("scale_1"):
                shot(page, "diary"); click("scale_3"); click("confirm"); page.wait_for_timeout(700); continue
            if has("opt_2"):
                shot(page, "what"); click("opt_1"); click("confirm"); page.wait_for_timeout(700); continue
            if has("opt_0") and has("opt_1"):
                shot(page, "how"); click("opt_0"); click("confirm"); page.wait_for_timeout(700); continue
            if has("next") and text("complete!"):
                shot(page, "summary"); click("next"); continue
            if has("day_go"): shot(page, "day_intro"); click("day_go"); continue
            if has("go") and text("See what it means"): shot(page, "reveal"); click("go"); continue
            if text("Your Mela Code!") : page.mouse.click(W/2, H/2); continue
            if has("skip"):
                name = "story" if text("Gulshan Model School has") else ("dialogue" if "dialogue" not in seen else "dialogue_" + str(steps))
                if name in ("story", "dialogue"): shot(page, name)
                click("skip"); continue
        page.screenshot(path=f"{OUT}/zz_final.png")
        log.append(f"steps={steps}")
        b.close()
finally:
    srv.terminate()
print(json.dumps({"seen": sorted(seen), "errors": errors[:20], "log": log}, indent=1))
