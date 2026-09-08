import { useEffect, useState, type FormEvent } from 'react';
import { ArrowLeft, ArrowRight } from 'lucide-react';
import { toast } from 'sonner';
import { asset } from './catalog';
import { go, useStore } from './store';
import './login.css';

export function LoginPage() {
  const { data, setData } = useStore();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [errors, setErrors] = useState<{ name?: string; email?: string }>({});
  const signedIn = Boolean(data.user);

  useEffect(() => {
    if (signedIn) go('/account');
  }, [signedIn]);

  function signIn(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const cleanName = name.trim();
    const cleanEmail = email.trim();
    const emailInput = event.currentTarget.elements.namedItem('email') as HTMLInputElement;
    const nextErrors: typeof errors = {};

    if (cleanName.length < 2) nextErrors.name = 'Enter a name with at least 2 characters.';
    if (!cleanEmail || emailInput.validity.typeMismatch) nextErrors.email = 'Enter a valid email address.';
    setErrors(nextErrors);

    if (nextErrors.name || nextErrors.email) {
      const firstInvalid = event.currentTarget.elements.namedItem(nextErrors.name ? 'name' : 'email');
      (firstInvalid as HTMLInputElement).focus();
      return;
    }

    setData(current => ({ ...current, user: { name: cleanName, email: cleanEmail } }));
    toast.success('Welcome to your demo account');
    go('/account');
  }

  return (
    <section className="section sign-in-page">
      <a className="sign-in-back" href="#/shop"><ArrowLeft size={16} /> Back to the tees</a>
      <div className="sign-in-shell">
        <div className="sign-in-art">
          <img className="sign-in-photo" src={asset('black-oversized')} alt="Black oversized tee" />
          <img className="sign-in-wordmark" src="./assets/wordmark.png" alt="GHOSTER" width="689" height="83" />
          <div className="sign-in-caption">
            <span className="eyebrow">BUILD FOR THE UNSEEN</span>
            <p>YOUR STYLE.<br />YOUR SPACE.</p>
            <span>Make room for your everyday favourites.</span>
          </div>
        </div>
        <div className="sign-in-content">
          <span className="eyebrow">YOUR GHOSTER ACCOUNT</span>
          <h1>WELCOME BACK.</h1>
          <p className="sign-in-intro">Your next rotation starts here.</p>
          <form className="sign-in-form" onSubmit={signIn} noValidate aria-label="Demo sign-in">
            <div className="sign-in-field">
              <label htmlFor="sign-in-name">Your name</label>
              <input
                id="sign-in-name" name="name" autoComplete="name" placeholder="Enter your name"
                value={name} onChange={event => { setName(event.target.value); setErrors(current => ({ ...current, name: undefined })); }}
                required minLength={2} maxLength={80} aria-invalid={Boolean(errors.name)}
                aria-describedby={errors.name ? 'sign-in-name-error' : undefined}
              />
              {errors.name && <p className="sign-in-error" id="sign-in-name-error" role="alert">{errors.name}</p>}
            </div>
            <div className="sign-in-field">
              <label htmlFor="sign-in-email">Email address</label>
              <input
                id="sign-in-email" name="email" type="email" autoComplete="email" placeholder="you@example.com"
                value={email} onChange={event => { setEmail(event.target.value); setErrors(current => ({ ...current, email: undefined })); }}
                required maxLength={254} aria-invalid={Boolean(errors.email)}
                aria-describedby={errors.email ? 'sign-in-email-error' : undefined}
              />
              {errors.email && <p className="sign-in-error" id="sign-in-email-error" role="alert">{errors.email}</p>}
            </div>
            <p className="sign-in-demo">Demo sign-in. Use sample details; no password is needed. Your profile is saved in this browser only.</p>
            <button className="action sign-in-submit" type="submit">Continue to account <ArrowRight size={18} /></button>
          </form>
          <a className="sign-in-guest" href="#/shop">Continue as a guest <ArrowRight size={15} /></a>
          <p className="sign-in-help">Need a hand? <a href="#/info/help">Visit our help centre</a></p>
        </div>
      </div>
    </section>
  );
}
