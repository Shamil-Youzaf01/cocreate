"use client";
import toast from "react-hot-toast";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Mail, User, Building2, ArrowRight } from "lucide-react";
import AuthShell from "@/components/auth-shell";
import { InlineSpinner } from "@/components/loading-state";
import { startSignup } from "@/services/auth.service";

export default function RegisterPage() {
  const router = useRouter();
  const requestLock = useRef(false);
  const [email, setEmail] = useState("");
  const [role, setRole] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isRedirecting, setIsRedirecting] = useState(false);
  const [error, setError] = useState("");
  async function handleSubmit(event) {
    event.preventDefault();
    if (requestLock.current || !role) return;
    requestLock.current = true;
    setIsLoading(true);
    setError("");
    let redirecting = false;
    try {
      const response = await startSignup(email.trim().toLowerCase(), role);
      toast.success("Verification email sent. Check your inbox.");
      const resendAt = Date.now() + response.data.retryAfter * 1000;
      setIsRedirecting(true);
      router.push(
        `/verify-email?email=${encodeURIComponent(response.data.email)}&role=${role}&resendAt=${resendAt}`,
      );
      redirecting = true;
    } catch (error) {
      const message =
        error.response?.data?.message ||
        "Unable to send verification email. Please try again.";
      setError(message);
      toast.error(message);
    } finally {
      if (!redirecting) {
        requestLock.current = false;
        setIsLoading(false);
        setIsRedirecting(false);
      }
    }
  }
  return (
    <AuthShell
      onBack={
        role
          ? () => {
              setRole(null);
              setError("");
            }
          : undefined
      }
      backDisabled={isLoading}
    >
      {!role ? (
        <>
          <div className="text-center">
            <p className="mb-2 text-xs font-semibold uppercase tracking-widest text-brand-500">
              Step 1 of 4
            </p>
            <h1 className="text-3xl font-bold tracking-tight text-text-primary">
              Join CoCreate
            </h1>
            <p className="mt-2 text-sm leading-5 text-text-secondary">
              Choose how you want to collaborate.
            </p>
          </div>
          <div className="mt-4 space-y-3">
            {[
              {
                value: "CREATOR",
                title: "I am a Creator",
                description:
                  "Discover campaigns, share your creativity, and track rewards.",
                icon: User,
              },
              {
                value: "BRAND",
                title: "I am a Brand or Agency",
                description:
                  "Launch campaigns, connect with creators, and review their work.",
                icon: Building2,
              },
            ].map(({ value, title, description, icon: Icon }) => (
              <button
                key={value}
                type="button"
                onClick={() => setRole(value)}
                className="group flex w-full items-center gap-3 rounded-xl border border-input-border bg-background-white-primary p-4 text-left transition hover:border-brand-500 hover:bg-background-gray-secondary"
              >
                <span className="rounded-xl bg-brand-500/10 p-3 text-brand-500">
                  <Icon size={22} />
                </span>
                <span className="flex-1">
                  <span className="block text-sm font-semibold text-text-primary">
                    {title}
                  </span>
                  <span className="mt-1 block text-xs leading-5 text-text-secondary">
                    {description}
                  </span>
                </span>
                <ArrowRight size={17} className="text-brand-500" />
              </button>
            ))}
          </div>
        </>
      ) : (
        <>
          <div className="text-center">
            <p className="mb-2 text-xs font-semibold uppercase tracking-widest text-brand-500">
              Step 2 of 4
            </p>
            <h1 className="text-3xl font-bold tracking-tight text-text-primary">
              Continue as a {role === "CREATOR" ? "creator" : "brand"}
            </h1>
            <p className="mt-2 text-sm leading-5 text-text-secondary">
              Enter your email. Verify it, then set up your profile.
            </p>
          </div>
          <form
            onSubmit={handleSubmit}
            aria-busy={isLoading}
            className="mt-4 space-y-4"
          >
            <div>
              <label
                htmlFor="email"
                className="mb-2 block text-sm font-medium text-input-label-text-color"
              >
                Email address
              </label>
              <div className="relative">
                <Mail
                  size={18}
                  className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-icon-tertiary"
                />
                <input
                  id="email"
                  type="email"
                  autoComplete="email"
                  required
                  disabled={isLoading}
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  placeholder="you@example.com"
                  className="w-full rounded-xl border border-input-border bg-input-background py-2.5 pl-10 pr-4 text-sm text-text-primary outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/15"
                />
              </div>
            </div>
            {error && (
              <p
                role="alert"
                className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-600"
              >
                {error}
              </p>
            )}
            <button
              type="submit"
              disabled={isLoading}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-brand-500 px-4 py-2.5 text-sm font-semibold text-white hover:bg-brand-600 disabled:opacity-60"
            >
              {isLoading && <InlineSpinner />}
              {isRedirecting
                ? "Opening email verification..."
                : isLoading
                  ? "Sending verification link..."
                  : "Continue with email"}
            </button>
          </form>
          <p role="status" className="sr-only">
            {isRedirecting
              ? "Verification email sent. Opening the next step."
              : isLoading
                ? "Sending your verification email. Please wait."
                : ""}
          </p>
        </>
      )}
      <p className="mt-3 text-center text-sm text-text-secondary">
        Already have an account?{" "}
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
