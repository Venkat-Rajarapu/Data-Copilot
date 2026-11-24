import { useState } from "react";

import {
  loginUser,
  registerUser,
  getCurrentUser,
} from "../../../api/authApi";

import "./LoginPage.css";

/* =========================================
   INLINE SVG ICONS
========================================= */

function BrainIcon({ size = 58 }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 64 64"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.7"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M31 13c-4-9-17-7-18 3-8 2-10 13-4 18-5 8 0 17 9 17 3 8 12 9 15 2V13Z" />
      <path d="M33 13c4-9 17-7 18 3 8 2 10 13 4 18 5 8 0 17-9 17-3 8-12 9-15 2V13Z" />
      <path d="M32 13v40M18 22c5-1 8 3 8 7M12 35c5-3 10 0 11 5M20 49c3-4 7-4 11-2M46 22c-5-1-8 3-8 7M52 35c-5-3-10 0-11 5M44 49c-3-4-7-4-11-2" />
      <circle cx="22" cy="17" r="2" fill="currentColor" stroke="none" />
      <circle cx="43" cy="17" r="2" fill="currentColor" stroke="none" />
    </svg>
  );
}

function MailIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      width="21"
      height="21"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      aria-hidden="true"
    >
      <rect x="3" y="5" width="18" height="14" rx="2" />
      <path d="m4 7 8 6 8-6" />
    </svg>
  );
}

function LockIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      width="21"
      height="21"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      aria-hidden="true"
    >
      <rect x="4" y="10" width="16" height="11" rx="2" />
      <path d="M8 10V7a4 4 0 0 1 8 0v3" />
      <path d="M12 14v3" />
    </svg>
  );
}

function UserIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      width="21"
      height="21"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      aria-hidden="true"
    >
      <circle cx="12" cy="8" r="4" />
      <path d="M4 21c0-4.4 3.6-7 8-7s8 2.6 8 7" />
    </svg>
  );
}

function EyeIcon({ hidden }) {
  return (
    <svg
      viewBox="0 0 24 24"
      width="19"
      height="19"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      aria-hidden="true"
    >
      {hidden ? (
        <>
          <path d="M3 3 21 21" />
          <path d="M10.6 10.6a2 2 0 0 0 2.8 2.8" />
          <path d="M9.9 5.2A11 11 0 0 1 12 5c5.5 0 9 7 9 7a14 14 0 0 1-3 3.7" />
          <path d="M6.2 6.2C4.2 7.6 3 10 3 12c0 0 3.5 7 9 7 1.1 0 2.1-.2 3-.6" />
        </>
      ) : (
        <>
          <path d="M2.5 12s3.5-7 9.5-7 9.5 7 9.5 7-3.5 7-9.5 7-9.5-7-9.5-7Z" />
          <circle cx="12" cy="12" r="3" />
        </>
      )}
    </svg>
  );
}

function ArrowIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      width="20"
      height="20"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M5 12h14M13 5l7 7-7 7" />
    </svg>
  );
}

function DatabaseIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      width="26"
      height="26"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      aria-hidden="true"
    >
      <ellipse cx="12" cy="5" rx="9" ry="3" />
      <path d="M3 5v14c0 1.7 4 3 9 3s9-1.3 9-3V5" />
      <path d="M3 12c0 1.7 4 3 9 3s9-1.3 9-3" />
    </svg>
  );
}

function ChartIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      width="25"
      height="25"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      aria-hidden="true"
    >
      <path d="M3 20h18" />
      <rect x="4" y="11" width="4" height="9" rx="1" />
      <rect x="10" y="6" width="4" height="14" rx="1" />
      <rect x="16" y="2" width="4" height="18" rx="1" />
    </svg>
  );
}

function SparkleIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      width="25"
      height="25"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="m12 2 2.3 7.7L22 12l-7.7 2.3L12 22l-2.3-7.7L2 12l7.7-2.3L12 2Z" />
      <path d="m19 2 .8 2.2L22 5l-2.2.8L19 8l-.8-2.2L16 5l2.2-.8L19 2Z" />
    </svg>
  );
}

/* =========================================
   HOLOGRAPHIC ANALYTICS COMPONENTS
========================================= */

