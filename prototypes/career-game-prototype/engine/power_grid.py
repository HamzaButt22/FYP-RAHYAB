# -*- coding: utf-8 -*-
"""Game 1 - The Power Sector: conduit puzzle model, isometric math and telemetry-to-profile compiler.

Pure Python with no pygame dependency, so every rule here ports 1:1 to a Unity C# script.
"""
import math
import random
import statistics

from engine.stream_transformation_engine import FEATURE_ORDER

# Conduit sides as a 4-bit mask (grid space, y grows downward).
N, E, S, W = 1, 2, 4, 8
SIDES = (N, E, S, W)
SIDE_VECTORS = {N: (0, -1), E: (1, 0), S: (0, 1), W: (-1, 0)}
OPPOSITE = {N: S, E: W, S: N, W: E}

STRAIGHT = N | S
ELBOW = N | E
TEE = N | E | S
FILLER_SHAPES = (STRAIGHT, ELBOW, TEE)

START_EVENT = "session_start"
ROTATION_EVENT = "conduit_rotation_step"

# Profile calibration constants.
DELIBERATION_CEILING_MS = 3000.0   # median pre-tile latency that maps to full DDM caution
MIN_VISITS_FOR_EVIDENCE = 3        # cadence features need at least this many tile visits
FULL_CYCLE_CLICKS = 4              # 4+ clicks in one visit = spun past the target orientation

# The 13-key matrix has no Realistic column, so Game 1 only feeds these keys; the rest stay 0.0,
# which adds nothing to any stream's dot product (a 0.5 placeholder would bias the softmax).
MEASURED_FEATURES = (
    "system_stability",
    "trial_and_error",
    "ddm_boundary_separation",
    "icar_3d_rotation",
    "ocean_conscientiousness",
)


def rotate_cw(mask: int) -> int:
    return ((mask << 1) | (mask >> 3)) & 0xF


def rotations_to_cover(mask: int, required: int):
    """Fewest clockwise quarter turns that open every side in `required`; None if the shape never can."""
    for turns in range(4):
        if mask & required == required:
            return turns
        mask = rotate_cw(mask)
    return None


def grid_to_screen(gx: float, gy: float, tile_w: float, tile_h: float, offset_x: float, offset_y: float) -> tuple:
    iso_x = (gx - gy) * (tile_w / 2) + offset_x
    iso_y = (gx + gy) * (tile_h / 2) + offset_y
    return iso_x, iso_y


def screen_to_grid(sx: float, sy: float, tile_w: float, tile_h: float, offset_x: float, offset_y: float) -> tuple:
    """Inverse projection; floor (not int) so points left of / above the grid land on negative cells."""
    u = (sx - offset_x) / (tile_w / 2)
    v = (sy - offset_y) / (tile_h / 2)
    return math.floor((u + v) / 2), math.floor((v - u) / 2)


def _side_between(a: tuple, b: tuple) -> int:
    delta = (b[0] - a[0], b[1] - a[1])
    for side, vector in SIDE_VECTORS.items():
        if vector == delta:
            return side
    raise ValueError(f"Cells {a} and {b} are not adjacent.")


def _random_path(size: int, start: tuple, goal: tuple, rng: random.Random) -> list:
    """Randomised DFS: a winding self-avoiding route from start to goal."""
    stack = [(start, [start])]
    while stack:
        cell, path = stack.pop()
        if cell == goal:
            return path
        neighbours = [(cell[0] + dx, cell[1] + dy) for dx, dy in SIDE_VECTORS.values()]
        rng.shuffle(neighbours)
        for nxt in neighbours:
            if 0 <= nxt[0] < size and 0 <= nxt[1] < size and nxt not in path:
                stack.append((nxt, path + [nxt]))
    raise RuntimeError("No route between generator and battery.")


