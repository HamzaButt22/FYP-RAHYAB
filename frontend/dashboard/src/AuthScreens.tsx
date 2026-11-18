// Staff sign-in screens (FR-71, FR-106): D-01 sign in, D-01b two-step code (with first-time setup),
// D-01c forgot password, and the page the invite and reset links open (/reset#token=...).
// Designs: design/screens/D-01*.html. Every field has a visible label; errors are announced (role="alert").
// "Use a backup code" from the D-01b design is not shown: backup codes are not built yet (a lost phone is
// handled by an admin reset, which the screen says).

import { useState, type FormEvent, type ReactNode } from 'react';

import logo from '../../../design/brand/logo/svg/branch-light.svg';
import { ApiError, cleanCode, errorKey, groupKey, looksLikeEmail, staffAuth, waitMinutes, type Challenge, type Setup } from './api';
import { useI18n } from './i18n';

function Card({ title, children }: { title: string; children: ReactNode }) {
  const { t } = useI18n();
  return (
    <main className="auth">
      <div className="auth-card card">
        <div className="brand">
          <img src={logo} alt="" aria-hidden="true" width={26} height={26} />
          <span className="brand-word">rahyaab</span>
          <span className="chip">{t('auth.staff')}</span>
        </div>
        <h1 className="h2">{title}</h1>
        {children}
      </div>
    </main>
  );
}

function ErrorText({ id, text }: { id: string; text: string | null }) {
  return text ? (
    <p id={id} className="field-error" role="alert">
      {text}
    </p>
  ) : null;
}

/** The message for an error, with the wait time filled in for 429. */
function useErrorText() {
  const { t } = useI18n();
  return (error: unknown, field?: string) => t(errorKey(error, field), { minutes: waitMinutes(error) });
}

// --------------------------------------------------------------------------------------------- D-01
export function SignIn({ onChallenge, onForgot }: { onChallenge: (c: Challenge) => void; onForgot: () => void }) {
  const { t } = useI18n();
  const message = useErrorText();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function submit(e: FormEvent) {
    e.preventDefault();
    if (!looksLikeEmail(email)) return setError(t('auth.errors.email'));
    setBusy(true);
    setError(null);
    try {
      onChallenge(await staffAuth.login(email.trim(), password));
    } catch (err) {
      setError(message(err));
      setPassword('');
    } finally {
      setBusy(false);
    }
  }

  return (
    <Card title={t('auth.signIn.title')}>
      <form className="form" onSubmit={submit} noValidate>
        <label htmlFor="email">{t('auth.signIn.email')}</label>
        <input id="email" type="email" autoComplete="username" maxLength={254} required value={email}
          onChange={(e) => setEmail(e.target.value)} aria-invalid={error ? true : undefined}
          aria-describedby={error ? 'signin-error' : undefined} />
        <label htmlFor="password">{t('auth.signIn.password')}</label>
        <input id="password" type="password" autoComplete="current-password" maxLength={128} required value={password}
          onChange={(e) => setPassword(e.target.value)} aria-invalid={error ? true : undefined}
          aria-describedby={error ? 'signin-error' : undefined} />
        <ErrorText id="signin-error" text={error} />
        <button className="btn primary" type="submit" disabled={busy} aria-busy={busy}>
          {t('auth.signIn.submit')}
        </button>
        <button className="link" type="button" onClick={onForgot}>
          {t('auth.signIn.forgot')}
        </button>
      </form>
      <p className="muted small">{t('auth.signIn.note')}</p>
    </Card>
  );
}

// -------------------------------------------------------------------------------------------- D-01b
export function TwoStep({ challenge, onDone, onBack }: { challenge: Challenge; onDone: () => void; onBack: () => void }) {
  const { t } = useI18n();
  const message = useErrorText();
  const [setup, setSetup] = useState<Setup | null>(null);
  const [code, setCode] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const needsSetup = challenge.mfa_setup_required;

  async function showKey() {
    setBusy(true);
    setError(null);
    try {
      setSetup(await staffAuth.setup(challenge.mfa_challenge_id));
    } catch (err) {
      setError(message(err));
    } finally {
      setBusy(false);
    }
  }

  async function submit(e: FormEvent) {
    e.preventDefault();
    if (code.length !== 6) return setError(t('auth.errors.code'));
    setBusy(true);
    setError(null);
    try {
      await staffAuth.verify(challenge.mfa_challenge_id, code);
      onDone();
    } catch (err) {
      setError(message(err));
      setCode('');
    } finally {
      setBusy(false);
    }
  }

  const codeForm = (
    <form className="form" onSubmit={submit} noValidate>
      <label htmlFor="code">{t('auth.code.label')}</label>
      <input id="code" className="code-input" inputMode="numeric" autoComplete="one-time-code" pattern="[0-9]*"
        maxLength={7} required value={code} onChange={(e) => setCode(cleanCode(e.target.value))}
        aria-invalid={error ? true : undefined}
        aria-describedby={error ? 'code-error' : needsSetup ? undefined : 'code-hint'} />
      <ErrorText id="code-error" text={error} />
      <button className="btn primary" type="submit" disabled={busy} aria-busy={busy}>
        {t('auth.code.submit')}
      </button>
      <button className="link" type="button" onClick={onBack}>
        {t('auth.code.back')}
      </button>
    </form>
  );

  if (needsSetup) {
    return (
      <Card title={t('auth.setup.title')}>
        <p>{t('auth.setup.intro')}</p>
        <ol className="steps">
          <li>{t('auth.setup.step1')}</li>
          <li>
            {t('auth.setup.step2')}
            {setup ? (
              <div className="setup-key">
                <span className="sr-only">{t('auth.setup.keyLabel')}: </span>
                <code aria-label={`${t('auth.setup.keyLabel')}: ${setup.setup_key.split('').join(' ')}`}>{groupKey(setup.setup_key)}</code>
                <p className="muted small">{t('auth.setup.keepSafe')}</p>
              </div>
            ) : (
              <div>
                <button className="btn secondary" type="button" onClick={showKey} disabled={busy} aria-busy={busy}>
                  {t('auth.setup.show')}
                </button>
              </div>
            )}
          </li>
          <li>{t('auth.setup.step3')}</li>
        </ol>
        {setup ? codeForm : <ErrorText id="code-error" text={error} />}
      </Card>
    );
  }

  return (
    <Card title={t('auth.code.title')}>
      <p id="code-hint" className="muted">{t('auth.code.hint')}</p>
      {codeForm}
      <p className="muted small">{t('auth.code.lostPhone')}</p>
    </Card>
  );
}

