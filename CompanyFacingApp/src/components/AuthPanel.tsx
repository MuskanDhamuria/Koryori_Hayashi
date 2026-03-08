import { FormEvent, useState } from 'react';

interface AuthPanelProps {
  setupRequired: boolean;
  loading: boolean;
  error: string | null;
  onLogin: (payload: { email: string; password: string }) => Promise<void>;
  onRegister: (payload: { name: string; email: string; password: string }) => Promise<void>;
}

export function AuthPanel({ setupRequired, loading, error, onLogin, onRegister }: AuthPanelProps) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [localError, setLocalError] = useState<string | null>(null);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLocalError(null);

    if (setupRequired) {
      if (!name.trim() || !email.trim() || !password.trim()) {
        setLocalError('Name, email, and password are required to create the first admin account.');
        return;
      }
      if (password !== confirmPassword) {
        setLocalError('The password confirmation does not match.');
        return;
      }
      await onRegister({ name, email, password });
      return;
    }

    if (!email.trim() || !password.trim()) {
      setLocalError('Email and password are required.');
      return;
    }

    await onLogin({ email, password });
  }

  return (
    <div className="auth-shell">
      <div className="auth-card">
        <span className="eyebrow">CompanyFacingApp Secure Access</span>
        <h1>{setupRequired ? 'Create the first admin account' : 'Sign in to the dashboard'}</h1>
        <p>
          {setupRequired
            ? 'The backend now stores users and operational data in a local SQLite database. Create the first administrator to enable secure access.'
            : 'Authentication is backed by the local SQLite database and uses secure, HTTP-only session cookies.'}
        </p>

        <form className="auth-form" onSubmit={handleSubmit}>
          {setupRequired ? (
            <label>
              Full name
              <input type="text" value={name} onChange={(event) => setName(event.target.value)} placeholder="Operations Admin" />
            </label>
          ) : null}

          <label>
            Email address
            <input type="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="admin@company.com" />
          </label>

          <label>
            Password
            <input type="password" value={password} onChange={(event) => setPassword(event.target.value)} placeholder="••••••••" />
          </label>

          {setupRequired ? (
            <label>
              Confirm password
              <input
                type="password"
                value={confirmPassword}
                onChange={(event) => setConfirmPassword(event.target.value)}
                placeholder="••••••••"
              />
            </label>
          ) : null}

          {localError || error ? <div className="auth-error">{localError ?? error}</div> : null}

          <button type="submit" className="button" disabled={loading}>
            {loading ? 'Working…' : setupRequired ? 'Create admin account' : 'Sign in'}
          </button>
        </form>
      </div>
    </div>
  );
}
