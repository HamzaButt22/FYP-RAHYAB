// The teacher and admin dashboard. Staff sign in first (FR-71): password, then a 6-digit code. The session
// lives in an HttpOnly cookie the API sets; this code only asks GET /auth/staff/me who is signed in.
// Invite and reset emails open /reset#token=...: the token is read once and removed from the address bar.
// After sign-in: your classes (D-02), a class roster (D-03) and a student summary (D-04), chosen by the address
// (#/classes, #/class/<id>, #/student/<id>), so the browser's Back button works.

import { useEffect, useState } from 'react';

import './app.css';
import { ApiError, parseRoute, staffAuth, tokenFromHash, type Challenge, type Me, type Route } from './api';
import { Forgot, ResetPassword, SignIn, TwoStep } from './AuthScreens';
import { I18nProvider, useI18n } from './i18n';
import { FormsPage } from './FormsPage';
import { ClassesPage, RosterPage, Shell, StudentPage } from './Pages';
import { SessionProvider } from './session';

type Screen =
  | { name: 'loading' }
  | { name: 'signIn' }
  | { name: 'twoStep'; challenge: Challenge }
  | { name: 'forgot' }
  | { name: 'reset'; token: string | null }
  | { name: 'app'; me: Me };

/** The reset or invite token, read once at start-up and removed from the address bar and history. */
function takeResetToken(): { token: string | null } | null {
  if (typeof window === 'undefined' || window.location.pathname !== '/reset') return null;
  const token = tokenFromHash(window.location.hash);
  window.history.replaceState(null, '', '/');
  return { token };
}

const startLink = takeResetToken();

export function App() {
  return (
    <I18nProvider>
      <Dashboard />
    </I18nProvider>
  );
}

function Dashboard() {
  const { t } = useI18n();
  const [screen, setScreen] = useState<Screen>(startLink ? { name: 'reset', token: startLink.token } : { name: 'loading' });

  useEffect(() => {
    if (screen.name !== 'loading') return;
    let live = true;
    staffAuth
      .me()
      .then((me) => live && setScreen({ name: 'app', me }))
      .catch((err: unknown) => {
        // 401: not signed in. Anything else (API down) also starts at sign-in, which shows the error on use.
        if (live) setScreen({ name: 'signIn' });
        if (!(err instanceof ApiError)) console.error(err);
      });
    return () => {
      live = false;
    };
  }, [screen.name]);

  switch (screen.name) {
    case 'loading':
      return (
        <main className="auth" aria-busy="true">
          <p role="status">{t('auth.loading')}</p>
        </main>
      );
    case 'signIn':
      return <SignIn onChallenge={(challenge) => setScreen({ name: 'twoStep', challenge })} onForgot={() => setScreen({ name: 'forgot' })} />;
    case 'twoStep':
      return <TwoStep challenge={screen.challenge} onDone={() => setScreen({ name: 'loading' })} onBack={() => setScreen({ name: 'signIn' })} />;
    case 'forgot':
      return <Forgot onBack={() => setScreen({ name: 'signIn' })} />;
    case 'reset':
      return <ResetPassword token={screen.token} onSignIn={() => setScreen({ name: 'signIn' })} onForgot={() => setScreen({ name: 'forgot' })} />;
    case 'app': {
      const { me } = screen;
      const signedOut = () => setScreen({ name: 'signIn' });
      const signOut = () => {
        staffAuth
          .logout(me.csrf_token)
          .catch(() => undefined) // signed out either way: the session may already have ended
          .finally(signedOut);
      };
      return (
        <SessionProvider value={{ me, signedOut, signOut }}>
          <Shell>
            <RoutedPage />
          </Shell>
        </SessionProvider>
      );
    }
  }
}

/** The page the address names; follows Back and Forward. */
function RoutedPage() {
  const [route, setRoute] = useState<Route>(() => parseRoute(window.location.hash));
  useEffect(() => {
    const follow = () => {
      setRoute(parseRoute(window.location.hash));
      window.scrollTo(0, 0);
    };
    window.addEventListener('hashchange', follow);
    return () => window.removeEventListener('hashchange', follow);
  }, []);
  if (route.page === 'class') return <RosterPage key={route.id} classId={route.id} />;
  if (route.page === 'forms') return <FormsPage key={`forms:${route.id}`} classId={route.id} />;
  if (route.page === 'student') return <StudentPage key={route.id} studentId={route.id} classId={route.classId} />;
  return <ClassesPage />;
}
