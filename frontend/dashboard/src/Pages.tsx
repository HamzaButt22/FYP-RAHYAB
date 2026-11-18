// The signed-in dashboard (FR-72..74, FR-77): D-02 your classes with the students worth a chat, D-03 a class
// roster, D-04 a student's printable summary. Designs: design/screens/D-0*.html. Data: docs/api/openapi.yaml
// (/dash/*). The API decides who may be seen; this code only shows what it returns. A 401 (session ended)
// goes back to sign-in. Only built pages are in the menu: no buttons that do nothing.

import { useState, type ReactNode } from 'react';

import logo from '../../../design/brand/logo/svg/branch-light.svg';
import {
  ApiError,
  dash,
  daysSince,
  percent,
  routeHash,
  type ClassSummary,
  type Flag,
  type RosterRow,
  type StudentSummary,
} from './api';
import { useI18n } from './i18n';
import { Status, useLoad } from './load';
import { useSession } from './session';

// ----------------------------------------------------------------------------------------- shell
export function Shell({ active, children }: { active: 'classes' | 'school'; children: ReactNode }) {
  const { t } = useI18n();
  const { me, signOut } = useSession();
  return (
    <div className="layout">
      <nav className="side" aria-label={t('nav.label')}>
        <div className="brand">
          <img src={logo} alt="" aria-hidden="true" width={26} height={26} />
          <span className="brand-word">rahyaab</span>
        </div>
        <a
          className={active === 'classes' ? 'nav on' : 'nav'}
          href={routeHash({ page: 'classes' })}
          aria-current={active === 'classes' ? 'page' : undefined}
        >
          {t('nav.classes')}
        </a>
        {me.role === 'school_admin' ? (
          <a
            className={active === 'school' ? 'nav on' : 'nav'}
            href={routeHash({ page: 'school' })}
            aria-current={active === 'school' ? 'page' : undefined}
          >
            {t('nav.school')}
          </a>
        ) : null}
        <div className="side-foot">
          <p className="muted small">{t('auth.signedInAs', { email: me.email })}</p>
          <button type="button" className="btn secondary" onClick={signOut}>
            {t('auth.signOut')}
          </button>
        </div>
      </nav>
      <main className="main">{children}</main>
    </div>
  );
}

// ------------------------------------------------------------------------------------- D-02 classes
export function ClassesPage() {
  const { t } = useI18n();
  const [classes, retryClasses] = useLoad(dash.classes, 'classes');
  return (
    <>
      <header className="head">
        <h1 className="h1">{t('dash.classesTitle')}</h1>
      </header>
      {classes.status !== 'ok' ? (
        <Status state={classes} retry={retryClasses} />
      ) : classes.data.length === 0 ? (
        <p className="card notice">{t('dash.noClasses')}</p>
      ) : (
        <section className="class-grid">
          {classes.data.map((c) => (
            <ClassCard key={c.id} cls={c} />
          ))}
        </section>
      )}
      <FlagsTable onHandled={retryClasses} />
    </>
  );
}

function ClassCard({ cls }: { cls: ClassSummary }) {
  const { t } = useI18n();
  return (
    <a className="card class-card" href={routeHash({ page: 'class', id: cls.id })}>
      <span className="h3">{t('dash.classCard', { name: cls.name })}</span>
      <span className="muted">{cls.school}</span>
      <span>{t('dash.students', { n: cls.enrolled })}</span>
      <span>{t('dash.startedPct', { pct: percent(cls.started, cls.enrolled) })}</span>
      {cls.open_flags > 0 ? <span className="chip warn">{t('dash.toCheck', { n: cls.open_flags })}</span> : null}
    </a>
  );
}

