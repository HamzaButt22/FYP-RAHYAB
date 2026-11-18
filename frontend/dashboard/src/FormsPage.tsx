// D-11 Consent forms for one class (FR-05a, FR-06): every printed paper form by number and what happened to
// it, recording a signed form that came back, and printing new forms. Forms are listed by number, not by
// student: a student's nickname shows only if their family ticked the teacher box (FR-78). Printing gives the
// two locked Excel files the admin command makes, with the password shown once (the API keeps a sealed copy).

import { useState, type FormEvent } from 'react';

import {
  ApiError,
  bandsFor,
  dash,
  fileUrl,
  lastGroup,
  routeHash,
  type ConsentForm,
  type PrintedForms,
} from './api';
import { useI18n } from './i18n';
import { Status, useLoad } from './load';
import { useSession } from './session';

export function FormsPage({ classId }: { classId: string }) {
  const { t } = useI18n();
  const [classes, retryClasses] = useLoad(dash.classes, 'classes');
  const [forms, retryForms] = useLoad(() => dash.forms(classId), `forms:${classId}`);
  const [recording, setRecording] = useState<ConsentForm | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  if (classes.status !== 'ok') return <Status state={classes} retry={retryClasses} />;
  const cls = classes.data.find((c) => c.id === classId);
  if (!cls) return <Status state={{ status: 'error' }} retry={retryClasses} />;

  const list = forms.status === 'ok' ? forms.data : [];
  const count = (status: ConsentForm['status']) => list.filter((f) => f.status === status).length;

  return (
    <>
      <a className="link back" href={routeHash({ page: 'class', id: classId })}>
        {t('forms.back', { name: cls.name })}
      </a>
      <header className="head">
        <div>
          <p className="muted">{cls.school}</p>
          <h1 className="h1">{t('forms.title', { name: cls.name })}</h1>
          <p className="muted">{t('forms.intro')}</p>
        </div>
      </header>

      {notice ? (
        <p className="card notice" role="status">
          {notice}
        </p>
      ) : null}

      {forms.status !== 'ok' ? (
        <Status state={forms} retry={retryForms} />
      ) : (
        <>
          <section className="stats">
            <div className="card">
              <span className="muted">{t('forms.waiting')}</span>
              <span className="stat">{count('printed')}</span>
            </div>
            <div className="card">
              <span className="muted">{t('forms.recordedCount')}</span>
              <span className="stat">{count('recorded')}</span>
            </div>
            <div className="card">
              <span className="muted">{t('forms.claimedCount')}</span>
              <span className="stat">{count('claimed')}</span>
            </div>
          </section>

          {recording ? (
            <RecordPanel
              classId={classId}
              form={recording}
              onCancel={() => setRecording(null)}
              onSaved={(saved) => {
                setRecording(null);
                setNotice(t('forms.saved', { serial: saved.serial }));
                retryForms();
              }}
            />
          ) : null}

          {list.length === 0 ? <p className="card notice">{t('forms.none')}</p> : <FormsTable forms={list} onRecord={(f) => {
            setNotice(null);
            setRecording(f);
          }} />}
        </>
      )}

      <PrintPanel classId={classId} onPrinted={retryForms} />
    </>
  );
}

