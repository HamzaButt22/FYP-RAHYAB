# APNA MELA — Asset Manifest

| | |
|---|---|
| **Document** | ASSET_MANIFEST.md · v1.0 |
| **Dimensions** | Pixel sizes at **1× logical (1920×1080)**. Optional @2× copies for 4K use the suffix `@2x` (e.g. `bg_menu_mela_dusk@2x.png`, 3840×2160). |
| **Formats** | PNG-24 with alpha for art (sRGB, no embedded profile beyond sRGB); OGG for audio; TTF for fonts. Opaque backgrounds may ship as high-quality JPG if size matters (keep the `.png` name in data, swap the extension at build time). |
| **Folders** | `assets/bg/`, `assets/story/`, `assets/char/`, `assets/props/`, `assets/jobs/`, `assets/ui/`, `assets/fx/`, `assets/fonts/`, `assets/audio/music/`, `assets/audio/sfx/`, `assets/audio/vo/`, `data/` |
| **Naming** | lowercase snake_case · `category_subject_variant.ext` · no spaces · every filename is unique across the project |
| **Totals** | **351 entries** · **323 essential** · **28 optional** (sets written as `a / b` count as one entry) |

> **Essential** = needed to ship v1.0 at the quality shown in the mockups. **Optional** = adds polish; the game must work without it (code falls back to a simpler presentation).

**Art rules for every asset:** follow UI_STYLE_GUIDE (5 px ink outline at 1× reference size, palette hex values, flat colour + one highlight) and CHARACTER_BIBLE (proportions, props). Leave 8 px transparent padding around sprites. Pivot = bottom-centre for characters, centre for icons. Characters are delivered as layers (body + face) so the 6 poses × 7 faces combine at runtime.

## A. Backgrounds & scenes

*18 entries · 16 essential · 2 optional*

| # | Filename | Dimensions | Priority | Notes |
|---|---|---|---|---|
| 1 | `bg_menu_mela_dusk.png` | 1920×1080 | Essential | Main menu, Daily Summary (blurred). Ferris wheel and tent layers separate for ambient animation (see below) |
| 2 | `bg_school_courtyard_day.png` | 1920×1080 | Essential | Morning dialogue scenes (school building, neem trees, bunting) |
| 3 | `bg_mela_map_day.png` | 1920×1080 | Essential | Mela Map base (path, grass, jhoola base). Tents are separate sprites |
| 4 | `bg_mela_night.png` | 1920×1080 | Essential | Diary, evening transition, closing ceremony, finale (lights off) |
| 5 | `bg_mela_night_lights_on.png` | 1920×1080 | Essential | Overlay layer: lit bulbs + glow (cross-faded in) |
| 6 | `bg_stall_karigar.png` | 1920×1080 | Essential | Karigar Workshop: awning, sign board (text drawn in code), counter, props |
| 7 | `bg_stall_jugnu.png` | 1920×1080 | Essential | Jugnu Science Tent: awning, sign board (text drawn in code), counter, props |
| 8 | `bg_stall_rangmahal.png` | 1920×1080 | Essential | Rang Mahal Art Stall: awning, sign board (text drawn in code), counter, props |
| 9 | `bg_stall_madad.png` | 1920×1080 | Essential | Madad Markaz Help Desk: awning, sign board (text drawn in code), counter, props |
| 10 | `bg_stall_chatkhara.png` | 1920×1080 | Essential | Chatkhara Chaat Stall: awning, sign board (text drawn in code), counter, props |
| 11 | `bg_stall_hisaab.png` | 1920×1080 | Essential | Hisaab Ghar Ticket Office: awning, sign board (text drawn in code), counter, props |
| 12 | `bg_board_wall.png` | 1920×1080 | Essential | Wooden wall + truck-art frame + corkboard (Mela Board) |
| 13 | `bg_storybook_night_tile.png` | 512×512 (tileable) | Essential | Opening story and credits background |
| 14 | `bg_pattern_soft_tile.png` | 512×512 (tileable) | Essential | Cream lattice pattern for menus and results |
| 15 | `ui_letterbox_tile.png` | 256×256 (tileable) | Essential | Letterbox fill |
| 16 | `bg_sky_gradients.json` | data | Essential | Day / dusk / night gradient stops (drawn in code) |
| 17 | `bg_mela_map_day5_overlay.png` | 1920×1080 | Optional | Extra decorations + stage banner for Mela Day |
| 18 | `bg_menu_parallax_far.png / _mid.png` | 2112×1080 each | Optional | Parallax layers (turned off with Reduce Motion) |

## B. Story illustrations

*5 entries · 5 essential · 0 optional*

| # | Filename | Dimensions | Priority | Notes |
|---|---|---|---|---|
| 1 | `story_panel_01_gate.png` | 560×600 | Essential | School gate + '5 DAYS TO GO' banner (banner text drawn in code) |
| 2 | `story_panel_02_karim_banner.png` | 560×600 | Essential | Ustad Karim (worried) holding the torn banner |
| 3 | `story_panel_03_hudhud_neem.png` | 560×600 | Essential | Hudhud lands on the neem branch, avatar slot left empty (composited) |
| 4 | `story_panel_04_hudhud_closeup.png` | 1200×600 | Essential | Hudhud close-up with the glowing diary |
| 5 | `closing_stage_night.png` | 1920×1080 | Essential | Stage with all characters' slots for the closing ceremony |

## C. Characters (layered)

*126 entries · 114 essential · 12 optional*

