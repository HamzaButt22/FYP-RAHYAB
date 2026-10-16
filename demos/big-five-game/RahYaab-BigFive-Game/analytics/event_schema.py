"""Shared telemetry contract between the game, the database layer and analytics.

Every event the game emits uses one of these types. Keeping the vocabulary in one
place means a typo in the game is caught immediately (the logger refuses unknown
types) and the analytics code can rely on stable names.
"""
from __future__ import annotations


class EventType:
    SESSION_START = "SESSION_START"
    SESSION_END = "SESSION_END"

    LEVEL_START = "LEVEL_START"
    LEVEL_COMPLETE = "LEVEL_COMPLETE"
    LEVEL_FAILED = "LEVEL_FAILED"

    PLAYER_MOVE = "PLAYER_MOVE"                # sampled (2 Hz) movement summary
    PLAYER_INTERACTION = "PLAYER_INTERACTION"  # touching / inspecting / using objects

    DECISION = "DECISION"                      # a choice was presented
    DECISION_RESPONSE = "DECISION_RESPONSE"    # the player committed to an option

    EXPLORATION = "EXPLORATION"                # entering zones / checkpoints / leaving zones
    NPC_INTERACTION = "NPC_INTERACTION"        # conversations with villagers

    HELP_ACTION = "HELP_ACTION"
    SHARE_ACTION = "SHARE_ACTION"
    COOPERATION_ACTION = "COOPERATION_ACTION"
    COMPETITION_ACTION = "COMPETITION_ACTION"

    RISK_ACTION = "RISK_ACTION"

    ITEM_COLLECTED = "ITEM_COLLECTED"
    RESOURCE_USED = "RESOURCE_USED"

    ERROR = "ERROR"                            # player mistakes (invalid / wasteful actions)
    FAILURE = "FAILURE"                        # bad outcomes (laser hit, gate lockdown, timeout)
    RETRY = "RETRY"

    STRATEGY_CHANGE = "STRATEGY_CHANGE"        # a labelled strategy was adopted / switched

    TASK_START = "TASK_START"
    TASK_COMPLETE = "TASK_COMPLETE"
    TASK_ABANDON = "TASK_ABANDON"

    REWARD_SELECTED = "REWARD_SELECTED"

    GAME_PAUSED = "GAME_PAUSED"
    GAME_RESUMED = "GAME_RESUMED"

    ENV_EVENT = "ENV_EVENT"                    # scripted surprise (tremor, rockfall, ...)


ALL_EVENT_TYPES = frozenset(
    v for k, v in vars(EventType).items() if not k.startswith("_") and isinstance(v, str)
)

# Event types that count as a deliberate player "action" (denominator for error_rate).
PLAYER_ACTION_TYPES = frozenset({
    EventType.PLAYER_INTERACTION, EventType.DECISION_RESPONSE, EventType.RESOURCE_USED,
    EventType.ITEM_COLLECTED, EventType.HELP_ACTION, EventType.SHARE_ACTION,
    EventType.COOPERATION_ACTION, EventType.COMPETITION_ACTION, EventType.RISK_ACTION,
    EventType.ERROR,
})

# Decision option "kinds" used in DECISION_RESPONSE.metadata.chosen_kind
KIND_SAFE = "safe"
KIND_RISKY = "risky"
KIND_CHECK = "check"          # information seeking / re-checking
KIND_NOVEL = "novel"
KIND_PROSOCIAL = "prosocial"
KIND_SELFISH = "selfish"
KIND_NEUTRAL = "neutral"
KIND_IGNORE = "ignore"
KIND_SOCIAL = "social"        # keep chatting / join in
KIND_EXIT = "exit"            # end a conversation politely

# Decision categories used in metadata.category
CAT_RISK = "risk"
CAT_REWARD = "reward"
CAT_PRESSURE = "pressure"
CAT_PLANNING = "planning"
CAT_HELP = "help"
CAT_SHARE = "share"
CAT_COOPERATION = "cooperation"
CAT_SOCIAL = "social"
