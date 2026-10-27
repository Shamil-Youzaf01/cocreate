"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import { Eye, EyeOff, LockKeyhole, Mail } from "lucide-react";
import AuthShell from "@/components/auth-shell";
import { InlineSpinner } from "@/components/loading-state";
import { login } from "@/services/auth.service";
import useAuthStore from "@/store/authStore";
import toast from "react-hot-toast";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const requestLock = useRef(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isRedirecting, setIsRedirecting] = useState(false);
  const [error, setError] = useState("");
  const setAuth = useAuthStore((state) => state.setAuth);
  const router = useRouter();

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (requestLock.current) return;
    requestLock.current = true;
    let redirecting = false;

    try {
      setIsLoading(true);
      setError("");

      const response = await login({
        email,
        password,
      });

      setAuth({
        user: response.data.user,
        accessToken: response.data.accessToken,
      });

      toast.success("Welcome back!");
      setIsRedirecting(true);
      router.push("/dashboard");
      redirecting = true;
    } catch (error) {
      const message =
        error.response?.data?.message || "Unable to login. Please try again.";

      setError(message);
      toast.error(message);
    } finally {
      if (!redirecting) {
        requestLock.current = false;
        setIsLoading(false);
        setIsRedirecting(false);
      }
    }
  };
  return (
    <AuthShell>
      <div className="text-center">
        <h1 className="text-3xl font-bold tracking-tight text-text-primary">
          Sign In
        </h1>

        <p className="mt-2 text-sm leading-5 text-text-secondary">
          Welcome back! Please sign in to access your account.
        </p>
      </div>

      <button
        type="button"
        disabled={isLoading}
        className="mt-3 flex w-full items-center justify-center gap-3 rounded-xl border border-input-border bg-background-white-primary px-4 py-2.5 text-sm font-semibold text-text-primary transition hover:bg-background-gray-secondary"
      >
        <GoogleIcon />
        Continue with Google
      </button>

      <div className="relative my-3">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-border-secondary-alt" />
        </div>

        <div className="relative flex justify-center">
          <span className="bg-card-background px-3 text-xs font-medium uppercase tracking-[0.16em] text-text-tertiary">
            Or
          </span>
        </div>
      </div>

      <form onSubmit={handleSubmit} aria-busy={isLoading}>
        <fieldset disabled={isLoading} className="space-y-3">
          <div>
            <label
              htmlFor="email"
              className="mb-2 block text-sm font-medium text-input-label-text-color"
            >
              Email address
              <span className="ml-1 text-red-600">*</span>
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
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="you@example.com"
                className="w-full rounded-xl border border-input-border bg-input-background py-2.5 pl-10 pr-4 text-sm text-text-primary outline-none transition placeholder:text-input-placeholder-text-color focus:border-brand-500 focus:ring-2 focus:ring-brand-500/15"
              />
            </div>
          </div>

          <div>
            <label
              htmlFor="password"
              className="mb-2 block text-sm font-medium text-input-label-text-color"
            >
              Password
              <span className="ml-1 text-red-600">*</span>
            </label>

            <div className="relative">
              <LockKeyhole
                size={18}
                className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-icon-tertiary"
              />

              <input
                id="password"
                type={showPassword ? "text" : "password"}
                autoComplete="current-password"
                required
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                placeholder="Enter your password"
                className="w-full rounded-xl border border-input-border bg-input-background py-2.5 pl-10 pr-12 text-sm text-text-primary outline-none transition placeholder:text-input-placeholder-text-color focus:border-brand-500 focus:ring-2 focus:ring-brand-500/15"
              />

              <button
                type="button"
                onClick={() => setShowPassword((value) => !value)}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-icon-tertiary transition hover:text-icon-primary"
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          <div className="flex items-center justify-between gap-4">
            <label className="flex cursor-pointer items-center gap-2">
              <input
                type="checkbox"
                checked={rememberMe}
                onChange={(event) => setRememberMe(event.target.checked)}
                className="h-4 w-4 rounded border-input-border text-brand-500 focus:ring-brand-500"
              />

              <span className="text-sm text-text-secondary">
                Keep me logged in
              </span>
            </label>

            <Link
              href="/forgot-password"
              className="text-sm font-semibold text-text-primary underline-offset-4 hover:text-brand-500 hover:underline"
            >
              Forgot password?
            </Link>
          </div>

          {error && (
            <div
              role="alert"
              className="rounded-xl border border-red-200 bg-red-50 px-3 py-2.5 text-sm text-red-600"
            >
              {error}
            </div>
          )}
          <button
            type="submit"
            disabled={isLoading}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-brand-500 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-brand-600 active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-70"
          >
            {isLoading && <InlineSpinner />}
            {isRedirecting
              ? "Opening your dashboard..."
              : isLoading
                ? "Signing in..."
                : "Login"}
          </button>
        </fieldset>
      </form>
      <p role="status" className="sr-only">
        {isRedirecting
          ? "Signed in. Opening your dashboard."
          : isLoading
            ? "Signing in. Please wait."
            : ""}
      </p>

      <p className="mt-3 text-center text-sm text-text-secondary">
        New here?{" "}
        <Link
          href="/register"
          className="font-semibold text-brand-500 hover:text-brand-600 hover:underline"
        >
          Create an account
        </Link>
      </p>
    </AuthShell>
  );
}

function GoogleIcon() {
  return (
    <svg className="h-5 w-5" viewBox="0 0 24 24" aria-hidden="true">
      <path
        fill="#4285F4"
        d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.8-2.4 3.66v3.05h3.88c2.27-2.09 3.665-5.17 3.665-9.15z"
      />
      <path
        fill="#34A853"
        d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.24v3.15C3.26 21.36 7.33 24 12 24z"
      />
      <path
        fill="#FBBC05"
        d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.24C.45 8.16 0 9.94 0 12s.45 3.84 1.24 5.42l4.04-3.15z"
      />
      <path
        fill="#EA4335"
        d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.33 0 3.26 2.64 1.24 6.58l4.04 3.15c.95-2.83 3.6-4.98 6.72-4.98z"
      />
    </svg>
  );
}
