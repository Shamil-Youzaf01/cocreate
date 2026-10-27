"use client";
import {
  PageSkeleton as SharedPageSkeleton,
  InlineSpinner,
} from "@/components/loading-state";
import useUnsavedChanges from "@/hooks/use-unsaved-changes";

import { useState, useRef } from "react";

import { Link2, Video, MapPin, Save, UserRound } from "lucide-react";

import toast from "react-hot-toast";

import useAuthStore from "@/store/authStore";

import { updateProfile } from "@/services/auth.service";

export default function CreatorProfilePage() {
  const user = useAuthStore((state) => state.user);

  if (!user)
    return <SharedPageSkeleton label="Loading profile…" variant="form" />;
  return <CreatorProfileForm key={user.id || user._id} user={user} />;
}

function CreatorProfileForm({ user }) {
  const saveLock = useRef(false);

  const setUser = useAuthStore((state) => state.setUser);

  const [form, setForm] = useState({
    name: user?.name || "",
    bio: user?.bio || "",
    location: user?.location || "",
    instagramUrl: user?.instagramUrl || "",
    youtubeUrl: user?.youtubeUrl || "",
    categories: user?.categories || [],
  });

  const [categoryInput, setCategoryInput] = useState("");

  const [isSaving, setIsSaving] = useState(false);

  useUnsavedChanges(
    Boolean(categoryInput) ||
      JSON.stringify(form) !==
        JSON.stringify({
          name: user?.name || "",
          bio: user?.bio || "",
          location: user?.location || "",
          instagramUrl: user?.instagramUrl || "",
          youtubeUrl: user?.youtubeUrl || "",
          categories: user?.categories || [],
        }),
  );

  if (!user)
    return <SharedPageSkeleton label="Loading profile…" variant="form" />;

  const updateField = (field, value) => {
    setForm((current) => ({
      ...current,
      [field]: value,
    }));
  };

  const addCategory = () => {
    const value = categoryInput.trim();

    if (!value) return;
    if (value.length > 50) {
      toast.error("Each category must be 50 characters or fewer.");
      return;
    }

    if (form.categories.includes(value)) {
      setCategoryInput("");
      return;
    }

    if (form.categories.length >= 8) {
      toast.error("Maximum 8 categories allowed.");
      return;
    }

    setForm((current) => ({
      ...current,
      categories: [...current.categories, value],
    }));

    setCategoryInput("");
  };

  const removeCategory = (category) => {
    setForm((current) => ({
      ...current,
      categories: current.categories.filter((item) => item !== category),
    }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (saveLock.current) return;

    try {
      saveLock.current = true;
      setIsSaving(true);

      const response = await updateProfile(form);

      const updatedUser = response.data?.user;

      if (updatedUser) {
        setUser(updatedUser);
        setForm({
          name: updatedUser.name || "",
          bio: updatedUser.bio || "",
          location: updatedUser.location || "",
          instagramUrl: updatedUser.instagramUrl || "",
          youtubeUrl: updatedUser.youtubeUrl || "",
          categories: updatedUser.categories || [],
        });
      } else {
        throw new Error("Profile response missing user");
      }

      toast.success("Profile updated successfully.");
    } catch (error) {
      toast.error(error.response?.data?.message || "Unable to update profile.");
    } finally {
      saveLock.current = false;
      setIsSaving(false);
    }
  };

  return (
    <div className="mx-auto max-w-4xl px-2 py-6 lg:px-6">
      <div className="mb-6">
        <h1 className="text-[30px] font-semibold tracking-tight text-text-primary">
          Creator Profile
        </h1>

        <p className="mt-1 text-sm text-text-tertiary">
          Manage your creator profile information.
        </p>
      </div>

      <form
        onSubmit={handleSubmit}
        className="rounded-2xl border border-card-border bg-card-background"
        aria-busy={isSaving}
      >
        {/* Header */}
        <div className="flex items-center gap-4 border-b border-card-border p-6">
          <div className="flex size-16 shrink-0 items-center justify-center rounded-full bg-brand-50 text-lg font-semibold text-brand-500">
            {getInitials(user.name)}
          </div>

          <div>
            <p className="font-semibold text-text-primary">{user.name}</p>

            <p className="mt-1 text-sm text-text-tertiary">{user.email}</p>
          </div>
        </div>

        {/* Form */}
        <fieldset
          disabled={isSaving}
          className="grid min-w-0 gap-5 p-6 md:grid-cols-2 disabled:opacity-60"
        >
          <Field label="Display name" icon={UserRound}>
            <input
              value={form.name}
              required
              minLength={2}
              onChange={(event) => updateField("name", event.target.value)}
              className={inputClass}
              maxLength={50}
            />
          </Field>

          <Field label="Location" icon={MapPin}>
            <input
              value={form.location}
              onChange={(event) => updateField("location", event.target.value)}
              placeholder="Kerala, India"
              className={inputClass}
              maxLength={100}
            />
          </Field>

          <div className="md:col-span-2">
            <Field label="Bio">
              <textarea
                rows={4}
                value={form.bio}
                onChange={(event) => updateField("bio", event.target.value)}
                placeholder="Tell brands a little about yourself..."
                className={`${inputClass} h-auto resize-none py-3`}
                maxLength={300}
              />
            </Field>

            <p className="mt-1 text-right text-xs text-text-tertiary">
              {form.bio.length}
              /300
            </p>
          </div>

          <Field label="Instagram" icon={Link2}>
            <input
              type="url"
              value={form.instagramUrl}
              onChange={(event) =>
                updateField("instagramUrl", event.target.value)
              }
              placeholder="https://instagram.com/username"
              className={inputClass}
            />
          </Field>

          <Field label="YouTube" icon={Video}>
            <input
              type="url"
              value={form.youtubeUrl}
              onChange={(event) =>
                updateField("youtubeUrl", event.target.value)
              }
              placeholder="https://youtube.com/@channel"
              className={inputClass}
            />
          </Field>

          <div className="md:col-span-2">
            <label
              htmlFor="profile-category"
              className="text-sm font-medium text-text-primary"
            >
              Categories
            </label>

            <div className="mt-2 flex gap-2">
              <input
                id="profile-category"
                maxLength={50}
                value={categoryInput}
                onChange={(event) => setCategoryInput(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === "Enter") {
                    event.preventDefault();
                    addCategory();
                  }
                }}
                placeholder="Fashion, Tech, Lifestyle..."
                className={`${inputClass} flex-1`}
              />

              <button
                type="button"
                onClick={addCategory}
                className="rounded-xl border border-card-border px-4 text-sm font-medium text-text-primary hover:bg-background-gray-primary"
              >
                Add
              </button>
            </div>

            {form.categories.length > 0 && (
              <div className="mt-3 flex flex-wrap gap-2">
                {form.categories.map((category) => (
                  <button
                    key={category}
                    type="button"
                    onClick={() => removeCategory(category)}
                    className="rounded-full bg-background-gray-primary px-3 py-1.5 text-xs font-medium text-text-secondary hover:text-red-500"
                  >
                    {category} ×
                  </button>
                ))}
              </div>
            )}
          </div>
        </fieldset>

        {/* Footer */}
        <div className="flex justify-end border-t border-card-border p-5">
          <button
            type="submit"
            disabled={isSaving}
            className="inline-flex items-center gap-2 rounded-xl bg-brand-500 px-5 py-2.5 text-sm font-medium text-white hover:bg-brand-600 disabled:opacity-50"
            aria-busy={isSaving}
          >
            {isSaving ? <InlineSpinner /> : <Save size={16} />}

            {isSaving ? "Saving..." : "Save changes"}
          </button>
        </div>
      </form>
    </div>
  );
}

function Field({ label, icon: Icon, children }) {
  return (
    <label className="block">
      <span className="mb-2 flex items-center gap-2 text-sm font-medium text-text-primary">
        {Icon && <Icon size={15} className="text-text-tertiary" />}

        {label}
      </span>

      {children}
    </label>
  );
}

const inputClass =
  "h-11 w-full rounded-xl border border-card-border bg-transparent px-3 text-sm text-text-primary outline-none transition placeholder:text-text-tertiary focus:border-brand-500";

function getInitials(name = "") {
  if (!name) return "U";

  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part.charAt(0).toUpperCase())
    .join("");
}
