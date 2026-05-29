"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  BadgeCheck,
  Eye,
  EyeOff,
  GraduationCap,
  Lock,
  Mail,
  ShieldCheck,
  Sparkles,
  UserRound,
  X
} from "lucide-react";
import { FormEvent, useState } from "react";

import { Footer } from "@/components/Footer";
import { Nav } from "@/components/Nav";
import { useAuth } from "@/components/AuthProvider";
import { useToast } from "@/components/ToastProvider";
import { api } from "@/lib/api";

const modeContent = {
  student: {
    title: "Student Login",
    sub: "Sign in to access your learning library.",
    eyebrow: "Welcome back",
    heading: "Continue your learning journey",
    blurb: "Sign in to access your courses and keep building real-world skills.",
    highlights: [
      { icon: GraduationCap, text: "Pick up right where you left off" },
      { icon: BadgeCheck, text: "All your purchased courses in one place" },
      { icon: ShieldCheck, text: "Token-protected, secure sessions" }
    ]
  },
  admin: {
    title: "Admin Login",
    sub: "Manage courses and the catalog.",
    eyebrow: "Admin workspace",
    heading: "Take control of the catalog",
    blurb: "Sign in as an admin to create, edit and manage every course.",
    highlights: [
      { icon: ShieldCheck, text: "Role-protected admin access" },
      { icon: BadgeCheck, text: "Create & publish courses instantly" },
      { icon: GraduationCap, text: "Manage the entire learning catalog" }
    ]
  }
} as const;

export default function LoginPage() {
  const router = useRouter();
  const [loginMode, setLoginMode] = useState<"student" | "admin">("student");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const { refreshUser } = useAuth();
  const toast = useToast();

  const content = modeContent[loginMode];
  const isAdmin = loginMode === "admin";
  const showResendVerification = error.toLowerCase().includes("verify your email");

  function switchMode(mode: "student" | "admin") {
    if (mode === loginMode) return;
    setLoginMode(mode);
    setError("");
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setLoading(true);
    try {
      await api.login({ email, password });
      const user = await refreshUser({ allowRefresh: false });
      if (!user) {
        throw new Error("Could not load your account");
      }
      if (loginMode === "admin" && user.role !== "admin") {
        await api.logout().catch(() => undefined);
        throw new Error("Admin account required");
      }
      toast.success("Signed in successfully");
      router.push(loginMode === "admin" ? "/admin" : "/courses");
      router.refresh();
    } catch (err) {
      const message = err instanceof Error ? err.message : "Login failed";
      setError(message);
      toast.error(message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="shell">
      <Nav />
      <section className={`auth-split auth-themed ${isAdmin ? "is-admin" : "is-student"}`}>
        <aside className="auth-aside reveal">
          <div className="auth-orbs" aria-hidden="true">
            <span className="auth-orb orb-a" />
            <span className="auth-orb orb-b" />
            <span className="auth-orb orb-c" />
          </div>
          <span className="eyebrow eyebrow-light">
            <Sparkles size={16} />
            <span key={content.eyebrow} className="swap-text">
              {content.eyebrow}
            </span>
          </span>
          <h2 key={content.heading} className="swap-text">
            {content.heading}
          </h2>
          <p key={content.blurb} className="swap-text">
            {content.blurb}
          </p>
          <ul className="auth-benefits">
            {content.highlights.map((item, index) => (
              <li className="benefit-anim" key={item.text} style={{ animationDelay: `${index * 90}ms` }}>
                <span className="auth-benefit-icon">
                  <item.icon size={18} />
                </span>
                {item.text}
              </li>
            ))}
          </ul>
        </aside>

        <div className="form-wrap auth-form-panel">
          <form autoComplete="off" className="form" onSubmit={submit}>
            <Link aria-label="Close login" className="form-close" href="/">
              <X size={18} />
            </Link>

            <div className={`login-switch animated ${isAdmin ? "to-admin" : "to-student"}`} role="tablist" aria-label="Login type">
              <span className="switch-thumb" aria-hidden="true" />
              <button
                aria-selected={!isAdmin}
                className={!isAdmin ? "active" : ""}
                onClick={() => switchMode("student")}
                role="tab"
                type="button"
              >
                <UserRound size={17} />
                Student
              </button>
              <button
                aria-selected={isAdmin}
                className={isAdmin ? "active" : ""}
                onClick={() => switchMode("admin")}
                role="tab"
                type="button"
              >
                <ShieldCheck size={17} />
                Admin
              </button>
            </div>

            <div className="auth-mode-head" key={loginMode}>
              <span className="auth-mode-icon">
                {isAdmin ? <ShieldCheck size={22} /> : <UserRound size={22} />}
              </span>
              <div>
                <h1>{content.title}</h1>
                <p className="form-sub">{content.sub}</p>
              </div>
            </div>

            <div className="field field-anim" style={{ animationDelay: "60ms" }}>
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

            <div className="field field-anim" style={{ animationDelay: "120ms" }}>
              <label htmlFor="password">Password</label>
              <div className="input-icon">
                <Lock size={18} />
                <input
                  autoComplete="off"
                  id="password"
                  minLength={10}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
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

            <div className="form-row-end">
              <Link className="form-link" href="/forgot-password">
                Forgot password?
              </Link>
            </div>
            {error ? <div className="error">{error}</div> : null}
            {showResendVerification ? (
              <button
                className="button secondary"
                disabled={loading || !email}
                onClick={async () => {
                  try {
                    const res = await api.resendVerification(email);
                    toast.success(res.message);
                  } catch (err) {
                    toast.error(err instanceof Error ? err.message : "Could not resend verification email");
                  }
                }}
                type="button"
              >
                Resend verification email
              </button>
            ) : null}
            <button
              className="button auth-submit field-anim"
              disabled={loading || !email.trim() || !password}
              style={{ animationDelay: "180ms" }}
              type="submit"
            >
              {loading ? "Signing in..." : isAdmin ? "Sign in as Admin" : "Sign in"}
            </button>
            <p className="form-foot">
              New to CourseStack? <Link href="/register">Create an account</Link>
            </p>
          </form>
        </div>
      </section>
      <Footer />
    </main>
  );
}
