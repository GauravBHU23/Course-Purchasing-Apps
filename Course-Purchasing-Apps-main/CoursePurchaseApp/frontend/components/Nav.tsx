"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { BookOpen, LayoutDashboard, LogOut, Mail, ShoppingBag, UserRound } from "lucide-react";

import { Avatar } from "@/components/Avatar";
import { useAuth } from "@/components/AuthProvider";
import { useToast } from "@/components/ToastProvider";
import { api } from "@/lib/api";

export function Nav() {
  const router = useRouter();
  const pathname = usePathname();
  const toast = useToast();
  const { clearUser, loading, user: currentUser } = useAuth();

  async function logout() {
    await api.logout().catch(() => undefined);
    clearUser();
    toast.success("Logged out successfully");
    router.push("/login");
    router.refresh();
  }

  const isActive = (href: string) => pathname === href;

  return (
    <nav className="nav">
      <Link className="brand" href="/">
        <span className="brand-mark">
          <BookOpen size={18} />
        </span>
        CourseStack
      </Link>
      <div className="nav-links">
        <Link className={`nav-link ${isActive("/courses") ? "active" : ""}`} href="/courses">
          <ShoppingBag size={18} />
          Courses
        </Link>
        <Link className={`nav-link ${isActive("/contact") ? "active" : ""}`} href="/contact">
          <Mail size={18} />
          Contact
        </Link>
        {!loading && currentUser ? (
          <>
            {currentUser.role === "admin" ? (
              <Link className={`nav-link ${isActive("/admin") ? "active" : ""}`} href="/admin">
                <LayoutDashboard size={18} />
                Admin
              </Link>
            ) : null}
            <Link className={`nav-link ${isActive("/my-courses") ? "active" : ""}`} href="/my-courses">
              <UserRound size={18} />
              My Courses
            </Link>
            <Link className="nav-user" href="/profile" title="View profile">
              <Avatar
                className="nav-avatar"
                color={currentUser.avatar_color}
                name={currentUser.full_name}
                size={34}
                url={currentUser.avatar_url}
              />
              <span className="nav-user-name">{currentUser.full_name.split(" ")[0]}</span>
            </Link>
            <button className="icon-button danger" onClick={logout} title="Logout" type="button">
              <LogOut size={18} />
            </button>
          </>
        ) : (
          <>
            <Link className="button secondary" href="/register">
              Sign Up
            </Link>
            <Link className="button" href="/login">
              Login
            </Link>
          </>
        )}
      </div>
    </nav>
  );
}
