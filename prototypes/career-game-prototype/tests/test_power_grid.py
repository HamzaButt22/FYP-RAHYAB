import math

import pytest

from engine.power_grid import (
    E, N, S, W,
    ROTATION_EVENT,
    START_EVENT,
    MEASURED_FEATURES,
    PowerGrid,
    compile_profile,
    rotate_cw,
    rotations_to_cover,
    screen_to_grid,
    grid_to_screen,
    summarise_session,
)
from engine.stream_transformation_engine import FEATURE_ORDER, StreamTransformationEngine

FILL = N  # a stub that never links to the hand-built path below


def solved_tiles():
    """Path: (0,0)->(1,0)->(2,0)->(3,0)->(3,1)->(3,2)->(3,3), entering W of (0,0), leaving E of (3,3)."""
    tiles = [[FILL] * 4 for _ in range(4)]
    tiles[0][0] = W | E
    tiles[1][0] = W | E
    tiles[2][0] = W | E
    tiles[3][0] = W | S
    tiles[3][1] = N | S
    tiles[3][2] = N | S
    tiles[3][3] = N | E
    return tiles


def rotation(ms, x, y):
    return {"event_type": ROTATION_EVENT, "monotonic_ms": ms, "data": {"grid_x": x, "grid_y": y}}


def start(ms=0.0):
    return {"event_type": START_EVENT, "monotonic_ms": ms, "data": {}}


# --- Conduit geometry -------------------------------------------------------

def test_rotate_cw_moves_each_side_one_quarter_turn():
    assert rotate_cw(N) == E
    assert rotate_cw(E) == S
    assert rotate_cw(S) == W
    assert rotate_cw(W) == N
    assert rotate_cw(N | E) == E | S


def test_four_rotations_are_identity_for_every_mask():
    for mask in range(1, 16):
        m = mask
        for _ in range(4):
            m = rotate_cw(m)
        assert m == mask


def test_rotations_to_cover_counts_clockwise_turns():
    assert rotations_to_cover(N | E, N | E) == 0
    assert rotations_to_cover(N | E, E | S) == 1
    assert rotations_to_cover(N | E, W | N) == 3
    assert rotations_to_cover(N | S, W | E) == 1


def test_straight_conduit_cannot_cover_an_elbow():
    assert rotations_to_cover(N | S, N | E) is None


# --- Connectivity -----------------------------------------------------------

def test_hand_built_path_is_solved_and_energises_only_the_path():
    grid = PowerGrid(solved_tiles())
    assert grid.is_solved()
    assert len(grid.energized()) == 7
    assert grid.min_rotations_to_solve() == 0


def test_breaking_a_straight_needs_one_turn_because_of_symmetry():
    grid = PowerGrid(solved_tiles())
    grid.rotate(1, 0)
    assert not grid.is_solved()
    assert grid.min_rotations_to_solve() == 1


def test_breaking_an_elbow_needs_three_more_clockwise_turns():
    grid = PowerGrid(solved_tiles())
    grid.rotate(3, 3)
    assert not grid.is_solved()
    assert grid.min_rotations_to_solve() == 3


def test_source_tile_must_face_the_generator():
    tiles = solved_tiles()
    tiles[0][0] = N | E  # open toward the path but not toward the generator
    grid = PowerGrid(tiles)
    assert grid.energized() == set()
    assert not grid.is_solved()


def test_rejects_non_square_or_invalid_masks():
    with pytest.raises(ValueError):
        PowerGrid([[N, N], [N]])
    with pytest.raises(ValueError):
        PowerGrid([[0, N], [N, N]])
    with pytest.raises(ValueError):
        PowerGrid([[True, N], [N, N]])


def test_copy_is_independent():
    grid = PowerGrid(solved_tiles())
    clone = grid.copy()
    clone.rotate(0, 0)
    assert grid.is_solved()
    assert not clone.is_solved()


@pytest.mark.parametrize("seed", range(25))
def test_generated_puzzle_is_scrambled_but_solvable(seed):
    import random
    grid = PowerGrid.generate(4, random.Random(seed))
    assert grid.size == 4
    assert not grid.is_solved()
    optimal = grid.min_rotations_to_solve()
    assert optimal is not None and optimal >= 1


def test_generation_is_deterministic_for_a_seed():
    import random
    a = PowerGrid.generate(4, random.Random(7))
    b = PowerGrid.generate(4, random.Random(7))
    assert a.tiles == b.tiles


# --- Isometric projection ---------------------------------------------------

def test_tile_centre_round_trips_through_projection():
    for gx in range(4):
        for gy in range(4):
            sx, sy = grid_to_screen(gx + 0.5, gy + 0.5, 160, 80, 512, 224)
            assert screen_to_grid(sx, sy, 160, 80, 512, 224) == (gx, gy)


def test_projection_matches_spec_formula():
    sx, sy = grid_to_screen(3, 1, 160, 80, 512, 224)
    assert sx == (3 - 1) * 80 + 512
    assert sy == (3 + 1) * 40 + 224


def test_point_left_of_grid_maps_to_negative_cell_not_tile_zero():
    # Regression: int() truncation snapped fractional -0.x coordinates onto column 0.
    sx, sy = grid_to_screen(-0.4, 0.5, 160, 80, 512, 224)
    assert screen_to_grid(sx, sy, 160, 80, 512, 224) == (-1, 0)


# --- Session replay and profile compilation --------------------------------

def broken_grid():
    grid = PowerGrid(solved_tiles())
    grid.rotate(1, 0)       # straight: 1 turn to fix
    grid.rotate(3, 3)       # elbow: 3 turns to fix
    return grid             # optimal = 4