| # | Filename | Dimensions | Priority | Notes |
|---|---|---|---|---|
| 1 | `char_zain_body_idle.png` | 640×1000 | Essential | Body layer, head area left blank with a pivot marker |
| 2 | `char_zain_body_wave.png` | 640×1000 | Essential | Body layer, head area left blank with a pivot marker |
| 3 | `char_zain_body_point.png` | 640×1000 | Essential | Body layer, head area left blank with a pivot marker |
| 4 | `char_zain_body_think.png` | 640×1000 | Essential | Body layer, head area left blank with a pivot marker |
| 5 | `char_zain_body_busy.png` | 640×1000 | Essential | Body layer, head area left blank with a pivot marker |
| 6 | `char_zain_body_cheer.png` | 640×1000 | Essential | Body layer, head area left blank with a pivot marker |
| 7 | `char_zain_face_smile.png` | 400×400 | Essential | Head layer (hair + face) anchored at the head pivot |
| 8 | `char_zain_face_happy.png` | 400×400 | Essential | Head layer (hair + face) anchored at the head pivot |
| 9 | `char_zain_face_talk.png` | 400×400 | Essential | Head layer (hair + face) anchored at the head pivot |
| 10 | `char_zain_face_wow.png` | 400×400 | Essential | Head layer (hair + face) anchored at the head pivot |
| 11 | `char_zain_face_think.png` | 400×400 | Essential | Head layer (hair + face) anchored at the head pivot |
| 12 | `char_zain_face_worried.png` | 400×400 | Essential | Head layer (hair + face) anchored at the head pivot |
| 13 | `char_zain_face_blink.png` | 400×400 | Essential | Head layer (hair + face) anchored at the head pivot |
| 14 | `char_zain_portrait.png` | 512×512 | Optional | Pre-composed circular portrait (otherwise cropped in code) |
| 15 | `char_hira_body_idle.png` | 640×1000 | Essential | Body layer, head area left blank with a pivot marker |
| 16 | `char_hira_body_wave.png` | 640×1000 | Essential | Body layer, head area left blank with a pivot marker |
| 17 | `char_hira_body_point.png` | 640×1000 | Essential | Body layer, head area left blank with a pivot marker |
| 18 | `char_hira_body_think.png` | 640×1000 | Essential | Body layer, head area left blank with a pivot marker |
| 19 | `char_hira_body_busy.png` | 640×1000 | Essential | Body layer, head area left blank with a pivot marker |
| 20 | `char_hira_body_cheer.png` | 640×1000 | Essential | Body layer, head area left blank with a pivot marker |
| 21 | `char_hira_face_smile.png` | 400×400 | Essential | Head layer (hair + face) anchored at the head pivot |
| 22 | `char_hira_face_happy.png` | 400×400 | Essential | Head layer (hair + face) anchored at the head pivot |
| 23 | `char_hira_face_talk.png` | 400×400 | Essential | Head layer (hair + face) anchored at the head pivot |
| 24 | `char_hira_face_wow.png` | 400×400 | Essential | Head layer (hair + face) anchored at the head pivot |
| 25 | `char_hira_face_think.png` | 400×400 | Essential | Head layer (hair + face) anchored at the head pivot |
| 26 | `char_hira_face_worried.png` | 400×400 | Essential | Head layer (hair + face) anchored at the head pivot |
| 27 | `char_hira_face_blink.png` | 400×400 | Essential | Head layer (hair + face) anchored at the head pivot |
| 28 | `char_hira_portrait.png` | 512×512 | Optional | Pre-composed circular portrait (otherwise cropped in code) |
| 29 | `char_bilal_body_idle.png` | 640×1000 | Essential | Body layer, head area left blank with a pivot marker |
| 30 | `char_bilal_body_wave.png` | 640×1000 | Essential | Body layer, head area left blank with a pivot marker |
| 31 | `char_bilal_body_point.png` | 640×1000 | Essential | Body layer, head area left blank with a pivot marker |
| 32 | `char_bilal_body_think.png` | 640×1000 | Essential | Body layer, head area left blank with a pivot marker |
| 33 | `char_bilal_body_busy.png` | 640×1000 | Essential | Body layer, head area left blank with a pivot marker |
| 34 | `char_bilal_body_cheer.png` | 640×1000 | Essential | Body layer, head area left blank with a pivot marker |
| 35 | `char_bilal_face_smile.png` | 400×400 | Essential | Head layer (hair + face) anchored at the head pivot |
| 36 | `char_bilal_face_happy.png` | 400×400 | Essential | Head layer (hair + face) anchored at the head pivot |
| 37 | `char_bilal_face_talk.png` | 400×400 | Essential | Head layer (hair + face) anchored at the head pivot |
| 38 | `char_bilal_face_wow.png` | 400×400 | Essential | Head layer (hair + face) anchored at the head pivot |
| 39 | `char_bilal_face_think.png` | 400×400 | Essential | Head layer (hair + face) anchored at the head pivot |
| 40 | `char_bilal_face_worried.png` | 400×400 | Essential | Head layer (hair + face) anchored at the head pivot |
| 41 | `char_bilal_face_blink.png` | 400×400 | Essential | Head layer (hair + face) anchored at the head pivot |
| 42 | `char_bilal_portrait.png` | 512×512 | Optional | Pre-composed circular portrait (otherwise cropped in code) |
| 43 | `char_sara_body_idle.png` | 640×1000 | Essential | Body layer, head area left blank with a pivot marker |
| 44 | `char_sara_body_wave.png` | 640×1000 | Essential | Body layer, head area left blank with a pivot marker |
| 45 | `char_sara_body_point.png` | 640×1000 | Essential | Body layer, head area left blank with a pivot marker |
| 46 | `char_sara_body_think.png` | 640×1000 | Essential | Body layer, head area left blank with a pivot marker |
| 47 | `char_sara_body_busy.png` | 640×1000 | Essential | Body layer, head area left blank with a pivot marker |
| 48 | `char_sara_body_cheer.png` | 640×1000 | Essential | Body layer, head area left blank with a pivot marker |
| 49 | `char_sara_face_smile.png` | 400×400 | Essential | Head layer (hair + face) anchored at the head pivot |
| 50 | `char_sara_face_happy.png` | 400×400 | Essential | Head layer (hair + face) anchored at the head pivot |
| 51 | `char_sara_face_talk.png` | 400×400 | Essential | Head layer (hair + face) anchored at the head pivot |
| 52 | `char_sara_face_wow.png` | 400×400 | Essential | Head layer (hair + face) anchored at the head pivot |
| 53 | `char_sara_face_think.png` | 400×400 | Essential | Head layer (hair + face) anchored at the head pivot |
| 54 | `char_sara_face_worried.png` | 400×400 | Essential | Head layer (hair + face) anchored at the head pivot |
| 55 | `char_sara_face_blink.png` | 400×400 | Essential | Head layer (hair + face) anchored at the head pivot |
| 56 | `char_sara_portrait.png` | 512×512 | Optional | Pre-composed circular portrait (otherwise cropped in code) |
| 57 | `char_karim_body_idle.png` | 640×1120 | Essential |  |
| 58 | `char_karim_body_point.png` | 640×1120 | Essential |  |
| 59 | `char_karim_body_think.png` | 640×1120 | Essential |  |
| 60 | `char_karim_body_wave.png` | 640×1120 | Essential |  |
| 61 | `char_karim_body_cheer.png` | 640×1120 | Essential |  |
| 62 | `char_karim_face_smile.png` | 420×420 | Essential |  |
| 63 | `char_karim_face_happy.png` | 420×420 | Essential |  |
| 64 | `char_karim_face_talk.png` | 420×420 | Essential |  |
| 65 | `char_karim_face_wow.png` | 420×420 | Essential |  |
| 66 | `char_karim_face_think.png` | 420×420 | Essential |  |
| 67 | `char_karim_face_worried.png` | 420×420 | Essential |  |
| 68 | `char_karim_face_blink.png` | 420×420 | Essential |  |
| 69 | `char_karim_body_handkerchief.png` | 640×1120 | Optional | Closing ceremony one-off |
| 70 | `char_sara_body_photo.png` | 640×1000 | Essential | Camera raised to her eye (visit complete / board) |
| 71 | `char_hudhud_smile.png` | 512×512 | Essential | Full-body still (perched) |
| 72 | `char_hudhud_happy.png` | 512×512 | Essential | Full-body still (perched) |
| 73 | `char_hudhud_talk.png` | 512×512 | Essential | Full-body still (perched) |
| 74 | `char_hudhud_wow.png` | 512×512 | Essential | Full-body still (perched) |
| 75 | `char_hudhud_think.png` | 512×512 | Essential | Full-body still (perched) |
| 76 | `char_hudhud_worried.png` | 512×512 | Essential | Full-body still (perched) |
| 77 | `char_hudhud_blink.png` | 512×512 | Essential | Full-body still (perched) |
| 78 | `char_hudhud_idle_sheet.png` | 4096×512 (8 frames @512) | Essential | Horizontal sprite sheet, 12 fps |
| 79 | `char_hudhud_fly_sheet.png` | 4096×512 (8 frames @512) | Essential | Horizontal sprite sheet, 12 fps |
| 80 | `char_hudhud_crest_flutter_sheet.png` | 3072×512 (6 frames @512) | Essential | Horizontal sprite sheet, 12 fps |
| 81 | `char_hudhud_hop_sheet.png` | 3072×512 (6 frames @512) | Essential | Horizontal sprite sheet, 12 fps |
| 82 | `char_hudhud_write_sheet.png` | 3072×512 (6 frames @512) | Essential | Horizontal sprite sheet, 12 fps |
| 83 | `char_hudhud_present.png` | 640×640 | Essential | Wings open, diary glowing (finale) |
| 84 | `avatar_body_idle.png` | 640×1000 | Essential | Shared body in the pink Volunteer T-shirt |
| 85 | `avatar_body_idle_skinmask.png` | 640×1000 | Essential | Greyscale mask tinted to skin s1–s4 in code |
| 86 | `avatar_body_wave.png` | 640×1000 | Essential | Shared body in the pink Volunteer T-shirt |
| 87 | `avatar_body_wave_skinmask.png` | 640×1000 | Essential | Greyscale mask tinted to skin s1–s4 in code |
| 88 | `avatar_body_point.png` | 640×1000 | Essential | Shared body in the pink Volunteer T-shirt |
| 89 | `avatar_body_point_skinmask.png` | 640×1000 | Essential | Greyscale mask tinted to skin s1–s4 in code |
| 90 | `avatar_body_think.png` | 640×1000 | Essential | Shared body in the pink Volunteer T-shirt |
| 91 | `avatar_body_think_skinmask.png` | 640×1000 | Essential | Greyscale mask tinted to skin s1–s4 in code |
| 92 | `avatar_body_busy.png` | 640×1000 | Essential | Shared body in the pink Volunteer T-shirt |
| 93 | `avatar_body_busy_skinmask.png` | 640×1000 | Essential | Greyscale mask tinted to skin s1–s4 in code |
| 94 | `avatar_body_cheer.png` | 640×1000 | Essential | Shared body in the pink Volunteer T-shirt |
| 95 | `avatar_body_cheer_skinmask.png` | 640×1000 | Essential | Greyscale mask tinted to skin s1–s4 in code |
| 96 | `avatar_head_A1_hair_front.png` | 400×400 | Essential | Hair/hijab front layer |
| 97 | `avatar_head_A1_hair_back.png` | 400×400 | Essential | Long hair / hijab drape behind the body (blank if not needed) |
| 98 | `avatar_head_A2_hair_front.png` | 400×400 | Essential | Hair/hijab front layer |
| 99 | `avatar_head_A2_hair_back.png` | 400×400 | Essential | Long hair / hijab drape behind the body (blank if not needed) |
| 100 | `avatar_head_A3_hair_front.png` | 400×400 | Essential | Hair/hijab front layer |
| 101 | `avatar_head_A3_hair_back.png` | 400×400 | Essential | Long hair / hijab drape behind the body (blank if not needed) |
| 102 | `avatar_head_A4_hair_front.png` | 400×400 | Essential | Hair/hijab front layer |
| 103 | `avatar_head_A4_hair_back.png` | 400×400 | Essential | Long hair / hijab drape behind the body (blank if not needed) |
| 104 | `avatar_head_A5_hair_front.png` | 400×400 | Essential | Hair/hijab front layer |
| 105 | `avatar_head_A5_hair_back.png` | 400×400 | Essential | Long hair / hijab drape behind the body (blank if not needed) |
| 106 | `avatar_head_A6_hair_front.png` | 400×400 | Essential | Hair/hijab front layer |
| 107 | `avatar_head_A6_hair_back.png` | 400×400 | Essential | Long hair / hijab drape behind the body (blank if not needed) |
| 108 | `avatar_head_A7_hair_front.png` | 400×400 | Essential | Hair/hijab front layer |
| 109 | `avatar_head_A7_hair_back.png` | 400×400 | Essential | Long hair / hijab drape behind the body (blank if not needed) |
| 110 | `avatar_head_A8_hair_front.png` | 400×400 | Essential | Hair/hijab front layer |
| 111 | `avatar_head_A8_hair_back.png` | 400×400 | Essential | Long hair / hijab drape behind the body (blank if not needed) |
| 112 | `avatar_face_smile.png` | 400×400 | Essential | Shared face features (eyes, brows, mouth, blush) |
| 113 | `avatar_face_happy.png` | 400×400 | Essential | Shared face features (eyes, brows, mouth, blush) |
| 114 | `avatar_face_talk.png` | 400×400 | Essential | Shared face features (eyes, brows, mouth, blush) |
| 115 | `avatar_face_wow.png` | 400×400 | Essential | Shared face features (eyes, brows, mouth, blush) |
| 116 | `avatar_face_think.png` | 400×400 | Essential | Shared face features (eyes, brows, mouth, blush) |
| 117 | `avatar_face_worried.png` | 400×400 | Essential | Shared face features (eyes, brows, mouth, blush) |
| 118 | `avatar_face_blink.png` | 400×400 | Essential | Shared face features (eyes, brows, mouth, blush) |
| 119 | `avatar_glasses.png` | 400×400 | Essential | Overlay for A5 |
| 120 | `avatar_walk_sheet.png` | 768×256 (4 frames @192) | Optional | Map walk cycle (otherwise idle + bob) |
| 121 | `npc_crowd_01.png` | 160×260 | Optional | Day 5 visitors on the map (families, children) |
| 122 | `npc_crowd_02.png` | 160×260 | Optional | Day 5 visitors on the map (families, children) |
| 123 | `npc_crowd_03.png` | 160×260 | Optional | Day 5 visitors on the map (families, children) |
| 124 | `npc_crowd_04.png` | 160×260 | Optional | Day 5 visitors on the map (families, children) |
| 125 | `npc_crowd_05.png` | 160×260 | Optional | Day 5 visitors on the map (families, children) |
| 126 | `npc_crowd_06.png` | 160×260 | Optional | Day 5 visitors on the map (families, children) |

