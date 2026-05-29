"use client";

import { useEffect } from "react";
import Link from "next/link";
import { AlertTriangle, BookOpenCheck, RefreshCw } from "lucide-react";

export default function Error({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <main className="shell">
      <nav className="nav">
        <Link className="brand" href="/">
          CourseStack
        </Link>
        <div className="nav-links">
          <Link className="button secondary" href="/courses">
            <BookOpenCheck size={18} />
            Courses
          </Link>
        </div>
      </nav>
      <section className="fallback-screen reveal">
        <div className="fallback-art error-art" aria-hidden="true">
          <span className="fallback-code">Oops</span>
          <div className="fallback-orbit orbit-one" />
          <div className="fallback-orbit orbit-two" />
          <AlertTriangle className="fallback-compass" size={72} />
        </div>
        <div className="fallback-copy">
          <span className="eyebrow">
            <AlertTriangle size={16} />
            Something went wrong
          </span>
          <h1>The app hit an unexpected issue.</h1>
          <p>
            This can happen during a temporary API, network, or page rendering problem. Try again,
            or return to the course catalog.
          </p>
          <div className="fallback-actions">
            <button className="button" onClick={reset} type="button">
              <RefreshCw size={18} />
              Try Again
            </button>
            <Link className="button secondary" href="/courses">
              <BookOpenCheck size={18} />
              Browse Courses
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