def test_summary_replays_rotations_and_detects_solve():
    grid = broken_grid()
    events = [start(), rotation(1200, 1, 0),
              rotation(2600, 3, 3), rotation(2800, 3, 3), rotation(3000, 3, 3)]
    m = summarise_session(grid, events)
    assert m["optimal_rotations"] == 4
    assert m["total_rotations"] == 4
    assert m["rotations_to_solve"] == 4
    assert m["solved_final"] is True
    assert m["solve_ms"] == 3000
    assert m["visit_count"] == 2
    assert m["clean_visit_ratio"] == 1.0
    assert m["path_efficiency"] == 1.0
    assert m["rotation_efficiency"] == 1.0


def test_summary_does_not_mutate_initial_grid():
    grid = broken_grid()
    summarise_session(grid, [start(), rotation(100, 1, 0)])
    assert grid.min_rotations_to_solve() == 4


def test_summary_ignores_tampered_or_out_of_bounds_coordinates():
    grid = broken_grid()
    events = [start(), rotation(100, 9, 9), rotation(200, True, 0),
              rotation(300, "1", 0), rotation(400, -1, 0),
              {"event_type": ROTATION_EVENT, "monotonic_ms": 500, "data": None}]
    m = summarise_session(grid, events)
    assert m["total_rotations"] == 0


def test_summary_does_not_trust_client_solved_flags():
    grid = broken_grid()
    forged = rotation(100, 0, 1)
    forged["data"]["solved"] = True
    m = summarise_session(grid, [start(), forged])
    assert m["solved_final"] is False


def test_profile_has_exactly_the_canonical_keys_in_unit_range():
    grid = broken_grid()
    events = [start(), rotation(1200, 1, 0),
              rotation(2600, 3, 3), rotation(2800, 3, 3), rotation(3000, 3, 3)]
    profile = compile_profile(summarise_session(grid, events))
    assert list(profile) == FEATURE_ORDER
    for value in profile.values():
        assert isinstance(value, float) and 0.0 <= value <= 1.0
    probs = StreamTransformationEngine().recommend(profile)
    assert math.isclose(sum(probs.values()), 1.0)


def test_unmeasured_features_carry_zero_evidence():
    grid = broken_grid()
    events = [start(), rotation(1200, 1, 0),
              rotation(2600, 3, 3), rotation(2800, 3, 3), rotation(3000, 3, 3)]
    profile = compile_profile(summarise_session(grid, events))
    for feature in FEATURE_ORDER:
        if feature not in MEASURED_FEATURES:
            assert profile[feature] == 0.0


def test_quitting_unsolved_gives_no_competence_credit():
    grid = broken_grid()
    events = [start(), rotation(1000, 1, 0), rotation(2000, 0, 1), rotation(3000, 0, 2)]
    profile = compile_profile(summarise_session(grid, events))
    assert profile["icar_3d_rotation"] == 0.0
    assert profile["ocean_conscientiousness"] == 0.0


def test_empty_session_is_all_zero_and_still_scoreable():
    profile = compile_profile(summarise_session(broken_grid(), [start()]))
    assert all(v == 0.0 for v in profile.values())
    probs = StreamTransformationEngine().recommend(profile)
    assert all(math.isclose(p, 0.2) for p in probs.values())


def test_sloppy_solver_scores_lower_than_efficient_solver():
    clean = [start(), rotation(1200, 1, 0),
             rotation(2600, 3, 3), rotation(2800, 3, 3), rotation(3000, 3, 3)]
    sloppy = [start(), rotation(400, 0, 1), rotation(700, 1, 0), rotation(900, 1, 0),
              rotation(1100, 1, 0), rotation(1300, 1, 0), rotation(1500, 1, 0),
              rotation(1800, 3, 3), rotation(2000, 3, 3), rotation(2200, 3, 3)]
    p_clean = compile_profile(summarise_session(broken_grid(), clean))
    p_sloppy = compile_profile(summarise_session(broken_grid(), sloppy))
    assert p_sloppy["ocean_conscientiousness"] < p_clean["ocean_conscientiousness"]
    assert p_sloppy["icar_3d_rotation"] < p_clean["icar_3d_rotation"]
    assert p_sloppy["trial_and_error"] > p_clean["trial_and_error"]


def snake_tiles():
    """3x3 where the shapes force a single 9-tile serpentine route (no Manhattan shortcut exists)."""
    t = [[None] * 3 for _ in range(3)]
    t[0][0], t[1][0], t[2][0] = W | E, W | E, W | S
    t[2][1], t[1][1], t[0][1] = N | W, E | W, E | S
    t[0][2], t[1][2], t[2][2] = N | E, W | E, W | E
    return t


def test_shortest_route_respects_tile_shapes_not_manhattan_distance():
    grid = PowerGrid(snake_tiles())
    assert grid.is_solved()
    assert grid.shortest_path_tiles() == 9


def test_forced_long_route_still_earns_full_path_efficiency():
    grid = PowerGrid(snake_tiles())
    grid.rotate(1, 1)
    m = summarise_session(grid, [start(), rotation(900, 1, 1)])
    assert m["solved_final"] is True
    assert m["path_efficiency"] == 1.0


def test_extra_energised_branches_lower_path_efficiency():
    tiles = solved_tiles()
    tiles[1][0] = W | E | S   # tee leaks power downward...
    tiles[1][1] = N           # ...into a dead-end stub
    grid = PowerGrid(tiles)
    grid.rotate(3, 3)
    events = [start(), rotation(1000, 3, 3), rotation(1500, 3, 3), rotation(2000, 3, 3)]
    m = summarise_session(grid, events)
    assert m["solved_final"] is True
    assert m["path_efficiency"] == pytest.approx(7 / 8)