## D. World props & stall assets

*35 entries · 28 essential · 7 optional*

| # | Filename | Dimensions | Priority | Notes |
|---|---|---|---|---|
| 1 | `stall_tent_karigar_map.png` | 280×250 | Essential | Map tent in the stall colour |
| 2 | `stall_icon_karigar.png` | 128×128 | Essential | Icon disc (also 64×64 export) |
| 3 | `stall_card_art_karigar.png` | 140×126 | Essential | Small tent for the stall card header |
| 4 | `stall_prop_loop_karigar_sheet.png` | 1536×256 (6 frames @256) | Optional | Ambient prop loop (steam, bubbles, kite…) |
| 5 | `stall_tent_jugnu_map.png` | 280×250 | Essential | Map tent in the stall colour |
| 6 | `stall_icon_jugnu.png` | 128×128 | Essential | Icon disc (also 64×64 export) |
| 7 | `stall_card_art_jugnu.png` | 140×126 | Essential | Small tent for the stall card header |
| 8 | `stall_prop_loop_jugnu_sheet.png` | 1536×256 (6 frames @256) | Optional | Ambient prop loop (steam, bubbles, kite…) |
| 9 | `stall_tent_rangmahal_map.png` | 280×250 | Essential | Map tent in the stall colour |
| 10 | `stall_icon_rangmahal.png` | 128×128 | Essential | Icon disc (also 64×64 export) |
| 11 | `stall_card_art_rangmahal.png` | 140×126 | Essential | Small tent for the stall card header |
| 12 | `stall_prop_loop_rangmahal_sheet.png` | 1536×256 (6 frames @256) | Optional | Ambient prop loop (steam, bubbles, kite…) |
| 13 | `stall_tent_madad_map.png` | 280×250 | Essential | Map tent in the stall colour |
| 14 | `stall_icon_madad.png` | 128×128 | Essential | Icon disc (also 64×64 export) |
| 15 | `stall_card_art_madad.png` | 140×126 | Essential | Small tent for the stall card header |
| 16 | `stall_prop_loop_madad_sheet.png` | 1536×256 (6 frames @256) | Optional | Ambient prop loop (steam, bubbles, kite…) |
| 17 | `stall_tent_chatkhara_map.png` | 280×250 | Essential | Map tent in the stall colour |
| 18 | `stall_icon_chatkhara.png` | 128×128 | Essential | Icon disc (also 64×64 export) |
| 19 | `stall_card_art_chatkhara.png` | 140×126 | Essential | Small tent for the stall card header |
| 20 | `stall_prop_loop_chatkhara_sheet.png` | 1536×256 (6 frames @256) | Optional | Ambient prop loop (steam, bubbles, kite…) |
| 21 | `stall_tent_hisaab_map.png` | 280×250 | Essential | Map tent in the stall colour |
| 22 | `stall_icon_hisaab.png` | 128×128 | Essential | Icon disc (also 64×64 export) |
| 23 | `stall_card_art_hisaab.png` | 140×126 | Essential | Small tent for the stall card header |
| 24 | `stall_prop_loop_hisaab_sheet.png` | 1536×256 (6 frames @256) | Optional | Ambient prop loop (steam, bubbles, kite…) |
| 25 | `prop_ferris_wheel_rotor.png` | 520×520 | Essential | Rotating wheel (cabins are separate) |
| 26 | `prop_ferris_wheel_stand.png` | 520×420 | Essential |  |
| 27 | `prop_ferris_cabin.png` | 64×52 | Essential | Tinted in code (8 colours) |
| 28 | `prop_kaam_board.png` | 440×400 | Essential | Corkboard with frame (notes in code) |
| 29 | `prop_kaam_note_01..04.png` | 160×130 each | Essential | 4 pinned paper notes |
| 30 | `prop_polaroid_frame.png` | 240×276 (9-slice) | Essential | Photos composited inside |
| 31 | `prop_diary_spread.png` | 1540×820 | Essential | Open book (pages + cover) |
| 32 | `prop_diary_page_turn_sheet.png` | 3080×820 (4 frames) | Optional | Page turn animation (otherwise a skew tween) |
| 33 | `prop_quill.png` | 120×120 | Essential |  |
| 34 | `prop_podium.png` | 640×160 | Essential | Avatar selection podium |
| 35 | `prop_neem_tree.png` | 420×520 | Essential | Reused on several scenes |

