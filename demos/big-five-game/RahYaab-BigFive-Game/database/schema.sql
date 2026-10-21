-- RahYaab Big Five Game -- telemetry database schema (SQLite dialect).
-- Kept deliberately close to portable SQL so it can be moved to PostgreSQL later
-- (replace INTEGER PRIMARY KEY AUTOINCREMENT with SERIAL/IDENTITY, TEXT JSON with JSONB).

CREATE TABLE IF NOT EXISTS players (
    player_id   INTEGER PRIMARY KEY AUTOINCREMENT,
    name        TEXT    NOT NULL,
    created_at  TEXT    NOT NULL,
    is_demo     INTEGER NOT NULL DEFAULT 0      -- 1 = scripted demo bot, not a real participant
);

-- Static reference table describing the four gameplay scenarios.
CREATE TABLE IF NOT EXISTS levels (
    level_id           INTEGER PRIMARY KEY,
    name               TEXT NOT NULL,
    scenario           TEXT NOT NULL,
    primary_constructs TEXT NOT NULL,
    description        TEXT
);

CREATE TABLE IF NOT EXISTS sessions (
    session_id   TEXT    PRIMARY KEY,
    player_id    INTEGER NOT NULL REFERENCES players(player_id) ON DELETE CASCADE,
    started_at   TEXT    NOT NULL,
    ended_at     TEXT,
    duration_ms  INTEGER,
    status       TEXT    NOT NULL DEFAULT 'in_progress'
                         CHECK (status IN ('in_progress', 'completed', 'abandoned')),
    game_version TEXT,
    seed         INTEGER
);

CREATE TABLE IF NOT EXISTS game_events (
    event_id         INTEGER PRIMARY KEY AUTOINCREMENT,
    session_id       TEXT    NOT NULL REFERENCES sessions(session_id) ON DELETE CASCADE,
    player_id        INTEGER NOT NULL REFERENCES players(player_id)   ON DELETE CASCADE,
    level_id         INTEGER          REFERENCES levels(level_id),
    timestamp        TEXT    NOT NULL,           -- ISO-8601, wall-clock style
    t_ms             INTEGER NOT NULL,           -- game-clock ms since SESSION_START (pause-safe)
    event_type       TEXT    NOT NULL,
    action           TEXT,
    decision_time_ms REAL,
    risk_level       REAL,
    metadata         TEXT    NOT NULL DEFAULT '{}'   -- JSON blob with event specific parameters
);

CREATE INDEX IF NOT EXISTS idx_events_session       ON game_events(session_id, t_ms);
CREATE INDEX IF NOT EXISTS idx_events_session_type  ON game_events(session_id, event_type);
CREATE INDEX IF NOT EXISTS idx_events_level         ON game_events(session_id, level_id);

CREATE TABLE IF NOT EXISTS behavioral_features (
    feature_id    INTEGER PRIMARY KEY AUTOINCREMENT,
    session_id    TEXT    NOT NULL REFERENCES sessions(session_id) ON DELETE CASCADE,
    player_id     INTEGER NOT NULL REFERENCES players(player_id)   ON DELETE CASCADE,
    feature_name  TEXT    NOT NULL,
    feature_group TEXT    NOT NULL,              -- exploration | planning | social | pressure | decision | raw
    feature_value REAL    NOT NULL,
    computed_at   TEXT    NOT NULL,
    UNIQUE (session_id, feature_name)
);

CREATE TABLE IF NOT EXISTS personality_results (
    result_id         INTEGER PRIMARY KEY AUTOINCREMENT,
    session_id        TEXT    NOT NULL UNIQUE REFERENCES sessions(session_id) ON DELETE CASCADE,
    player_id         INTEGER NOT NULL REFERENCES players(player_id) ON DELETE CASCADE,
    openness          REAL    NOT NULL,
    conscientiousness REAL    NOT NULL,
    extraversion      REAL    NOT NULL,
    agreeableness     REAL    NOT NULL,
    neuroticism       REAL    NOT NULL,
    labels_json       TEXT    NOT NULL,          -- {"openness": "High", ...}
    coverage_json     TEXT    NOT NULL,          -- fraction of each trait's weight that had data
    evidence_json     TEXT    NOT NULL,          -- human readable behavioural evidence per trait
    model_name        TEXT    NOT NULL,
    model_version     TEXT    NOT NULL,
    is_validated      INTEGER NOT NULL DEFAULT 0, -- 0 = prototype scoring, NOT psychometrically validated
    created_at        TEXT    NOT NULL
);

INSERT OR IGNORE INTO levels (level_id, name, scenario, primary_constructs, description) VALUES
 (1, 'The Whispering Valley', 'Exploration',            'Openness',
     'Open valley with a signposted main path and hidden optional areas, curious objects and small gambles.'),
 (2, 'The Workshop',          'Planning & resources',   'Conscientiousness',
     'Limited materials, several orders: inspect, plan, build, make mistakes, retry and optimise.'),
 (3, 'Harbor Village',        'Social interaction',     'Extraversion, Agreeableness',
     'Villagers ask for help, share, cooperate or compete. Players may initiate, help, negotiate or ignore.'),
 (4, 'The Crumbling Vault',   'Pressure & uncertainty', 'Neuroticism-related stress indicators',
     'Countdown, laser lane, uncertain gates and a surprise tremor. Decide, re-check, fail and recover.');
