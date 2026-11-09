"""Interactive entry point:  python game/main.py   (or `python run.py game`)."""
from __future__ import annotations

import os
import sys
from pathlib import Path

# allow `python game/main.py` from any working directory
ROOT = Path(__file__).resolve().parents[1]
if str(ROOT) not in sys.path:
    sys.path.insert(0, str(ROOT))

import pygame  # noqa: E402

from game import settings as S  # noqa: E402
from game.app import GameApp  # noqa: E402
from game.input_state import InputState  # noqa: E402

MOVE_KEYS = {
    "left": (pygame.K_LEFT, pygame.K_a), "right": (pygame.K_RIGHT, pygame.K_d),
    "up": (pygame.K_UP, pygame.K_w), "down": (pygame.K_DOWN, pygame.K_s),
}


def poll_input(app: GameApp) -> InputState:
    inp = InputState()
    for ev in pygame.event.get():
        if ev.type == pygame.QUIT:
            app.quit()
        elif ev.type == pygame.KEYDOWN:
            k = ev.key
            if k in (pygame.K_RETURN, pygame.K_KP_ENTER):
                inp.confirm = True
            elif k in (pygame.K_e, pygame.K_SPACE):
                inp.interact = True
            elif k == pygame.K_ESCAPE:
                inp.back = True
            elif k == pygame.K_p:
                inp.pause = True
            elif k == pygame.K_TAB:
                inp.tab = True
            elif k == pygame.K_BACKSPACE:
                inp.backspace = True
            elif k == pygame.K_x:
                inp.save = True
            elif k == pygame.K_m:
                inp.menu = True
            if k in MOVE_KEYS["up"]:
                inp.up = True
            if k in MOVE_KEYS["down"]:
                inp.down = True
            if k in MOVE_KEYS["left"]:
                inp.left = True
            if k in MOVE_KEYS["right"]:
                inp.right = True
            if pygame.K_1 <= k <= pygame.K_9:
                inp.number = k - pygame.K_0
            if ev.unicode and ev.unicode.isprintable():
                inp.text += ev.unicode
    keys = pygame.key.get_pressed()
    inp.dx = int(any(keys[k] for k in MOVE_KEYS["right"])) - int(any(keys[k] for k in MOVE_KEYS["left"]))
    inp.dy = int(any(keys[k] for k in MOVE_KEYS["down"])) - int(any(keys[k] for k in MOVE_KEYS["up"]))
    return inp


def main() -> None:
    pygame.init()
    pygame.display.set_caption(S.TITLE)
    screen = pygame.display.set_mode((S.SCREEN_W, S.SCREEN_H))
    clock = pygame.time.Clock()
    app = GameApp()
    while app.running:
        dt = min(clock.tick(S.FPS) / 1000.0, 0.05)       # cap dt so a window drag cannot create huge jumps
        inp = poll_input(app)
        if not app.running:
            break
        app.step(inp, dt)
        app.draw(screen)
        pygame.display.flip()
    pygame.quit()


if __name__ == "__main__":
    main()