## E. Job illustrations (What cards)

*60 entries · 60 essential · 0 optional*

| # | Filename | Dimensions | Priority | Notes |
|---|---|---|---|---|
| 1 | `job_r01.png` | 220×220 | Essential | "Fix the wobbly stall table". Neutral style; no stall colours or icons |
| 2 | `job_r02.png` | 220×220 | Essential | "Build a kite frame from bamboo sticks". Neutral style; no stall colours or icons |
| 3 | `job_r03.png` | 220×220 | Essential | "Hang up the string lights safely". Neutral style; no stall colours or icons |
| 4 | `job_r04.png` | 220×220 | Essential | "Oil the creaky wheels of the jhoola". Neutral style; no stall colours or icons |
| 5 | `job_r05.png` | 220×220 | Essential | "Hammer together the ticket booth". Neutral style; no stall colours or icons |
| 6 | `job_r06.png` | 220×220 | Essential | "Plant marigolds along the entrance path". Neutral style; no stall colours or icons |
| 7 | `job_r07.png` | 220×220 | Essential | "Put up the tent poles and ropes". Neutral style; no stall colours or icons |
| 8 | `job_r08.png` | 220×220 | Essential | "Fix a flat tyre at the bicycle stand". Neutral style; no stall colours or icons |
| 9 | `job_r09.png` | 220×220 | Essential | "Set up the speakers and cables". Neutral style; no stall colours or icons |
| 10 | `job_r10.png` | 220×220 | Essential | "Carve wooden name plates for the stalls". Neutral style; no stall colours or icons |
| 11 | `job_i01.png` | 220×220 | Essential | "Test which kite shape flies highest". Neutral style; no stall colours or icons |
| 12 | `job_i02.png` | 220×220 | Essential | "Find out why the lights keep flickering". Neutral style; no stall colours or icons |
| 13 | `job_i03.png` | 220×220 | Essential | "Test which cup keeps chai hot longest". Neutral style; no stall colours or icons |
| 14 | `job_i04.png` | 220×220 | Essential | "Figure out why one cooler melts ice faster". Neutral style; no stall colours or icons |
| 15 | `job_i05.png` | 220×220 | Essential | "Run the volcano experiment for the science tent". Neutral style; no stall colours or icons |
| 16 | `job_i06.png` | 220×220 | Essential | "Explain moon craters through the telescope". Neutral style; no stall colours or icons |
| 17 | `job_i07.png` | 220×220 | Essential | "Investigate why the plants by the gate are wilting". Neutral style; no stall colours or icons |
| 18 | `job_i08.png` | 220×220 | Essential | "Work out how the water filter cleans water". Neutral style; no stall colours or icons |
| 19 | `job_i09.png` | 220×220 | Essential | "Solve the mystery of the missing raffle tickets". Neutral style; no stall colours or icons |
| 20 | `job_i10.png` | 220×220 | Essential | "Check the weather data and predict rain". Neutral style; no stall colours or icons |
| 21 | `job_a01.png` | 220×220 | Essential | "Paint the big welcome banner". Neutral style; no stall colours or icons |
| 22 | `job_a02.png` | 220×220 | Essential | "Make up a catchy jingle for the mela". Neutral style; no stall colours or icons |
| 23 | `job_a03.png` | 220×220 | Essential | "Design the mela's logo". Neutral style; no stall colours or icons |
| 24 | `job_a04.png` | 220×220 | Essential | "Decorate the stall in truck-art style". Neutral style; no stall colours or icons |
| 25 | `job_a05.png` | 220×220 | Essential | "Write a short funny skit for the stage". Neutral style; no stall colours or icons |
| 26 | `job_a06.png` | 220×220 | Essential | "Play the dhol for the opening". Neutral style; no stall colours or icons |
| 27 | `job_a07.png` | 220×220 | Essential | "Take creative photos for the mela board". Neutral style; no stall colours or icons |
| 28 | `job_a08.png` | 220×220 | Essential | "Paint faces for the little kids". Neutral style; no stall colours or icons |
| 29 | `job_a09.png` | 220×220 | Essential | "Arrange flowers and lights into a display". Neutral style; no stall colours or icons |
| 30 | `job_a10.png` | 220×220 | Essential | "Write a short poem for the opening ceremony". Neutral style; no stall colours or icons |
| 31 | `job_s01.png` | 220×220 | Essential | "Help lost children find their families". Neutral style; no stall colours or icons |
| 32 | `job_s02.png` | 220×220 | Essential | "Teach younger students a new game". Neutral style; no stall colours or icons |
| 33 | `job_s03.png` | 220×220 | Essential | "Welcome guests and show them around". Neutral style; no stall colours or icons |
| 34 | `job_s04.png` | 220×220 | Essential | "Help an elderly visitor find a seat". Neutral style; no stall colours or icons |
| 35 | `job_s05.png` | 220×220 | Essential | "Assist the school nurse at the first-aid corner". Neutral style; no stall colours or icons |
| 36 | `job_s06.png` | 220×220 | Essential | "Calm a nervous friend before their stage show". Neutral style; no stall colours or icons |
| 37 | `job_s07.png` | 220×220 | Essential | "Explain the science show to little kids". Neutral style; no stall colours or icons |
| 38 | `job_s08.png` | 220×220 | Essential | "Help a new student make friends". Neutral style; no stall colours or icons |
| 39 | `job_s09.png` | 220×220 | Essential | "Guide a visitor in a wheelchair around the mela". Neutral style; no stall colours or icons |
| 40 | `job_s10.png` | 220×220 | Essential | "Help two classmates sort out a disagreement". Neutral style; no stall colours or icons |
| 41 | `job_e01.png` | 220×220 | Essential | "Convince visitors to try the chaat". Neutral style; no stall colours or icons |
| 42 | `job_e02.png` | 220×220 | Essential | "Lead the team that sets up the stage". Neutral style; no stall colours or icons |
| 43 | `job_e03.png` | 220×220 | Essential | "Pitch the mela to a local shop for sponsorship". Neutral style; no stall colours or icons |
| 44 | `job_e04.png` | 220×220 | Essential | "Announce events on the microphone". Neutral style; no stall colours or icons |
| 45 | `job_e05.png` | 220×220 | Essential | "Run the stall and make the big decisions". Neutral style; no stall colours or icons |
| 46 | `job_e06.png` | 220×220 | Essential | "Bargain for a better price on paper plates". Neutral style; no stall colours or icons |
| 47 | `job_e07.png` | 220×220 | Essential | "Come up with a plan to sell more tickets". Neutral style; no stall colours or icons |
| 48 | `job_e08.png` | 220×220 | Essential | "Host the closing ceremony". Neutral style; no stall colours or icons |
| 49 | `job_e09.png` | 220×220 | Essential | "Persuade the principal to keep the mela open later". Neutral style; no stall colours or icons |
| 50 | `job_e10.png` | 220×220 | Essential | "Start a mini business selling bookmarks". Neutral style; no stall colours or icons |
| 51 | `job_c01.png` | 220×220 | Essential | "Count and record the ticket money". Neutral style; no stall colours or icons |
| 52 | `job_c02.png` | 220×220 | Essential | "Make a duty schedule for all volunteers". Neutral style; no stall colours or icons |
| 53 | `job_c03.png` | 220×220 | Essential | "Keep the stock list of plates and cups". Neutral style; no stall colours or icons |
| 54 | `job_c04.png` | 220×220 | Essential | "Sort the raffle tickets by number". Neutral style; no stall colours or icons |
| 55 | `job_c05.png` | 220×220 | Essential | "Fill in the expense sheet carefully". Neutral style; no stall colours or icons |
| 56 | `job_c06.png` | 220×220 | Essential | "Check every stall against the supplies list". Neutral style; no stall colours or icons |
| 57 | `job_c07.png` | 220×220 | Essential | "Label and organise the lost-and-found". Neutral style; no stall colours or icons |
| 58 | `job_c08.png` | 220×220 | Essential | "Type up the list of prize winners". Neutral style; no stall colours or icons |
| 59 | `job_c09.png` | 220×220 | Essential | "Make a neat price chart for the stall". Neutral style; no stall colours or icons |
| 60 | `job_c10.png` | 220×220 | Essential | "File the permission slips in order". Neutral style; no stall colours or icons |

