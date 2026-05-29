import Link from "next/link";
import { BookOpen, Github, Linkedin, Lock, Mail, ShieldCheck, Twitter } from "lucide-react";

export function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className="footer">
      <div className="footer-inner">
        <div className="footer-brand">
          <Link className="footer-logo" href="/">
            <span className="footer-logo-mark">
              <BookOpen size={20} />
            </span>
            CourseStack
          </Link>
          <p>
            A secure, modern learning marketplace. Buy focused courses, build real projects, and
            keep your learning library in one place.
          </p>
          <div className="footer-social">
            <a aria-label="Twitter" href="https://twitter.com" rel="noreferrer" target="_blank">
              <Twitter size={18} />
            </a>
            <a aria-label="GitHub" href="https://github.com" rel="noreferrer" target="_blank">
              <Github size={18} />
            </a>
            <a aria-label="LinkedIn" href="https://linkedin.com" rel="noreferrer" target="_blank">
              <Linkedin size={18} />
            </a>
            <a aria-label="Email" href="mailto:hello@coursestack.app">
              <Mail size={18} />
            </a>
          </div>
        </div>

        <div className="footer-col">
          <h4>Explore</h4>
          <Link href="/courses">All Courses</Link>
          <Link href="/my-courses">My Courses</Link>
          <Link href="/contact">Contact Us</Link>
          <Link href="/register">Create Account</Link>
          <Link href="/login">Sign In</Link>
        </div>

        <div className="footer-col">
          <h4>Categories</h4>
          <Link href="/courses">Web Development</Link>
          <Link href="/courses">Mobile Apps</Link>
          <Link href="/courses">Backend &amp; APIs</Link>
          <Link href="/courses">UI / UX Design</Link>
        </div>

        <div className="footer-col">
          <h4>Trust &amp; Security</h4>
          <span className="footer-badge">
            <ShieldCheck size={15} /> JWT secured sessions
          </span>
          <span className="footer-badge">
            <Lock size={15} /> Encrypted passwords
          </span>
          <span className="footer-badge">
            <ShieldCheck size={15} /> Token-protected APIs
          </span>
        </div>
      </div>

      <div className="footer-bottom">
        <span>&copy; {year} CourseStack. All rights reserved.</span>
        <div className="footer-bottom-links">
          <Link href="/">Privacy</Link>
          <Link href="/">Terms</Link>
          <Link href="/contact">Support</Link>
        </div>
      </div>
    </footer>
  );
}
