"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import {
  ArrowRight,
  Building2,
  Clock3,
  Mail,
  MapPin,
  MessageSquareText,
  PhoneCall,
  Send,
  ShieldCheck
} from "lucide-react";

import { Footer } from "@/components/Footer";
import { Nav } from "@/components/Nav";
import { useToast } from "@/components/ToastProvider";

const contactCards = [
  {
    icon: MapPin,
    title: "Visit us",
    body: "CourseStack Learning Studio, 3rd Floor, MG Road, Bengaluru, Karnataka 560001"
  },
  {
    icon: Mail,
    title: "Email support",
    body: "hello@coursestack.app"
  },
  {
    icon: PhoneCall,
    title: "Call us",
    body: "+91 98765 43210"
  },
  {
    icon: Clock3,
    title: "Support hours",
    body: "Mon to Sat, 10:00 AM to 7:00 PM"
  }
];

const trustNotes = [
  "Fast response for access and payment issues",
  "Course purchase support from a real team",
  "Secure learner data and verified communication"
];

export default function ContactPage() {
  const toast = useToast();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");

  function sendMessage(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const mailto = new URL("mailto:hello@coursestack.app");
    mailto.searchParams.set("subject", subject || "CourseStack enquiry");
    mailto.searchParams.set(
      "body",
      `Name: ${name}\nEmail: ${email}\n\nMessage:\n${message}`
    );

    window.location.href = mailto.toString();
    toast.success("Your mail draft is ready", "Message prepared");

    setName("");
    setEmail("");
    setSubject("");
    setMessage("");
  }

  return (
    <main className="shell">
      <Nav />

      <section className="contact-hero reveal">
        <div className="contact-copy">
          <span className="eyebrow">
            <MessageSquareText size={16} />
            Contact us
          </span>
          <h1>Talk to the CourseStack team</h1>
          <p>
            Reach out for course access support, purchase questions, partnership enquiries, or help
            choosing the right learning path.
          </p>
          <div className="contact-trust">
            {trustNotes.map((note) => (
              <span className="contact-trust-pill" key={note}>
                <ShieldCheck size={14} />
                {note}
              </span>
            ))}
          </div>
        </div>

        <div className="contact-hero-art">
          <div className="contact-orbit orbit-a" />
          <div className="contact-orbit orbit-b" />
          <div className="contact-hero-card card-one">
            <Building2 size={20} />
            <strong>Support first</strong>
            <span>Fast help for learners and buyers</span>
          </div>
          <div className="contact-hero-card card-two">
            <Mail size={20} />
            <strong>Direct communication</strong>
            <span>Use the form or email us directly</span>
          </div>
          <div className="contact-hero-card card-three">
            <PhoneCall size={20} />
            <strong>Human response</strong>
            <span>No confusing handoff, just clear help</span>
          </div>
        </div>
      </section>

      <section className="contact-grid">
        <div className="contact-info">
          <div className="contact-info-grid">
            {contactCards.map((item) => (
              <article className="contact-info-card reveal" key={item.title}>
                <span className="contact-info-icon">
                  <item.icon size={18} />
                </span>
                <strong>{item.title}</strong>
                <p>{item.body}</p>
              </article>
            ))}
          </div>

          <div className="contact-note reveal">
            <strong>Need quick help with a purchased course?</strong>
            <p>
              Include your account email and course name in the message so we can help you faster.
            </p>
            <Link className="button secondary" href="/my-courses">
              Open My Courses
              <ArrowRight size={16} />
            </Link>
          </div>
        </div>

        <form className="contact-form reveal" onSubmit={sendMessage}>
          <div className="contact-form-head">
            <span className="eyebrow">
              <Send size={16} />
              Send message
            </span>
            <h2>Write to us</h2>
            <p>Share your question and we'll help you from the right support channel.</p>
          </div>

          <div className="contact-form-grid">
            <div className="field">
              <label htmlFor="contact-name">Full name</label>
              <div className="input-icon">
                <MessageSquareText size={18} />
                <input
                  id="contact-name"
                  onChange={(event) => setName(event.target.value)}
                  placeholder="Your full name"
                  required
                  value={name}
                />
              </div>
            </div>

            <div className="field">
              <label htmlFor="contact-email">Email</label>
              <div className="input-icon">
                <Mail size={18} />
                <input
                  id="contact-email"
                  onChange={(event) => setEmail(event.target.value)}
                  placeholder="you@example.com"
                  required
                  type="email"
                  value={email}
                />
              </div>
            </div>
          </div>

          <div className="field">
            <label htmlFor="contact-subject">Subject</label>
            <div className="input-icon">
              <Building2 size={18} />
              <input
                id="contact-subject"
                onChange={(event) => setSubject(event.target.value)}
                placeholder="Course access, payment help, partnership..."
                required
                value={subject}
              />
            </div>
          </div>

          <div className="field">
            <label htmlFor="contact-message">Message</label>
            <textarea
              className="contact-textarea"
              id="contact-message"
              onChange={(event) => setMessage(event.target.value)}
              placeholder="Tell us how we can help..."
              required
              rows={7}
              value={message}
            />
          </div>

          <button className="button contact-submit" type="submit">
            <Send size={18} />
            Send Message
          </button>
        </form>
      </section>

      <Footer />
    </main>
  );
}
