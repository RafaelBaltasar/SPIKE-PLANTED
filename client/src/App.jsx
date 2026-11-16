
import { useState } from 'react';
import {
  GraduationCap,
  Sprout,
  ShieldCheck,
  Clock3,
  BookOpenCheck,
  Eye,
  EyeOff,
  ArrowRight,
  CheckCircle2,
  LogOut,
} from 'lucide-react';

import { api } from './api/axios';
import './App.css';

const initialForm = {
  fullName: '',
  email: '',
  password: '',
  studentNumber: '',
  firstName: '',
  lastName: '',
  program: '',
  yearLevel: '',
};

function App() {
  const [mode, setMode] = useState('login');
  const [form, setForm] = useState(initialForm);
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [currentUser, setCurrentUser] = useState(() => {
    const savedUser = localStorage.getItem('spikeUser');
    return savedUser ? JSON.parse(savedUser) : null;
  });

  const isRegister = mode === 'register';

  function handleChange(event) {
    const { name, value } = event.target;

    setForm((previous) => ({
      ...previous,
      [name]: value,
    }));
  }

  function switchMode(nextMode) {
    setMode(nextMode);
    setForm(initialForm);
    setError('');
    setSuccess('');
  }

  async function handleSubmit(event) {
    event.preventDefault();

    setError('');
    setSuccess('');
    setLoading(true);

    try {
      const endpoint = isRegister
        ? '/auth/register'
        : '/auth/login';

      const payload = isRegister
        ? {
            fullName: form.fullName.trim(),
            email: form.email.trim(),
            password: form.password,
            studentNumber: form.studentNumber.trim(),
            firstName: form.firstName.trim(),
            lastName: form.lastName.trim(),
            program: form.program,
            yearLevel: form.yearLevel,
          }
        : {
            email: form.email.trim(),
            password: form.password,
          };

      const response = await api.post(endpoint, payload);
      const { token, user } = response.data;

      if (token) {
        localStorage.setItem('spikeToken', token);
      }

      if (user) {
        localStorage.setItem('spikeUser', JSON.stringify(user));
        setCurrentUser(user);
      }

      setSuccess(
        isRegister
          ? 'Your student account has been created successfully!'
          : 'You have successfully logged in!'
      );
    } catch (requestError) {
      setError(
        requestError.response?.data?.message ||
        'Unable to connect to the server. Please try again.'
      );
    } finally {
      setLoading(false);
    }
  }

  function handleLogout() {
    localStorage.removeItem('spikeToken');
    localStorage.removeItem('spikeUser');
    setCurrentUser(null);
    setForm(initialForm);
    setSuccess('');
    setError('');
    setMode('login');
  }

  if (currentUser) {
    return (
      <main className="welcome-page">
        <header className="topbar">
          <a className="brand" href="/">
            <span className="brand-icon">
              <Sprout size={25} />
            </span>
            <span>
              <strong>SPIKE PLANTED</strong>
              <small>OJT TRACKING SYSTEM</small>
            </span>
          </a>

          <button className="logout-button" onClick={handleLogout}>
            <LogOut size={17} />
            Log out
          </button>
        </header>

        <section className="welcome-card">
          <div className="welcome-icon">
            <CheckCircle2 size={42} />
          </div>

          <p className="eyebrow">AUTHENTICATION SUCCESSFUL</p>
          <h1>Welcome, {currentUser.fullName}!</h1>
          <p className="welcome-description">
            You are now signed in to SPIKE PLANTED.
            Your OJT tracking workspace will be available here as we
            build the system features.
          </p>

          <div className="account-details">
            <div>
              <span>Account email</span>
              <strong>{currentUser.email}</strong>
            </div>
            <div>
              <span>Account role</span>
              <strong>{currentUser.role}</strong>
            </div>
          </div>

          <p className="next-step-note">
            Your login is working. The student dashboard is our next
            development step.
          </p>
        </section>
      </main>
    );
  }

  return (
    <main className="auth-page">
      <section className="brand-panel">
        <div className="brand-panel-content">
          <a className="brand brand-light" href="/">
            <span className="brand-icon">
              <Sprout size={27} />
            </span>
            <span>
              <strong>SPIKE PLANTED</strong>
              <small>OJТ TRACKING SYSTEM</small>
            </span>
          </a>

          <div className="hero-content">
            <span className="hero-label">
              <span className="hero-label-dot" />
              BICOL UNIVERSITY - POLANGUI
            </span>

            <h1>
              Grow your skills.
              <br />
              <span>Track your journey.</span>
            </h1>

            <p>
              Your internship journey, organized in one place.
              Monitor your training hours, submit weekly journals,
              and keep track of your OJT requirements.
            </p>

            <div className="feature-list">
              <div className="feature-item">
                <span><Clock3 size={20} /></span>
                <div>
                  <strong>Attendance Tracking</strong>
                  <small>Record and monitor your OJT hours.</small>
                </div>
              </div>

              <div className="feature-item">
                <span><BookOpenCheck size={20} /></span>
                <div>
                  <strong>Weekly Journals</strong>
                  <small>Document your activities and learnings.</small>
                </div>
              </div>

              <div className="feature-item">
                <span><ShieldCheck size={20} /></span>
                <div>
                  <strong>Document Management</strong>
                  <small>Keep your internship requirements organized.</small>
                </div>
              </div>
            </div>
          </div>

          <p className="panel-footer">
            Bicol University - Polangui Campus
            <span> • </span>
            Internship and Practicum
          </p>
        </div>
      </section>

      <section className="form-panel">
        <div className="mobile-brand">
          <span className="brand-icon">
            <Sprout size={24} />
          </span>
          <strong>SPIKE PLANTED</strong>
        </div>

        <div className="auth-card">
          <div className="form-heading">
            <span className="form-icon">
              <GraduationCap size={25} />
            </span>

            <p className="eyebrow">STUDENT PORTAL</p>
            <h2>
              {isRegister ? 'Create your account' : 'Welcome back'}
            </h2>
            <p>
              {isRegister
                ? 'Register to start managing your OJT journey.'
                : 'Sign in to access your internship workspace.'}
            </p>
          </div>

          <div className="auth-tabs">
            <button
              type="button"
              className={!isRegister ? 'active' : ''}
              onClick={() => switchMode('login')}
            >
              Sign In
            </button>

            <button
              type="button"
              className={isRegister ? 'active' : ''}
              onClick={() => switchMode('register')}
            >
              Create Account
            </button>
          </div>

          {error && (
            <div className="message message-error">
              {error}
            </div>
          )}

          {success && (
            <div className="message message-success">
              {success}
            </div>
          )}

          <form onSubmit={handleSubmit}>
            {isRegister && (
              <>
                <div className="form-group">
                  <label htmlFor="fullName">Complete name</label>
                  <input
                    id="fullName"
                    name="fullName"
                    type="text"
                    placeholder="Enter your complete name"
                    value={form.fullName}
                    onChange={handleChange}
                    required
                  />
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label htmlFor="firstName">First name</label>
                    <input
                      id="firstName"
                      name="firstName"
                      type="text"
                      placeholder="First name"
                      value={form.firstName}
                      onChange={handleChange}
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label htmlFor="lastName">Last name</label>
                    <input
                      id="lastName"
                      name="lastName"
                      type="text"
                      placeholder="Last name"
                      value={form.lastName}
                      onChange={handleChange}
                      required
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label htmlFor="studentNumber">Student number</label>
                  <input
                    id="studentNumber"
                    name="studentNumber"
                    type="text"
                    placeholder="Enter your student number"
                    value={form.studentNumber}
                    onChange={handleChange}
                    required
                  />
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label htmlFor="program">Program</label>
                    <input
                      id="program"
                      name="program"
                      type="text"
                      placeholder="e.g. BSIS"
                      value={form.program}
                      onChange={handleChange}
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label htmlFor="yearLevel">Year level</label>
                    <select
                      id="yearLevel"
                      name="yearLevel"
                      value={form.yearLevel}
                      onChange={handleChange}
                      required
                    >
                      <option value="">Select year</option>
                      <option value="1st Year">1st Year</option>
                      <option value="2nd Year">2nd Year</option>
                      <option value="3rd Year">3rd Year</option>
                      <option value="4th Year">4th Year</option>
                      <option value="5th Year">5th Year</option>
                    </select>
                  </div>
                </div>
              </>
            )}

            <div className="form-group">
              <label htmlFor="email">Email address</label>
              <input
                id="email"
                name="email"
                type="email"
                placeholder="Enter your email address"
                value={form.email}
                onChange={handleChange}
                autoComplete="email"
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="password">Password</label>

              <div className="password-wrapper">
                <input
                  id="password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Enter your password"
                  value={form.password}
                  onChange={handleChange}
                  autoComplete={isRegister ? 'new-password' : 'current-password'}
                  minLength={8}
                  required
                />

                <button
                  type="button"
                  className="password-toggle"
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff size={19} /> : <Eye size={19} />}
                </button>
              </div>

              {isRegister && (
                <small className="field-hint">
                  Password must contain at least 8 characters.
                </small>
              )}
            </div>

            <button
              className="submit-button"
              type="submit"
              disabled={loading}
            >
              {loading
                ? 'Please wait...'
                : isRegister
                  ? 'Create Student Account'
                  : 'Sign In to Your Account'}

              {!loading && <ArrowRight size={18} />}
            </button>
          </form>

          <div className="form-bottom">
            <ShieldCheck size={16} />
            <span>Secure student account authentication</span>
          </div>
        </div>

        <p className="copyright">
          © 2026 SPIKE PLANTED. Bicol University - Polangui.
        </p>
      </section>
    </main>
  );
}

export default App;
