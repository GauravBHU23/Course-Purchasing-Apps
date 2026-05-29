"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { Edit3, Plus, Save, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";

import { useAuth } from "@/components/AuthProvider";
import { Footer } from "@/components/Footer";
import { Loader } from "@/components/Loader";
import { Modal } from "@/components/Modal";
import { Nav } from "@/components/Nav";
import { useToast } from "@/components/ToastProvider";
import { api, Course, CoursePayload, formatPrice } from "@/lib/api";

const emptyForm: CoursePayload = {
  title: "",
  slug: "",
  description: "",
  price_cents: 0,
  level: "Beginner",
  duration_hours: 1,
  thumbnail_url: ""
};

export default function AdminPage() {
  const router = useRouter();
  const toast = useToast();
  const { error, loading: authLoading, user } = useAuth();
  const [courses, setCourses] = useState<Course[]>([]);
  const [form, setForm] = useState<CoursePayload>(emptyForm);
  const [selectedCourseId, setSelectedCourseId] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [authState, setAuthState] = useState<"checking" | "ok" | "guest" | "unverified" | "forbidden">("checking");
  const selectedCourse = useMemo(
    () => courses.find((course) => course.id === selectedCourseId),
    [courses, selectedCourseId]
  );

  useEffect(() => {
    if (authLoading) {
      setAuthState("checking");
      return;
    }

    if (!user) {
      const message = error ?? "Could not verify admin access";
      if (message.toLowerCase().includes("verify your email")) {
        setAuthState("unverified");
      } else {
        setAuthState("guest");
      }
      return;
    }

    if (user.role !== "admin") {
      setAuthState("forbidden");
      return;
    }

    setAuthState("ok");
    loadCourses();
  }, [authLoading, error, user]);

  function loadCourses() {
    setLoading(true);
    api
      .courses()
      .then(setCourses)
      .catch((err) => toast.error(err instanceof Error ? err.message : "Could not load courses"))
      .finally(() => setLoading(false));
  }

  function editCourse(course: Course) {
    setSelectedCourseId(course.id);
    setForm({
      title: course.title,
      slug: course.slug,
      description: course.description,
      price_cents: course.price_cents,
      level: course.level,
      duration_hours: course.duration_hours,
      thumbnail_url: course.thumbnail_url
    });
  }

  function newCourse() {
    setSelectedCourseId("");
    setForm(emptyForm);
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    try {
      if (selectedCourseId) {
        const updated = await api.updateCourse(selectedCourseId, form);
        setCourses((current) => current.map((course) => (course.id === updated.id ? updated : course)));
        toast.success("Course updated successfully");
      } else {
        const created = await api.createCourse(form);
        setCourses((current) => [created, ...current]);
        setSelectedCourseId(created.id);
        toast.success("Course created successfully");
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not save course");
    } finally {
      setSaving(false);
    }
  }

  async function deleteCourse(courseId: string) {
    setSaving(true);
    try {
      await api.deleteCourse(courseId);
      setCourses((current) => current.filter((course) => course.id !== courseId));
      if (selectedCourseId === courseId) {
        newCourse();
      }
      toast.success("Course deleted successfully");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not delete course");
    } finally {
      setSaving(false);
    }
  }

  if (authState !== "ok") {
    return (
      <main className="shell">
        <Nav />
        <div className="page-loader">
          <Loader label="Checking admin access..." />
        </div>
        <Modal
          open={authState === "guest"}
          tone="info"
          dismissable={false}
          title="Admin login required"
          message="You need to sign in with an admin account to manage courses."
          actions={[
            { label: "Go to Login", onClick: () => router.push("/login") },
            { label: "Browse Courses", variant: "secondary", onClick: () => router.push("/courses") }
          ]}
        />
        <Modal
          open={authState === "unverified"}
          tone="info"
          dismissable={false}
          title="Email verification required"
          message="Please verify your email before accessing the admin area."
          actions={[
            { label: "Go to Login", onClick: () => router.push("/login") },
            { label: "Browse Courses", variant: "secondary", onClick: () => router.push("/courses") }
          ]}
        />
        <Modal
          open={authState === "forbidden"}
          tone="error"
          dismissable={false}
          title="Access denied"
          message="This area is for admins only. Your account does not have admin permissions."
          actions={[{ label: "Browse Courses", onClick: () => router.push("/courses") }]}
        />
      </main>
    );
  }

  return (
    <main className="shell">
      <Nav />
      <section className="page-head">
        <div>
          <span className="eyebrow">
            <Edit3 size={16} />
            Admin workspace
          </span>
          <h1>Course Manager</h1>
          <p>Create, update, and remove courses. Students see this catalog immediately.</p>
        </div>
        <button className="button secondary" onClick={newCourse} type="button">
          <Plus size={18} />
          New Course
        </button>
      </section>

      <section className="admin-layout">
        <form className="form admin-form" onSubmit={submit}>
          <h2>{selectedCourse ? "Update Course" : "Create Course"}</h2>
          <div className="admin-fields">
            <label className="field">
              <span>Title</span>
              <input
                onChange={(event) => setForm((current) => ({ ...current, title: event.target.value }))}
                required
                value={form.title}
              />
            </label>
            <label className="field">
              <span>Slug</span>
              <input
                onChange={(event) => setForm((current) => ({ ...current, slug: event.target.value }))}
                pattern="[a-z0-9]+(-[a-z0-9]+)*"
                required
                value={form.slug}
              />
            </label>
            <label className="field">
              <span>Level</span>
              <input
                onChange={(event) => setForm((current) => ({ ...current, level: event.target.value }))}
                required
                value={form.level}
              />
            </label>
            <label className="field">
              <span>Duration hours</span>
              <input
                min={1}
                onChange={(event) =>
                  setForm((current) => ({ ...current, duration_hours: Number(event.target.value) }))
                }
                required
                type="number"
                value={form.duration_hours}
              />
            </label>
            <label className="field">
              <span>Price cents</span>
              <input
                min={0}
                onChange={(event) => setForm((current) => ({ ...current, price_cents: Number(event.target.value) }))}
                required
                type="number"
                value={form.price_cents}
              />
            </label>
            <label className="field">
              <span>Thumbnail URL</span>
              <input
                onChange={(event) => setForm((current) => ({ ...current, thumbnail_url: event.target.value }))}
                required
                value={form.thumbnail_url}
              />
            </label>
          </div>
          <label className="field">
            <span>Description</span>
            <textarea
              onChange={(event) => setForm((current) => ({ ...current, description: event.target.value }))}
              required
              value={form.description}
            />
          </label>
          <button className="button" disabled={saving} type="submit">
            <Save size={18} />
            {saving ? "Saving" : selectedCourse ? "Update Course" : "Create Course"}
          </button>
        </form>

        <div className="admin-list">
          {loading ? <div className="empty">Loading courses...</div> : null}
          {courses.map((course) => (
            <article className="admin-row" key={course.id}>
              <img alt={course.title} src={`${course.thumbnail_url}?auto=format&fit=crop&w=320&q=70`} />
              <div>
                <h3>{course.title}</h3>
                <p>
                  {course.level} · {course.duration_hours}h · {formatPrice(course.price_cents)}
                </p>
              </div>
              <button className="icon-button secondary" onClick={() => editCourse(course)} title="Edit" type="button">
                <Edit3 size={17} />
              </button>
              <button
                className="icon-button danger"
                disabled={saving}
                onClick={() => deleteCourse(course.id)}
                title="Delete"
                type="button"
              >
                <Trash2 size={17} />
              </button>
            </article>
          ))}
        </div>
      </section>
      <Footer />
    </main>
  );
}
