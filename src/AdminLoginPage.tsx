import { useState, type FormEvent } from 'react';
import { ArrowLeft, ArrowRight, Lock } from 'lucide-react';
import { BrandLogo } from './BrandPages';
import { ADMIN_DEMO_CREDENTIALS, useStore } from './store';

export function AdminLoginPage() {
  const { adminLogin } = useStore();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!email.trim() || !password) { setError('Enter both an email and a password.'); return; }
    setSubmitting(true);
    const ok = await adminLogin(email, password);
    setSubmitting(false);
    setError(ok ? '' : 'Incorrect email or password.');
  }

  return (
    <div className="ops-login-shell">
      <form className="ops-login-card" onSubmit={submit} noValidate aria-label="Admin sign-in">
        <a className="ops-login-brand" href="#/"><BrandLogo /><span>STORE OPERATIONS</span></a>
        <div className="ops-login-heading"><Lock size={18} /><h1>Workspace sign-in.</h1></div>
        <p className="ops-login-intro">Restricted to the GHOSTER team. Sign in to manage products, orders and reports.</p>
        <label className="ops-login-field">Email
          <input name="email" type="email" autoComplete="username" value={email}
            onChange={event => { setEmail(event.target.value); setError(''); }}
            aria-invalid={Boolean(error)} autoFocus />
        </label>
        <label className="ops-login-field">Password
          <input name="password" type="password" autoComplete="current-password" value={password}
            onChange={event => { setPassword(event.target.value); setError(''); }}
            aria-invalid={Boolean(error)} />
        </label>
        {error && <p className="ops-login-error" role="alert">{error}</p>}
        <button className="ops-button ops-login-submit" type="submit" disabled={submitting}>{submitting ? 'Signing in…' : 'Sign in'} <ArrowRight size={17} /></button>
        <p className="ops-login-demo">Demo workspace. Use <strong>{ADMIN_DEMO_CREDENTIALS.email}</strong> / <strong>{ADMIN_DEMO_CREDENTIALS.password}</strong>.</p>
        <a className="ops-login-back" href="#/"><ArrowLeft size={15} />Back to storefront</a>
      </form>
    </div>
  );
}
