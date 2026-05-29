"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { X } from "lucide-react";
import { FormEvent, useState } from "react";

import { Nav } from "@/components/Nav";
import { useToast } from "@/components/ToastProvider";
import { api } from "@/lib/api";

export default function RegisterPage() {
  const router = useRouter();
  const [fullName, setFullName] = useState("");
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
      await api.register({ email, full_name: fullName, password });
      await api.login({ email, password });
      toast.success("Account created successfully");
      router.push("/courses");
      router.refresh();
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
            <Link aria-label="Close register" className="form-close" href="/">
              <X size={18} />
            </Link>
            <h1>Create Account</h1>
            <div className="field">
              <label htmlFor="fullName">Full name</label>
              <input id="fullName" onChange={(e) => setFullName(e.target.value)} required value={fullName} />
            </div>
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
              {loading ? "Creating" : "Create account"}
            </button>
            <Link href="/login">Already have an account?</Link>
          </form>
        </div>
      </section>
    </main>
  );
}
