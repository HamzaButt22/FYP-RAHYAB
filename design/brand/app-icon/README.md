# App icons

The `svg/` files are the editable masters. `png/` holds files at the sizes Expo, the Play Store and the App Store need.

| PNG | Replaces in the app | Notes |
|---|---|---|
| `icon-ios-expo.png` | `assets/icon.png` | 1024 × 1024, opaque, full bleed (the OS rounds the corners) |
| `android-adaptive-foreground.png` | `assets/android-icon-foreground.png` | Logo inside the 66% safe zone, transparent |
| `android-adaptive-background.png` | `assets/android-icon-background.png` | Solid `#F6EFE3` |
| `android-adaptive-monochrome.png` | `assets/android-icon-monochrome.png` | Android 13+ themed icons |
| `splash-icon-light.png` | `assets/splash-icon.png` | On a `#F6EFE3` splash |
| `splash-icon-dark.png` | dark splash image | On a `#121B1B` splash |
| `favicon-48.png` | `assets/favicon.png` | Web and the teacher dashboard (192 and 512 for PWA) |
| `icon-terracotta.png`, `icon-dark.png` | — | Alternatives for store artwork or A/B tests |

## Switching the app to the new icons (when you're ready)

1. Copy the PNGs over the files in `assets/` named in the table above.
2. In `app.json`:
   - set `"userInterfaceStyle": "automatic"` (enables dark mode);
   - set `"android.adaptiveIcon.backgroundColor": "#F6EFE3"`;
   - add the `expo-splash-screen` plugin with `"image": "./assets/splash-icon.png"`, `"backgroundColor": "#F6EFE3"`, `"imageWidth": 200`, and a `"dark"` block using `splash-icon-dark.png` and `"#121B1B"`.
3. Rebuild with `npx expo prebuild --clean` or an EAS build. Icons do not update over hot reload.

`design/brand/store/play-feature-graphic-1024x500.png` is the Google Play feature graphic.
