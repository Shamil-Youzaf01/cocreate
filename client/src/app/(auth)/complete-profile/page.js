"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Eye, EyeOff, CheckCircle2 } from "lucide-react";
import AuthShell from "@/components/auth-shell";
import LoadingState, { InlineSpinner } from "@/components/loading-state";
import toast from "react-hot-toast";
import { completeSignup, getSignupProfile } from "@/services/auth.service";

const inputClass =
  "w-full rounded-xl border border-input-border bg-input-background px-4 py-2.5 text-sm text-text-primary outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/15";
export default function CompleteProfilePage() {
  const router = useRouter();
  const lock = useRef(false);
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [role, setRole] = useState("CREATOR");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isRedirecting, setIsRedirecting] = useState(false);
  const [error, setError] = useState("");
  useEffect(() => {
    let active = true;
    getSignupProfile()
      .then((response) => {
        if (active) {
          setEmail(response.data.email);
          if (response.data.role) {
            setRole(response.data.role);
          }
        }
      })
      .catch((error) => {
        if (active)
          setError(
            error.response?.data?.message ||
              "Unable to load your verified email. Please try again.",
          );
      })
      .finally(() => {
        if (active) setIsLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);

  async function handleSubmit(event) {
    event.preventDefault();

    if (lock.current) return;

    setError("");

    if (password !== confirmPassword) {
      const message = "Passwords do not match.";
      setError(message);
      toast.error(message);
      return;
    }

    lock.current = true;
    setIsSaving(true);
    let redirecting = false;

    try {
      await completeSignup({
        name: name.trim(),
        password,
        confirmPassword,
        role,
      });
      setPassword("");
      setConfirmPassword("");
      toast.success("Profile created. You can now sign in.");
      setIsRedirecting(true);
      router.replace("/login?registered=1");
      redirecting = true;
    } catch (error) {
      const message =
        error.response?.data?.message ||
        "Unable to create your profile. Please try again.";

      setError(message);
      toast.error(message);
    } finally {
      if (!redirecting) {
        lock.current = false;
        setIsSaving(false);
        setIsRedirecting(false);
      }
    }
  }
  return (
    <AuthShell>
      <div className="mb-6 text-center">
        <p className="mb-3 text-xs font-semibold uppercase tracking-widest text-brand-500">
          Step 4 of 4
        </p>
        <h1 className="text-3xl font-bold tracking-tight text-text-primary">
          Complete your profile
        </h1>
        <p className="mt-3 text-sm leading-6 text-text-secondary">
          Your email is verified. Tell us your name and set a password.
        </p>
      </div>
      {isLoading ? (
        <LoadingState compact label="Loading your verified email..." />
      ) : email ? (
        <form onSubmit={handleSubmit} aria-busy={isSaving}>
          <fieldset disabled={isSaving} className="space-y-4">
            <div>
              <label
                htmlFor="profile-email"
                className="mb-2 flex items-center gap-2 text-sm font-medium text-input-label-text-color"
              >
                Verified email{" "}
                <CheckCircle2 size={16} className="text-brand-500" />
              </label>
              <input
                id="profile-email"
                type="email"
                value={email}
                readOnly
                autoComplete="email"
                className={`${inputClass} cursor-default opacity-75`}
              />
              <p className="mt-1 text-xs text-text-tertiary">
                This is the email you verified and cannot be changed here.
              </p>
            </div>
            <div>
              <label
                htmlFor="profile-name"
                className="mb-2 block text-sm font-medium text-input-label-text-color"
              >
                Name
              </label>
              <input
                id="profile-name"
                value={name}
                onChange={(event) => setName(event.target.value)}
                required
                minLength={2}
                maxLength={50}
                autoComplete="name"
                placeholder="Your full name"
                className={inputClass}
              />
            </div>
            {[
              {
                id: "profile-password",
                label: "Password",
                value: password,
                setter: setPassword,
              },
              {
                id: "profile-confirm",
                label: "Confirm password",
                value: confirmPassword,
                setter: setConfirmPassword,
              },
            ].map((field) => (
              <div key={field.id}>
                <label
                  htmlFor={field.id}
                  className="mb-2 block text-sm font-medium text-input-label-text-color"
                >
                  {field.label}
                </label>
                <div className="relative">
                  <input
                    id={field.id}
                    type={showPassword ? "text" : "password"}
                    value={field.value}
                    onChange={(event) => field.setter(event.target.value)}
                    required
                    minLength={8}
                    maxLength={72}
                    autoComplete="new-password"
                    className={`${inputClass} pr-12`}
                  />
                  <button
                    type="button"
                    aria-label={
                      showPassword ? "Hide passwords" : "Show passwords"
                    }
                    aria-pressed={showPassword}
                    onClick={() => setShowPassword((value) => !value)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-icon-tertiary"
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>
            ))}
            <p className="text-xs text-text-tertiary">
              Use at least 8 characters for your password.
            </p>
            {error && (
              <p
                role="alert"
                className="rounded-xl bg-red-50 p-3 text-sm text-red-600"
              >
                {error}
              </p>
            )}
            <button
              type="submit"
              disabled={isSaving}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-brand-500 px-4 py-2.5 text-sm font-semibold text-white hover:bg-brand-600 disabled:opacity-60"
            >
              {isSaving && <InlineSpinner />}
              {isRedirecting
                ? "Opening sign in..."
                : isSaving
                  ? "Creating your profile..."
                  : "Create account"}
            </button>
          </fieldset>
        </form>
      ) : (
        <div>
          <p role="alert" className="text-sm text-red-600">
            {error}
          </p>
          <Link
            href="/register"
            className="mt-4 inline-block font-semibold text-brand-500"
          >
            Verify your email
          </Link>
        </div>
      )}
      <p role="status" className="sr-only">
        {isRedirecting
          ? "Account created. Opening sign in."
          : isSaving
            ? "Creating your account. Please wait."
            : ""}
      </p>
      <p className="mt-5 text-center text-sm text-text-secondary">
        Already completed your profile?{" "}
        <Link
          href="/login"
          className="font-semibold text-brand-500 hover:underline"
        >
          Sign in
        </Link>
      </p>
    </AuthShell>
  );
}