function BusinessPanel() {
  const bars = [18, 29, 23, 39, 34, 53, 46, 77, 62, 89, 70, 98, 79, 58];

  return (
    <div className="lp-panel lp-business-panel">
      <div className="lp-panel-top">
        <strong>Business Analytics</strong>
        <span>+18.4% ↗</span>
      </div>

      <div className="lp-business-bars">
        {bars.map((height, index) => (
          <div
            key={index}
            className="lp-business-bar"
            style={{
              height: `${height}%`,
              animationDelay: `${index * 45}ms`,
            }}
          />
        ))}
      </div>

      <div className="lp-panel-caption">
        Performance Overview
      </div>
    </div>
  );
}

function InsightsPanel() {
  return (
    <div className="lp-panel lp-insights-panel">
      <div className="lp-insights-heading">
        <BrainIcon size={39} />

        <div>
          <strong>AI Insights</strong>
          <span>Intelligence engine</span>
        </div>
      </div>

      <div className="lp-insights-number">124</div>

      <div className="lp-panel-caption">
        Generated
      </div>
    </div>
  );
}

function QualityPanel() {
  return (
    <div className="lp-panel lp-quality-panel">
      <strong className="lp-panel-title">
        Data Quality
      </strong>

      <svg className="lp-quality-svg" viewBox="0 0 120 120">
        <defs>
          <linearGradient
            id="lpQualityGradient"
            x1="0"
            y1="0"
            x2="1"
            y2="1"
          >
            <stop offset="0%" stopColor="#00d4ff" />
            <stop offset="100%" stopColor="#19e6c1" />
          </linearGradient>
        </defs>

        <circle
          cx="60"
          cy="60"
          r="43"
          fill="none"
          stroke="rgba(0,212,255,.12)"
          strokeWidth="9"
        />

        <circle
          cx="60"
          cy="60"
          r="43"
          fill="none"
          stroke="url(#lpQualityGradient)"
          strokeWidth="9"
          strokeLinecap="round"
          strokeDasharray="267 270"
          transform="rotate(-90 60 60)"
        />

        <text
          x="60"
          y="58"
          textAnchor="middle"
          className="lp-quality-number"
        >
          98.6%
        </text>

        <text
          x="60"
          y="75"
          textAnchor="middle"
          className="lp-quality-label"
        >
          Excellent
        </text>
      </svg>

      <div className="lp-panel-caption">
        Data Validation Score
      </div>
    </div>
  );
}

function PredictionPanel() {
  return (
    <div className="lp-panel lp-prediction-panel">
      <strong className="lp-panel-title">
        Predictive Analytics
      </strong>

      <svg viewBox="0 0 260 105" className="lp-prediction-svg">
        <defs>
          <linearGradient
            id="lpPredictionFill"
            x1="0"
            y1="0"
            x2="0"
            y2="1"
          >
            <stop offset="0%" stopColor="#00dfff" stopOpacity=".35" />
            <stop offset="100%" stopColor="#00dfff" stopOpacity="0" />
          </linearGradient>
        </defs>

        <path
          d="M0 85 C20 78 24 55 45 60 S70 77 92 42 S120 56 140 38 S168 55 190 20 S225 30 260 5 V105 H0Z"
          fill="url(#lpPredictionFill)"
        />

        <path
          d="M0 85 C20 78 24 55 45 60 S70 77 92 42 S120 56 140 38 S168 55 190 20 S225 30 260 5"
          fill="none"
          stroke="#00e5ff"
          strokeWidth="2.7"
        />

        {[45, 92, 140, 190, 260].map((x, index) => (
          <circle
            key={x}
            cx={x}
            cy={[60, 42, 38, 20, 5][index]}
            r="3.5"
            fill="#19e6c1"
            stroke="#00dfff"
            strokeWidth="1"
          />
        ))}
      </svg>

      <div className="lp-panel-caption">
        AI-powered forecasting
      </div>
    </div>
  );
}

/* =========================================
   HOLOGRAPHIC GLOBE
========================================= */

function HolographicGlobe() {
  return (
    <div className="lp-globe-scene">
      <div className="lp-globe">
        <div className="lp-globe-grid" />
        <div className="lp-globe-meridian" />
        <div className="lp-globe-highlight" />
      </div>

      <div className="lp-globe-platform">
        <div />
      </div>
    </div>
  );
}

