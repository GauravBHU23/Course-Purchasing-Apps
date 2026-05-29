import Link from "next/link";
import { BookOpenCheck, Compass, Home, LogIn } from "lucide-react";

export default function NotFound() {
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
          <Link className="button" href="/login">
            Login
          </Link>
        </div>
      </nav>
      <section className="fallback-screen reveal">
        <div className="fallback-art" aria-hidden="true">
          <span className="fallback-code">404</span>
          <div className="fallback-orbit orbit-one" />
          <div className="fallback-orbit orbit-two" />
          <Compass className="fallback-compass" size={72} />
        </div>
        <div className="fallback-copy">
          <span className="eyebrow">
            <Compass size={16} />
            Page not found
          </span>
          <h1>Looks like this course path does not exist.</h1>
          <p>
            The page may have moved, the URL may be mistyped, or the course route is not available
            yet. You can jump back into the catalog from here.
          </p>
          <div className="fallback-actions">
            <Link className="button" href="/courses">
              <BookOpenCheck size={18} />
              Browse Courses
            </Link>
            <Link className="button secondary" href="/">
              <Home size={18} />
              Go Home
            </Link>
            <Link className="button secondary" href="/login">
              <LogIn size={18} />
              Login
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
