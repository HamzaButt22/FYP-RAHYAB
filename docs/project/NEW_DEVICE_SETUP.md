# Set up a new computer: view, run, debug and develop Rahyaab

Everything a teammate needs on a fresh Windows PC (macOS and Linux notes are marked) to see the designs, run the backend, run the app on an emulator or a phone, and debug it. Tested on Windows 11 on 13 Nov 2026. `GETTING_STARTED.md` has the team workflow; this file is only about the machine.

**Time:** about 2 hours the first time, most of it downloads. **Disk:** about 25 GB free (Android SDK, emulator image, Gradle cache and Docker). Put the big folders on a drive with space (step 3).

## 0. Just looking? No install needed

| To see | Open |
|---|---|
| Code, documents, CI results | GitHub: the repository's **Code** and **Actions** tabs |
| All 55 screen designs | `design/screens/index.html` in a browser (add `?theme=dark` for dark mode), or the PNGs in `design/screens/png/`, or Figma (links in `design/screens/README.md`) |
| Brand: logo, Hudhud, colours, fonts | `design/brand/BRAND_GUIDELINES.md`, `design/APPROVED.md` |
| Game design | `design/game/GAME_DESIGN.md` |
| What is built so far | `docs/project/GETTING_STARTED.md` §4 (status), `docs/project/MVP.md` |

## 1. Tools

| Tool | Version | Notes |
|---|---|---|
| Git | latest | During set-up on Windows, keep "Git Bash". Then `git config --global core.longpaths true` |
| VS Code | latest | Open `rahyaab.code-workspace`; accept the recommended extensions |
| Node.js | **24** | From nodejs.org |
| pnpm | **12** (CI uses 12) | `npm install -g pnpm@12` |
| Python | **3.13** through **uv** | `pip install uv`, then `uv python install 3.13` |
| Docker Desktop | latest | Database and API locally |
| JDK | **17** | Microsoft Build of OpenJDK 17 (tested). Set `JAVA_HOME` to its folder |
| Android Studio | latest | Only for the Android SDK and the emulator; we code in VS Code |

**Windows terminal:** Windows PowerShell 5.1 does not accept `&&`. Run the commands in this guide one at a time, or use Git Bash or PowerShell 7.

## 2. Get the code

```bash
git clone https://github.com/HamzaButt22/FYP-RAHYAB.git
```

Keep the folder path short (for example `D:\dev\FYP-RAHYAB`). Long paths break the Android C++ build on Windows (step 6).

## 3. Android SDK and emulator

1. Install Android Studio. In the first-run wizard choose **Custom**, and set the **SDK location** to a drive with space (we use `W:\Android Studio\Sdk`).
2. **More Actions → SDK Manager**:
   - **SDK Platforms:** tick **Android 16 (API 36)**.
   - **SDK Tools:** tick **Show Package Details**, then under **CMake** tick **3.31.6** (Windows needs it, step 6). Keep Android SDK Platform-Tools and the Emulator ticked.
   - The first app build downloads the NDK and build tools it needs by itself.
3. **More Actions → Virtual Device Manager → Create device**: a Pixel or "Medium Phone", the newest Google Play x86_64 image, 2–4 GB RAM.
4. **Environment variables** (Windows: Start → "Edit environment variables for your account"; these are per-user and need no administrator):

   | Variable | Value (example) |
   |---|---|
   | `ANDROID_HOME` | `W:\Android Studio\Sdk` (your SDK location) |
   | `JAVA_HOME` | `C:\Program Files\Microsoft\jdk-17…` |
   | `GRADLE_USER_HOME` | optional: `W:\Gradle`, to keep the 4 GB Gradle cache off drive C: |
   | `ANDROID_AVD_HOME` | optional: `W:\Android\avd`, to keep emulator images off drive C: |
   | `Path` (add) | `%ANDROID_HOME%\platform-tools` |

   **macOS/Linux:** export the same variables in `~/.zshrc` or `~/.bashrc`; the SDK is usually `~/Library/Android/sdk` (macOS) or `~/Android/Sdk` (Linux).

   **If you move the AVD folder by hand,** the `<name>.ini` file must be saved **without a byte-order mark** (UTF-8 without BOM). Otherwise Android Studio reports "Corrupted AVD ini file".
5. Close and reopen the terminal, then check:

```bash
java -version
```

```bash
adb --version
```

## 4. Backend (database and API)

```bash
python tools/dev.py up
```

```bash
python tools/dev.py seed
```

