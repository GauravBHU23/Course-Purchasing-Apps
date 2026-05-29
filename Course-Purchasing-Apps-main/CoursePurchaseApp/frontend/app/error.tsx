"use client";

import { useEffect } from "react";
import Link from "next/link";
import { AlertTriangle, BookOpen, BookOpenCheck, RefreshCw } from "lucide-react";

export default function Error({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <main className="shell">
      <nav className="nav">
        <Link className="brand" href="/">
          <span className="brand-mark">
            <BookOpen size={18} />
          </span>
          CourseStack
        </Link>
        <div className="nav-links">
          <Link className="button secondary" href="/courses">
            <BookOpenCheck size={18} />
            Courses
          </Link>
        </div>
      </nav>
      <section className="notfound reveal">
        <span className="notfound-icon notfound-icon-error">
          <AlertTriangle size={40} />
        </span>
        <h1>Something went wrong</h1>
        <p>
          We hit an unexpected issue. This is usually temporary — please try again, or head back to
          the catalog.
        </p>
        <div className="notfound-actions">
          <button className="button" onClick={reset} type="button">
            <RefreshCw size={18} />
            Try Again
          </button>
          <Link className="button secondary" href="/courses">
            <BookOpenCheck size={18} />
            Browse Courses
          </Link>
        </div>
      </section>
    </main>
  );
}
