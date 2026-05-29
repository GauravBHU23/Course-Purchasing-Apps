"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense, useEffect, useRef, useState } from "react";
import { CheckCircle2, Clock, XCircle } from "lucide-react";

import { Footer } from "@/components/Footer";
import { Loader } from "@/components/Loader";
import { Nav } from "@/components/Nav";
import { api } from "@/lib/api";

function CallbackInner() {
  const params = useSearchParams();
  const [state, setState] = useState<"verifying" | "paid" | "pending" | "error">("verifying");
  const ran = useRef(false);

  // Instamojo appends payment_id and payment_request_id to the redirect URL.
  const paymentRequestId = params.get("payment_request_id") ?? "";
  const paymentId = params.get("payment_id") ?? "";

  useEffect(() => {
    if (ran.current) return;
    ran.current = true;

    if (!paymentRequestId) {
      setState("error");
      return;
    }
    api
      .verifyPayment(paymentRequestId, paymentId || undefined)
      .then((res) => setState(res.status === "paid" ? "paid" : "pending"))
      .catch(() => setState("error"));
  }, [paymentRequestId, paymentId]);

  if (state === "verifying") {
    return (
      <div className="form">
        <Loader label="Confirming your payment..." />
      </div>
    );
  }

  if (state === "paid") {
    return (
      <div className="form">
        <span className="modal-icon modal-success" style={{ margin: "0 auto 8px" }}>
          <CheckCircle2 size={28} />
        </span>
        <h1 style={{ textAlign: "center" }}>Payment successful 🎉</h1>
        <p className="form-sub" style={{ textAlign: "center" }}>
          Thank you! Your course has been added to your library.
        </p>
        <Link className="button" href="/my-courses">
          Go to My Courses
        </Link>
      </div>
    );
  }

  if (state === "pending") {
    return (
      <div className="form">
        <span className="modal-icon modal-info" style={{ margin: "0 auto 8px" }}>
          <Clock size={28} />
        </span>
        <h1 style={{ textAlign: "center" }}>Payment pending</h1>
        <p className="form-sub" style={{ textAlign: "center" }}>
          We haven't received confirmation yet. If money was deducted, it will reflect shortly —
          check My Courses in a few minutes.
        </p>
        <Link className="button secondary" href="/courses">
          Back to Courses
        </Link>
      </div>
    );
  }

  return (
    <div className="form">
      <span className="modal-icon modal-error" style={{ margin: "0 auto 8px" }}>
        <XCircle size={28} />
      </span>
      <h1 style={{ textAlign: "center" }}>Payment not completed</h1>
      <p className="form-sub" style={{ textAlign: "center" }}>
        The payment was cancelled or could not be verified. You can try again from the courses page.
      </p>
      <Link className="button" href="/courses">
        Back to Courses
      </Link>
    </div>
  );
}

export default function PaymentCallbackPage() {
  return (
    <main className="shell">
      <Nav />
      <section className="auth-split">
        <aside className="auth-aside reveal">
          <span className="eyebrow eyebrow-light">Secure checkout</span>
          <h2>Almost there!</h2>
          <p>We're confirming your payment with the gateway. This only takes a moment.</p>
        </aside>
        <div className="form-wrap auth-form-panel">
          <Suspense fallback={<div className="form">Loading...</div>}>
            <CallbackInner />
          </Suspense>
        </div>
      </section>
      <Footer />
    </main>
  );
}