function FlagsTable({ onHandled }: { onHandled: () => void }) {
  const { t } = useI18n();
  const { me, signedOut } = useSession();
  const [flags, retry] = useLoad(dash.flags, 'flags');
  const [handled, setHandled] = useState<string[]>([]);
  const [failed, setFailed] = useState(false);

  async function handle(flag: Flag) {
    setFailed(false);
    try {
      await dash.resolveFlag(flag.id, me.csrf_token);
      setHandled((ids) => [...ids, flag.id]);
      onHandled(); // the class cards' "to check" counts change too
    } catch (err) {
      if (err instanceof ApiError && err.status === 401) signedOut();
      else setFailed(true);
    }
  }

  if (flags.status !== 'ok') return <Status state={flags} retry={retry} />;
  const open = flags.data.filter((f) => !handled.includes(f.id));
  return (
    <section className="section" aria-labelledby="attention-title">
      <h2 id="attention-title" className="h2">
        {t('dash.attention')}
      </h2>
      {failed ? (
        <p role="alert" className="field-error">
          {t('dash.error')}
        </p>
      ) : null}
      {open.length === 0 ? (
        <p className="muted" role="status">
          {t('dash.attentionNone')}
        </p>
      ) : (
        <div className="card table-card">
          <div className="table-scroll">
            <table className="tbl">
              <caption className="sr-only">{t('dash.attentionCaption')}</caption>
              <thead>
                <tr>
                  <th scope="col">{t('dash.colFlag')}</th>
                  <th scope="col">{t('dash.colStudent')}</th>
                  <th scope="col">{t('dash.colClass')}</th>
                  <th scope="col">{t('dash.colSince')}</th>
                  <th scope="col">{t('dash.colAction')}</th>
                  <th scope="col">
                    <span className="sr-only">{t('dash.handled')}</span>
                  </th>
                </tr>
              </thead>
              <tbody>
                {open.map((f) => {
                  const days = daysSince(f.created_at);
                  return (
                    <tr key={f.id}>
                      <td>
                        <span className="chip warn">{t(`flags.${f.type}.label`)}</span>
                      </td>
                      <td>
                        <a className="nickname" href={routeHash({ page: 'student', id: f.student_id, classId: f.class_id })}>
                          {f.nickname}
                        </a>
                      </td>
                      <td>{f.class_name}</td>
                      <td>{days === 0 ? t('dash.today') : t('dash.days', { n: days })}</td>
                      <td className="wrap">{t(`flags.${f.type}.action`)}</td>
                      <td>
                        <button
                          type="button"
                          className="btn secondary small-btn"
                          onClick={() => void handle(f)}
                          aria-label={t('dash.handledLabel', { flag: t(`flags.${f.type}.label`), nickname: f.nickname })}
                        >
                          {t('dash.handled')}
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </section>
  );
}

// -------------------------------------------------------------------------------------- D-03 roster
export function RosterPage({ classId }: { classId: string }) {
  const { t } = useI18n();
  const [classes, retryClasses] = useLoad(dash.classes, 'classes');
  const [rows, retryRows] = useLoad(() => dash.roster(classId), `roster:${classId}`);
  if (classes.status !== 'ok') return <Status state={classes} retry={retryClasses} />;
  const cls = classes.data.find((c) => c.id === classId);
  if (!cls) {
    return (
      <>
        <p className="card notice" role="alert">
          {t('dash.error')}
        </p>
        <a className="link" href={routeHash({ page: 'classes' })}>
          {t('dash.back')}
        </a>
      </>
    );
  }
  return (
    <>
      <a className="link back" href={routeHash({ page: 'classes' })}>
        {t('dash.back')}
      </a>
      <header className="head">
        <div>
          <p className="muted">{cls.school}</p>
          <h1 className="h1">{t('roster.title', { name: cls.name })}</h1>
        </div>
        <div className="actions">
          <a className="btn secondary" href={routeHash({ page: 'forms', id: classId })}>
            {t('roster.forms')}
          </a>
          <a className="btn secondary" href={dash.exportUrl(classId)}>
            {t('roster.export')}
          </a>
        </div>
      </header>

      <section className="stats">
        <div className="card">
          <span className="muted">{t('roster.started')}</span>
          <span className="stat">
            {cls.started} / {cls.enrolled}
          </span>
        </div>
        <div className="card">
          <span className="muted">{t('roster.ready')}</span>
          <span className="stat">{cls.blueprint_ready}</span>
        </div>
        <div className="card">
          <span className="muted">{t('roster.chat')}</span>
          <span className="stat">{cls.open_flags}</span>
        </div>
      </section>

      {cls.not_shown > 0 ? (
        <p className="card notice" role="note">
          {t(cls.not_shown === 1 ? 'roster.notShownOne' : 'roster.notShown', { n: cls.not_shown })}
        </p>
      ) : null}

      {rows.status !== 'ok' ? (
        <Status state={rows} retry={retryRows} />
      ) : rows.data.length === 0 ? (
        <p className="card notice">{t('roster.empty')}</p>
      ) : (
        <RosterTable rows={rows.data} classId={classId} />
      )}
    </>
  );
}

function RosterTable({ rows, classId }: { rows: RosterRow[]; classId: string }) {
  const { t } = useI18n();
  return (
    <div className="card table-card">
      <div className="table-scroll">
        <table className="tbl">
          <caption className="sr-only">{t('roster.tableCaption')}</caption>
          <thead>
            <tr>
              <th scope="col">{t('roster.colStudent')}</th>
              <th scope="col">{t('roster.colForm')}</th>
              <th scope="col">{t('roster.colProgress')}</th>
              <th scope="col">{t('roster.colPath')}</th>
              <th scope="col">{t('roster.colConfidence')}</th>
              <th scope="col">{t('roster.colFlags')}</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.student_id}>
                <td>
                  <a
                    className="nickname"
                    href={routeHash({ page: 'student', id: row.student_id, classId })}
                    aria-label={t('roster.open', { nickname: row.nickname })}
                  >
                    {row.nickname}
                  </a>
                </td>
                <td>{row.form_serial ?? '—'}</td>
                <td>{row.started ? t('roster.week', { n: row.week, total: 4 }) : t('roster.notStarted')}</td>
                <td>{row.top_path ?? t('roster.none')}</td>
                <td>{row.confidence ? t(`confidence.${row.confidence}`) : t('roster.none')}</td>
                <td>
                  {row.flags.length === 0
                    ? '—'
                    : row.flags.map((f) => (
                        <span key={f} className="chip warn">
                          {t(`flags.${f}.label`)}
                        </span>
                      ))}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ------------------------------------------------------------------------------------- D-04 summary
export function StudentPage({ studentId, classId }: { studentId: string; classId: string | null }) {
  const { t } = useI18n();
  const [summary, retry] = useLoad(() => dash.summary(studentId), `student:${studentId}`);
  if (summary.status !== 'ok') return <Status state={summary} retry={retry} />;
  const s: StudentSummary = summary.data;
  const row = s.roster;
  return (
    <article className="summary">
      <a className="link back no-print" href={classId ? routeHash({ page: 'class', id: classId }) : routeHash({ page: 'classes' })}>
        {classId ? t('dash.backToClass', { name: s.class_name }) : t('dash.back')}
      </a>
      <header className="head">
        <div>
          <p className="muted">
            {s.school} · {t('roster.title', { name: s.class_name })}
          </p>
          <h1 className="h1 nickname">{row.nickname}</h1>
          <p className="muted">
            {[
              row.started ? t('roster.week', { n: row.week, total: 4 }) : t('roster.notStarted'),
              s.recommendation ? t('student.ready') : null,
              row.form_serial ? t('student.form', { serial: row.form_serial }) : null,
              s.consent_method ? t(`student.consent.${s.consent_method}`) : null,
            ]
              .filter(Boolean)
              .join(' · ')}
          </p>
        </div>
        <div className="actions no-print">
          <button type="button" className="btn primary" onClick={() => window.print()}>
            {t('student.print')}
          </button>
        </div>
      </header>

      <section className="card section">
        <h2 className="h2">
          {t('student.topPaths')}
          {s.recommendation ? ` · ${t(`confidence.${s.recommendation.confidence}`)}` : ''}
        </h2>
        {s.recommendation ? (
          <>
            <ol className="paths">
              {s.recommendation.ranked.map((card) => (
                <li key={card.stream_id}>
                  <span>{card.name}</span>
                  <span className="chip">{t(`fit.${card.fit_band}`)}</span>
                </li>
              ))}
            </ol>
            {s.recommendation.provisional ? <p className="muted small">{t('student.provisional')}</p> : null}
          </>
        ) : (
          <p className="muted">{t('student.noResult')}</p>
        )}
      </section>

      {s.top_interests.length > 0 ? (
        <section className="card section">
          <h2 className="h2">{t('student.interests')}</h2>
          <ol className="paths">
            {s.top_interests.map((code) => (
              <li key={code}>{t(`interest.${code}`)}</li>
            ))}
          </ol>
        </section>
      ) : null}

      {row.flags.length > 0 ? (
        <section className="card section">
          <h2 className="h2">{t('roster.chat')}</h2>
          <ul className="paths">
            {row.flags.map((f) => (
              <li key={f}>
                <b>{t(`flags.${f}.label`)}</b>: {t(`flags.${f}.action`)}
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      <p className="muted small">{t('student.logged')}</p>
    </article>
  );
}
