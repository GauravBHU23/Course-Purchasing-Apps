"use client";

import { useRouter } from "next/navigation";
import { FormEvent, useEffect, useRef, useState } from "react";
import {
  Eye,
  EyeOff,
  KeyRound,
  Lock,
  Mail,
  Save,
  Trash2,
  Upload,
  UserRound
} from "lucide-react";

import { Avatar } from "@/components/Avatar";
import { useAuth } from "@/components/AuthProvider";
import { Footer } from "@/components/Footer";
import { Loader } from "@/components/Loader";
import { Modal } from "@/components/Modal";
import { Nav } from "@/components/Nav";
import { useToast } from "@/components/ToastProvider";
import { api } from "@/lib/api";

export default function ProfilePage() {
  const router = useRouter();
  const toast = useToast();
  const { error, loading, setUser: setAuthUser, user } = useAuth();
  const [authError, setAuthError] = useState(false);
  const [authMessage, setAuthMessage] = useState("Please sign in to view and edit your profile.");
  const [authTitle, setAuthTitle] = useState("Login required");

  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [savingProfile, setSavingProfile] = useState(false);

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [changingPassword, setChangingPassword] = useState(false);

  useEffect(() => {
    if (loading) {
      return;
    }

    if (!user) {
      const message = error ?? "Please sign in to view and edit your profile.";
      if (message.toLowerCase().includes("verify your email")) {
        setAuthTitle("Email verification required");
        setAuthMessage("Please verify your email before opening your profile.");
      } else {
        setAuthTitle("Login required");
        setAuthMessage("Please sign in to view and edit your profile.");
      }
      setAuthError(true);
      return;
    }

    setAuthError(false);
    setFullName(user.full_name);
    setEmail(user.email);
    setAvatarUrl(user.avatar_url);
  }, [error, loading, user]);

  async function onPickFile(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;
    if (file.size > 3 * 1024 * 1024) {
      toast.error("Image must be smaller than 3 MB");
      return;
    }
    setUploading(true);
    try {
      const updated = await api.uploadAvatar(file);
      setAuthUser(updated);
      setAvatarUrl(updated.avatar_url);
      toast.success("Profile photo updated");
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not upload photo");
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  }

  async function removePhoto() {
    setUploading(true);
    try {
      const updated = await api.removeAvatar();
      setAuthUser(updated);
      setAvatarUrl(updated.avatar_url);
      toast.success("Profile photo removed");
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not remove photo");
    } finally {
      setUploading(false);
    }
  }

  async function saveProfile(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSavingProfile(true);
    try {
      const updated = await api.updateProfile({ full_name: fullName, email });
      setAuthUser(updated);
      toast.success("Profile updated successfully");
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not update profile");
    } finally {
      setSavingProfile(false);
    }
  }

  async function changePassword(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setChangingPassword(true);
    try {
      await api.changePassword({ current_password: currentPassword, new_password: newPassword });
      toast.success("Password changed. Please sign in again.");
      router.push("/login");
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not change password");
    } finally {
      setChangingPassword(false);
    }
  }

  if (loading) {
    return (
      <main className="shell">
        <Nav />
        <div className="page-loader">
          <Loader label="Loading your profile..." />
        </div>
      </main>
    );
  }

  return (
    <main className="shell">
      <Nav />
      <section className="page-head">
        <div>
          <span className="eyebrow">
            <UserRound size={16} />
            Account settings
          </span>
          <h1>My Profile</h1>
          <p>Update your details, choose an avatar color, and manage your password.</p>
        </div>
      </section>

      <section className="profile-layout">
        <div className="profile-card profile-preview">
          <div className="avatar-upload">
            <Avatar color={user?.avatar_color} name={fullName} size={104} url={avatarUrl} />
            <button
              aria-label="Change photo"
              className="avatar-edit-btn"
              disabled={uploading}
              onClick={() => fileInputRef.current?.click()}
              type="button"
            >
              <Upload size={16} />
            </button>
          </div>
          <input
            accept="image/png,image/jpeg,image/webp,image/gif"
            hidden
            onChange={onPickFile}
            ref={fileInputRef}
            type="file"
          />
          <h3>{fullName || "Your name"}</h3>
          <p>{email}</p>
          {user?.role === "admin" ? <span className="profile-role">Admin</span> : null}

          <div className="avatar-actions">
            <button
              className="button secondary"
              disabled={uploading}
              onClick={() => fileInputRef.current?.click()}
              type="button"
            >
              <Upload size={16} />
              {uploading ? "Uploading..." : "Upload photo"}
            </button>
            {avatarUrl ? (
              <button
                className="icon-button danger"
                disabled={uploading}
                onClick={removePhoto}
                title="Remove photo"
                type="button"
              >
                <Trash2 size={16} />
              </button>
            ) : null}
          </div>
          <span className="avatar-hint">JPG, PNG, WEBP or GIF · max 3 MB</span>
        </div>

        <div className="profile-stack">
          <form className="profile-card" onSubmit={saveProfile}>
            <h2>Profile details</h2>

            <div className="field">
              <label htmlFor="fullName">Full name</label>
              <div className="input-icon">
                <UserRound size={18} />
                <input
                  autoComplete="off"
                  id="fullName"
                  onChange={(e) => setFullName(e.target.value)}
                  required
                  value={fullName}
                />
              </div>
            </div>

            <div className="field">
              <label htmlFor="email">Email</label>
              <div className="input-icon">
                <Mail size={18} />
                <input
                  autoComplete="off"
                  id="email"
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  type="email"
                  value={email}
                />
              </div>
            </div>

            <button className="button" disabled={savingProfile} type="submit">
              <Save size={18} />
              {savingProfile ? "Saving..." : "Save changes"}
            </button>
          </form>

          <form className="profile-card" onSubmit={changePassword}>
            <h2>
              <KeyRound size={20} style={{ verticalAlign: "-3px", marginRight: 8 }} />
              Change password
            </h2>
            <p className="form-sub">For security, you'll be signed out after changing your password.</p>

            <div className="field">
              <label htmlFor="currentPassword">Current password</label>
              <div className="input-icon">
                <Lock size={18} />
                <input
                  autoComplete="off"
                  id="currentPassword"
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  required
                  type={showCurrent ? "text" : "password"}
                  value={currentPassword}
                />
                <button className="input-toggle" onClick={() => setShowCurrent((v) => !v)} type="button">
                  {showCurrent ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            <div className="field">
              <label htmlFor="newPassword">New password</label>
              <div className="input-icon">
                <Lock size={18} />
                <input
                  autoComplete="new-password"
                  id="newPassword"
                  minLength={10}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="At least 10 characters"
                  required
                  type={showNew ? "text" : "password"}
                  value={newPassword}
                />
                <button className="input-toggle" onClick={() => setShowNew((v) => !v)} type="button">
                  {showNew ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            <button className="button" disabled={changingPassword} type="submit">
              <KeyRound size={18} />
              {changingPassword ? "Updating..." : "Update password"}
            </button>
          </form>
        </div>
      </section>

      <Footer />

      <Modal
        open={authError}
        tone="info"
        dismissable={false}
        title={authTitle}
        message={authMessage}
        actions={[{ label: "Go to Login", onClick: () => router.push("/login") }]}
      />
    </main>
  );
}
