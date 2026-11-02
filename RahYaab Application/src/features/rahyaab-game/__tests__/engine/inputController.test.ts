import { InputController, quantizeStick } from '../../utils/inputController';

describe('quantizeStick (analog joystick -> desktop 8-way WASD)', () => {
  it('has a dead zone', () => {
    expect(quantizeStick(0.1, -0.2)).toEqual([0, 0]);
  });
  it('maps the 8 sectors like arrow keys (screen y grows downward)', () => {
    expect(quantizeStick(1, 0)).toEqual([1, 0]);
    expect(quantizeStick(-1, 0)).toEqual([-1, 0]);
    expect(quantizeStick(0, 1)).toEqual([0, 1]);
    expect(quantizeStick(0, -1)).toEqual([0, -1]);
    expect(quantizeStick(0.7, 0.7)).toEqual([1, 1]);
    expect(quantizeStick(-0.7, -0.7)).toEqual([-1, -1]);
    expect(quantizeStick(0.9, 0.2)).toEqual([1, 0]); // 12.5 deg -> pure right
    expect(quantizeStick(0.9, 0.5)).toEqual([1, 1]); // 29 deg -> diagonal
  });
});

describe('InputController', () => {
  it('applies held movement to every step and a press to exactly one step', () => {
    const c = new InputController();
    c.setMove(1, 0);
    c.press({ interact: true }, 'play:world');
    const a = c.next('play:world');
    const b = c.next('play:world');
    expect([a.dx, a.interact]).toEqual([1, true]);
    expect([b.dx, b.interact]).toEqual([1, false]);
  });

  it('queues fast taps instead of losing them (one per engine step)', () => {
    const c = new InputController();
    c.press({ number: 1 }, 'm1');
    c.press({ number: 3 }, 'm1');
    expect(c.next('m1').number).toBe(1);
    expect(c.next('m1').number).toBe(3);
    expect(c.next('m1').number).toBeNull();
  });

  it('drops a stale tap aimed at a dialog that has already closed (double-tap protection)', () => {
    const c = new InputController();
    c.press({ confirm: true }, 'dialog#1');
    c.press({ confirm: true }, 'dialog#1'); // second tap on "Choose"
    expect(c.next('dialog#1').confirm).toBe(true);
    // the first confirm closed dialog #1 and the level ended -> outcome screen
    expect(c.next('outcome').confirm).toBe(false);
    expect(c.pending()).toBe(0);
  });

  it('releasing the stick stops movement; reset clears everything', () => {
    const c = new InputController();
    c.setMove(-1, 1);
    c.press({ tab: true }, 'x');
    c.setMove(0, 0);
    expect(c.next('x')).toMatchObject({ dx: 0, dy: 0, tab: true });
    c.setMove(1, 1);
    c.press({ pause: true }, 'x');
    c.reset();
    expect(c.next('x')).toMatchObject({ dx: 0, dy: 0, pause: false });
  });

  it('caps the queue so a stuck UI cannot flood the engine', () => {
    const c = new InputController();
    for (let i = 0; i < 100; i++) c.press({ interact: true }, 't');
    expect(c.pending()).toBeLessThanOrEqual(8);
  });
});
