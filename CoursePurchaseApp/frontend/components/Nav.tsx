"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { LayoutDashboard, LogOut, ShoppingBag, UserRound } from "lucide-react";
import { useEffect, useState } from "react";

import { api, User } from "@/lib/api";
import { useToast } from "@/components/ToastProvider";

export function Nav() {
  const router = useRouter();
  const toast = useToast();
  const [currentUser, setCurrentUser] = useState<User | null>(null);

  useEffect(() => {
    let active = true;

    api
      .me()
      .then((user) => {
        if (active) {
          setCurrentUser(user);
        }
      })
      .catch(() => {
        if (active) {
          setCurrentUser(null);
        }
      });

    return () => {
      active = false;
    };
  }, []);

  async function logout() {
    await api.logout().catch(() => undefined);
    setCurrentUser(null);
    toast.success("Logged out successfully");
    router.push("/login");
    router.refresh();
  }

  return (
    <nav className="nav">
      <Link className="brand" href="/">
        CourseStack
      </Link>
      <div className="nav-links">
        <Link className="button secondary" href="/courses">
          <ShoppingBag size={18} />
          Courses
        </Link>
        {currentUser ? (
          <>
            {currentUser.role === "admin" ? (
              <Link className="button secondary" href="/admin">
                <LayoutDashboard size={18} />
                Admin
              </Link>
            ) : null}
            <Link className="button secondary" href="/my-courses">
              <UserRound size={18} />
              My Courses
            </Link>
            <button className="icon-button secondary" onClick={logout} title="Logout" type="button">
              <LogOut size={18} />
            </button>
          </>
        ) : (
          <Link className="button" href="/login">
            Login
          </Link>
        )}
      </div>
    </nav>
  );
}
