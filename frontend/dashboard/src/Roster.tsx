// D-03 Teacher: class roster (design/screens/D-03-teacher-class-roster.html).
// The data is a fixed sample until staff sign-in and the dashboard API exist; the page says so.

import logo from '../../../design/brand/logo/svg/branch-light.svg';
import { useI18n } from './i18n';

type Row = {
  nickname: string;
  week: number;
  path: 'preEngineering' | 'ics' | 'preMedical' | null;
  confidence: 'sure' | 'unsure' | null;
  mixed: boolean;
};

const SAMPLE = {
  school: 'Govt. Girls High School · 2026–27',
  className: '9-B',
  started: [28, 34] as const,
  ready: 19,
  chat: 4,
  rows: [
    { nickname: 'Ayesha_10', week: 4, path: 'preEngineering', confidence: 'sure', mixed: false },
    { nickname: 'Bilal_R', week: 2, path: null, confidence: null, mixed: false },
    { nickname: 'Hira_S', week: 4, path: 'ics', confidence: 'unsure', mixed: true },
    { nickname: 'Usman_T', week: 3, path: null, confidence: null, mixed: false },
    { nickname: 'Zara_K', week: 4, path: 'preMedical', confidence: 'sure', mixed: false },
  ] satisfies Row[],
};

const NAV = ['classes', 'students', 'reports', 'school', 'settings'] as const;

export function Roster() {
  const { t } = useI18n();
  return (
    <div className="layout">
      <nav className="side" aria-label={t('nav.label')}>
        <div className="brand">
          <img src={logo} alt="" aria-hidden="true" width={26} height={26} />
          <span className="brand-word">
            rahyaab
          </span>
        </div>
        {NAV.map((item) => (
          <a key={item} className={item === 'classes' ? 'nav on' : 'nav'} href="#" aria-current={item === 'classes' ? 'page' : undefined}>
            {t(`nav.${item}`)}
          </a>
        ))}
      </nav>

      <main className="main">
        <p className="demo" role="note">
          {t('demo')}
        </p>

        <header className="head">
          <div>
            <p className="muted">{SAMPLE.school}</p>
            <h1 className="h1">{t('roster.title', { name: SAMPLE.className })}</h1>
          </div>
          <div className="actions">
            <button type="button" className="btn secondary">
              {t('roster.export')}
            </button>
            <button type="button" className="btn primary">
              {t('roster.invite')}
            </button>
          </div>
        </header>

        <section className="stats">
          <div className="card">
            <span className="muted">{t('roster.started')}</span>
            <span className="stat">
              <bdi>
                {SAMPLE.started[0]} / {SAMPLE.started[1]}
              </bdi>
            </span>
          </div>
          <div className="card">
            <span className="muted">{t('roster.ready')}</span>
            <span className="stat">{SAMPLE.ready}</span>
          </div>
          <div className="card">
            <span className="muted">{t('roster.chat')}</span>
            <span className="stat">{SAMPLE.chat}</span>
          </div>
        </section>

        <div className="card table-card">
          <div className="table-scroll">
            <table className="tbl">
              <caption className="sr-only">{t('roster.tableCaption')}</caption>
              <thead>
                <tr>
                  <th scope="col">{t('roster.colStudent')}</th>
                  <th scope="col">{t('roster.colProgress')}</th>
                  <th scope="col">{t('roster.colPath')}</th>
                  <th scope="col">{t('roster.colConfidence')}</th>
                  <th scope="col">{t('roster.colNote')}</th>
                </tr>
              </thead>
              <tbody>
                {SAMPLE.rows.map((row) => (
                  <tr key={row.nickname}>
                    <td>
                      <b className="nickname">
                        {row.nickname}
                      </b>
                    </td>
                    <td>{t('roster.week', { n: row.week, total: 4 })}</td>
                    <td>{row.path ? t(`paths.${row.path}`) : t('roster.none')}</td>
                    <td>{row.confidence ? t(`roster.${row.confidence}`) : t('roster.none')}</td>
                    <td>{row.mixed ? <span className="chip warn">{t('roster.mixed')}</span> : '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </main>
    </div>
  );
}
