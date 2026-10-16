"""Small drawing helpers (text, panels, bars). No game logic here."""
from __future__ import annotations

from functools import lru_cache

import pygame

from game import settings as S


@lru_cache(maxsize=64)
def font(size: int, bold: bool = False) -> pygame.font.Font:
    f = pygame.font.Font(None, size)
    f.set_bold(bold)
    return f


def text(surf, s: str, pos, size: int = 28, color=S.TEXT, anchor: str = "topleft", bold: bool = False):
    img = font(size, bold).render(str(s), True, color)
    r = img.get_rect()
    setattr(r, anchor, pos)
    surf.blit(img, r)
    return r


def wrap(s: str, size: int, max_w: int, bold: bool = False) -> list[str]:
    f = font(size, bold)
    lines: list[str] = []
    for para in str(s).split("\n"):
        words, cur = para.split(" "), ""
        for w in words:
            trial = (cur + " " + w).strip()
            if f.size(trial)[0] <= max_w or not cur:
                cur = trial
            else:
                lines.append(cur)
                cur = w
        lines.append(cur)
    return lines


def paragraph(surf, s: str, pos, size: int, max_w: int, color=S.TEXT, line_gap: int = 4, bold: bool = False) -> int:
    """Draw wrapped text; returns the y coordinate below the last line."""
    x, y = pos
    for line in wrap(s, size, max_w, bold):
        text(surf, line, (x, y), size, color, bold=bold)
        y += font(size).get_height() + line_gap
    return y


def panel(surf, rect, color=S.PANEL, border=None, radius: int = 12, alpha: int | None = None, width: int = 2):
    rect = pygame.Rect(rect)
    if alpha is not None:
        tmp = pygame.Surface(rect.size, pygame.SRCALPHA)
        pygame.draw.rect(tmp, (*color, alpha), tmp.get_rect(), border_radius=radius)
        surf.blit(tmp, rect)
    else:
        pygame.draw.rect(surf, color, rect, border_radius=radius)
    if border:
        pygame.draw.rect(surf, border, rect, width, border_radius=radius)
    return rect


def bar(surf, rect, frac: float, color=S.ACCENT, bg=(24, 28, 44), radius: int = 8):
    rect = pygame.Rect(rect)
    pygame.draw.rect(surf, bg, rect, border_radius=radius)
    frac = max(0.0, min(1.0, frac))
    if frac > 0:
        fill = pygame.Rect(rect.x, rect.y, max(radius * 2, int(rect.w * frac)), rect.h)
        pygame.draw.rect(surf, color, fill, border_radius=radius)


def vertical_gradient(size, top, bottom) -> pygame.Surface:
    w, h = size
    surf = pygame.Surface(size)
    for y in range(h):
        t = y / max(1, h - 1)
        pygame.draw.line(surf, tuple(int(top[i] + (bottom[i] - top[i]) * t) for i in range(3)), (0, y), (w, y))
    return surf


def shadow_circle(surf, pos, r, alpha=70):
    tmp = pygame.Surface((r * 3, r * 2), pygame.SRCALPHA)
    pygame.draw.ellipse(tmp, (0, 0, 0, alpha), tmp.get_rect())
    surf.blit(tmp, (pos[0] - r * 1.5, pos[1] - r + r * 0.6))


def key_hint(surf, label: str, pos, size: int = 22):
    r = text(surf, label, pos, size, S.BG, bold=True)
    box = r.inflate(14, 6)
    pygame.draw.rect(surf, S.TEXT_DIM, box, border_radius=6)
    text(surf, label, box.center, size, S.BG, anchor="center", bold=True)
    return box