class PowerGrid:
    """Square grid of conduit masks, indexed tiles[x][y]. Power enters the source tile from
    `source_side` (generator) and must leave the sink tile through `sink_side` (battery)."""

    def __init__(self, tiles, source=(0, 0), source_side=W, sink=None, sink_side=E):
        size = len(tiles)
        if size < 1 or any(len(column) != size for column in tiles):
            raise ValueError("Conduit grid must be square.")
        for column in tiles:
            for mask in column:
                if isinstance(mask, bool) or not isinstance(mask, int) or not 1 <= mask <= 15:
                    raise ValueError(f"Invalid conduit mask: {mask!r}")
        self.size = size
        self.tiles = [list(column) for column in tiles]
        self.source = source
        self.source_side = source_side
        self.sink = sink if sink is not None else (size - 1, size - 1)
        self.sink_side = sink_side

    @classmethod
    def generate(cls, size: int = 4, rng: random.Random = None) -> "PowerGrid":
        rng = rng or random.Random()
        source, sink = (0, 0), (size - 1, size - 1)
        tiles = [[rng.choice(FILLER_SHAPES) for _ in range(size)] for _ in range(size)]
        path = _random_path(size, source, sink, rng)
        for i, (x, y) in enumerate(path):
            entry = W if i == 0 else _side_between((x, y), path[i - 1])
            exit_ = E if i == len(path) - 1 else _side_between((x, y), path[i + 1])
            tiles[x][y] = entry | exit_
        grid = cls(tiles, source, W, sink, E)
        while True:
            for x in range(size):
                for y in range(size):
                    for _ in range(rng.randrange(4)):
                        grid.rotate(x, y)
            if not grid.is_solved():
                return grid

    def copy(self) -> "PowerGrid":
        return PowerGrid(self.tiles, self.source, self.source_side, self.sink, self.sink_side)

    def in_bounds(self, x, y) -> bool:
        for v in (x, y):
            if isinstance(v, bool) or not isinstance(v, int):
                return False
        return 0 <= x < self.size and 0 <= y < self.size

    def rotate(self, x: int, y: int) -> None:
        self.tiles[x][y] = rotate_cw(self.tiles[x][y])

    def energized(self) -> set:
        sx, sy = self.source
        if not self.tiles[sx][sy] & self.source_side:
            return set()
        seen = {self.source}
        stack = [self.source]
        while stack:
            x, y = stack.pop()
            mask = self.tiles[x][y]
            for side in SIDES:
                if not mask & side:
                    continue
                dx, dy = SIDE_VECTORS[side]
                nx, ny = x + dx, y + dy
                if self.in_bounds(nx, ny) and (nx, ny) not in seen and self.tiles[nx][ny] & OPPOSITE[side]:
                    seen.add((nx, ny))
                    stack.append((nx, ny))
        return seen

    def is_solved(self) -> bool:
        kx, ky = self.sink
        return bool(self.tiles[kx][ky] & self.sink_side) and self.sink in self.energized()

    def _route_bounds(self) -> tuple:
        """(fewest clicks, fewest tiles) over every simple generator->battery route the tile shapes allow.

        Exact: each tile sits on a route at most once, so a route's click cost is the sum of its tiles'
        independent turn counts. Shapes never change under rotation, so the tile bound is fixed per puzzle.
        """
        best = {"clicks": None, "tiles": None}

        def walk(cell, entry, visited, cost):
            x, y = cell
            mask = self.tiles[x][y]
            if cell == self.sink:
                turns = rotations_to_cover(mask, entry | self.sink_side)
                if turns is not None:
                    if best["clicks"] is None or cost + turns < best["clicks"]:
                        best["clicks"] = cost + turns
                    if best["tiles"] is None or len(visited) < best["tiles"]:
                        best["tiles"] = len(visited)
                return
            for side in SIDES:
                dx, dy = SIDE_VECTORS[side]
                nxt = (x + dx, y + dy)
                if not self.in_bounds(*nxt) or nxt in visited:
                    continue
                turns = rotations_to_cover(mask, entry | side)
                if turns is not None:
                    walk(nxt, OPPOSITE[side], visited | {nxt}, cost + turns)

        walk(self.source, self.source_side, {self.source}, 0)
        return best["clicks"], best["tiles"]

    def min_rotations_to_solve(self):
        """Exact minimum clicks to power the battery; None if the shapes can never connect."""
        return self._route_bounds()[0]

    def shortest_path_tiles(self):
        """Fewest tiles any achievable route can energise (L_min); None if unsolvable."""
        return self._route_bounds()[1]


