"use client";

import { Clock, GraduationCap, ShoppingCart } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { api, Course, formatPrice } from "@/lib/api";
import { useToast } from "@/components/ToastProvider";

type Props = {
  course: Course;
  index?: number;
  purchased?: boolean;
};

export function CourseCard({ course, index = 0, purchased = false }: Props) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();
  const toast = useToast();

  async function buy() {
    setError("");
    setLoading(true);
    try {
      await api.purchase(course.id);
      toast.success(`${course.title} purchased successfully`);
      router.push("/my-courses");
      router.refresh();
    } catch (err) {
      const message = err instanceof Error ? err.message : "Purchase failed";
      setError(message);
      toast.error(message);
      if (err instanceof Error && err.message.includes("Not authenticated")) {
        router.push("/login");
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <article className="card reveal" style={{ animationDelay: `${Math.min(index * 70, 420)}ms` }}>
      <div className="card-media">
        <img alt={course.title} src={`${course.thumbnail_url}?auto=format&fit=crop&w=900&q=80`} />
        <span className="card-badge">{course.level}</span>
      </div>
      <div className="card-body">
        <div className="meta">
          <span className="meta-pill">
            <GraduationCap size={14} /> {course.level}
          </span>
          <span className="meta-pill">
            <Clock size={14} /> {course.duration_hours}h
          </span>
        </div>
        <h3>{course.title}</h3>
        <p>{course.description}</p>
        <div className="price">{formatPrice(course.price_cents)}</div>
        {purchased ? (
          <span className="button secondary">Purchased</span>
        ) : (
          <button className="button" disabled={loading} onClick={buy} type="button">
            <ShoppingCart size={18} />
            {loading ? "Processing" : "Buy Course"}
          </button>
        )}
        {error ? <div className="error">{error}</div> : null}
      </div>
    </article>
  );
}