## F. UI art

*49 entries · 49 essential · 0 optional*

| # | Filename | Dimensions | Priority | Notes |
|---|---|---|---|---|
| 1 | `logo_apnamela.png` | 1100×440 | Essential | Wordmark on the truck-art ribbon with the Urdu sub-ribbon (no Hudhud) |
| 2 | `logo_apnamela_small.png` | 560×224 | Essential | Splash/credits |
| 3 | `ui_bunting_strip.png` | 1920×180 (tileable x) | Essential | Hanging bunting |
| 4 | `ui_lights_strip_off.png / _on.png` | 1920×140 each | Essential | String lights |
| 5 | `ui_heart_full.png / ui_heart_empty.png` | 150×150 each | Essential | Loved-it |
| 6 | `ui_diya.png` | 96×96 | Essential | Light currency icon |
| 7 | `ui_diya_particle.png` | 48×48 | Essential | Flies to the HUD |
| 8 | `ui_check_badge.png` | 84×84 | Essential | Selection badge |
| 9 | `ui_stamp_pakka.png` | 320×160 | Essential | Confirm stamp (EN) — UR version below |
| 10 | `ui_stamp_pakka_ur.png` | 320×160 | Essential |  |
| 11 | `ui_hand_tap_hint.png` | 150×150 | Essential | Tutorial pointer |
| 12 | `ui_bulb_on.png / ui_bulb_off.png` | 40×40 each | Essential | Mela Board bulbs |
| 13 | `ui_medallion_R.png` | 300×300 | Essential | Final reveal medallion (icon + ring; letter drawn in code) |
| 14 | `ui_medallion_I.png` | 300×300 | Essential | Final reveal medallion (icon + ring; letter drawn in code) |
| 15 | `ui_medallion_A.png` | 300×300 | Essential | Final reveal medallion (icon + ring; letter drawn in code) |
| 16 | `ui_medallion_S.png` | 300×300 | Essential | Final reveal medallion (icon + ring; letter drawn in code) |
| 17 | `ui_medallion_E.png` | 300×300 | Essential | Final reveal medallion (icon + ring; letter drawn in code) |
| 18 | `ui_medallion_C.png` | 300×300 | Essential | Final reveal medallion (icon + ring; letter drawn in code) |
| 19 | `icon_gear.png` | 128×128 | Essential | Line icon, ink colour, 7 px stroke @100 grid |
| 20 | `icon_sound_on.png` | 128×128 | Essential | Line icon, ink colour, 7 px stroke @100 grid |
| 21 | `icon_sound_off.png` | 128×128 | Essential | Line icon, ink colour, 7 px stroke @100 grid |
| 22 | `icon_music.png` | 128×128 | Essential | Line icon, ink colour, 7 px stroke @100 grid |
| 23 | `icon_pause.png` | 128×128 | Essential | Line icon, ink colour, 7 px stroke @100 grid |
| 24 | `icon_back.png` | 128×128 | Essential | Line icon, ink colour, 7 px stroke @100 grid |
| 25 | `icon_next.png` | 128×128 | Essential | Line icon, ink colour, 7 px stroke @100 grid |
| 26 | `icon_close.png` | 128×128 | Essential | Line icon, ink colour, 7 px stroke @100 grid |
| 27 | `icon_map.png` | 128×128 | Essential | Line icon, ink colour, 7 px stroke @100 grid |
| 28 | `icon_book.png` | 128×128 | Essential | Line icon, ink colour, 7 px stroke @100 grid |
| 29 | `icon_board.png` | 128×128 | Essential | Line icon, ink colour, 7 px stroke @100 grid |
| 30 | `icon_check.png` | 128×128 | Essential | Line icon, ink colour, 7 px stroke @100 grid |
| 31 | `icon_lock.png` | 128×128 | Essential | Line icon, ink colour, 7 px stroke @100 grid |
| 32 | `icon_info.png` | 128×128 | Essential | Line icon, ink colour, 7 px stroke @100 grid |
| 33 | `icon_help.png` | 128×128 | Essential | Line icon, ink colour, 7 px stroke @100 grid |
| 34 | `icon_globe.png` | 128×128 | Essential | Line icon, ink colour, 7 px stroke @100 grid |
| 35 | `icon_trash.png` | 128×128 | Essential | Line icon, ink colour, 7 px stroke @100 grid |
| 36 | `icon_save.png` | 128×128 | Essential | Line icon, ink colour, 7 px stroke @100 grid |
| 37 | `icon_home.png` | 128×128 | Essential | Line icon, ink colour, 7 px stroke @100 grid |
| 38 | `icon_text_size.png` | 128×128 | Essential | Line icon, ink colour, 7 px stroke @100 grid |
| 39 | `icon_motion.png` | 128×128 | Essential | Line icon, ink colour, 7 px stroke @100 grid |
| 40 | `icon_contrast.png` | 128×128 | Essential | Line icon, ink colour, 7 px stroke @100 grid |
| 41 | `icon_voice.png` | 128×128 | Essential | Line icon, ink colour, 7 px stroke @100 grid |
| 42 | `icon_screen.png` | 128×128 | Essential | Line icon, ink colour, 7 px stroke @100 grid |
| 43 | `icon_camera.png` | 128×128 | Essential | Line icon, ink colour, 7 px stroke @100 grid |
| 44 | `icon_star.png` | 128×128 | Essential | Line icon, ink colour, 7 px stroke @100 grid |
| 45 | `fx_confetti_sheet.png` | 768×128 (6 pieces) | Essential |  |
| 46 | `fx_sparkle_sheet.png` | 768×128 (6 frames) | Essential |  |
| 47 | `fx_firework_burst_sheet.png` | 4096×512 (8 frames @512) | Essential | Tinted in code; ≤3 flashes/s |
| 48 | `fx_glow_radial.png` | 512×512 | Essential | Selection/reveal glow |
| 49 | `ui_shapes` | procedural | Essential | Buttons, cards, pills, ribbons, toggles, sliders are drawn in code from UI_STYLE_GUIDE tokens (no PNGs) |

