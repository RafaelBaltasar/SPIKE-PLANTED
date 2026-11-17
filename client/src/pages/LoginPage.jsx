
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  GraduationCap,
  Sprout,
  ShieldCheck,
  Clock3,
  BookOpenCheck,
  Eye,
  EyeOff,
  ArrowRight
} from 'lucide-react';

import { api } from '../api/axios';
import { useAuth } from '../context/AuthContext';
import '../App.css';

const initialForm = {
  fullName: '',
  email: '',
  password: '',
  role: 'student',
  studentNumber: '',
  firstName: '',
  lastName: '',
  program: '',
  yearLevel: '',
  department: ''
};

export default function LoginPage() {
  const navigate = useNavigate();
  const { login } = useAuth();

  const [mode, setMode] = useState('login');
  const [form, setForm] = useState(initialForm);
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const isRegister = mode === 'register';
  const isStudent = form.role === 'student';

  // Display the reason an inactive student was logged out.
  useEffect(() => {
    const authMessage = sessionStorage.getItem('spikeAuthMessage');

    if (authMessage) {
      setError(authMessage);
      sessionStorage.removeItem('spikeAuthMessage');
    }
  }, []);

  function handleChange(event) {
    const { name, value } = event.target;

    setForm((previous) => ({
      ...previous,
      [name]: value
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
            role: form.role,

            ...(isStudent
              ? {
                  studentNumber: form.studentNumber.trim(),
                  firstName: form.firstName.trim(),
                  lastName: form.lastName.trim(),
                  program: form.program,
                  yearLevel: form.yearLevel
                }
              : {
                  department: form.department.trim()
                })
          }
        : {
            email: form.email.trim(),
            password: form.password
          };

      const response = await api.post(endpoint, payload);

      const { token, user } = response.data;

      if (token && user) {
        login(token, user);

        setSuccess(
          isRegister
            ? 'Account created!'
            : 'Logged in successfully!'
        );

        setTimeout(() => navigate('/dashboard'), 800);
      }

    } catch (requestError) {
      setError(
        requestError.response?.data?.message ||
        'Unable to connect to the server. Please try again.'
      );

    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="auth-page">

      {/* BRAND PANEL */}
      <section className="brand-panel">
        <div className="brand-panel-content">

          <a className="brand brand-light" href="/">
            <span className="brand-icon">
              <Sprout size={27} />
            </span>

            <span>
              <strong>SPIKE PLANTED</strong>
              <small>OJT TRACKING SYSTEM</small>
            </span>
          </a>

          <div className="hero-content">

            <span className="hero-label">
              <span className="hero-label-dot" />
              BICOL UNIVERSITY - POLANGUI
            </span>

            <h1>
              Grow your skills.<br />
              <span>Track your journey.</span>
            </h1>

            <p>
              Your internship journey, organized in one place.
              Monitor your training hours, submit weekly journals,
              and keep track of your OJT requirements.
            </p>

            <div className="feature-list">

              <div className="feature-item">
                <span>
                  <Clock3 size={20} />
                </span>

                <div>
                  <strong>Attendance Tracking</strong>
                  <small>Record and monitor your OJT hours.</small>
                </div>
              </div>

              <div className="feature-item">
                <span>
                  <BookOpenCheck size={20} />
                </span>

                <div>
                  <strong>Weekly Journals</strong>
                  <small>Document your activities and learnings.</small>
                </div>
              </div>

              <div className="feature-item">
                <span>
                  <ShieldCheck size={20} />
                </span>

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

      {/* LOGIN AND REGISTRATION PANEL */}
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

            <p className="eyebrow">PORTAL ACCESS</p>

            <h2>
              {isRegister
                ? 'Create your account'
                : 'Welcome back'}
            </h2>

            <p>
              {isRegister
                ? 'Register to start managing your OJT journey.'
                : 'Sign in to access your workspace.'}
            </p>
          </div>

          {/* AUTHENTICATION TABS */}
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

          {/* ERROR AND SUCCESS MESSAGES */}
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

          {/* AUTHENTICATION FORM */}
          <form onSubmit={handleSubmit}>

            {isRegister && (
              <>

                <div className="form-group">
                  <label htmlFor="role">Register As</label>

                  <select
                    id="role"
                    name="role"
                    value={form.role}
                    onChange={handleChange}
                    required
                  >
                    <option value="student">Student Intern</option>
                    <option value="coordinator">
                      OJT Coordinator (Faculty)
                    </option>
                    <option value="admin">Dean / Admin</option>
                  </select>
                </div>

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

                {isStudent ? (
                  <>

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
                      <label htmlFor="studentNumber">
                        Student number
                      </label>

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
                ) : (

                  <div className="form-group">
                    <label htmlFor="department">
                      Department / Office
                    </label>

                    <input
                      id="department"
                      name="department"
                      type="text"
                      placeholder="e.g. College of Science"
                      value={form.department}
                      onChange={handleChange}
                      required
                    />
                  </div>

                )}

              </>
            )}

            {/* EMAIL */}
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

            {/* PASSWORD */}
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
                  autoComplete={
                    isRegister
                      ? 'new-password'
                      : 'current-password'
                  }
                  minLength={8}
                  required
                />

                <button
                  type="button"
                  className="password-toggle"
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label={
                    showPassword
                      ? 'Hide password'
                      : 'Show password'
                  }
                >
                  {showPassword
                    ? <EyeOff size={19} />
                    : <Eye size={19} />}
                </button>

              </div>

              {isRegister && (
                <small className="field-hint">
                  Password must contain at least 8 characters.
                </small>
              )}
            </div>

            {/* SUBMIT BUTTON */}
            <button
              className="submit-button"
              type="submit"
              disabled={loading}
            >
              {loading
                ? 'Please wait...'
                : isRegister
                  ? 'Create Account'
                  : 'Sign In'}

              {!loading && <ArrowRight size={18} />}
            </button>

          </form>

          <div className="form-bottom">
            <ShieldCheck size={16} />
            <span>Secure account authentication</span>
          </div>

        </div>

        <p className="copyright">
          © 2026 SPIKE PLANTED. Bicol University - Polangui.
        </p>

      </section>

    </main>
  );
}
