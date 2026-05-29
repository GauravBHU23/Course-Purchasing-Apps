import Link from "next/link";
import { BookOpenCheck, Compass, Home } from "lucide-react";

import { Footer } from "@/components/Footer";
import { Nav } from "@/components/Nav";

export default function NotFound() {
  return (
    <main className="shell">
      <Nav />
      <section className="notfound reveal">
        <span className="notfound-badge">404</span>
        <span className="notfound-icon">
          <Compass size={40} />
        </span>
        <h1>Page not found</h1>
        <p>
          The page you’re looking for doesn’t exist or may have moved. Let’s get you back on track.
        </p>
        <div className="notfound-actions">
          <Link className="button" href="/courses">
            <BookOpenCheck size={18} />
            Browse Courses
          </Link>
          <Link className="button secondary" href="/">
            <Home size={18} />
            Go Home
          </Link>
        </div>
      </section>
      <Footer />
    </main>
  );
}
