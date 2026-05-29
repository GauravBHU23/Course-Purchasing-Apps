"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import {
  ArrowLeft,
  ArrowRight,
  BadgeCheck,
  BookOpenCheck,
  CheckCircle2,
  Clock3,
  CreditCard,
  Headset,
  LockKeyhole,
  PlayCircle,
  ReceiptText,
  RefreshCcw,
  ShieldCheck,
  Sparkles,
  Star
} from "lucide-react";

import { useAuth } from "@/components/AuthProvider";
import { Footer } from "@/components/Footer";
import { Loader } from "@/components/Loader";
import { Nav } from "@/components/Nav";
import { useToast } from "@/components/ToastProvider";
import { api, Course, formatPrice } from "@/lib/api";

const checkoutHighlights = [
  {
    icon: ShieldCheck,
    title: "Secure checkout",
    text: "Payment is completed on Instamojo's hosted gateway with server-side verification."
  },
  {
    icon: BookOpenCheck,
    title: "Instant course unlock",
    text: "Once payment is confirmed, the course is added directly to your library."
  },
  {
    icon: Sparkles,
    title: "Practical learning path",
    text: "Structured lessons, real projects, and a clean learning dashboard after purchase."
  }
];

const trustItems = [
  "Secure payment via Instamojo",
  "Automatic course unlock",
  "Real-time purchase verification"
];

const nextSteps = [
  {
    title: "Proceed to gateway",
    text: "You will move to Instamojo to finish the payment on a secure hosted screen."
  },
  {
    title: "Payment gets verified",
    text: "Our backend confirms the transaction before granting access to avoid errors."
  },
  {
    title: "Start learning instantly",
    text: "Once confirmed, the course appears in My Courses for this account."
  }
];

const faqs = [
  {
    q: "When will I get course access?",
    a: "Usually within moments after payment confirmation. Your purchase is verified automatically."
  },
  {
    q: "Is the payment secure?",
    a: "Yes. The payment is completed on Instamojo and verified server-side before access is granted."
  },
  {
    q: "What if the payment fails or stays pending?",
    a: "You can retry the payment. If money was deducted, the status normally updates shortly after verification."
  }
];

function derived(course: Course) {
  const seed = course.id.charCodeAt(0) + course.title.length;
  const rating = (4.5 + ((seed % 5) / 10)).toFixed(1);
  const lessons = 18 + (seed % 30);
  const learners = `${1 + (seed % 9)}.${seed % 9}k`;
  return { rating, lessons, learners };
}

