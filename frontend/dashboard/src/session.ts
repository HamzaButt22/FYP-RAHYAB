// The signed-in staff member, for every dashboard page: who they are (and their CSRF token), and how to go back
// to sign-in when the session has ended (`signedOut`) or on purpose (`signOut`). Kept apart from the page
// components so the dev server can hot-reload pages without losing the session.

import { createContext, useContext } from 'react';

import type { Me } from './api';

export type Session = { me: Me; signedOut: () => void; signOut: () => void };

const SessionContext = createContext<Session | null>(null);

export const SessionProvider = SessionContext.Provider;

export function useSession(): Session {
  const value = useContext(SessionContext);
  if (!value) throw new Error('useSession must be used inside SessionProvider');
  return value;
}
