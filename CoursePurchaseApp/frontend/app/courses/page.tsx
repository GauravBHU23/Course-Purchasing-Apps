"use client";

import { useEffect, useState } from "react";
import { BookOpenCheck, Flame, Search } from "lucide-react";

import { CourseCard } from "@/components/CourseCard";
import { Nav } from "@/components/Nav";
import { useToast } from "@/components/ToastProvider";
import { api, Course } from "@/lib/api";

export default function CoursesPage() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [error, setError] = useState("");
  const toast = useToast();

  useEffect(() => {
    api
      .courses()
      .then(setCourses)
      .catch((err) => {
        const message = err instanceof Error ? err.message : "Could not load courses";
        setError(message);
        toast.error(message);
      });
  }, [toast]);

  return (
    <main className="shell">
      <Nav />
      <section className="page-head">
        <div>
          <span className="eyebrow">
            <Flame size={16} />
            Live catalog
          </span>
          <h1>Courses</h1>
          <p>Pick a practical path, purchase securely, and keep your learning library in one place.</p>
        </div>
        <div className="head-panel">
          <BookOpenCheck size={22} />
          <strong>{courses.length || "..."}</strong>
          <span>ready-to-buy courses</span>
        </div>
      </section>
      {error ? <p className="error">{error}</p> : null}
      {!error && courses.length === 0 ? (
        <section className="grid">
          {[0, 1, 2].map((item) => (
            <article className="card skeleton" key={item}>
              <div className="skeleton-media" />
              <div className="card-body">
                <span />
                <h3 />
                <p />
                <button className="button" disabled type="button">
                  <Search size={18} />
                  Loading
                </button>
              </div>
            </article>
          ))}
        </section>
      ) : null}
      <section className="grid">
        {courses.map((course, index) => (
          <CourseCard course={course} index={index} key={course.id} />
        ))}
      </section>
    </main>
  );
}
