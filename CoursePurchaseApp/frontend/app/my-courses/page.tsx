"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import { CourseCard } from "@/components/CourseCard";
import { Nav } from "@/components/Nav";
import { useToast } from "@/components/ToastProvider";
import { api, Purchase } from "@/lib/api";

export default function MyCoursesPage() {
  const [purchases, setPurchases] = useState<Purchase[]>([]);
  const [error, setError] = useState("");
  const toast = useToast();

  useEffect(() => {
    api
      .myCourses()
      .then(setPurchases)
      .catch((err) => {
        const message = err instanceof Error ? err.message : "Could not load your courses";
        setError(message);
        toast.error(message);
      });
  }, [toast]);

  return (
    <main className="shell">
      <Nav />
      <h1>My Courses</h1>
      {error ? <p className="error">{error}</p> : null}
      {!error && purchases.length === 0 ? (
        <div className="empty">
          No purchased courses yet. <Link href="/courses">Browse courses</Link>
        </div>
      ) : null}
      <section className="grid">
        {purchases.map((purchase, index) => (
          <CourseCard course={purchase.course} index={index} key={purchase.id} purchased />
        ))}
      </section>
    </main>
  );
}
