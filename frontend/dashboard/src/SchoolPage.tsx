// D-09 School and teachers (FR-80, FR-106): for a school admin, their own school only. Invite teachers,
// counsellors and school admins (an email link, never a password), change who sees which classes, disable an
// account, reset a password or two-step sign-in (each confirmed first), add classes and make new class codes
// (each code shown once: only a hash is kept). The API enforces all of this; the page only offers it.

import { useState, type FormEvent } from 'react';

import { ApiError, looksLikeEmail, school, validSection, type NewCode, type SchoolClass, type StaffRow } from './api';
import { useI18n } from './i18n';
import { Status, useLoad } from './load';
import { useSession } from './session';

type Action = 'disable' | 'enable' | 'resetPassword' | 'resetTwoStep';

/** Runs a change and turns a 401 into sign-in; returns the error code, or null when it worked. */
function useChange() {
  const { me, signedOut } = useSession();
  return async <T,>(run: (csrf: string) => Promise<T>): Promise<{ ok: T } | { error: string }> => {
    try {
      return { ok: await run(me.csrf_token) };
    } catch (err) {
      if (err instanceof ApiError && err.status === 401) signedOut();
      return { error: err instanceof ApiError ? err.code : 'generic' };
    }
  };
}

export function SchoolPage() {
  const { t } = useI18n();
  const [staff, retryStaff] = useLoad(school.staff, 'school-staff');
  const [classes, retryClasses] = useLoad(school.classes, 'school-classes');
  return (
    <>
      <header className="head">
        <h1 className="h1">{t('school.title')}</h1>
      </header>
      {staff.status !== 'ok' || classes.status !== 'ok' ? (
        <Status state={staff.status !== 'ok' ? staff : classes} retry={() => { retryStaff(); retryClasses(); }} />
      ) : (
        <>
          <StaffSection rows={staff.data} classes={classes.data} onChanged={retryStaff} />
          <InviteSection classes={classes.data} onInvited={retryStaff} />
          <ClassesSection classes={classes.data} onChanged={retryClasses} />
        </>
      )}
    </>
  );
}

// ------------------------------------------------------------------------------------------- staff
function StaffSection({ rows, classes, onChanged }: { rows: StaffRow[]; classes: SchoolClass[]; onChanged: () => void }) {
  const { t } = useI18n();
  const [editing, setEditing] = useState<StaffRow | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  return (
    <section className="section" aria-labelledby="staff-title">
      <h2 id="staff-title" className="h2">
        {t('school.staffTitle')}
      </h2>
      {notice ? (
        <p className="card notice" role="status">
          {notice}
        </p>
      ) : null}
      {editing ? (
        <EditPanel
          person={editing}
          classes={classes}
          onClose={() => setEditing(null)}
          onDone={(message) => {
            setEditing(null);
            setNotice(message);
            onChanged();
          }}
        />
      ) : null}
      <div className="card table-card">
        <div className="table-scroll">
          <table className="tbl">
            <caption className="sr-only">{t('school.staffCaption')}</caption>
            <thead>
              <tr>
                <th scope="col">{t('school.colPerson')}</th>
                <th scope="col">{t('school.colRole')}</th>
                <th scope="col">{t('school.colClasses')}</th>
                <th scope="col">{t('school.colTwoStep')}</th>
                <th scope="col">{t('school.colStatus')}</th>
                <th scope="col">
                  <span className="sr-only">{t('school.colActions')}</span>
                </th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.id}>
                  <td>
                    {r.email} {r.is_you ? <span className="muted">{t('school.you')}</span> : null}
                  </td>
                  <td>{t(`school.role.${r.role}`)}</td>
                  <td className="wrap">{r.classes.length ? r.classes.map((c) => c.name).join(', ') : t('school.noClasses')}</td>
                  <td>{r.two_step ? t('school.twoStepOn') : t('school.twoStepOff')}</td>
                  <td>
                    <span className={r.status === 'active' ? 'chip' : 'chip warn'}>{t(`school.status.${r.status}`)}</span>
                  </td>
                  <td>
                    <button
                      type="button"
                      className="btn secondary small-btn"
                      onClick={() => {
                        setNotice(null);
                        setEditing(r);
                      }}
                      aria-label={t('school.editLabel', { email: r.email })}
                    >
                      {t('school.edit')}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
}

function ClassChecks({ classes, chosen, onChange, legend }: { classes: SchoolClass[]; chosen: string[]; onChange: (ids: string[]) => void; legend: string }) {
  return (
    <fieldset className="checks">
      <legend>{legend}</legend>
      {classes.map((c) => (
        <label key={c.id} className="check">
          <input
            type="checkbox"
            checked={chosen.includes(c.id)}
            onChange={(e) => onChange(e.target.checked ? [...chosen, c.id] : chosen.filter((id) => id !== c.id))}
          />
          {c.name}
        </label>
      ))}
    </fieldset>
  );
}

