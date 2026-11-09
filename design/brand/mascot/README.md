# Hudhud (mascot)

The `svg/` files are the editable masters. `png/` holds exports at 128px (@1x), 256px (@2x) and 384px (@3x). Use files ending `-dark` on dark grounds: their body is brighter (`#D9643F`) and they have a cream die-cut edge. The edge is drawn as plain shapes, not an SVG filter, so it renders in `react-native-svg`.

| Pose | Use |
|---|---|
| `hudhud` | Default, hero, onboarding |
| `hudhud-listening` | While the student plays; calm |
| `hudhud-curious` | After a surprising choice |
| `hudhud-thinking` | Short waits, model updating |
| `hudhud-reading` | Explore, course pages |
| `hudhud-headphones` | Home, weekly recap |
| `hudhud-sleeping` | Offline, waiting for parent consent |
| `hudhud-waving` | First launch, back after a break |
| `hudhud-celebrating` | Blueprint reveal only |
| `hudhud-messenger` | Delivers the Blueprint, notifications |

The mascot never appears on **parent-facing** consent pages (P-02), parent reports, teacher screens or payment screens. It may appear on the **student's own** waiting screen ("waiting for a parent", `hudhud-sleeping`), which is part of the student's game.
