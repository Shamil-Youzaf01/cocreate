"use client";

import { Suspense, useEffect, useRef, useState } from "react";
import Link from "next/link";
import BrandLogo from "@/components/brand-logo";
import { useRouter, useSearchParams } from "next/navigation";
import LoadingState, { InlineSpinner } from "@/components/loading-state";
import {
  ArrowLeft,
  CheckCircle2,
  LoaderCircle,
  Mail,
  CircleAlert,
} from "lucide-react";
import {
  verifySignup,
  startSignup,
  getSignupProfile,
} from "@/services/auth.service";
import toast from "react-hot-toast";

export default function VerifyEmailPage() {
  return (
    <Suspense
      fallback={
        <LoadingState fullScreen label="Loading email verification..." />
      }
    >
      <VerificationFromSearch />
    </Suspense>
  );
}

function VerificationFromSearch() {
  const params = useSearchParams();
  return (
    <EmailVerification
      key={`${params.get("token") || ""}:${params.get("role") || ""}`}
      params={params}
    />
  );
}

function EmailVerification({ params }) {
  const router = useRouter();
  const verificationRequest = useRef(null);
  const resendLock = useRef(false);
  const navigationLock = useRef(false);
  const token = params.get("token");
  const role = params.get("role");
  const expectedEmail = token
    ? ""
    : (params.get("email") || "").trim().toLowerCase();
  const [status, setStatus] = useState(token ? "loading" : "pending");
  const [message, setMessage] = useState(
    token
      ? ""
      : "Open the verification link and finish your profile in the browser where you open it. If you use another device, continue on that device.",
  );
  const [email, setEmail] = useState(params.get("email") || "");
  const [isSending, setIsSending] = useState(false);
  const [isRedirecting, setIsRedirecting] = useState(false);
  const [resendMessage, setResendMessage] = useState("");
  const [profileRequired, setProfileRequired] = useState(false);
  const [resendAt, setResendAt] = useState(() => {
    const deadline = Number(params.get("resendAt"));
    return Number.isFinite(deadline) ? deadline : 0;
  });
  const [now, setNow] = useState(() => Date.now());
  const secondsLeft = Math.max(0, Math.ceil((resendAt - now) / 1000));

  useEffect(() => {
    const timer = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(timer);
  }, []);

  useEffect(() => {
    let active = true;
    if (!token) {
      // Resume only if this browser received its own setup cookie from the link.
      let checking = false;
      const checkVerified = async () => {
        if (checking || navigationLock.current) return;
        checking = true;
        try {
          const response = await getSignupProfile();
          if (
            active &&
            expectedEmail &&
            response.data.email === expectedEmail &&
            (!role || response.data.role === role)
          ) {
            navigationLock.current = true;
            setIsRedirecting(true);
            router.replace("/complete-profile");
          }
        } catch {
          /* Waiting for verification; keep the inbox screen visible. */
        } finally {
          checking = false;
        }
      };
      checkVerified();
      const poll = window.setInterval(checkVerified, 3000);
      window.addEventListener("focus", checkVerified);
      return () => {
        active = false;
        window.clearInterval(poll);
        window.removeEventListener("focus", checkVerified);
      };
    }
    // Reuse the request when React re-runs the effect: verification tokens are single-use.
    verificationRequest.current ??= verifySignup(token);
    verificationRequest.current
      .then((response) => {
        if (!active) return;
        toast.success("Email verified!");

        if (response.data.profileRequired) {
          setProfileRequired(true);
          setStatus("success");
          setMessage(
            "Email verified. Continue to set up your profile in this browser.",
          );
          return;
        }
        setStatus("success");
        setMessage(
          "Your email is verified. You can now sign in to your CoCreate account.",
        );
      })
      .catch((error) => {
        if (!active) return;
        const errorMessage =
          error.response?.data?.message ||
          "We could not verify your email. Check your connection and try opening the link again.";

        setStatus("error");
        setMessage(errorMessage);
        toast.error(errorMessage);
      });
    return () => {
      active = false;
    };
  }, [expectedEmail, role, router, token]);

  const beginNavigation = (event) => {
    if (navigationLock.current) {
      event.preventDefault();
      return;
    }
    navigationLock.current = true;
    setIsRedirecting(true);
  };

  const handleResend = async (event) => {
    event.preventDefault();
    if (resendLock.current || navigationLock.current || Date.now() < resendAt)
      return;
    resendLock.current = true;
    setIsSending(true);
    setResendMessage("");
    try {
      if (!role) {
        const msg =
          "Please return to registration to choose your account type and request a new link.";
        setResendMessage(msg);
        toast.error(msg);
        return;
      }
      const response = await startSignup(email.trim().toLowerCase(), role);
      const deadline = Date.now() + response.data.retryAfter * 1000;
      setNow(Date.now());
      setResendAt(deadline);
      const url = new URL(window.location.href);
      url.searchParams.set("resendAt", String(deadline));
      url.searchParams.set("email", response.data.email);
      window.history.replaceState(null, "", url);
      setResendMessage(
        "A new verification link has been sent. Please check your inbox.",
      );
      toast.success("Verification link resent.");
    } catch (error) {
      const retryAfter = Number(error.response?.data?.data?.retryAfter);
      if (retryAfter > 0) setResendAt(Date.now() + retryAfter * 1000);
      const msg =
        error.response?.data?.message ||
        "Unable to send the email. Please try again.";
      setResendMessage(msg);
      toast.error(msg);
    } finally {
      resendLock.current = false;
      setIsSending(false);
    }
  };

  const Icon =
    status === "loading" || isRedirecting
      ? LoaderCircle
      : status === "success"
        ? CheckCircle2
        : status === "error"
          ? CircleAlert
          : Mail;
  const title = isRedirecting
    ? "Opening the next step"
    : status === "loading"
      ? "Verifying your email"
      : status === "success"
        ? "Email verified"
        : status === "error"
          ? "Unable to verify email"
          : "Check your email";

  return (
    <main className="flex min-h-screen items-center justify-center bg-background-gray-primary px-4 py-8 sm:px-6">
      <section className="w-full max-w-lg rounded-[28px] border border-card-border bg-card-background p-6 shadow-3xl sm:p-8">
        <Link href="/" className="mx-auto block w-fit">
          <BrandLogo />
        </Link>
        <div className="mt-8 text-center" role="status" aria-live="polite">
          <Icon
            size={44}
            className={`mx-auto mb-4 text-brand-500 ${status === "loading" || isRedirecting ? "animate-spin motion-reduce:animate-none" : ""}`}
            aria-hidden="true"
          />
          <h1 className="text-2xl font-bold tracking-tight text-text-primary">
            {title}
          </h1>
          <p className="mt-3 text-sm leading-6 text-text-secondary">
            {isRedirecting
              ? "Your email is verified. Please wait while the next page opens."
              : status === "loading"
                ? "Please wait while we confirm your email address and open the next step."
                : message}
          </p>
        </div>
        {(status === "pending" || status === "error") && !isRedirecting && (
          <form
            onSubmit={handleResend}
            aria-busy={isSending}
            className="mt-6 space-y-3"
          >
            <p className="text-sm text-text-secondary">
              Need a new link? Enter the email you want to verify.
            </p>
            <label
              htmlFor="verification-email"
              className="block text-sm font-medium text-input-label-text-color"
            >
              Email address
            </label>
            <input
              id="verification-email"
              type="email"
              autoComplete="email"
              required
              disabled={isSending}
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="you@example.com"
              className="w-full rounded-xl border border-input-border bg-input-background px-4 py-2.5 text-sm text-text-primary outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/15"
            />
            <button
              type="submit"
              disabled={isSending || secondsLeft > 0}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-brand-500 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-brand-600 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isSending && <InlineSpinner />}
              {isSending
                ? "Sending..."
                : secondsLeft > 0
                  ? `Resend in ${secondsLeft}s`
                  : "Resend verification email"}
            </button>
            {resendMessage && (
              <p role="status" className="text-sm text-text-secondary">
                {resendMessage}
              </p>
            )}
          </form>
        )}
        <p role="status" className="sr-only">
          {isSending ? "Sending your verification email. Please wait." : ""}
        </p>
        {status === "success" &&
          (profileRequired ? (
            <Link
              href="/complete-profile"
              onNavigate={beginNavigation}
              aria-disabled={isRedirecting}
              className="mt-6 flex w-full items-center justify-center gap-2 rounded-xl bg-brand-500 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-brand-600 aria-disabled:opacity-60"
            >
              {isRedirecting && <InlineSpinner />}
              {isRedirecting
                ? "Opening profile setup..."
                : "Continue to profile setup"}
            </Link>
          ) : (
            <Link
              href="/login"
              onNavigate={beginNavigation}
              aria-disabled={isRedirecting}
              className="mt-6 flex w-full items-center justify-center gap-2 rounded-xl bg-brand-500 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-brand-600 aria-disabled:opacity-60"
            >
              {isRedirecting && <InlineSpinner />}
              {isRedirecting ? "Opening sign in..." : "Continue to sign in"}
            </Link>
          ))}
        {(status === "error" || status === "pending") && !role && (
          <Link
            href="/register"
            className="mt-4 block text-center text-sm font-semibold text-brand-500"
          >
            Choose account type and request a new link
          </Link>
        )}
        {status !== "success" && (
          <Link
            href="/login"
            className="mt-6 flex items-center justify-center gap-2 text-sm font-semibold text-brand-500 hover:underline"
          >
            <ArrowLeft size={16} />
            Back to sign in
          </Link>
        )}
      </section>
    </main>
  );
}
