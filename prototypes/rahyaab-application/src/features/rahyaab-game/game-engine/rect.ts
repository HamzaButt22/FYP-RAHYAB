/**
 * Integer rectangle with pygame.Rect semantics (the subset the game logic uses).
 *
 * pygame truncates float coordinates toward zero before testing points, uses C integer division in `center`
 * and `inflate`, and never reports a collision with a zero-sized rectangle. Gameplay outcomes (zone entry,
 * collisions, exits) depend on these exact rules, so they are reproduced here.
 */
const trunc = (v: number) => {
  const t = Math.trunc(v);
  return t === 0 ? 0 : t;
};
const cdiv2 = (v: number) => trunc(v / 2);

export class Rect {
  readonly x: number;
  readonly y: number;
  readonly w: number;
  readonly h: number;

  constructor(x: number, y: number, w: number, h: number) {
    this.x = trunc(x);
    this.y = trunc(y);
    this.w = trunc(w);
    this.h = trunc(h);
  }

  get left() {
    return this.x;
  }
  get top() {
    return this.y;
  }
  get right() {
    return this.x + this.w;
  }
  get bottom() {
    return this.y + this.h;
  }
  get centerx() {
    return this.x + cdiv2(this.w);
  }
  get centery() {
    return this.y + cdiv2(this.h);
  }
  get center(): [number, number] {
    return [this.centerx, this.centery];
  }

  collidepoint(px: number, py: number): boolean {
    const x = trunc(px);
    const y = trunc(py);
    return x >= this.x && x < this.x + this.w && y >= this.y && y < this.y + this.h;
  }

  colliderect(o: Rect): boolean {
    if (this.w === 0 || this.h === 0 || o.w === 0 || o.h === 0) return false;
    return this.x < o.x + o.w && this.y < o.y + o.h && this.x + this.w > o.x && this.y + this.h > o.y;
  }

  inflate(dx: number, dy: number): Rect {
    return new Rect(this.x - cdiv2(dx), this.y - cdiv2(dy), this.w + dx, this.h + dy);
  }

  copy(): Rect {
    return new Rect(this.x, this.y, this.w, this.h);
  }

  /** A rect of size (w, h) centred on (cx, cy) like `r = Rect(0,0,w,h); r.center = (cx, cy)`. */
  static centered(w: number, h: number, cx: number, cy: number): Rect {
    return new Rect(trunc(cx) - cdiv2(w), trunc(cy) - cdiv2(h), w, h);
  }
}

export const R = (x: number, y: number, w: number, h: number) => new Rect(x, y, w, h);