// -------------------------------------------------------------------------------------------- D-01c
export function Forgot({ onBack }: { onBack: () => void }) {
  const { t } = useI18n();
  const message = useErrorText();
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function submit(e: FormEvent) {
    e.preventDefault();
    if (!looksLikeEmail(email)) return setError(t('auth.errors.email'));
    setBusy(true);
    setError(null);
    try {
      await staffAuth.requestReset(email.trim());
      setSent(true);
    } catch (err) {
      setError(message(err));
    } finally {
      setBusy(false);
    }
  }

  return (
    <Card title={t('auth.forgot.title')}>
      <p role="status">{sent ? t('auth.forgot.sent') : t('auth.forgot.intro')}</p>
      <form className="form" onSubmit={submit} noValidate>
        <label htmlFor="forgot-email">{t('auth.signIn.email')}</label>
        <input id="forgot-email" type="email" autoComplete="username" maxLength={254} required value={email}
          onChange={(e) => setEmail(e.target.value)} aria-invalid={error ? true : undefined}
          aria-describedby={error ? 'forgot-error' : undefined} />
        <ErrorText id="forgot-error" text={error} />
        <button className="btn primary" type="submit" disabled={busy} aria-busy={busy}>
          {sent ? t('auth.forgot.again') : t('auth.forgot.submit')}
        </button>
        <button className="link" type="button" onClick={onBack}>
          {t('auth.forgot.back')}
        </button>
      </form>
      <p className="muted small">{t('auth.forgot.note')}</p>
    </Card>
  );
}

// ------------------------------------------------------------------------- /reset#token=... (invite too)
export function ResetPassword({ token, onSignIn, onForgot }: { token: string | null; onSignIn: () => void; onForgot: () => void }) {
  const { t } = useI18n();
  const message = useErrorText();
  const [password, setPassword] = useState('');
  const [again, setAgain] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [linkBad, setLinkBad] = useState(token === null);
  const [done, setDone] = useState(false);
  const [busy, setBusy] = useState(false);

  async function submit(e: FormEvent) {
    e.preventDefault();
    if (!token) return;
    if (password.length < 12) return setError(t('auth.errors.too_short'));
    if (password !== again) return setError(t('auth.errors.mismatch'));
    setBusy(true);
    setError(null);
    try {
      await staffAuth.confirmReset(token, password);
      setDone(true);
    } catch (err) {
      if (err instanceof ApiError && err.code === 'reset_link_invalid') setLinkBad(true);
      setError(message(err, 'new_password'));
    } finally {
      setBusy(false);
    }
  }

  if (done) {
    return (
      <Card title={t('auth.reset.title')}>
        <p role="status">{t('auth.reset.done')}</p>
        <button className="btn primary" type="button" onClick={onSignIn}>
          {t('auth.reset.toSignIn')}
        </button>
      </Card>
    );
  }
  if (linkBad) {
    return (
      <Card title={t('auth.reset.title')}>
        <p role="alert">{token === null ? t('auth.reset.noToken') : t('auth.errors.reset_link_invalid')}</p>
        <button className="btn primary" type="button" onClick={onForgot}>
          {t('auth.reset.newLink')}
        </button>
        <button className="link" type="button" onClick={onSignIn}>
          {t('auth.forgot.back')}
        </button>
      </Card>
    );
  }
  return (
    <Card title={t('auth.reset.title')}>
      <p id="reset-hint" className="muted">{t('auth.reset.hint')}</p>
      <form className="form" onSubmit={submit} noValidate>
        {/* Lets password managers save the new password for the right account. */}
        <input type="text" autoComplete="username" hidden readOnly value="" />
        <label htmlFor="new-password">{t('auth.reset.password')}</label>
        <input id="new-password" type="password" autoComplete="new-password" minLength={12} maxLength={128} required
          value={password} onChange={(e) => setPassword(e.target.value)} aria-invalid={error ? true : undefined}
          aria-describedby={error ? 'reset-error reset-hint' : 'reset-hint'} />
        <label htmlFor="new-password-again">{t('auth.reset.confirm')}</label>
        <input id="new-password-again" type="password" autoComplete="new-password" maxLength={128} required value={again}
          onChange={(e) => setAgain(e.target.value)} aria-invalid={error ? true : undefined}
          aria-describedby={error ? 'reset-error' : undefined} />
        <ErrorText id="reset-error" text={error} />
        <button className="btn primary" type="submit" disabled={busy} aria-busy={busy}>
          {t('auth.reset.submit')}
        </button>
      </form>
    </Card>
  );
}