This creates the git-ignored `infra/docker/.env` and local secrets, starts PostgreSQL, the API (http://localhost:8000) and the jobs worker, and loads the synthetic development data. All other commands: `python tools/dev.py` with no argument. Tests:

```bash
python tools/dev.py check
```

## 5. The mobile app

The app uses a **development build** (`expo-dev-client`), not Expo Go. Start the emulator first (Virtual Device Manager → ▶), or connect a phone (below).

```bash
cd frontend/mobile
```

```bash
pnpm install
```

Build and install the app (the first time takes 10–60 minutes; later builds take about 1 minute). Repeat this only when a package with native code changes:

```bash
pnpm android
```

Every day after that, start the JavaScript server and open the **Rahyaab** app on the emulator:

```bash
pnpm start
```

Edits to `src/` appear on the phone at once (Fast Refresh).

**A real phone instead of the emulator:** Settings → About phone → tap "Build number" 7 times; then Developer options → **USB debugging** on. Connect the cable, accept the prompt on the phone, and check that `adb devices` lists it. Then run `pnpm android` as above.

**What you will see in a development build (normal, not part of Rahyaab):**
- a floating gear button (Expo's developer menu);
- a one-time "Allow Rahyaab to find nearby devices?" prompt from Expo's tools: choose **Don't allow**;
- "Skip to the app" on the join screen and "Start onboarding again" on You. Release builds have none of these.

## 6. Windows only: the C++ build fix (once per PC)

React Native compiles C++ with CMake, and its file paths can exceed the old 260-character Windows limit.
1. **Long paths on.** Check with `reg query HKLM\SYSTEM\CurrentControlSet\Control\FileSystem /v LongPathsEnabled`. If it is not `0x1`, an administrator must turn it on (Expo's guide "Windows long paths" has the command), then restart.
2. **CMake 3.31.6** installed (step 3). It ships Ninja 1.12.1, which handles long paths.
3. A personal Gradle settings file, `gradle.properties`, in `%USERPROFILE%\.gradle\` (or in your `GRADLE_USER_HOME`), containing:

```
android.cmakeVersion=3.31.6
```

This file is not in the repository, so cloud (EAS) and Linux builds keep their defaults. The mobile app's `pnpm-workspace.yaml` also sets `nodeLinker: hoisted` (a flat `node_modules`) to keep paths short.

## 7. Debugging

| What | How |
|---|---|
| Mobile: JavaScript, components, network | With `pnpm start` running, press **`j`** in its terminal to open React Native DevTools (breakpoints, console, network) |
| Mobile: developer menu | The gear button, or `adb shell input keyevent 82` |
| Mobile: native logs | `adb logcat -s ReactNativeJS` |
| Mobile: emulator can't reach the server | `adb reverse tcp:8081 tcp:8081`, then reopen the app |
| API, scoring, jobs | VS Code → Run and Debug (F5): the configurations are listed in `GETTING_STARTED.md` §3b |
| Dashboard | VS Code → "Dashboard: debug in Edge" |

## 8. Problems we have already hit

| Message | Cause | Fix |
|---|---|---|
| `ninja: error: manifest 'build.ninja' still dirty after 100 tries`, or `ninja: error: mkdir(...): No such file or directory` | Windows path length | Step 6, then delete `frontend/mobile/android` and the `node_modules/**/android/.cxx` folders and build again |
| `CMake '3.31.6' was not found` | The Gradle setting is there but CMake 3.31.6 is not installed | Step 3, SDK Tools |
| "Corrupted AVD ini file" in Android Studio | The `.ini` file was saved with a byte-order mark | Save it as UTF-8 without BOM (step 3.4) |
| `Port 8081 is unavailable` | An old Metro server is still running | Close the other terminal, or end the `node` process using port 8081 |
| `The token '&&' is not a valid statement separator` | Windows PowerShell 5.1 | Run the commands one at a time (step 1) |
| App shows "Unmatched Route" | A route was added without a matching file | Check `src/app/` against the links; `pnpm typecheck` catches most of these |
| Urdu letters such as گ lose their top stroke | Android clips Nastaliq above the first line | Always use `AppText` for text; it adds the headroom (`frontend/mobile/README.md`) |

## 9. What is not in the repository, on purpose

| Item | Why | Where to get it |
|---|---|---|
| Filled university templates (`docs/university/*.docx`) | They contain phone numbers | From the team's private drive |
| Research paper PDFs | Copyright | The citations and notes are in `docs/research/`; download the papers from the publishers |
| O*NET 31.0 CSV files | Large, and only needed to re-derive path profiles | onetcenter.org (CC BY 4.0); `tools/onet_profiles.py` explains which files |
| `.env` files and keys | Secrets | `python tools/dev.py up` creates local ones; production secrets live in GitHub environments |
| AI-assistant settings files | Personal | Each developer's own |