export default function CheckoutPage() {
  const params = useParams<{ courseId: string }>();
  const courseId = typeof params.courseId === "string" ? params.courseId : "";
  const router = useRouter();
  const toast = useToast();
  const { user, loading: authLoading } = useAuth();

  const [course, setCourse] = useState<Course | null>(null);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!courseId) {
      setError("Course not found");
      setLoading(false);
      return;
    }

    setLoading(true);
    setError("");
    api
      .course(courseId)
      .then(setCourse)
      .catch((err) => {
        const message = err instanceof Error ? err.message : "Could not load course";
        setError(message);
        toast.error(message);
      })
      .finally(() => setLoading(false));
  }, [courseId, toast]);

  const meta = useMemo(() => (course ? derived(course) : null), [course]);

  async function continueToPayment() {
    if (!course) return;
    if (!user) {
      toast.error("Please sign in before continuing to payment");
      router.push("/login");
      return;
    }

    setProcessing(true);
    setError("");
    try {
      const { payment_url } = await api.createPayment(course.id);
      window.location.href = payment_url;
    } catch (err) {
      const message = err instanceof Error ? err.message : "Could not start payment";
      setError(message);
      toast.error(message);
      if (message.toLowerCase().includes("verify your email")) {
        router.push("/login");
      }
    } finally {
      setProcessing(false);
    }
  }

  if (loading) {
    return (
      <main className="shell">
        <Nav />
        <section className="checkout-shell">
          <div className="form" style={{ maxWidth: "520px", margin: "0 auto" }}>
            <Loader label="Preparing your checkout..." />
          </div>
        </section>
        <Footer />
      </main>
    );
  }

  if (!course) {
    return (
      <main className="shell">
        <Nav />
        <section className="notfound">
          <span className="notfound-badge">CHECKOUT</span>
          <div className="notfound-icon notfound-icon-error">
            <CreditCard size={38} />
          </div>
          <h1>{error ? "Checkout unavailable" : "Course not found"}</h1>
          <p>{error || "The checkout link is invalid or this course is no longer available."}</p>
          <div className="notfound-actions">
            <Link className="button" href="/courses">
              Back to Courses
            </Link>
          </div>
        </section>
        <Footer />
      </main>
    );
  }

  return (
    <main className="shell">
      <Nav />
      <section className="checkout-shell">
        <div className="checkout-grid">
          <aside className="checkout-intro reveal">
            <Link className="checkout-back" href="/courses">
              <ArrowLeft size={16} />
              Back to catalog
            </Link>
            <span className="eyebrow">
              <LockKeyhole size={16} />
              Company-style checkout
            </span>
            <h1>Review your order before secure payment</h1>
            <p>
              A clear summary, secure purchase flow, and automatic access once your payment is
              confirmed.
            </p>

            <div className="checkout-trust-strip">
              {trustItems.map((item) => (
                <span className="checkout-trust-pill" key={item}>
                  <ShieldCheck size={14} />
                  {item}
                </span>
              ))}
            </div>

            <div className="checkout-course-card">
              <img
                alt={course.title}
                className="checkout-course-image"
                src={`${course.thumbnail_url}?auto=format&fit=crop&w=1200&q=80`}
              />
              <div className="checkout-course-body">
                <div className="checkout-chip-row">
                  <span className="meta-pill">
                    <BadgeCheck size={14} /> {course.level}
                  </span>
                  <span className="meta-pill">
                    <Clock3 size={14} /> {course.duration_hours}h
                  </span>
                  <span className="meta-pill">
                    <PlayCircle size={14} /> {meta?.lessons} lessons
                  </span>
                </div>
                <h2>{course.title}</h2>
                <p>{course.description}</p>
                <div className="checkout-rating-row">
                  <span className="rating-score">
                    <Star fill="currentColor" size={14} /> {meta?.rating}
                  </span>
                  <span className="rating-meta">{meta?.learners} learners joined</span>
                </div>
              </div>
            </div>

            <div className="checkout-feature-list">
              {checkoutHighlights.map((item) => (
                <article className="checkout-feature" key={item.title}>
                  <span className="checkout-feature-icon">
                    <item.icon size={18} />
                  </span>
                  <div>
                    <strong>{item.title}</strong>
                    <p>{item.text}</p>
                  </div>
                </article>
              ))}
            </div>

            <section className="checkout-next">
              <div className="checkout-section-head">
                <span className="eyebrow">
                  <ArrowRight size={16} />
                  What happens next
                </span>
                <h3>From payment to course access</h3>
              </div>
              <div className="checkout-next-grid">
                {nextSteps.map((step, index) => (
                  <article className="checkout-next-card" key={step.title}>
                    <span className="checkout-next-index">0{index + 1}</span>
                    <strong>{step.title}</strong>
                    <p>{step.text}</p>
                  </article>
                ))}
              </div>
            </section>

            <section className="checkout-faq">
              <div className="checkout-section-head">
                <span className="eyebrow">
                  <ReceiptText size={16} />
                  Quick answers
                </span>
                <h3>Mini FAQ</h3>
              </div>
              <div className="checkout-faq-list">
                {faqs.map((item) => (
                  <article className="checkout-faq-item" key={item.q}>
                    <strong>{item.q}</strong>
                    <p>{item.a}</p>
                  </article>
                ))}
              </div>
            </section>
          </aside>

          <section className="checkout-panel reveal">
            <div className="checkout-summary">
              <div className="checkout-summary-head">
                <div>
                  <span className="eyebrow">Order summary</span>
                  <h2>Complete your purchase</h2>
                </div>
                <span className="checkout-lock">
                  <ShieldCheck size={16} />
                  Verified
                </span>
              </div>

              <div className="checkout-line">
                <span>Course</span>
                <strong>{course.title}</strong>
              </div>
              <div className="checkout-line">
                <span>Access</span>
                <strong>Lifetime</strong>
              </div>
              <div className="checkout-line">
                <span>Course price</span>
                <strong>{formatPrice(course.price_cents)}</strong>
              </div>
              <div className="checkout-line subtle">
                <span>Gateway pricing</span>
                <span>Shown by Instamojo on the next step</span>
              </div>

              <div className="checkout-total">
                <span>Payable now</span>
                <strong>{formatPrice(course.price_cents)}</strong>
              </div>

              <div className="checkout-account">
                <h3>Your account</h3>
                {authLoading ? (
                  <p>Checking your sign-in status...</p>
                ) : user ? (
                  <>
                    <div className="checkout-account-card">
                      <strong>{user.full_name}</strong>
                      <span>{user.email}</span>
                    </div>
                    <ul className="checkout-checks">
                      <li>
                        <CheckCircle2 size={16} />
                        Course will be added to this account after payment
                      </li>
                      <li>
                        <CheckCircle2 size={16} />
                        Purchase verification happens automatically
                      </li>
                    </ul>
                  </>
                ) : (
                  <>
                    <p>Sign in first so we can attach this purchase to your learning library.</p>
                    <div className="checkout-auth-actions">
                      <Link className="button" href="/login">
                        Login
                      </Link>
                      <Link className="button secondary" href="/register">
                        Create account
                      </Link>
                    </div>
                  </>
                )}
              </div>

              <div className="checkout-support-box">
                <div className="checkout-support-head">
                  <span className="checkout-support-icon">
                    <Headset size={16} />
                  </span>
                  <strong>Support and refund help</strong>
                </div>
                <ul className="checkout-support-list">
                  <li>
                    <CheckCircle2 size={16} />
                    Payment support is available if verification takes longer than expected
                  </li>
                  <li>
                    <RefreshCcw size={16} />
                    Refund terms and gateway details are shown again on the Instamojo step
                  </li>
                  <li>
                    <ReceiptText size={16} />
                    Keep this account email active so access and payment updates reach you correctly
                  </li>
                </ul>
              </div>

              {error ? <div className="error">{error}</div> : null}

              <button
                className="button checkout-pay-button"
                disabled={!user || processing}
                onClick={continueToPayment}
                type="button"
              >
                <CreditCard size={18} />
                {processing ? "Redirecting to payment..." : "Proceed to Secure Checkout"}
              </button>

              <p className="checkout-note">
                No hidden charges from CourseStack. Final gateway details, if any, are shown on the
                next secure Instamojo step.
              </p>
            </div>
          </section>
        </div>
      </section>
      <Footer />
    </main>
  );
}
