"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";
import { ArrowLeft, MailCheck, Send, ShieldCheck } from "lucide-react";

import { Footer } from "@/components/Footer";
import { Modal } from "@/components/Modal";
import { Nav } from "@/components/Nav";
import { useToast } from "@/components/ToastProvider";
import { api } from "@/lib/api";

export default function ForgotPasswordPage() {
  const router = useRouter();
  const toast = useToast();
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [notFound, setNotFound] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    try {
      const res = await api.forgotPassword(email);
      setSent(true);
      toast.success(res.message);
      return res;
    } catch (err) {
      const message = err instanceof Error ? err.message : "Could not send reset email";
      // 404 / "does not exist" => account not registered: show the popup.
      if (message.toLowerCase().includes("does not exist") || message.toLowerCase().includes("not found")) {
        setNotFound(true);
      } else {
        toast.error(message);
      }
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
            <ShieldCheck size={16} />
            Account recovery
          </span>
          <h2>Forgot your password?</h2>
          <p>No worries - it happens. Enter your email and we'll send you a secure link to reset it.</p>
          <ul className="auth-benefits">
            <li>
              <span className="auth-benefit-icon">
                <MailCheck size={18} />
              </span>
              Secure reset link sent to your inbox
            </li>
            <li>
              <span className="auth-benefit-icon">
                <ShieldCheck size={18} />
              </span>
              Link expires automatically for safety
            </li>
          </ul>
        </aside>

        <div className="form-wrap auth-form-panel">
          {sent ? (
            <div className="form">
              <span className="modal-icon modal-success" style={{ margin: "0 auto 8px" }}>
                <MailCheck size={28} />
              </span>
              <h1 style={{ textAlign: "center" }}>Check your email</h1>
              <p className="form-sub" style={{ textAlign: "center" }}>
                We've sent a password reset link to <strong>{email}</strong>. It may take a minute to
                arrive - don't forget to check spam.
              </p>
              <Link className="button" href="/login">
                <ArrowLeft size={18} />
                Back to login
              </Link>
            </div>
          ) : (
            <form className="form" onSubmit={submit}>
              <h1>Reset password</h1>
              <p className="form-sub">Enter the email linked to your account.</p>
              <div className="field">
                <label htmlFor="email">Email</label>
                <div className="input-icon">
                  <Send size={18} />
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
              <button className="button" disabled={loading || !email.trim()} type="submit">
                <Send size={18} />
                {loading ? "Sending..." : "Send reset link"}
              </button>
              <p className="form-foot">
                Remembered it? <Link href="/login">Back to login</Link>
              </p>
              <p className="form-foot">
                No account yet? <Link href="/register">Register first</Link>
              </p>
            </form>
          )}
        </div>
      </section>
      <Footer />

      <Modal
        open={notFound}
        tone="error"
        title="No account found"
        message={
          <>
            We couldn't find an account for <strong>{email}</strong>. Please create an account first,
            then you can reset your password.
          </>
        }
        onClose={() => setNotFound(false)}
        actions={[
          { label: "Create account", onClick: () => router.push("/register") },
          { label: "Try again", variant: "secondary", onClick: () => setNotFound(false) }
        ]}
      />
    </main>
  );
}
