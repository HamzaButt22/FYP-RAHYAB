"""Global game settings and colour palette."""
GAME_VERSION = "0.2.0"
TITLE = "RahYaab - Behavioral Assessment Game"

SCREEN_W, SCREEN_H = 1100, 700
HUD_H = 96
WORLD_W, WORLD_H = 1100, 604            # SCREEN_H - HUD_H + 0 ; the world is drawn below the HUD
FPS = 60

PLAYER_RADIUS = 12
PLAYER_SPEED = 215.0                      # px / s
INTERACT_RANGE = 62                       # px from an object's edge
MAX_ATTEMPTS = 3                          # attempts per level before the game moves on

# palette -------------------------------------------------------------------
BG = (18, 22, 36)
PANEL = (30, 36, 56)
PANEL_LIGHT = (44, 52, 78)
TEXT = (234, 238, 248)
TEXT_DIM = (150, 160, 186)
ACCENT = (96, 165, 250)
ACCENT_2 = (52, 211, 153)
WARN = (251, 191, 36)
DANGER = (248, 113, 113)
GOLD = (250, 204, 21)

TRAIT_COLORS = {
    "openness": (167, 139, 250),
    "conscientiousness": (52, 211, 153),
    "extraversion": (251, 191, 36),
    "agreeableness": (244, 114, 182),
    "neuroticism": (96, 165, 250),
}