/* =========================================
   FORM INPUT COMPONENT
========================================= */

function FormInput({
  icon: Icon,
  label,
  name,
  type = "text",
  placeholder,
  value,
  onChange,
  error,
  showPassword,
  onTogglePassword,
  autoComplete,
}) {
  const passwordField = type === "password";

  const actualType =
    passwordField && showPassword ? "text" : type;

  return (
    <div className="lp-field-group">
      <label className="lp-visually-hidden" htmlFor={name}>
        {label}
      </label>

      <div className={`lp-input-wrap ${error ? "lp-input-error" : ""}`}>
        <Icon />

        <input
          id={name}
          name={name}
          type={actualType}
          placeholder={placeholder}
          value={value}
          onChange={onChange}
          autoComplete={autoComplete}
          aria-invalid={Boolean(error)}
          aria-describedby={error ? `${name}-error` : undefined}
          required
        />

        {passwordField && (
          <button
            type="button"
            className="lp-eye-button"
            aria-label={showPassword ? "Hide password" : "Show password"}
            onClick={onTogglePassword}
          >
            <EyeIcon hidden={showPassword} />
          </button>
        )}
      </div>

      {error && (
        <span className="lp-field-error" id={`${name}-error`}>
          {error}
        </span>
      )}
    </div>
  );
}

/* =========================================
   MAIN LOGIN PAGE
========================================= */

