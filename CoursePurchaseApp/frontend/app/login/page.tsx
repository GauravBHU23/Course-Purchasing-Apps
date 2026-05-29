"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { ShieldCheck, UserRound, X } from "lucide-react";
import { FormEvent, useState } from "react";

import { Nav } from "@/components/Nav";
import { useToast } from "@/components/ToastProvider";
import { api } from "@/lib/api";

export default function LoginPage() {
  const router = useRouter();
  const [loginMode, setLoginMode] = useState<"student" | "admin">("student");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const toast = useToast();

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setLoading(true);
    try {
      await api.login({ email, password });
      const user = await api.me();
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
      <section className="auth-stage">
        <div className="auth-motion" aria-hidden="true">
          <span className="auth-line line-one" />
          <span className="auth-line line-two" />
          <span className="auth-tile tile-one" />
          <span className="auth-tile tile-two" />
          <span className="auth-tile tile-three" />
        </div>
        <div className="form-wrap auth-form">
          <form className="form" onSubmit={submit}>
            <Link aria-label="Close login" className="form-close" href="/">
              <X size={18} />
            </Link>
            <div className="login-switch" role="tablist" aria-label="Login type">
              <button
                aria-selected={loginMode === "student"}
                className={loginMode === "student" ? "active" : ""}
                onClick={() => {
                  setLoginMode("student");
                  setError("");
                }}
                role="tab"
                type="button"
              >
                <UserRound size={17} />
                Student Login
              </button>
              <button
                aria-selected={loginMode === "admin"}
                className={loginMode === "admin" ? "active" : ""}
                onClick={() => {
                  setLoginMode("admin");
                  setError("");
                }}
                role="tab"
                type="button"
              >
                <ShieldCheck size={17} />
                Admin Login
              </button>
            </div>
            <h1>{loginMode === "admin" ? "Admin Login" : "Student Login"}</h1>
            <div className="field">
              <label htmlFor="email">Email</label>
              <input id="email" onChange={(e) => setEmail(e.target.value)} required type="email" value={email} />
            </div>
            <div className="field">
              <label htmlFor="password">Password</label>
              <input
                id="password"
                minLength={10}
                onChange={(e) => setPassword(e.target.value)}
                required
                type="password"
                value={password}
              />
            </div>
            {error ? <div className="error">{error}</div> : null}
            <button className="button" disabled={loading} type="submit">
              {loading ? "Signing in" : "Sign in"}
            </button>
            <Link href="/register">Create a new account</Link>
          </form>
        </div>
      </section>
    </main>
  );
}
