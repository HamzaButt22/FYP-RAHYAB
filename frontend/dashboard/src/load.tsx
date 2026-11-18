// Loading data for a dashboard page, and the loading or error message shown meanwhile. A 401 means the session
// ended, so the page goes back to sign-in.

import { useEffect, useState } from 'react';

import { ApiError } from './api';
import { useI18n } from './i18n';
import { useSession } from './session';

export type Load<T> = { status: 'loading' } | { status: 'error' } | { status: 'ok'; data: T };

/** Loads data for a page; a 401 means the session ended, so it goes back to sign-in. */
export function useLoad<T>(load: () => Promise<T>, key: string): [Load<T>, () => void] {
  const { signedOut } = useSession();
  const [state, setState] = useState<Load<T>>({ status: 'loading' });
  const [attempt, setAttempt] = useState(0);
  useEffect(() => {
    let live = true;
    load()
      .then((data) => live && setState({ status: 'ok', data }))
      .catch((err: unknown) => {
        if (!live) return;
        if (err instanceof ApiError && err.status === 401) signedOut();
        else setState({ status: 'error' });
      });
    return () => {
      live = false;
    };
    // `load` is a new function every render; `key` says when the data to load is different.
  }, [key, attempt]);
  // Data already on screen stays there while it is fetched again (no "Loading" flash, and messages next to it,
  // such as "Invite sent", are not lost); only an error or a first load shows the loading state.
  const retry = () => {
    setState((current) => (current.status === 'ok' ? current : { status: 'loading' }));
    setAttempt((n) => n + 1);
  };
  return [state, retry];
}

export function Status({ state, retry }: { state: Load<unknown>; retry: () => void }) {
  const { t } = useI18n();
  if (state.status === 'loading') return <p role="status">{t('dash.loading')}</p>;
  return (
    <div role="alert" className="card notice">
      <p>{t('dash.error')}</p>
      <button type="button" className="btn secondary" onClick={retry}>
        {t('dash.retry')}
      </button>
    </div>
  );
}

