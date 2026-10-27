"use client";
import {
  PageSkeleton as SharedPageSkeleton,
  InlineSpinner,
} from "@/components/loading-state";
import useUnsavedChanges from "@/hooks/use-unsaved-changes";

import { useRef, useState } from "react";

import { Building2, Globe2, Link2, MapPin, Save } from "lucide-react";

import toast from "react-hot-toast";

import useAuthStore from "@/store/authStore";

import { updateProfile } from "@/services/auth.service";

export default function BrandProfilePage() {
  const user = useAuthStore((state) => state.user);

  if (!user)
    return <SharedPageSkeleton label="Loading profile…" variant="form" />;
  return <BrandProfileForm key={user.id || user._id} user={user} />;
}

function BrandProfileForm({ user }) {
  const saveLock = useRef(false);

  const setUser = useAuthStore((state) => state.setUser);

  const [form, setForm] = useState({
    name: user?.name || "",
    bio: user?.bio || "",
    location: user?.location || "",
    instagramUrl: user?.instagramUrl || "",
    industry: user?.industry || "",
    website: user?.website || "",
  });

  const [isSaving, setIsSaving] = useState(false);

  useUnsavedChanges(
    JSON.stringify(form) !==
      JSON.stringify({
        name: user?.name || "",
        bio: user?.bio || "",
        location: user?.location || "",
        instagramUrl: user?.instagramUrl || "",
        industry: user?.industry || "",
        website: user?.website || "",
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
          industry: updatedUser.industry || "",
          website: updatedUser.website || "",
        });
      } else {
        throw new Error("Profile response missing user");
      }

      toast.success("Brand profile updated successfully.");
    } catch (error) {
      toast.error(
        error.response?.data?.message || "Unable to update brand profile.",
      );
    } finally {
      saveLock.current = false;
      setIsSaving(false);
    }
  };

  return (
    <div className="mx-auto max-w-4xl px-2 py-6 lg:px-6">
      <div className="mb-6">
        <h1 className="text-[30px] font-semibold tracking-tight text-text-primary">
          Brand Profile
        </h1>

        <p className="mt-1 text-sm text-text-tertiary">
          Manage your company information.
        </p>
      </div>

      <form
        onSubmit={handleSubmit}
        className="rounded-2xl border border-card-border bg-card-background"
        aria-busy={isSaving}
      >
        {/* Header */}
        <div className="flex items-center gap-4 border-b border-card-border p-6">
          <div className="flex size-16 shrink-0 items-center justify-center rounded-full bg-brand-50 text-brand-500">
            <Building2 size={26} />
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
          <Field label="Brand name" icon={Building2}>
            <input
              value={form.name}
              required
              minLength={2}
              onChange={(event) => updateField("name", event.target.value)}
              className={inputClass}
              maxLength={50}
            />
          </Field>

          <Field label="Industry" icon={Building2}>
            <input
              value={form.industry}
              onChange={(event) => updateField("industry", event.target.value)}
              placeholder="Fashion, Tech, Beauty..."
              className={inputClass}
              maxLength={100}
            />
          </Field>

          <Field label="Location" icon={MapPin}>
            <input
              value={form.location}
              onChange={(event) => updateField("location", event.target.value)}
              placeholder="Dubai, UAE"
              className={inputClass}
              maxLength={100}
            />
          </Field>

          <Field label="Website" icon={Globe2}>
            <input
              type="url"
              value={form.website}
              onChange={(event) => updateField("website", event.target.value)}
              placeholder="https://yourbrand.com"
              className={inputClass}
            />
          </Field>

          <Field label="Instagram" icon={Link2}>
            <input
              type="url"
              value={form.instagramUrl}
              onChange={(event) =>
                updateField("instagramUrl", event.target.value)
              }
              placeholder="https://instagram.com/yourbrand"
              className={inputClass}
            />
          </Field>

          <div className="md:col-span-2">
            <Field label="About the brand">
              <textarea
                rows={4}
                value={form.bio}
                onChange={(event) => updateField("bio", event.target.value)}
                placeholder="Tell creators about your brand..."
                className={`${inputClass} h-auto resize-none py-3`}
                maxLength={300}
              />
            </Field>

            <p className="mt-1 text-right text-xs text-text-tertiary">
              {form.bio.length}
              /300
            </p>
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
