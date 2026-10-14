'use client';

import {
  createContext,
  FormEvent,
  ReactNode,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';

export type MemberUser = {
  id?: string;
  email?: string;
  displayName?: string;
};

type MemberSessionContextValue = {
  user: MemberUser | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  register: (displayName: string, email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  refresh: () => Promise<void>;
};

const MemberSessionContext = createContext<MemberSessionContextValue | null>(null);

async function responseMessage(response: Response, fallback: string) {
  try {
    const payload = (await response.json()) as { error?: { message?: string } };
    return payload.error?.message ?? fallback;
  } catch {
    return fallback;
  }
}

export function MemberSessionProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<MemberUser | null>(null);
  const [loading, setLoading] = useState(true);
  const sessionRequestNumber = useRef(0);

  const refresh = useCallback(async () => {
    const requestNumber = ++sessionRequestNumber.current;
    const controller = new AbortController();
    setUser(null);
    setLoading(true);
    try {
      const response = await fetch('/api/member/session', {
        cache: 'no-store',
        signal: controller.signal,
      });
      if (requestNumber !== sessionRequestNumber.current) return;
      if (!response.ok) {
        setUser(null);
        return;
      }
      const payload = (await response.json()) as { data?: { user?: MemberUser | null } };
      setUser(payload.data?.user ?? null);
    } catch {
      if (requestNumber !== sessionRequestNumber.current) return;
      setUser(null);
    } finally {
      if (requestNumber === sessionRequestNumber.current) setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refresh();
    return () => {
      sessionRequestNumber.current += 1;
    };
  }, [refresh]);

  const signIn = useCallback(async (email: string, password: string) => {
    const requestNumber = ++sessionRequestNumber.current;
    setUser(null);
    setLoading(true);
    try {
      const response = await fetch('/api/member/session', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      if (requestNumber !== sessionRequestNumber.current) return;
      if (!response.ok) throw new Error(await responseMessage(response, 'Sign-in failed.'));
      const payload = (await response.json()) as { data?: { user?: MemberUser } };
      setUser(payload.data?.user ?? null);
    } finally {
      if (requestNumber === sessionRequestNumber.current) setLoading(false);
    }
  }, []);

  const register = useCallback(
    async (displayName: string, email: string, password: string) => {
      const response = await fetch('/api/member/register', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ displayName, email, password }),
      });
      if (!response.ok) throw new Error(await responseMessage(response, 'Registration failed.'));
      await signIn(email, password);
    },
    [signIn],
  );

  const signOut = useCallback(async () => {
    ++sessionRequestNumber.current;
    setUser(null);
    setLoading(false);
    try {
      await fetch('/api/member/session', { method: 'DELETE' });
    } finally {
      setUser(null);
    }
  }, []);

  const value = useMemo(
    () => ({ user, loading, signIn, register, signOut, refresh }),
    [loading, refresh, register, signIn, signOut, user],
  );
  return <MemberSessionContext.Provider value={value}>{children}</MemberSessionContext.Provider>;
}

export function useMemberSession() {
  const value = useContext(MemberSessionContext);
  if (!value) throw new Error('useMemberSession must be used inside MemberSessionProvider');
  return value;
}

export default function MemberAuthPanel({ heading = 'Sign in to continue' }: { heading?: string }) {
  const { user, loading, signIn, register, signOut } = useMemberSession();
  const [mode, setMode] = useState<'signin' | 'register'>('signin');
  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setError(null);
    try {
      if (mode === 'register') await register(displayName, email, password);
      else await signIn(email, password);
      setPassword('');
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Authentication failed.');
    } finally {
      setBusy(false);
    }
  }

  if (loading) return <p className="notice">Checking your JainConnect session…</p>;
  if (user) {
    return (
      <section className="session-panel" aria-label="Signed-in member session">
        <p className="eyebrow">Signed in</p>
        <p>
          {user.displayName ?? user.email ?? 'JainConnect member'}
          {user.email ? <span className="muted"> · {user.email}</span> : null}
        </p>
        <button className="button-secondary" type="button" onClick={() => void signOut()}>
          Sign out
        </button>
      </section>
    );
  }

  return (
    <section className="session-panel" aria-labelledby="member-auth-heading">
      <p className="eyebrow">Member account</p>
      <h2 id="member-auth-heading">{heading}</h2>
      <div className="workflow-tabs" role="tablist" aria-label="Member account action">
        <button
          className={mode === 'signin' ? 'workflow-tab active' : 'workflow-tab'}
          type="button"
          role="tab"
          aria-selected={mode === 'signin'}
          onClick={() => setMode('signin')}
        >
          Sign in
        </button>
        <button
          className={mode === 'register' ? 'workflow-tab active' : 'workflow-tab'}
          type="button"
          role="tab"
          aria-selected={mode === 'register'}
          onClick={() => setMode('register')}
        >
          Create account
        </button>
      </div>
      <form className="workflow-form" onSubmit={submit}>
        {mode === 'register' ? (
          <div className="field">
            <label htmlFor="member-display-name">Display name</label>
            <input
              id="member-display-name"
              required
              minLength={2}
              maxLength={120}
              autoComplete="name"
              value={displayName}
              onChange={(event) => setDisplayName(event.target.value)}
            />
          </div>
        ) : null}
        <div className="field">
          <label htmlFor="member-email">Email</label>
          <input
            id="member-email"
            type="email"
            required
            autoComplete="username"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
          />
        </div>
        <div className="field">
          <label htmlFor="member-password">Password</label>
          <input
            id="member-password"
            type="password"
            required
            minLength={12}
            maxLength={128}
            autoComplete={mode === 'signin' ? 'current-password' : 'new-password'}
            value={password}
            onChange={(event) => setPassword(event.target.value)}
          />
        </div>
        {error ? (
          <p className="notice notice-error" role="alert">
            {error}
          </p>
        ) : null}
        <button type="submit" disabled={busy}>
          {busy ? 'Please wait…' : mode === 'signin' ? 'Sign in' : 'Create account'}
        </button>
      </form>
    </section>
  );
}
