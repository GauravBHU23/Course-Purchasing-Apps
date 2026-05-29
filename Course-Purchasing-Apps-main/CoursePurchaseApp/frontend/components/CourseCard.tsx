"use client";

import { CheckCircle2, Clock, GraduationCap, PlayCircle, ShoppingCart, Star } from "lucide-react";
import { useRouter } from "next/navigation";

import { Course, formatPrice } from "@/lib/api";
import { useToast } from "@/components/ToastProvider";

type Props = {
  course: Course;
  index?: number;
  purchased?: boolean;
};

// Deterministic pseudo-values so cards feel real without backend fields.
function derived(course: Course) {
  const seed = course.id.charCodeAt(0) + course.title.length;
  const rating = (4.5 + ((seed % 5) / 10)).toFixed(1);
  const lessons = 18 + (seed % 30);
  const learners = (1 + (seed % 9)) + "." + (seed % 9) + "k";
  return { rating, lessons, learners };
}

export function CourseCard({ course, index = 0, purchased = false }: Props) {
  const router = useRouter();
  const toast = useToast();
  const { rating, lessons, learners } = derived(course);

  function buy() {
    toast.success("Review your order before payment");
    router.push(`/checkout/${course.id}`);
  }

  return (
    <article className="card reveal" style={{ animationDelay: `${Math.min(index * 70, 420)}ms` }}>
      <div className="card-media">
        <img alt={course.title} src={`${course.thumbnail_url}?auto=format&fit=crop&w=900&q=80`} />
        <span className="card-badge">{course.level}</span>
        {purchased ? (
          <span className="card-owned">
            <CheckCircle2 size={14} /> Owned
          </span>
        ) : null}
        <span className="card-play">
          <PlayCircle size={42} />
        </span>
      </div>
      <div className="card-body">
        <div className="meta">
          <span className="meta-pill">
            <GraduationCap size={14} /> {course.level}
          </span>
          <span className="meta-pill">
            <Clock size={14} /> {course.duration_hours}h
          </span>
          <span className="meta-pill">
            <PlayCircle size={14} /> {lessons} lessons
          </span>
        </div>
        <h3>{course.title}</h3>
        <p>{course.description}</p>
        <div className="card-rating">
          <span className="rating-score">
            <Star fill="currentColor" size={14} /> {rating}
          </span>
          <span className="rating-meta">{learners} learners</span>
        </div>
        <div className="card-footer">
          <div className="price">{formatPrice(course.price_cents)}</div>
          {purchased ? (
            <span className="button secondary">
              <CheckCircle2 size={18} /> Purchased
            </span>
          ) : (
            <button className="button" onClick={buy} type="button">
              <ShoppingCart size={18} />
              Buy Course
            </button>
          )}
        </div>
      </div>
    </article>
  );
}
