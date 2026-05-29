"use client";

import Link from "next/link";
import {
  BadgeCheck,
  Eye,
  EyeOff,
  GraduationCap,
  Lock,
  Mail,
  MailCheck,
  ShieldCheck,
  Sparkles,
  UserRound,
  X
} from "lucide-react";
import { FormEvent, useMemo, useState } from "react";

import { Footer } from "@/components/Footer";
import { Nav } from "@/components/Nav";
import { useToast } from "@/components/ToastProvider";
import { api } from "@/lib/api";

const benefits = [
  { icon: GraduationCap, text: "Lifetime access to every course you buy" },
  { icon: ShieldCheck, text: "Bank-grade security on every request" },
  { icon: BadgeCheck, text: "New courses added regularly" },
  { icon: Sparkles, text: "Learn by building real projects" }
];

export default function RegisterPage() {
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [serverMessage, setServerMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [registered, setRegistered] = useState(false);
  const [agreed, setAgreed] = useState(false);
  const toast = useToast();

  const rules = useMemo(
    () => [
      { label: "At least 10 characters", ok: password.length >= 10 },
      { label: "One uppercase letter", ok: /[A-Z]/.test(password) },
      { label: "One lowercase letter", ok: /[a-z]/.test(password) },
      { label: "One number", ok: /[0-9]/.test(password) },
      { label: "One special character", ok: /[^A-Za-z0-9]/.test(password) }
    ],
    [password]
  );

  const passedCount = rules.filter((rule) => rule.ok).length;
  const strength = password.length === 0 ? 0 : Math.round((passedCount / rules.length) * 100);
  const strengthLabel = strength === 100 ? "Strong" : strength >= 60 ? "Good" : strength > 0 ? "Weak" : "";
  const allPassed = passedCount === rules.length;

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    if (!allPassed) {
      setError("Please meet all password requirements");
      return;
    }
    setLoading(true);
    try {
      const res = await api.register({ email, full_name: fullName, password });
      setServerMessage(res.message);
      setRegistered(true);
      toast.success(res.message);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Registration failed";
      setError(message);
      toast.error(message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="shell">
      <Nav />
      <section className="auth-split">
        <aside className="auth-aside reveal">
          <span className="eyebrow eyebrow-light">
            <Sparkles size={16} />
            Join CourseStack
          </span>
          <h2>Start building real projects today</h2>
          <p>Create a free account and unlock the full catalog of project-first courses.</p>
          <ul className="auth-benefits">
            {benefits.map((item) => (
              <li key={item.text}>
                <span className="auth-benefit-icon">
                  <item.icon size={18} />
                </span>
                {item.text}
              </li>
            ))}
          </ul>
        </aside>

        <div className="form-wrap auth-form-panel">
          {registered ? (
            <div className="form">
              <span className="modal-icon modal-success" style={{ margin: "0 auto 8px" }}>
                <MailCheck size={28} />
              </span>
              <h1 style={{ textAlign: "center" }}>Verify your email</h1>
              <p className="form-sub" style={{ textAlign: "center" }}>
                {serverMessage || "We&apos;ve sent a verification link to your email."} Check <strong>{email}</strong>,
                verify your email, then login. Do not forget to check your spam folder.
              </p>
              <Link className="button" href="/login">
                Go to login
              </Link>
              <button
                className="button secondary"
                onClick={async () => {
                  try {
                    await api.resendVerification(email);
                    toast.success("Verification link sent again");
                  } catch {
                    toast.error("Could not resend right now");
                  }
                }}
                type="button"
              >
                Resend email
              </button>
            </div>
          ) : (
            <form autoComplete="off" className="form" onSubmit={submit}>
              <Link aria-label="Close register" className="form-close" href="/">
                <X size={18} />
              </Link>
              <h1>Create Account</h1>
              <p className="form-sub">It only takes a minute to get started.</p>

              <div className="field">
                <label htmlFor="fullName">Full name</label>
                <div className="input-icon">
                  <UserRound size={18} />
                  <input
                    autoComplete="off"
                    id="fullName"
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="Your name"
                    required
                    value={fullName}
                  />
                </div>
              </div>

              <div className="field">
                <label htmlFor="email">Email</label>
                <div className="input-icon">
                  <Mail size={18} />
                  <input
                    autoComplete="off"
                    id="email"
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@example.com"
                    required
                    type="email"
                    value={email}
                  />
                </div>
              </div>

              <div className="field">
                <label htmlFor="password">Password</label>
                <div className="input-icon">
                  <Lock size={18} />
                  <input
                    autoComplete="new-password"
                    id="password"
                    minLength={10}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Create a strong password"
                    required
                    type={showPassword ? "text" : "password"}
                    value={password}
                  />
                  <button
                    aria-label={showPassword ? "Hide password" : "Show password"}
                    className="input-toggle"
                    onClick={() => setShowPassword((value) => !value)}
                    type="button"
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>

              {password.length > 0 ? (
                <div className="pw-strength">
                  <div className="pw-bar">
                    <span
                      className={`pw-bar-fill ${strength === 100 ? "strong" : strength >= 60 ? "good" : "weak"}`}
                      style={{ width: `${strength}%` }}
                    />
                  </div>
                  <span className="pw-label">{strengthLabel}</span>
                </div>
              ) : null}

              <label className="agree-check">
                <input
                  checked={agreed}
                  onChange={(e) => setAgreed(e.target.checked)}
                  type="checkbox"
                />
                <span>
                  I have read and agree to the <Link href="/">Terms</Link> &amp;{" "}
                  <Link href="/">Privacy Policy</Link>.
                </span>
              </label>

              {error ? <div className="error">{error}</div> : null}
              <button
                className="button"
                disabled={loading || !fullName.trim() || !email.trim() || !allPassed || !agreed}
                type="submit"
              >
                {loading ? "Creating account..." : "Create account"}
              </button>
              <p className="form-foot">
                Already have an account? <Link href="/login">Sign in</Link>
              </p>
            </form>
          )}
        </div>
      </section>
      <Footer />
    </main>
  );
}
