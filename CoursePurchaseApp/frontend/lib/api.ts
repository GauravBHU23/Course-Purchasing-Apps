export type User = {
  id: string;
  email: string;
  full_name: string;
  role: string;
};

export type Course = {
  id: string;
  title: string;
  slug: string;
  description: string;
  price_cents: number;
  level: string;
  duration_hours: number;
  thumbnail_url: string;
};

export type Purchase = {
  id: string;
  status: string;
  course: Course;
};

export type CoursePayload = {
  title: string;
  slug: string;
  description: string;
  price_cents: number;
  level: string;
  duration_hours: number;
  thumbnail_url: string;
};

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
  const response = await fetch(`${API_URL}${path}`, {
    ...init,
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      ...init.headers
    }
  });

  if (response.status === 401 && path !== "/api/v1/auth/refresh") {
    const refreshed = await fetch(`${API_URL}/api/v1/auth/refresh`, {
      method: "POST",
      credentials: "include"
    });
    if (refreshed.ok) {
      return request<T>(path, init);
    }
  }

  if (!response.ok) {
    const body = await response.json().catch(() => ({ detail: "Request failed" }));
    throw new Error(body.detail ?? "Request failed");
  }

  if (response.status === 204) {
    return undefined as T;
  }
  return response.json() as Promise<T>;
}

export const api = {
  register: (payload: { email: string; full_name: string; password: string }) =>
    request<User>("/api/v1/auth/register", { method: "POST", body: JSON.stringify(payload) }),
  login: (payload: { email: string; password: string }) =>
    request<{ access_token: string }>("/api/v1/auth/login", { method: "POST", body: JSON.stringify(payload) }),
  logout: () => request<void>("/api/v1/auth/logout", { method: "POST" }),
  me: () => request<User>("/api/v1/auth/me"),
  courses: () => request<Course[]>("/api/v1/courses"),
  createCourse: (payload: CoursePayload) =>
    request<Course>("/api/v1/courses", { method: "POST", body: JSON.stringify(payload) }),
  updateCourse: (courseId: string, payload: Partial<CoursePayload>) =>
    request<Course>(`/api/v1/courses/${courseId}`, { method: "PATCH", body: JSON.stringify(payload) }),
  deleteCourse: (courseId: string) => request<void>(`/api/v1/courses/${courseId}`, { method: "DELETE" }),
  purchase: (courseId: string) =>
    request<Purchase>(`/api/v1/courses/${courseId}/purchase`, { method: "POST" }),
  myCourses: () => request<Purchase[]>("/api/v1/courses/my")
};

export function formatPrice(cents: number): string {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0
  }).format(cents / 100);
}
