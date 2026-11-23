// Fresh synthetic data before every run: tools/e2e_seed.py through `python tools/dev.py e2e_seed`.
// It removes the previous run's "E2E Test School" first, so runs never depend on each other.
// Set E2E_SKIP_SEED=1 only when something else has just seeded (CI seeds in its own step).
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

export default function globalSetup(): void {
  if (process.env.E2E_SKIP_SEED === '1') return;
  const root = fileURLToPath(new URL('../..', import.meta.url));
  const python = process.env.PYTHON ?? 'python';
  const run = spawnSync(python, ['tools/dev.py', 'e2e_seed'], { cwd: root, stdio: 'inherit' });
  if (run.status !== 0) {
    throw new Error('Seeding failed. Is the stack running? Start it with: python tools/dev.py up');
  }
}
