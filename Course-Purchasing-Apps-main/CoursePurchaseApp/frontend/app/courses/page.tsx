"use client";

import { useEffect, useMemo, useState } from "react";
import { ArrowUpDown, BookOpenCheck, Flame, Search, SlidersHorizontal } from "lucide-react";

import { CourseCard } from "@/components/CourseCard";
import { Footer } from "@/components/Footer";
import { Nav } from "@/components/Nav";
import { useToast } from "@/components/ToastProvider";
import { api, Course } from "@/lib/api";

export default function CoursesPage() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [level, setLevel] = useState("All");
  const [sortBy, setSortBy] = useState("newest");
  const toast = useToast();

  useEffect(() => {
    api
      .courses()
      .then(setCourses)
      .catch((err) => {
        const message = err instanceof Error ? err.message : "Could not load courses";
        setError(message);
        toast.error(message);
      })
      .finally(() => setLoading(false));
  }, [toast]);

  const levels = useMemo(() => {
    const set = new Set(courses.map((course) => course.level));
    return ["All", ...Array.from(set)];
  }, [courses]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    const result = courses.filter((course) => {
      const matchesQuery =
        !q ||
        course.title.toLowerCase().includes(q) ||
        course.description.toLowerCase().includes(q);
      const matchesLevel = level === "All" || course.level === level;
      return matchesQuery && matchesLevel;
    });

    const sorted = [...result];
    if (sortBy === "price-asc") sorted.sort((a, b) => a.price_cents - b.price_cents);
    else if (sortBy === "price-desc") sorted.sort((a, b) => b.price_cents - a.price_cents);
    else if (sortBy === "duration") sorted.sort((a, b) => b.duration_hours - a.duration_hours);
    // "newest" keeps the backend order (created_at desc).
    return sorted;
  }, [courses, query, level, sortBy]);

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
          <strong>{loading ? "..." : courses.length}</strong>
          <span>ready-to-buy courses</span>
        </div>
      </section>

      <section className="toolbar">
        <div className="search-box">
          <Search size={18} />
          <input
            aria-label="Search courses"
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search courses..."
            type="search"
            value={query}
          />
        </div>
        <div className="filter-group" role="group" aria-label="Filter by level">
          <SlidersHorizontal className="filter-icon" size={16} />
          {levels.map((item) => (
            <button
              className={`chip ${level === item ? "active" : ""}`}
              key={item}
              onClick={() => setLevel(item)}
              type="button"
            >
              {item}
            </button>
          ))}
        </div>
        <label className="sort-box">
          <ArrowUpDown size={16} />
          <select aria-label="Sort courses" onChange={(e) => setSortBy(e.target.value)} value={sortBy}>
            <option value="newest">Newest</option>
            <option value="price-asc">Price: Low to High</option>
            <option value="price-desc">Price: High to Low</option>
            <option value="duration">Longest duration</option>
          </select>
        </label>
      </section>

      {error ? <p className="error">{error}</p> : null}

      {loading ? (
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

      {!loading && filtered.length === 0 && !error ? (
        <div className="empty">No courses match your search. Try a different keyword or level.</div>
      ) : null}

      <section className="grid">
        {filtered.map((course, index) => (
          <CourseCard course={course} index={index} key={course.id} />
        ))}
      </section>

      <Footer />
    </main>
  );
}