## G. Fonts (OFL)

*11 entries · 10 essential · 1 optional*

| # | Filename | Dimensions | Priority | Notes |
|---|---|---|---|---|
| 1 | `Baloo2-Bold.ttf` | font | Essential | Bundle with OFL.txt |
| 2 | `Baloo2-ExtraBold.ttf` | font | Essential | Bundle with OFL.txt |
| 3 | `Nunito-Regular.ttf` | font | Essential | Bundle with OFL.txt |
| 4 | `Nunito-SemiBold.ttf` | font | Essential | Bundle with OFL.txt |
| 5 | `Nunito-Bold.ttf` | font | Essential | Bundle with OFL.txt |
| 6 | `Nunito-ExtraBold.ttf` | font | Essential | Bundle with OFL.txt |
| 7 | `BalooBhaijaan2-Bold.ttf` | font | Essential | Bundle with OFL.txt |
| 8 | `BalooBhaijaan2-ExtraBold.ttf` | font | Essential | Bundle with OFL.txt |
| 9 | `NotoNastaliqUrdu-Regular.ttf` | font | Essential | Bundle with OFL.txt |
| 10 | `NotoNastaliqUrdu-Bold.ttf` | font | Essential | Bundle with OFL.txt |
| 11 | `NotoNaskhArabic-Regular.ttf / -Bold.ttf` | font | Optional | Fallback if Nastaliq shaping fails the tech spike |

