import Link from "next/link";
import { ArrowRight, PlayCircle, ShieldCheck, Sparkles } from "lucide-react";

import { Nav } from "@/components/Nav";

export default function Home() {
  return (
    <main className="shell">
      <Nav />
      <section className="hero">
        <div className="hero-copy reveal">
          <span className="eyebrow">
            <PlayCircle size={16} />
            FastAPI + Next.js learning marketplace
          </span>
          <h1>CourseStack</h1>
          <p>
            Discover focused courses, create your account, and buy securely through a responsive
            course marketplace built for a modern learning flow.
          </p>
          <div className="nav-links">
            <Link className="button" href="/courses">
              <Sparkles size={18} />
              Browse Courses
              <ArrowRight size={16} />
            </Link>
            <Link className="button secondary" href="/register">
              <ShieldCheck size={18} />
              Create Account
            </Link>
          </div>
          <div className="stats-strip">
            <span>
              <strong>JWT</strong>
              Secure cookies
            </span>
            <span>
              <strong>Live</strong>
              Course catalog
            </span>
            <span>
              <strong>SQL</strong>
              Purchase history
            </span>
          </div>
        </div>
        <div className="hero-media reveal">
          <img
            alt="Students learning app development"
            className="hero-image"
            src="https://images.unsplash.com/photo-1522202176988-66273c2fd55f?auto=format&fit=crop&w=1200&q=80"
          />
          <div className="floating-panel panel-one">
            <strong>4.9</strong>
            <span>learner rating</span>
          </div>
          <div className="floating-panel panel-two">
            <strong>24h</strong>
            <span>project tracks</span>
          </div>
        </div>
      </section>
    </main>
  );
}
