import Link from "next/link";
import {
  ArrowRight,
  BadgeCheck,
  Code2,
  CreditCard,
  GraduationCap,
  Layers,
  PlayCircle,
  Quote,
  ServerCog,
  ShieldCheck,
  Smartphone,
  Sparkles,
  Star,
  Users
} from "lucide-react";

import { Footer } from "@/components/Footer";
import { Nav } from "@/components/Nav";

const categories = [
  { icon: Code2, title: "Web Development", desc: "Next.js, React, TypeScript & modern frontend." },
  { icon: ServerCog, title: "Backend & APIs", desc: "FastAPI, databases, auth, and scaling." },
  { icon: Smartphone, title: "Mobile Apps", desc: "React Native end-to-end app building." },
  { icon: Layers, title: "Full Stack", desc: "Ship complete products from idea to deploy." }
];

const features = [
  {
    icon: ShieldCheck,
    title: "Bank-grade security",
    desc: "JWT in httpOnly cookies, rotating refresh tokens, and token-protected APIs on every request."
  },
  {
    icon: CreditCard,
    title: "Buy once, learn forever",
    desc: "Purchases are saved to your account and instantly available in your personal library."
  },
  {
    icon: GraduationCap,
    title: "Project-first learning",
    desc: "Every course is built around real, production-style projects — not just theory."
  },
  {
    icon: BadgeCheck,
    title: "Always up to date",
    desc: "Admins push fresh content and new courses that appear in your catalog immediately."
  }
];

const testimonials = [
  {
    name: "Aarav Sharma",
    role: "Frontend Developer",
    quote: "The Next.js track got me job-ready in weeks. The projects mirror real work exactly."
  },
  {
    name: "Priya Verma",
    role: "Backend Engineer",
    quote: "Finally a FastAPI course that covers auth, security and deployment properly."
  },
  {
    name: "Rohan Mehta",
    role: "Student",
    quote: "Clean UI, smooth checkout, and my courses are always one click away. Loved it."
  }
];

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
          <h1>
            Learn by building <span className="hero-accent">real projects</span>
          </h1>
          <p>
            Discover focused, project-first courses. Create your account and purchase securely on a
            fast, responsive platform built for modern learners.
          </p>
          <div className="nav-links">
            <Link className="button" href="/courses">
              <Sparkles size={18} />
              Browse Courses
              <ArrowRight size={16} />
            </Link>
            <Link className="button secondary" href="/register">
              <ShieldCheck size={18} />
              Create Free Account
            </Link>
          </div>
          <div className="stats-strip">
            <span>
              <strong>12k+</strong>
              Active learners
            </span>
            <span>
              <strong>4.9</strong>
              Average rating
            </span>
            <span>
              <strong>100%</strong>
              Secure checkout
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

      <section className="section">
        <div className="section-head">
          <span className="eyebrow">
            <Layers size={16} />
            Categories
          </span>
          <h2>Pick your path</h2>
          <p>Curated tracks across the most in-demand skills in tech.</p>
        </div>
        <div className="feature-grid">
          {categories.map((cat) => (
            <Link className="feature-card" href="/courses" key={cat.title}>
              <span className="feature-icon">
                <cat.icon size={22} />
              </span>
              <h3>{cat.title}</h3>
              <p>{cat.desc}</p>
              <span className="feature-link">
                Explore <ArrowRight size={15} />
              </span>
            </Link>
          ))}
        </div>
      </section>

      <section className="section">
        <div className="section-head">
          <span className="eyebrow">
            <ShieldCheck size={16} />
            Why CourseStack
          </span>
          <h2>Built for serious learners</h2>
          <p>Security, speed, and a learning experience that actually sticks.</p>
        </div>
        <div className="feature-grid">
          {features.map((feat) => (
            <article className="feature-card static" key={feat.title}>
              <span className="feature-icon">
                <feat.icon size={22} />
              </span>
              <h3>{feat.title}</h3>
              <p>{feat.desc}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="section">
        <div className="section-head">
          <span className="eyebrow">
            <Users size={16} />
            Loved by learners
          </span>
          <h2>What students say</h2>
          <p>Real outcomes from a real, project-first curriculum.</p>
        </div>
        <div className="testimonial-grid">
          {testimonials.map((item) => (
            <article className="testimonial-card" key={item.name}>
              <Quote className="testimonial-quote" size={26} />
              <div className="testimonial-stars">
                {[0, 1, 2, 3, 4].map((star) => (
                  <Star fill="currentColor" key={star} size={15} />
                ))}
              </div>
              <p>{item.quote}</p>
              <div className="testimonial-author">
                <span className="testimonial-avatar">
                  {item.name
                    .split(" ")
                    .map((part) => part[0])
                    .join("")}
                </span>
                <div>
                  <strong>{item.name}</strong>
                  <span>{item.role}</span>
                </div>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="cta-banner reveal">
        <div className="cta-copy">
          <h2>Ready to start building?</h2>
          <p>Create your free account and unlock the full course catalog in seconds.</p>
        </div>
        <div className="nav-links">
          <Link className="button" href="/register">
            <Sparkles size={18} />
            Get Started Free
          </Link>
          <Link className="button ghost" href="/courses">
            Browse Courses
            <ArrowRight size={16} />
          </Link>
        </div>
      </section>

      <Footer />
    </main>
  );
}