## H. Music (OGG Vorbis, 44.1 kHz stereo, −16 LUFS, seamless loops)

*8 entries · 7 essential · 1 optional*

| # | Filename | Dimensions | Priority | Notes |
|---|---|---|---|---|
| 1 | `mus_menu_theme.ogg` | ~90 s loop | Essential | Dhol + rubab + light synth, upbeat |
| 2 | `mus_day_prep.ogg` | ~120 s loop | Essential | Map and dialogue; bright, mid-tempo |
| 3 | `mus_stall_focus.ogg` | ~90 s loop | Essential | Softer bed under cards (no strong melody) |
| 4 | `mus_diary_night.ogg` | ~60 s loop | Essential | Soft bansuri + sitar, calm |
| 5 | `mus_mela_day5.ogg` | ~120 s loop | Essential | Festive full arrangement |
| 6 | `mus_finale_reveal.ogg` | ~45 s, non-loop | Essential | Build-up → medallion hits → warm resolve |
| 7 | `mus_results.ogg` | ~60 s loop | Essential | Gentle, reflective |
| 8 | `mus_credits.ogg` | ~90 s | Optional | Can reuse mus_menu_theme |

## I. Sound effects (OGG mono, −20 LUFS short-term peak)

*30 entries · 27 essential · 3 optional*

