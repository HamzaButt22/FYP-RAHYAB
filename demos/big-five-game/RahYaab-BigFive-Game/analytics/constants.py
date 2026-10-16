"""Level layout constants shared by analytics (fallbacks when LEVEL_START metadata is missing).

The game writes the real totals into LEVEL_START metadata, so analytics always prefers
those; these defaults only matter for hand-written / legacy telemetry.
"""

LEVEL_EXPLORATION = 1
LEVEL_PLANNING = 2
LEVEL_SOCIAL = 3
LEVEL_PRESSURE = 4
LEVEL_IDS = (1, 2, 3, 4)

MAX_ATTEMPTS = 3                 # attempts per level before the game lets the player move on

OPTIONAL_AREAS_TOTAL = 6         # level 1 optional zones
NOVEL_OBJECTS_TOTAL = 8          # level 1 unique first-time interactions possible
GRID_TOTAL_CELLS = 77            # 11 x 7 grid cells of 100 px over the 1100x604 world
NPC_ENCOUNTERS_TOTAL = 6         # level 3 encounters
IDLE_ENCOUNTERS_TOTAL = 3        # of which the player has to start themselves
L2_OPTIMAL_REWARD = 145         # best achievable reward in the workshop (brute-forced; see levels/level2_planning.py)
STRATEGY_DIVERSITY_REF = 8       # distinct strategies that map to diversity = 1.0

DECISION_TIME_CAP_MS = 120_000   # anything slower is treated as AFK and capped