function FormsTable({ forms, onRecord }: { forms: ConsentForm[]; onRecord: (form: ConsentForm) => void }) {
  const { t } = useI18n();
  const yesNo = (value: boolean | null) => (value === null ? '—' : value ? t('forms.yes') : t('forms.no'));
  return (
    <div className="card table-card">
      <div className="table-scroll">
        <table className="tbl">
          <caption className="sr-only">{t('forms.caption')}</caption>
          <thead>
            <tr>
              <th scope="col">{t('forms.colForm')}</th>
              <th scope="col">{t('forms.colType')}</th>
              <th scope="col">{t('forms.colStatus')}</th>
              <th scope="col">{t('forms.colBand')}</th>
              <th scope="col">{t('forms.colResearch')}</th>
              <th scope="col">{t('forms.colTeacher')}</th>
              <th scope="col">{t('forms.colRecorded')}</th>
              <th scope="col">{t('forms.colStudent')}</th>
            </tr>
          </thead>
          <tbody>
            {forms.map((f) => (
              <tr key={f.serial}>
                <td>
                  <b>{f.serial}</b>
                </td>
                <td>{t(`forms.kind.${f.kind}`)}</td>
                <td>
                  {f.status === 'printed' ? (
                    <button
                      type="button"
                      className="btn secondary small-btn"
                      onClick={() => onRecord(f)}
                      aria-label={t('forms.recordLabel', { serial: f.serial })}
                    >
                      {t('forms.record')}
                    </button>
                  ) : (
                    <span className={f.status === 'expired' ? 'chip warn' : 'chip'}>{t(`forms.status.${f.status}`)}</span>
                  )}
                </td>
                <td>{f.age_band ?? '—'}</td>
                <td>{yesNo(f.research_opt_in)}</td>
                <td>{yesNo(f.teacher_visible)}</td>
                <td>
                  {f.recorded_at && f.recorded_by
                    ? t('forms.recordedOn', { date: new Date(f.recorded_at).toLocaleDateString('en-GB'), who: f.recorded_by })
                    : '—'}
                </td>
                <td>{f.status === 'claimed' ? (f.nickname ?? t('forms.hidden')) : '—'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function RecordPanel({
  classId,
  form,
  onCancel,
  onSaved,
}: {
  classId: string;
  form: ConsentForm;
  onCancel: () => void;
  onSaved: (form: ConsentForm) => void;
}) {
  const { t } = useI18n();
  const { me, signedOut } = useSession();
  const [band, setBand] = useState('');
  const [research, setResearch] = useState(false);
  const [teacher, setTeacher] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function save(e: FormEvent) {
    e.preventDefault();
    if (!band) return setError(t('forms.bandRequired'));
    setBusy(true);
    setError(null);
    try {
      onSaved(await dash.recordForm(classId, form.serial, { age_band: band, research_opt_in: research, teacher_visible: teacher }, me.csrf_token));
    } catch (err) {
      if (err instanceof ApiError && err.status === 401) return signedOut();
      if (err instanceof ApiError && err.code === 'already_recorded') setError(t('forms.already'));
      else if (err instanceof ApiError && err.fieldCodes.age_band) setError(t('forms.bandWrong'));
      else setError(t('dash.error'));
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="card section" aria-labelledby="record-title">
      <h2 id="record-title" className="h2">
        {t('forms.recordTitle', { serial: form.serial })} · {t(`forms.kind.${form.kind}`)}
      </h2>
      <p className="muted">{t('forms.recordHelp')}</p>
      <form className="form" onSubmit={save} noValidate>
        <label htmlFor="band">{t('forms.band')}</label>
        <select id="band" value={band} onChange={(e) => setBand(e.target.value)} required aria-describedby={error ? 'record-error' : undefined}>
          <option value="">{t('forms.chooseBand')}</option>
          {bandsFor(form.kind).map((b) => (
            <option key={b} value={b}>
              {b}
            </option>
          ))}
        </select>
        <label className="check">
          <input type="checkbox" checked={research} onChange={(e) => setResearch(e.target.checked)} />
          {t('forms.researchBox')}
        </label>
        <label className="check">
          <input type="checkbox" checked={teacher} onChange={(e) => setTeacher(e.target.checked)} aria-describedby="teacher-help" />
          {t('forms.teacherBox')}
        </label>
        <p id="teacher-help" className="muted small">
          {t('forms.teacherBoxHelp')}
        </p>
        {error ? (
          <p id="record-error" className="field-error" role="alert">
            {error}
          </p>
        ) : null}
        <div className="actions">
          <button className="btn primary" type="submit" disabled={busy} aria-busy={busy}>
            {t('forms.save')}
          </button>
          <button className="btn secondary" type="button" onClick={onCancel}>
            {t('forms.cancel')}
          </button>
        </div>
      </form>
    </section>
  );
}

function PrintPanel({ classId, onPrinted }: { classId: string; onPrinted: () => void }) {
  const { t } = useI18n();
  const { me, signedOut } = useSession();
  const [count, setCount] = useState('10');
  const [kind, setKind] = useState<'parent' | 'self'>('parent');
  const [result, setResult] = useState<PrintedForms | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function make(e: FormEvent) {
    e.preventDefault();
    const n = Number(count);
    if (!Number.isInteger(n) || n < 1 || n > 60) return setError(t('forms.print.countError'));
    setBusy(true);
    setError(null);
    try {
      setResult(await dash.printForms(classId, n, kind, me.csrf_token));
      onPrinted();
    } catch (err) {
      if (err instanceof ApiError && err.status === 401) return signedOut();
      setError(err instanceof ApiError && err.code === 'rate_limited' ? t('auth.errors.rate_limited', { minutes: Math.ceil(err.retryAfter / 60) || 1 }) : t('dash.error'));
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="card section" aria-labelledby="print-title">
      <h2 id="print-title" className="h2">
        {t('forms.print.title')}
      </h2>
      {result ? (
        <PrintedPanel result={result} onDone={() => setResult(null)} />
      ) : (
        <>
          <p className="muted">{t('forms.print.help')}</p>
          <form className="form form-row" onSubmit={make} noValidate>
            <div>
              <label htmlFor="print-count">{t('forms.print.count')}</label>
              <input id="print-count" type="number" inputMode="numeric" min={1} max={60} value={count}
                onChange={(e) => setCount(e.target.value)} aria-describedby={error ? 'print-error' : undefined} />
            </div>
            <div>
              <label htmlFor="print-kind">{t('forms.print.kind')}</label>
              <select id="print-kind" value={kind} onChange={(e) => setKind(e.target.value as 'parent' | 'self')}>
                <option value="parent">{t('forms.kind.parent')}</option>
                <option value="self">{t('forms.kind.self')}</option>
              </select>
            </div>
            <button className="btn primary" type="submit" disabled={busy} aria-busy={busy}>
              {t('forms.print.submit')}
            </button>
          </form>
          {error ? (
            <p id="print-error" className="field-error" role="alert">
              {error}
            </p>
          ) : null}
        </>
      )}
    </section>
  );
}

function PrintedPanel({ result, onDone }: { result: PrintedForms; onDone: () => void }) {
  const { t } = useI18n();
  const [typed, setTyped] = useState('');
  const [wrong, setWrong] = useState(false);
  const [confirmed, setConfirmed] = useState(false);
  const [urls] = useState(() => result.files.map((f) => ({ name: f.name, url: fileUrl(f.content) })));

  function confirm(e: FormEvent) {
    e.preventDefault();
    const ok = typed.trim().toUpperCase() === lastGroup(result.password);
    setWrong(!ok);
    setConfirmed(ok);
  }

  return (
    <div className="printed">
      <p role="status">{t('forms.print.done', { count: result.count, first: result.first, last: result.last })}</p>
      <ul className="downloads">
        {urls.map((f) => (
          <li key={f.name}>
            <a className="btn secondary" href={f.url} download={f.name}>
              {t('forms.print.download', { name: f.name })}
            </a>
          </li>
        ))}
      </ul>
      {confirmed ? (
        <>
          <p role="status">{t('forms.print.confirmed')}</p>
          <button type="button" className="btn secondary" onClick={onDone}>
            {t('forms.print.hide')}
          </button>
        </>
      ) : (
        <>
          <p className="muted">{t('forms.print.password')}</p>
          <code className="password" aria-label={`${t('forms.print.password')}: ${result.password.split('').join(' ')}`}>
            {result.password}
          </code>
          <p className="muted small">{t('forms.print.passwordHelp')}</p>
          <form className="form" onSubmit={confirm} noValidate>
            <label htmlFor="confirm-group">{t('forms.print.confirm')}</label>
            <input id="confirm-group" autoComplete="off" maxLength={4} value={typed} onChange={(e) => setTyped(e.target.value)}
              aria-invalid={wrong ? true : undefined} aria-describedby={wrong ? 'confirm-error' : undefined} />
            {wrong ? (
              <p id="confirm-error" className="field-error" role="alert">
                {t('forms.print.confirmWrong')}
              </p>
            ) : null}
            <button className="btn primary" type="submit">
              {t('forms.save')}
            </button>
          </form>
        </>
      )}
    </div>
  );
}