| # | Filename | Dimensions | Priority | Notes |
|---|---|---|---|---|
| 1 | `sfx_ui_tap.ogg` | ≤3 s (amb 60 s) | Essential | Soft wooden tick |
| 2 | `sfx_ui_denied.ogg` | ≤3 s (amb 60 s) | Essential | Muted thunk |
| 3 | `sfx_ui_toggle.ogg` | ≤3 s (amb 60 s) | Essential |  |
| 4 | `sfx_ui_slider_tick.ogg` | ≤3 s (amb 60 s) | Essential |  |
| 5 | `sfx_card_deal.ogg` | ≤3 s (amb 60 s) | Essential | Paper whoosh |
| 6 | `sfx_card_select.ogg` | ≤3 s (amb 60 s) | Essential | Pop + lift |
| 7 | `sfx_confirm_stamp.ogg` | ≤3 s (amb 60 s) | Essential | Rubber stamp thump |
| 8 | `sfx_heart_pop.ogg` | ≤3 s (amb 60 s) | Essential | Pitch-shifted per heart in code |
| 9 | `sfx_light_earned.ogg` | ≤3 s (amb 60 s) | Essential | Soft chime |
| 10 | `sfx_visit_complete.ogg` | ≤3 s (amb 60 s) | Essential | Short jingle |
| 11 | `sfx_camera_shutter.ogg` | ≤3 s (amb 60 s) | Essential |  |
| 12 | `sfx_book_open.ogg` | ≤3 s (amb 60 s) | Essential |  |
| 13 | `sfx_page_turn.ogg` | ≤3 s (amb 60 s) | Essential |  |
| 14 | `sfx_quill_scribble.ogg` | ≤3 s (amb 60 s) | Essential |  |
| 15 | `sfx_hudhud_chirp_01.ogg` | ≤3 s (amb 60 s) | Essential | Hoopoe 'oop-oop' stylised |
| 16 | `sfx_hudhud_chirp_02.ogg` | ≤3 s (amb 60 s) | Essential |  |
| 17 | `sfx_hudhud_chirp_03.ogg` | ≤3 s (amb 60 s) | Essential |  |
| 18 | `sfx_hudhud_flap.ogg` | ≤3 s (amb 60 s) | Essential |  |
| 19 | `sfx_transition_bunting.ogg` | ≤3 s (amb 60 s) | Essential | Fabric whoosh |
| 20 | `sfx_day_complete.ogg` | ≤3 s (amb 60 s) | Essential | Celebratory sting |
| 21 | `sfx_medallion_reveal.ogg` | ≤3 s (amb 60 s) | Essential | Played ×3 with rising pitch |
| 22 | `sfx_firework_pop_01.ogg` | ≤3 s (amb 60 s) | Essential |  |
| 23 | `sfx_firework_pop_02.ogg` | ≤3 s (amb 60 s) | Essential |  |
| 24 | `sfx_crowd_cheer.ogg` | ≤3 s (amb 60 s) | Essential | Finale |
| 25 | `sfx_dhol_hit.ogg` | ≤3 s (amb 60 s) | Essential | Day intro |
| 26 | `sfx_text_blip.ogg` | ≤3 s (amb 60 s) | Optional | Per-character dialogue blip (off by default) |
| 27 | `amb_mela_day_loop.ogg` | ≤3 s (amb 60 s) | Essential | 60 s ambience: distant chatter, birds |
| 28 | `amb_night_crickets_loop.ogg` | ≤3 s (amb 60 s) | Essential | 60 s |
| 29 | `amb_crowd_day5_loop.ogg` | ≤3 s (amb 60 s) | Optional | Busy mela crowd |
| 30 | `sfx_ferris_creak.ogg` | ≤3 s (amb 60 s) | Optional |  |

## J. Voice pack (optional)

*2 entries · 0 essential · 2 optional*

| # | Filename | Dimensions | Priority | Notes |
|---|---|---|---|---|
| 1 | `vo_en_<line_key>.ogg` | per line (~220 lines) | Optional | English read-aloud for all dialogue, cards and diary intros (diary statements only if the instrument licence allows) |
| 2 | `vo_ur_<line_key>.ogg` | per line (~220 lines) | Optional | Urdu read-aloud |

## K. Data files (content, not art)

*7 entries · 7 essential · 0 optional*

| # | Filename | Dimensions | Priority | Notes |
|---|---|---|---|---|
| 1 | `data/strings_en.json` | JSON | Essential | All UI and dialogue text |
| 2 | `data/strings_ur.json` | JSON | Essential | Urdu, same keys |
| 3 | `data/cards_what.json` | JSON | Essential | W01–W20, option keys, types |
| 4 | `data/cards_how.json` | JSON | Essential | H01–H30, domain, H/L keys |
| 5 | `data/diary_items.json` | JSON | Essential | D01–D10 from the approved instrument, keys, scale |
| 6 | `data/stalls.json` | JSON | Essential | Stall ids, names, colours, type map |
| 7 | `data/careers_riasec.json` | JSON | Essential | Career ideas per type (counsellor-approved) |

## L. Animation list (code-driven unless a sheet is listed)

| Animation | Where | Method | Asset |
|---|---|---|---|
| Character idle breathe + blink | All scenes | Tween scaleY 1→1.015 (2.4 s); blink face swap 120 ms every 3–5 s | `*_face_blink.png` |
| Character talk | Dialogue, bubbles | Swap face talk/smile at 8 fps while text types | `*_face_talk.png` |
| Character react (happy hop) | Visit complete, finale | Squash and stretch tween 300 ms | — |
| Hudhud idle / fly / crest / hop / write | Throughout | Sprite sheets 12 fps | `char_hudhud_*_sheet.png` |
| Avatar walk on map | Mela Map | Path tween 600 ms + 4-frame walk (optional) | `avatar_walk_sheet.png` |
| Ferris wheel rotation | Menu, map, finale | Rotate rotor; cabins stay upright | `prop_ferris_*` |
| Bunting sway, lights twinkle | Menu, map, night | Per-flag rotation tween; random alpha | strips |
| Card deal / select / stamp | S13, S15 | Tweens (UI_STYLE_GUIDE §8) | `ui_stamp_pakka*.png` |
| Hearts pop | S14 | Scale tween + `sfx_heart_pop` | hearts |
| Light particle to HUD | Every confirm | Bezier tween 500 ms | `ui_diya_particle.png` |
| Book open / page turn | S18 | Hinge scaleX + skew tween (or sheet) | `prop_diary_*` |
| Polaroid drop / camera flash | S16, S19, S20 | Drop + swing; 80 ms white flash (off with Reduce Motion) | `prop_polaroid_frame.png` |
| Day → night | S17 | Gradient lerp + lights layer fade | `bg_mela_night_lights_on.png` |
| Medallion reveal + fireworks | S22 | Rise + elastic scale; firework sheet | `ui_medallion_*`, `fx_firework_burst_sheet.png` |
| Bunting wipe transition | Between full screens | Strip slides across 450 ms | `ui_bunting_strip.png` |

## M. Production order (recommended)

1. **Vertical slice:** logo, `bg_mela_map_day`, `bg_stall_jugnu`, Zain + Hira layers, avatar A1/A2, Hudhud stills, 12 job illustrations for Day 1, all UI icons, core SFX, `mus_day_prep`. This is enough to play Day 1 end to end.
2. **Full cast & stalls:** remaining stalls, Bilal, Sara, Karim, all avatars, all 60 job illustrations.
3. **Night & finale:** night backgrounds, diary, Mela Board, medallions, fireworks, remaining music.
4. **Polish (optional set):** parallax, prop loops, crowd NPCs, walk cycle, voice pack.