export default function LoginPage({ onLogin }) {
  const [mode, setMode] = useState("login");
  const [loading, setLoading] = useState(false);

  const [loginData, setLoginData] = useState({
    email: "",
    password: "",
  });

  const [registerData, setRegisterData] = useState({
    full_name: "",
    email: "",
    password: "",
    confirmPassword: "",
  });

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [errors, setErrors] = useState({});
  const [message, setMessage] = useState("");

  const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  /* =========================================
     SWITCH LOGIN / REGISTER
  ========================================= */

  function switchMode(nextMode) {
    setMode(nextMode);
    setErrors({});
    setMessage("");
    setShowPassword(false);
    setShowConfirmPassword(false);
  }

  /* =========================================
     UPDATE LOGIN INPUTS
  ========================================= */

  function updateLogin(event) {
    const { name, value } = event.target;

    setLoginData((previous) => ({
      ...previous,
      [name]: value,
    }));

    setErrors((previous) => ({
      ...previous,
      [name]: "",
    }));
  }

  /* =========================================
     UPDATE REGISTER INPUTS
  ========================================= */

  function updateRegister(event) {
    const { name, value } = event.target;

    setRegisterData((previous) => ({
      ...previous,
      [name]: value,
    }));

    setErrors((previous) => ({
      ...previous,
      [name]: "",
    }));
  }

  /* =========================================
     LOGIN VALIDATION
  ========================================= */

  function validateLogin() {
    const nextErrors = {};

    if (!emailPattern.test(loginData.email.trim())) {
      nextErrors.email = "Please enter a valid email address.";
    }

    if (loginData.password.length < 8) {
      nextErrors.password =
        "Password must contain at least 8 characters.";
    }

    setErrors(nextErrors);

    return Object.keys(nextErrors).length === 0;
  }

  /* =========================================
     REGISTER VALIDATION
  ========================================= */

  function validateRegister() {
    const nextErrors = {};

    if (!registerData.full_name.trim()) {
      nextErrors.full_name = "Full name is required.";
    }

    if (!emailPattern.test(registerData.email.trim())) {
      nextErrors.email = "Please enter a valid email address.";
    }

    if (registerData.password.length < 8) {
      nextErrors.password =
        "Password must contain at least 8 characters.";
    }

    if (
      registerData.confirmPassword !== registerData.password
    ) {
      nextErrors.confirmPassword = "Passwords do not match.";
    }

    setErrors(nextErrors);

    return Object.keys(nextErrors).length === 0;
  }

  /* =========================================
     LOGIN API INTEGRATION
  ========================================= */

  async function handleLogin(event) {
    event.preventDefault();

    if (!validateLogin()) return;

    setLoading(true);
    setMessage("");
    setErrors({});

    try {
      // Step 1: Authenticate with FastAPI
      await loginUser({
        email: loginData.email.trim().toLowerCase(),
        password: loginData.password,
      });

      // Step 2: Fetch authenticated user details
      const user = await getCurrentUser();

      // Step 3: Notify parent component
      if (typeof onLogin === "function") {
        onLogin(user);
      } else {
        setMessage("Login successful! Welcome to Data Copilot.");
      }

    } catch (error) {
      console.error("Login error:", error);

      const errorMessage =
        error.response?.data?.detail ||
        "Login failed. Please check your email and password.";

      setMessage(
        typeof errorMessage === "string"
          ? errorMessage
          : "Login failed. Please check your credentials."
      );

    } finally {
      setLoading(false);
    }
  }

  /* =========================================
     REGISTRATION API INTEGRATION
  ========================================= */

  async function handleRegister(event) {
    event.preventDefault();

    if (!validateRegister()) return;

    setLoading(true);
    setMessage("");
    setErrors({});

    try {
      // Call FastAPI registration endpoint
      await registerUser({
        full_name: registerData.full_name.trim(),
        email: registerData.email.trim().toLowerCase(),
        password: registerData.password,
      });

      // Clear registration fields
      setRegisterData({
        full_name: "",
        email: "",
        password: "",
        confirmPassword: "",
      });

      setLoginData({
        email: registerData.email.trim().toLowerCase(),
        password: "",
      });

      // Switch to login mode
      setMode("login");
      setErrors({});

      setMessage(
        "Registration successful! Please sign in with your account."
      );

    } catch (error) {
      console.error("Registration error:", error);

      const errorMessage =
        error.response?.data?.detail ||
        "Registration failed. Please try again.";

      setMessage(
        typeof errorMessage === "string"
          ? errorMessage
          : "Registration failed. Please check your details."
      );

    } finally {
      setLoading(false);
    }
  }

  const registering = mode === "register";

  /* =========================================
     MAIN UI
  ========================================= */

  return (
    <main className="lp-scene">

      {/* Background and architectural effects */}

      <div className="lp-background" aria-hidden="true">
        <div className="lp-background-overlay" />

        <div className="lp-ceiling-arcs" />

        <div className="lp-floor-rings" />

        <div className="lp-light-wave lp-wave-one" />

        <div className="lp-light-wave lp-wave-two" />

        <div className="lp-particles">
          {Array.from({ length: 28 }, (_, index) => (
            <span
              key={index}
              style={{
                left: `${(index * 37) % 100}%`,
                animationDelay: `${-(index % 8)}s`,
              }}
            />
          ))}
        </div>
      </div>

      {/* Left holographic panels */}

      <aside
        className="lp-side-panels lp-left-panels"
        aria-label="Analytics overview"
      >
        <BusinessPanel />
        <InsightsPanel />
      </aside>

      {/* Right holographic panels */}

      <aside
        className="lp-side-panels lp-right-panels"
        aria-label="AI analytics overview"
      >
        <QualityPanel />
        <PredictionPanel />
        <HolographicGlobe />
      </aside>

      {/* Main authentication content */}

      <div className="lp-main">

        {/* Header */}

        <header className="lp-header">
          <div className="lp-brand">
            <BrainIcon size={66} />

            <h1>
              <span>Data</span>{" "}
              <strong>Copilot</strong>
            </h1>
          </div>

          <p>Your Data. Every Insight. Every Decision.</p>

          <div className="lp-header-underline" />
        </header>

        {/* Authentication Card */}

        <section
          className={`lp-card ${registering ? "lp-register-mode" : ""}`}
        >
          <div className="lp-card-content" key={mode}>

            {/* Card Heading */}

            <div className="lp-card-heading">
              <h2>
                {registering
                  ? "Create Your Data Copilot Account"
                  : "Sign In to Data Copilot"}
              </h2>

              <p>
                {registering
                  ? "Start turning your data into decisions."
                  : "Access your AI-powered analytics workspace."}
              </p>
            </div>

            {/* Email Authentication Divider */}

            <div className="lp-divider">
              <span />
              <p>
                {registering
                  ? "Create your account"
                  : "Secure account access"}
              </p>
              <span />
            </div>

            {/* LOGIN FORM */}

            {!registering ? (
              <form
                className="lp-form"
                onSubmit={handleLogin}
                noValidate
              >
                <FormInput
                  icon={MailIcon}
                  label="Email address"
                  name="email"
                  type="email"
                  placeholder="Email address"
                  value={loginData.email}
                  onChange={updateLogin}
                  error={errors.email}
                  autoComplete="email"
                />

                <FormInput
                  icon={LockIcon}
                  label="Password"
                  name="password"
                  type="password"
                  placeholder="Password"
                  value={loginData.password}
                  onChange={updateLogin}
                  error={errors.password}
                  showPassword={showPassword}
                  onTogglePassword={() =>
                    setShowPassword((value) => !value)
                  }
                  autoComplete="current-password"
                />

                <button
                  type="submit"
                  className="lp-primary-button"
                  disabled={loading}
                >
                  {loading ? (
                    <>
                      <span className="lp-spinner" />
                      Signing In...
                    </>
                  ) : (
                    <>
                      Sign In <ArrowIcon />
                    </>
                  )}
                </button>
              </form>
            ) : (

              /* REGISTRATION FORM */

              <form
                className="lp-form"
                onSubmit={handleRegister}
                noValidate
              >
                <FormInput
                  icon={UserIcon}
                  label="Full name"
                  name="full_name"
                  placeholder="Full name"
                  value={registerData.full_name}
                  onChange={updateRegister}
                  error={errors.full_name}
                  autoComplete="name"
                />

                <FormInput
                  icon={MailIcon}
                  label="Email address"
                  name="email"
                  type="email"
                  placeholder="Email address"
                  value={registerData.email}
                  onChange={updateRegister}
                  error={errors.email}
                  autoComplete="email"
                />

                <FormInput
                  icon={LockIcon}
                  label="Password"
                  name="password"
                  type="password"
                  placeholder="Password (minimum 8 characters)"
                  value={registerData.password}
                  onChange={updateRegister}
                  error={errors.password}
                  showPassword={showPassword}
                  onTogglePassword={() =>
                    setShowPassword((value) => !value)
                  }
                  autoComplete="new-password"
                />

                <FormInput
                  icon={LockIcon}
                  label="Confirm password"
                  name="confirmPassword"
                  type="password"
                  placeholder="Confirm password"
                  value={registerData.confirmPassword}
                  onChange={updateRegister}
                  error={errors.confirmPassword}
                  showPassword={showConfirmPassword}
                  onTogglePassword={() =>
                    setShowConfirmPassword((value) => !value)
                  }
                  autoComplete="new-password"
                />

                <button
                  type="submit"
                  className="lp-primary-button"
                  disabled={loading}
                >
                  {loading ? (
                    <>
                      <span className="lp-spinner" />
                      Creating Account...
                    </>
                  ) : (
                    <>
                      Create Account <ArrowIcon />
                    </>
                  )}
                </button>
              </form>
            )}

            {/* API Success / Error Message */}

            {message && (
              <div className="lp-form-message" role="status">
                {message}
              </div>
            )}

            {/* Login / Registration Switch */}

            <div className="lp-account-switch">
              {registering ? (
                <>
                  Already have an account?

                  <button
                    type="button"
                    onClick={() => switchMode("login")}
                  >
                    Sign In
                  </button>
                </>
              ) : (
                <>
                  Don't have an account?

                  <button
                    type="button"
                    onClick={() => switchMode("register")}
                  >
                    Create Account
                  </button>
                </>
              )}
            </div>

          </div>

          <div className="lp-card-bottom-glow" />
        </section>

        {/* Bottom Feature Bar */}

        <div className="lp-feature-bar">

          <div className="lp-feature">
            <DatabaseIcon />
            <span>Intelligent Data</span>
          </div>

          <i />

          <div className="lp-feature">
            <ChartIcon />
            <span>Predictive Analytics</span>
          </div>

          <i />

          <div className="lp-feature">
            <SparkleIcon />
            <span>AI-Powered Insights</span>
          </div>

        </div>

      </div>

    </main>
  );
}