def _clamp01(value: float) -> float:
    return max(0.0, min(1.0, float(value)))


def summarise_session(initial_grid: PowerGrid, events: list) -> dict:
    """Replays validated telemetry against a copy of the starting grid.

    Solve state is recomputed from the replay, never read from client-supplied flags.
    """
    grid = initial_grid.copy()
    optimal, shortest_tiles = grid._route_bounds()
    start_ms = next((e["monotonic_ms"] for e in events if e.get("event_type") == START_EVENT), 0.0)
    last_ms = start_ms
    rotations = 0
    rotations_to_solve = None
    solve_ms = None
    visits = []

    for event in events:
        if event.get("event_type") != ROTATION_EVENT:
            continue
        data = event.get("data")
        if not isinstance(data, dict):
            continue
        x, y = data.get("grid_x"), data.get("grid_y")
        if not grid.in_bounds(x, y):
            continue
        ms = event["monotonic_ms"]
        grid.rotate(x, y)
        rotations += 1
        if visits and visits[-1]["tile"] == (x, y):
            visits[-1]["clicks"] += 1
        else:
            visits.append({"tile": (x, y), "clicks": 1, "latency_ms": ms - last_ms})
        last_ms = ms
        if solve_ms is None and grid.is_solved():
            solve_ms = ms - start_ms
            rotations_to_solve = rotations

    visits_per_tile = {}
    for visit in visits:
        visits_per_tile[visit["tile"]] = visits_per_tile.get(visit["tile"], 0) + 1
    clean = sum(1 for v in visits if v["clicks"] < FULL_CYCLE_CLICKS and visits_per_tile[v["tile"]] == 1)
    latencies = [v["latency_ms"] for v in visits]
    mean_latency = statistics.fmean(latencies) if latencies else 0.0

    solved_final = grid.is_solved()
    energized = len(grid.energized())
    return {
        "optimal_rotations": optimal,
        "total_rotations": rotations,
        "rotations_to_solve": rotations_to_solve,
        "solve_ms": solve_ms,
        "solved_final": solved_final,
        "post_solve_rotations": rotations - rotations_to_solve if rotations_to_solve is not None else 0,
        "visit_count": len(visits),
        "clean_visit_ratio": clean / len(visits) if visits else 0.0,
        "median_deliberation_ms": statistics.median(latencies) if latencies else 0.0,
        "deliberation_cv": statistics.pstdev(latencies) / mean_latency if mean_latency > 0 else 0.0,
        "energized_tiles": energized,
        "shortest_path_tiles": shortest_tiles,
        "rotation_efficiency": (optimal / rotations_to_solve) if rotations_to_solve else (1.0 if solved_final else 0.0),
        "path_efficiency": shortest_tiles / energized if solved_final else 0.0,
    }


def compile_evidence(metrics: dict) -> dict:
    """Only the features this session produced evidence for: a missing key means 'not measured',
    which is distinct from a measured 0.0."""
    evidence = {}

    if metrics["visit_count"] >= MIN_VISITS_FOR_EVIDENCE:
        # Action-frequency consistency: steady pre-tile pauses -> stable, unsteady -> volatile.
        evidence["system_stability"] = _clamp01(1.0 - metrics["deliberation_cv"])
        # Revisited or over-spun tiles = guessing orientations instead of resolving them mentally.
        evidence["trial_and_error"] = _clamp01(1.0 - metrics["clean_visit_ratio"])
        # Mental rotation latency (tau_rot) as speed-accuracy caution.
        evidence["ddm_boundary_separation"] = _clamp01(metrics["median_deliberation_ms"] / DELIBERATION_CEILING_MS)

    if metrics["solved_final"]:
        evidence["icar_3d_rotation"] = _clamp01(metrics["clean_visit_ratio"])
        evidence["ocean_conscientiousness"] = _clamp01(
            0.5 * metrics["rotation_efficiency"] + 0.5 * metrics["path_efficiency"]
        )

    return evidence


def compile_profile(metrics: dict) -> dict:
    """Maps a session summary onto the 13 canonical keys. 0.0 means 'no evidence from this game'."""
    evidence = compile_evidence(metrics)
    return {feature: evidence.get(feature, 0.0) for feature in FEATURE_ORDER}
