import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import logo from '../assets/icons/bank-one-one-logo.png';
import { useAuth } from '../context/AuthContext.jsx';
import { forgotPassword as forgotPasswordRequest, login as loginRequest } from '../api/auth.api.js';

export default function Login() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [remember, setRemember] = useState(false);
  const [forgotOpen, setForgotOpen] = useState(false);
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotMessage, setForgotMessage] = useState('');
  const [forgotStatus, setForgotStatus] = useState('idle');

  useEffect(() => {
    const savedRemember = localStorage.getItem('rememberMe') === 'true';
    const savedEmail = localStorage.getItem('rememberEmail') || '';
    if (savedRemember) {
      setRemember(true);
      setEmail(savedEmail);
    }
  }, []);

  const handleForgotSubmit = (event) => {
    event.preventDefault();
    setForgotMessage('');
    setForgotStatus('loading');
    forgotPasswordRequest({ email: forgotEmail })
      .then(() => {
        setForgotStatus('success');
        setForgotMessage('We sent a reset link to your email.');
      })
      .catch((err) => {
        const message =
          err.response?.data?.message || 'User not registered. Please sign up first.';
        if (message === 'User not registered') {
          setForgotMessage('User not registered. Please sign up first.');
        } else {
          setForgotMessage(message);
        }
        setForgotStatus('error');
      });
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    setError('');
    if (!email.includes('@')) {
      setError('Please enter a valid email address.');
      return;
    }
    loginRequest({ email, password })
      .then((response) => {
        login({ email, accessToken: response.data.accessToken });
        if (remember) {
          localStorage.setItem('rememberMe', 'true');
          localStorage.setItem('rememberEmail', email);
        } else {
          localStorage.removeItem('rememberMe');
          localStorage.removeItem('rememberEmail');
        }
        navigate('/dashboard');
      })
      .catch((err) => {
        const message =
          err.response?.data?.message ||
          'User not registered. Please sign up first.';
        if (message === 'User not registered') {
          setError('No user found. Please register first.');
          return;
        }
        if (message === 'Invalid credentials') {
          setError('Incorrect password.');
          return;
        }
        if (message === 'Email and password required') {
          setError('Email and password are required.');
          return;
        }
        if (message === 'Account not verified') {
          setError('Account not verified. Please check your email.');
          return;
        }
        setError(message);
      });
  };

  return (
    <div className="login-page">
      <div className="login-bg">
        <div className="login-orb login-orb--one" />
        <div className="login-orb login-orb--two" />
      </div>
      <div className="login-shell">
        <header className="login-header">
          <img className="login-logo" src={logo} alt="Bank One One logo" />
          <p className="login-eyebrow">Bank One One</p>
          <h1 className="login-title">Welcome back</h1>
          <p className="login-subtitle">
            Secure access to your accounts, cards, and transfers.
          </p>
        </header>
        <form className="login-card" onSubmit={handleSubmit}>
          <label className="login-field">
            <span>Email</span>
            <input
              type="email"
              placeholder="Email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              required
            />
          </label>
          <label className="login-field">
            <span>Password</span>
            <input
              type="password"
              placeholder="Password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              required
            />
          </label>
          {error ? <p className="login-error">{error}</p> : null}
          <div className="login-actions">
            <label className="login-check">
              <input
                type="checkbox"
                checked={remember}
                onChange={(event) => setRemember(event.target.checked)}
              />
              <span>Remember me</span>
            </label>
            <button
              type="button"
              className="login-link"
              onClick={() => {
                setForgotEmail(email);
                setForgotMessage('');
                setForgotStatus('idle');
                setForgotOpen(true);
              }}
            >
              Forgot password?
            </button>
          </div>
          <button type="submit" className="login-button">
            Sign in
          </button>
          <p className="login-foot">
            New here? <Link to="/register">Create an account</Link>
          </p>
        </form>
        {forgotOpen ? (
          <div className="login-modal" role="dialog" aria-modal="true">
            <div
              className="login-modal__backdrop"
              onClick={() => setForgotOpen(false)}
            />
            <div className="login-modal__panel">
              <h2>Reset your password</h2>
              <p>Enter your email to receive a reset link.</p>
              <form onSubmit={handleForgotSubmit}>
                <label className="login-field">
                  <span>Email</span>
                  <input
                    type="email"
                    placeholder="Email"
                    value={forgotEmail}
                    onChange={(event) => setForgotEmail(event.target.value)}
                    required
                  />
                </label>
                {forgotMessage ? (
                  <p
                    className={
                      forgotStatus === 'success' ? 'login-success' : 'login-error'
                    }
                  >
                    {forgotMessage}
                  </p>
                ) : null}
                <div className="login-modal__actions">
                  <button type="button" onClick={() => setForgotOpen(false)}>
                    Cancel
                  </button>
                  <button type="submit" disabled={forgotStatus === 'loading'}>
                    Send link
                  </button>
                </div>
              </form>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}
