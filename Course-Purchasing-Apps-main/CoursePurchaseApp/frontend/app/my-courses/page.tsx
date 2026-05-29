"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { AlertTriangle, ArrowRight, GraduationCap, Library, RefreshCw, SearchX, Sparkles } from "lucide-react";

import { useAuth } from "@/components/AuthProvider";
import { CourseCard } from "@/components/CourseCard";
import { Footer } from "@/components/Footer";
import { Loader } from "@/components/Loader";
import { Modal } from "@/components/Modal";
import { Nav } from "@/components/Nav";
import { api, Purchase } from "@/lib/api";

export default function MyCoursesPage() {
  const router = useRouter();
  const { error, loading: authLoading, user } = useAuth();
  const [purchases, setPurchases] = useState<Purchase[]>([]);
  const [loading, setLoading] = useState(true);
  const [authError, setAuthError] = useState(false);
  const [authMessage, setAuthMessage] = useState(
    "You need to be signed in to view your purchased courses. Please log in to continue."
  );
  const [authTitle, setAuthTitle] = useState("Login required");
  const [loadError, setLoadError] = useState("");
  const [retryTick, setRetryTick] = useState(0);

  useEffect(() => {
    let active = true;

    if (authLoading) {
      return () => {
        active = false;
      };
    }

    if (!user) {
      const message = error ?? "You need to be signed in to view your purchased courses. Please log in to continue.";
      if (message.toLowerCase().includes("verify your email")) {
        setAuthTitle("Email verification required");
        setAuthMessage("Please verify your email before opening My Courses.");
      } else {
        setAuthTitle("Login required");
        setAuthMessage("You need to be signed in to view your purchased courses. Please log in to continue.");
      }
      setAuthError(true);
      setLoading(false);
      return () => {
        active = false;
      };
    }

    setAuthError(false);
    setLoadError("");
    api
      .myCourses()
      .then((data) => {
        if (active) setPurchases(data);
      })
      .catch((err) => {
        if (!active) return;
        const message = err instanceof Error ? err.message : "Could not load your courses";
        setLoadError(message);
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [authLoading, error, retryTick, user]);

  const courseMissing = loadError.toLowerCase().includes("course not found");

  return (
    <main className="shell">
      <Nav />
      <section className="page-head">
        <div>
          <span className="eyebrow">
            <Library size={16} />
            Your library
          </span>
          <h1>My Courses</h1>
          <p>Everything you own, ready to continue learning whenever you are.</p>
        </div>
        <div className="head-panel">
          <GraduationCap size={22} />
          <strong>{loading ? "..." : purchases.length}</strong>
          <span>courses owned</span>
        </div>
      </section>

      {loading ? (
        <div className="page-loader">
          <Loader label="Loading your courses..." />
        </div>
      ) : null}

      {!loading && loadError ? (
        <section className="library-status reveal">
          <div className={`library-status-icon ${courseMissing ? "course-missing" : ""}`}>
            {courseMissing ? <SearchX size={34} /> : <AlertTriangle size={34} />}
          </div>
          <div className="library-status-copy">
            <span className="eyebrow">
              <Library size={16} />
              Library status
            </span>
            <h3>{courseMissing ? "A purchased course is currently unavailable" : "We couldn't load your library"}</h3>
            <p>
              {courseMissing
                ? "One of your saved purchases points to a course that is no longer available or was renamed. Your account is safe, but this item needs attention."
                : "This is usually temporary. Refresh your library or browse the catalog while we reconnect your purchase data."}
            </p>
            <div className="library-status-actions">
              <button className="button" onClick={() => setRetryTick((value) => value + 1)} type="button">
                <RefreshCw size={16} />
                Refresh Library
              </button>
              <Link className="button secondary" href="/courses">
                Browse Courses
                <ArrowRight size={16} />
              </Link>
            </div>
            <div className="library-status-note">
              <strong>{courseMissing ? "Why this can happen" : "Helpful note"}</strong>
              <span>
                {courseMissing
                  ? "Admins may have updated or removed a course after purchase data was created. If this keeps happening, reconnect the purchase record in the admin flow."
                  : loadError}
              </span>
            </div>
          </div>
        </section>
      ) : null}

      {!loading && !authError && !loadError && purchases.length === 0 ? (
        <div className="empty-state reveal">
          <span className="empty-icon">
            <Sparkles size={28} />
          </span>
          <h3>No courses yet</h3>
          <p>Your purchased courses will appear here. Explore the catalog to get started.</p>
          <Link className="button" href="/courses">
            Browse Courses
            <ArrowRight size={16} />
          </Link>
        </div>
      ) : null}

      <section className="grid">
        {purchases.map((purchase, index) => (
          <CourseCard course={purchase.course} index={index} key={purchase.id} purchased />
        ))}
      </section>

      <Footer />

      <Modal
        open={authError}
        tone="info"
        dismissable={false}
        title={authTitle}
        message={authMessage}
        actions={[
          { label: "Go to Login", onClick: () => router.push("/login") },
          { label: "Browse Courses", variant: "secondary", onClick: () => router.push("/courses") }
        ]}
      />
    </main>
  );
}
