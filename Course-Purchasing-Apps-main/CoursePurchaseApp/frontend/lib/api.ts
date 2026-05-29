import { logApiEntry } from "@/lib/api-debug";

export type User = {
  id: string;
  email: string;
  full_name: string;
  role: string;
  is_verified: boolean;
  avatar_color: string;
  avatar_url: string | null;
};

export type ProfilePayload = {
  full_name?: string;
  email?: string;
  avatar_color?: string;
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

const API_URL = process.env.NEXT_PUBLIC_BACKEND_URL ?? "http://localhost:8000";

type RequestOptions = {
  skipRefresh?: boolean;
};

class ApiError extends Error {
  status: number;
  body: unknown;

  constructor(message: string, status: number, body: unknown) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.body = body;
  }
}

function withJsonHeaders(init: RequestInit = {}): RequestInit {
  return {
    ...init,
    headers: {
      ...("body" in init && init.body ? { "Content-Type": "application/json" } : {}),
      ...init.headers
    }
  };
}

async function readResponseBody(response: Response): Promise<unknown> {
  if (response.status === 204) {
    return undefined;
  }

  const contentType = response.headers.get("content-type") ?? "";
  if (contentType.includes("application/json")) {
    return response.json().catch(() => ({ detail: "Invalid JSON response" }));
  }

  return response.text().catch(() => "");
}

async function performFetch(path: string, init: RequestInit = {}): Promise<{ response: Response; body: unknown }> {
  const method = init.method ?? "GET";
  const startedAt = Date.now();
  let requestBody: unknown;

  if (typeof init.body === "string") {
    try {
      requestBody = JSON.parse(init.body);
    } catch {
      requestBody = init.body;
    }
  }

  try {
    const response = await fetch(`${API_URL}${path}`, {
      ...init,
      credentials: "include"
    });
    const body = await readResponseBody(response);

    logApiEntry({
      method,
      path,
      status: response.status,
      ok: response.ok,
      durationMs: Date.now() - startedAt,
      requestBody,
      responseBody: body
    });

    return { response, body };
  } catch (error) {
    logApiEntry({
      method,
      path,
      status: "NETWORK_ERROR",
      ok: false,
      durationMs: Date.now() - startedAt,
      requestBody,
      responseBody: error instanceof Error ? error.message : "Network request failed"
    });
    throw error;
  }
}

async function request<T>(path: string, init: RequestInit = {}, options: RequestOptions = {}): Promise<T> {
  const { response, body } = await performFetch(path, withJsonHeaders(init));

  if (!options.skipRefresh && response.status === 401 && path !== "/api/v1/auth/refresh") {
    const refreshed = await performFetch("/api/v1/auth/refresh", { method: "POST" });
    if (refreshed.response.ok) {
      return request<T>(path, init, options);
    }
  }

  if (!response.ok) {
    const detail =
      typeof body === "object" && body && "detail" in body && typeof body.detail === "string"
        ? body.detail
        : "Request failed";
    throw new ApiError(detail, response.status, body);
  }

  return body as T;
}

export const api = {
  register: (payload: { email: string; full_name: string; password: string }) =>
    request<{ message: string }>("/api/v1/auth/register", {
      method: "POST",
      body: JSON.stringify(payload)
    }),
  verifyEmail: (token: string) =>
    request<{ message: string }>("/api/v1/auth/verify-email", {
      method: "POST",
      body: JSON.stringify({ token })
    }),
  resendVerification: (email: string) =>
    request<{ message: string }>("/api/v1/auth/resend-verification", {
      method: "POST",
      body: JSON.stringify({ email })
    }),
  login: (payload: { email: string; password: string }) =>
    request<{ access_token: string }>("/api/v1/auth/login", { method: "POST", body: JSON.stringify(payload) }),
  logout: () => request<void>("/api/v1/auth/logout", { method: "POST" }),
  me: (options?: RequestOptions) => request<User>("/api/v1/auth/me", {}, options),
  updateProfile: (payload: ProfilePayload) =>
    request<User>("/api/v1/auth/me", { method: "PATCH", body: JSON.stringify(payload) }),
  uploadAvatar: async (file: File): Promise<User> => {
    const form = new FormData();
    form.append("file", file);
    const { response, body } = await performFetch("/api/v1/auth/me/avatar", {
      method: "POST",
      body: form
    });
    if (!response.ok) {
      const detail =
        typeof body === "object" && body && "detail" in body && typeof body.detail === "string"
          ? body.detail
          : "Upload failed";
      throw new ApiError(detail, response.status, body);
    }
    return body as User;
  },
  removeAvatar: () => request<User>("/api/v1/auth/me/avatar", { method: "DELETE" }),
  changePassword: (payload: { current_password: string; new_password: string }) =>
    request<{ message: string }>("/api/v1/auth/change-password", {
      method: "POST",
      body: JSON.stringify(payload)
    }),
  forgotPassword: (email: string) =>
    request<{ message: string }>("/api/v1/auth/forgot-password", {
      method: "POST",
      body: JSON.stringify({ email })
    }),
  resetPassword: (payload: { token: string; new_password: string }) =>
    request<{ message: string }>("/api/v1/auth/reset-password", {
      method: "POST",
      body: JSON.stringify(payload)
    }),
  courses: () => request<Course[]>("/api/v1/courses"),
  course: (courseId: string) => request<Course>(`/api/v1/courses/${courseId}`),
  createCourse: (payload: CoursePayload) =>
    request<Course>("/api/v1/courses", { method: "POST", body: JSON.stringify(payload) }),
  updateCourse: (courseId: string, payload: Partial<CoursePayload>) =>
    request<Course>(`/api/v1/courses/${courseId}`, { method: "PATCH", body: JSON.stringify(payload) }),
  deleteCourse: (courseId: string) => request<void>(`/api/v1/courses/${courseId}`, { method: "DELETE" }),
  createPayment: (courseId: string) =>
    request<{ payment_url: string; payment_request_id: string }>(
      `/api/v1/payments/courses/${courseId}/create`,
      { method: "POST" }
    ),
  verifyPayment: (paymentRequestId: string, paymentId?: string) => {
    const qs = new URLSearchParams({ payment_request_id: paymentRequestId });
    if (paymentId) qs.set("payment_id", paymentId);
    return request<{ status: string; course_id: string }>(
      `/api/v1/payments/verify?${qs.toString()}`,
      { method: "POST" }
    );
  },
  myCourses: () => request<Purchase[]>("/api/v1/courses/my")
};

export function formatPrice(cents: number): string {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0
  }).format(cents / 100);
}