function EditPanel({ person, classes, onClose, onDone }: { person: StaffRow; classes: SchoolClass[]; onClose: () => void; onDone: (message: string) => void }) {
  const { t } = useI18n();
  const change = useChange();
  const [chosen, setChosen] = useState(person.classes.map((c) => c.id));
  const [confirming, setConfirming] = useState<Action | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function run(body: Parameters<typeof school.change>[1], message: string) {
    setBusy(true);
    setError(null);
    const result = await change((csrf) => school.change(person.id, body, csrf));
    setBusy(false);
    if ('ok' in result) onDone(message);
    else setError(t('dash.error'));
  }

  const actions: Action[] = person.is_you ? [] : [person.status === 'disabled' ? 'enable' : 'disable', 'resetPassword', 'resetTwoStep'];
  const bodyFor = (a: Action) =>
    a === 'disable' ? { disabled: true } : a === 'enable' ? { disabled: false } : a === 'resetPassword' ? { force_password_reset: true as const } : { reset_two_step: true as const };

  return (
    <div className="card section" aria-labelledby="edit-title">
      <h3 id="edit-title" className="h3">
        {t('school.editTitle', { email: person.email })}
      </h3>
      <form
        className="form"
        onSubmit={(e: FormEvent) => {
          e.preventDefault();
          void run({ class_ids: chosen }, t('school.done.classes'));
        }}
      >
        <ClassChecks classes={classes} chosen={chosen} onChange={setChosen} legend={t('school.classesFor')} />
        <div className="actions">
          <button className="btn primary" type="submit" disabled={busy} aria-busy={busy}>
            {t('school.save')}
          </button>
          <button className="btn secondary" type="button" onClick={onClose}>
            {t('school.close')}
          </button>
        </div>
      </form>

      {person.is_you ? <p className="muted small">{t('school.selfNote')}</p> : null}
      {confirming ? (
        <div className="notice card" role="alertdialog" aria-labelledby="confirm-text">
          <p id="confirm-text">{t(`school.confirm.${confirming === 'enable' ? 'disable' : confirming}`, { email: person.email })}</p>
          <div className="actions">
            <button className="btn primary" type="button" disabled={busy} onClick={() => void run(bodyFor(confirming), t(`school.done.${confirming}`))}>
              {t('school.confirm.yes')}
            </button>
            <button className="btn secondary" type="button" onClick={() => setConfirming(null)}>
              {t('school.confirm.no')}
            </button>
          </div>
        </div>
      ) : (
        <div className="actions">
          {actions.map((a) =>
            a === 'enable' ? (
              <button key={a} type="button" className="btn secondary" disabled={busy} onClick={() => void run(bodyFor(a), t('school.done.enable'))}>
                {t('school.enable')}
              </button>
            ) : (
              <button key={a} type="button" className="btn secondary" onClick={() => setConfirming(a)}>
                {t(`school.${a}`)}
              </button>
            ),
          )}
        </div>
      )}
      {error ? (
        <p className="field-error" role="alert">
          {error}
        </p>
      ) : null}
    </div>
  );
}

function InviteSection({ classes, onInvited }: { classes: SchoolClass[]; onInvited: () => void }) {
  const { t } = useI18n();
  const change = useChange();
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<StaffRow['role']>('teacher');
  const [chosen, setChosen] = useState<string[]>([]);
  const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(null);
  const [busy, setBusy] = useState(false);

  async function send(e: FormEvent) {
    e.preventDefault();
    if (!looksLikeEmail(email)) return setMessage({ ok: false, text: t('school.invite.emailError') });
    setBusy(true);
    const result = await change((csrf) => school.invite(email.trim(), role, chosen, csrf));
    setBusy(false);
    if ('ok' in result) {
      setMessage({ ok: true, text: t('school.invite.sent', { email: result.ok.email }) });
      setEmail('');
      setChosen([]);
      onInvited();
    } else {
      setMessage({ ok: false, text: result.error === 'email_taken' ? t('school.invite.taken') : t('dash.error') });
    }
  }

  return (
    <section className="card section" aria-labelledby="invite-title">
      <h2 id="invite-title" className="h2">
        {t('school.invite.title')}
      </h2>
      <p className="muted">{t('school.invite.help')}</p>
      <form className="form" onSubmit={send} noValidate>
        <label htmlFor="invite-email">{t('school.invite.email')}</label>
        <input id="invite-email" type="email" autoComplete="off" maxLength={254} value={email} onChange={(e) => setEmail(e.target.value)} />
        <label htmlFor="invite-role">{t('school.invite.role')}</label>
        <select id="invite-role" value={role} onChange={(e) => setRole(e.target.value as StaffRow['role'])}>
          {(['teacher', 'counsellor', 'school_admin'] as const).map((r) => (
            <option key={r} value={r}>
              {t(`school.role.${r}`)}
            </option>
          ))}
        </select>
        {classes.length ? <ClassChecks classes={classes} chosen={chosen} onChange={setChosen} legend={t('school.invite.classes')} /> : null}
        {message ? (
          <p className={message.ok ? '' : 'field-error'} role={message.ok ? 'status' : 'alert'}>
            {message.text}
          </p>
        ) : null}
        <button className="btn primary" type="submit" disabled={busy} aria-busy={busy}>
          {t('school.invite.submit')}
        </button>
      </form>
    </section>
  );
}

