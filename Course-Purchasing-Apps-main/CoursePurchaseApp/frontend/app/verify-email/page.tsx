"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense, useEffect, useRef, useState } from "react";
import { BadgeCheck, CheckCircle2, ShieldCheck, XCircle } from "lucide-react";

import { Footer } from "@/components/Footer";
import { Loader } from "@/components/Loader";
import { Nav } from "@/components/Nav";
import { api } from "@/lib/api";

function VerifyInner() {
  const params = useSearchParams();
  const token = params.get("token") ?? "";
  const [status, setStatus] = useState<"loading" | "ok" | "error">("loading");
  const [message, setMessage] = useState("");
  const ran = useRef(false);

  useEffect(() => {
    if (ran.current) return;
    ran.current = true;

    if (!token) {
      setStatus("error");
      setMessage("This verification link is missing or broken.");
      return;
    }
    api
      .verifyEmail(token)
      .then((res) => {
        setStatus("ok");
        setMessage(res.message);
      })
      .catch((err) => {
        setStatus("error");
        setMessage(err instanceof Error ? err.message : "Verification link is invalid or expired.");
      });
  }, [token]);

  if (status === "loading") {
    return (
      <div className="form">
        <Loader label="Verifying your email..." />
      </div>
    );
  }

  if (status === "ok") {
    return (
      <div className="form">
        <span className="modal-icon modal-success" style={{ margin: "0 auto 8px" }}>
          <CheckCircle2 size={28} />
        </span>
        <h1 style={{ textAlign: "center" }}>Your email is verified</h1>
        <p className="form-sub" style={{ textAlign: "center" }}>{message}</p>
        <Link className="button" href="/login">
          Login now
        </Link>
      </div>
    );
  }

  return (
    <div className="form">
      <span className="modal-icon modal-error" style={{ margin: "0 auto 8px" }}>
        <XCircle size={28} />
      </span>
      <h1 style={{ textAlign: "center" }}>Verification failed</h1>
      <p className="form-sub" style={{ textAlign: "center" }}>{message}</p>
      <Link className="button" href="/login">
        Back to login
      </Link>
      <Link className="button secondary" href="/register">
        Create a new account
      </Link>
    </div>
  );
}

export default function VerifyEmailPage() {
  return (
    <main className="shell">
      <Nav />
      <section className="auth-split">
        <aside className="auth-aside reveal">
          <span className="eyebrow eyebrow-light">
            <ShieldCheck size={16} />
            Email verification
          </span>
          <h2>Almost there!</h2>
          <p>We are confirming your email so we can keep your account safe and secure.</p>
          <ul className="auth-benefits">
            <li>
              <span className="auth-benefit-icon">
                <BadgeCheck size={18} />
              </span>
              Verified accounts keep CourseStack spam-free
            </li>
          </ul>
        </aside>
        <div className="form-wrap auth-form-panel">
          <Suspense fallback={<div className="form">Loading...</div>}>
            <VerifyInner />
          </Suspense>
        </div>
      </section>
      <Footer />
    </main>
  );
}
