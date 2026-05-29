"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { FormEvent, Suspense, useMemo, useState } from "react";
import { CheckCircle2, Circle, Eye, EyeOff, KeyRound, Lock, ShieldCheck } from "lucide-react";

import { Footer } from "@/components/Footer";
import { Nav } from "@/components/Nav";
import { useToast } from "@/components/ToastProvider";
import { api } from "@/lib/api";

function ResetForm() {
  const router = useRouter();
  const toast = useToast();
  const params = useSearchParams();
  const token = params.get("token") ?? "";

  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  const rules = useMemo(
    () => [
      { label: "At least 10 characters", ok: password.length >= 10 },
      { label: "One uppercase letter", ok: /[A-Z]/.test(password) },
      { label: "One lowercase letter", ok: /[a-z]/.test(password) },
      { label: "One number", ok: /[0-9]/.test(password) },
      { label: "One special character", ok: /[^A-Za-z0-9]/.test(password) },
      { label: "Passwords match", ok: password.length > 0 && password === confirm }
    ],
    [password, confirm]
  );
  const allPassed = rules.every((rule) => rule.ok);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!allPassed) {
      toast.error("Please meet all password requirements");
      return;
    }
    setLoading(true);
    try {
      await api.resetPassword({ token, new_password: password });
      setDone(true);
      toast.success("Password reset successfully");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Reset link is invalid or expired");
    } finally {
      setLoading(false);
    }
  }

  if (!token) {
    return (
      <div className="form">
        <span className="modal-icon modal-error" style={{ margin: "0 auto 8px" }}>
          <ShieldCheck size={28} />
        </span>
        <h1 style={{ textAlign: "center" }}>Invalid link</h1>
        <p className="form-sub" style={{ textAlign: "center" }}>
          This reset link is missing or broken. Please request a new one.
        </p>
        <Link className="button" href="/forgot-password">
          Request new link
        </Link>
      </div>
    );
  }

  if (done) {
    return (
      <div className="form">
        <span className="modal-icon modal-success" style={{ margin: "0 auto 8px" }}>
          <CheckCircle2 size={28} />
        </span>
        <h1 style={{ textAlign: "center" }}>Password updated</h1>
        <p className="form-sub" style={{ textAlign: "center" }}>
          Your password has been reset. You can now sign in with your new password.
        </p>
        <button className="button" onClick={() => router.push("/login")} type="button">
          Go to login
        </button>
      </div>
    );
  }

  return (
    <form className="form" onSubmit={submit}>
      <h1>Set a new password</h1>
      <p className="form-sub">Choose a strong password for your account.</p>

      <div className="field">
        <label htmlFor="password">New password</label>
        <div className="input-icon">
          <Lock size={18} />
          <input
            autoComplete="new-password"
            id="password"
            minLength={10}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="New password"
            required
            type={showPassword ? "text" : "password"}
            value={password}
          />
          <button className="input-toggle" onClick={() => setShowPassword((v) => !v)} type="button">
            {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
          </button>
        </div>
      </div>

      <div className="field">
        <label htmlFor="confirm">Confirm password</label>
        <div className="input-icon">
          <Lock size={18} />
          <input
            autoComplete="new-password"
            id="confirm"
            minLength={10}
            onChange={(e) => setConfirm(e.target.value)}
            placeholder="Re-enter password"
            required
            type={showPassword ? "text" : "password"}
            value={confirm}
          />
        </div>
      </div>

      <ul className="pw-rules">
        {rules.map((rule) => (
          <li className={rule.ok ? "ok" : ""} key={rule.label}>
            {rule.ok ? <CheckCircle2 size={16} /> : <Circle size={16} />}
            {rule.label}
          </li>
        ))}
      </ul>

      <button className="button" disabled={loading || !allPassed} type="submit">
        <KeyRound size={18} />
        {loading ? "Resetting..." : "Reset password"}
      </button>
      <p className="form-foot">
        <Link href="/login">Back to login</Link>
      </p>
    </form>
  );
}

export default function ResetPasswordPage() {
  return (
    <main className="shell">
      <Nav />
      <section className="auth-split">
        <aside className="auth-aside reveal">
          <span className="eyebrow eyebrow-light">
            <ShieldCheck size={16} />
            Secure reset
          </span>
          <h2>Create a new password</h2>
          <p>Almost done! Pick a strong password and you’ll be back to learning in no time.</p>
        </aside>
        <div className="form-wrap auth-form-panel">
          <Suspense fallback={<div className="form">Loading...</div>}>
            <ResetForm />
          </Suspense>
        </div>
      </section>
      <Footer />
    </main>
  );
}
