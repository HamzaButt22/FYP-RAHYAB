"""Device-independent input for one frame.

The pygame loop converts keyboard events into an InputState; headless test bots build
InputState objects directly, so the *exact same* game code runs in both cases.
"""
from __future__ import annotations

from dataclasses import dataclass
from typing import Optional


@dataclass
class InputState:
    dx: int = 0                    # held movement direction (-1, 0, 1)
    dy: int = 0
    interact: bool = False         # E / Space pressed this frame
    confirm: bool = False          # Enter pressed this frame
    up: bool = False               # menu navigation presses
    down: bool = False
    left: bool = False
    right: bool = False
    back: bool = False             # Esc
    pause: bool = False            # P
    number: Optional[int] = None   # 1..9 pressed this frame
    text: str = ""                 # typed characters (name entry)
    backspace: bool = False
    tab: bool = False
    save: bool = False             # X / report export
    menu: bool = False             # M: back to main menu (results screens)

    @property
    def any_press(self) -> bool:
        return bool(self.interact or self.confirm or self.up or self.down or self.left or self.right
                    or self.back or self.number is not None or self.text or self.tab or self.menu or self.save)

    @property
    def any_input(self) -> bool:
        return self.any_press or self.dx != 0 or self.dy != 0

    @property
    def accept(self) -> bool:
        """Enter or interact -- 'press the main button'."""
        return self.confirm or self.interact