// ------------------------------------------------------------------------------------------ classes
function ClassesSection({ classes, onChanged }: { classes: SchoolClass[]; onChanged: () => void }) {
  const { t } = useI18n();
  const change = useChange();
  const [code, setCode] = useState<(NewCode & { name: string }) | null>(null);
  const [confirming, setConfirming] = useState<SchoolClass | null>(null);
  const [grade, setGrade] = useState('9');
  const [section, setSection] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const date = (iso: string) => new Date(iso).toLocaleDateString('en-GB');

  async function rotate(cls: SchoolClass) {
    setBusy(true);
    const result = await change((csrf) => school.newCode(cls.id, csrf));
    setBusy(false);
    setConfirming(null);
    if ('ok' in result) {
      setCode({ ...result.ok, name: cls.name });
      onChanged();
    } else setError(t('dash.error'));
  }

  async function add(e: FormEvent) {
    e.preventDefault();
    if (!validSection(section)) return setError(t('school.add.sectionError'));
    setBusy(true);
    setError(null);
    const result = await change((csrf) => school.addClass(Number(grade), section.trim(), csrf));
    setBusy(false);
    if ('ok' in result) {
      setCode({ ...result.ok, name: `${grade}-${section.trim().toUpperCase()}` });
      setSection('');
      onChanged();
    } else setError(result.error === 'class_exists' ? t('school.add.exists') : t('dash.error'));
  }

  return (
    <section className="section" aria-labelledby="classes-title">
      <h2 id="classes-title" className="h2">
        {t('school.classesTitle')}
      </h2>
      {code ? (
        <div className="card notice printed" role="status">
          <p>
            <b>{t('school.code.title', { name: code.name })}</b>
          </p>
          <code className="password" aria-label={code.class_code.split('').join(' ')}>
            {code.class_code}
          </code>
          <p className="muted small">
            {t('school.code.help')} {t('school.code.until', { date: date(code.expires_at) })}
          </p>
          <button type="button" className="btn secondary" onClick={() => setCode(null)}>
            {t('school.code.hide')}
          </button>
        </div>
      ) : null}
      {confirming ? (
        <div className="card notice" role="alertdialog" aria-labelledby="rotate-text">
          <p id="rotate-text">{t('school.confirmNewCode', { name: confirming.name })}</p>
          <div className="actions">
            <button className="btn primary" type="button" disabled={busy} onClick={() => void rotate(confirming)}>
              {t('school.confirm.yes')}
            </button>
            <button className="btn secondary" type="button" onClick={() => setConfirming(null)}>
              {t('school.confirm.no')}
            </button>
          </div>
        </div>
      ) : null}
      <div className="card table-card">
        <div className="table-scroll">
          <table className="tbl">
            <caption className="sr-only">{t('school.classesCaption')}</caption>
            <thead>
              <tr>
                <th scope="col">{t('school.colClass')}</th>
                <th scope="col">{t('school.colCode')}</th>
                <th scope="col">
                  <span className="sr-only">{t('school.newCode')}</span>
                </th>
              </tr>
            </thead>
            <tbody>
              {classes.map((c) => (
                <tr key={c.id}>
                  <td>
                    <b>{c.name}</b>
                  </td>
                  <td>{c.code_live ? t('school.codeUntil', { date: date(c.code_expires_at) }) : <span className="chip warn">{t('school.codeExpired')}</span>}</td>
                  <td>
                    <button
                      type="button"
                      className="btn secondary small-btn"
                      onClick={() => {
                        setCode(null);
                        setConfirming(c);
                      }}
                      aria-label={t('school.newCodeLabel', { name: c.name })}
                    >
                      {t('school.newCode')}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      <form className="form form-row card section" onSubmit={add} noValidate aria-labelledby="add-title">
        <h3 id="add-title" className="h3 full">
          {t('school.add.title')}
        </h3>
        <div>
          <label htmlFor="add-grade">{t('school.add.grade')}</label>
          <select id="add-grade" value={grade} onChange={(e) => setGrade(e.target.value)}>
            {[8, 9, 10, 11, 12].map((g) => (
              <option key={g} value={g}>
                {g}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor="add-section">{t('school.add.section')}</label>
          <input id="add-section" maxLength={8} value={section} onChange={(e) => setSection(e.target.value)} aria-describedby="section-help" />
        </div>
        <button className="btn primary" type="submit" disabled={busy} aria-busy={busy}>
          {t('school.add.submit')}
        </button>
        <p id="section-help" className="muted small full">
          {t('school.add.sectionHelp')}
        </p>
        {error ? (
          <p className="field-error full" role="alert">
            {error}
          </p>
        ) : null}
      </form>
    </section>
  );
}
