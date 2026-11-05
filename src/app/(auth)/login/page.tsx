'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { signIn } from '@/server/actions/auth';
import Image from 'next/image';

export default function LoginPage() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const formData = new FormData(e.currentTarget);
    try {
      const result = await signIn(formData);
      if (!result.success) {
        setError(result.message || 'Login failed. Please check your credentials.');
        setLoading(false);
      } else if (result.redirectTo) {
        router.push(result.redirectTo);
        router.refresh();
      }
    } catch (err: any) {
      setError(err?.message || 'An unexpected error occurred.');
      setLoading(false);
    }
  }

  return (
    <div className="w-full flex flex-col items-center">
      {/* Brand Logo & Spaced Header */}
      <div className="flex flex-col items-center mb-7 text-center">
        <div className="w-16 h-16 rounded-full overflow-hidden shadow-xs ring-1 ring-brand-border mb-3.5 bg-brand-surface">
          <Image
            src="/brand/logo.jpg"
            alt="Piano Playroom Logo"
            width={64}
            height={64}
            className="w-full h-full object-cover"
            priority
          />
        </div>
        <h2 className="text-xs uppercase tracking-[0.35em] font-bold text-brand-text-primary">
          Piano Playroom
        </h2>
        <span className="text-[10px] uppercase tracking-[0.25em] text-brand-text-muted font-semibold mt-0.5">
          Music School
        </span>
      </div>

      {/* Elegant Heading */}
      <h1 className="font-serif text-3xl sm:text-4xl text-brand-text-primary tracking-tight mb-8 font-normal text-center">
        Welcome Back
      </h1>

      {error && (
        <div className="w-full mb-6 p-3 bg-brand-red-light border border-brand-red-border text-brand-red text-xs text-center rounded-xl font-medium">
          {error}
        </div>
      )}

      {/* Continue with Google (Pill Button) */}
      <button
        type="button"
        className="w-full py-3 px-4 rounded-full border border-brand-border bg-brand-surface hover:bg-brand-canvas transition-all flex items-center justify-center gap-3 text-xs font-semibold text-brand-text-primary shadow-xs cursor-pointer mb-6"
      >
        <svg className="w-4 h-4" viewBox="0 0 24 24">
          <path
            fill="#4285F4"
            d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
          />
          <path
            fill="#34A853"
            d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
          />
          <path
            fill="#FBBC05"
            d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
          />
          <path
            fill="#EA4335"
            d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
          />
        </svg>
        <span>Continue with Google</span>
      </button>

      {/* OR Divider */}
      <div className="w-full flex items-center justify-center my-6">
        <div className="w-full border-t border-brand-border" />
        <span className="px-3 text-[10px] tracking-widest text-brand-text-subtle font-bold uppercase">
          OR
        </span>
        <div className="w-full border-t border-brand-border" />
      </div>

      {/* Underline Form Fields */}
      <form onSubmit={handleSubmit} className="w-full space-y-6">
        <div className="space-y-1">
          <label
            htmlFor="email"
            className="block text-[10px] uppercase tracking-[0.2em] font-bold text-brand-text-muted"
          >
            Email Address
          </label>
          <input
            id="email"
            name="email"
            type="email"
            required
            autoComplete="email"
            className="w-full bg-transparent border-b border-brand-border focus:border-brand-primary py-2 text-sm text-brand-text-primary placeholder:text-brand-text-subtle focus:outline-none transition-colors"
          />
        </div>

        <div className="space-y-1">
          <div className="flex items-center justify-between">
            <label
              htmlFor="password"
              className="block text-[10px] uppercase tracking-[0.2em] font-bold text-brand-text-muted"
            >
              Password
            </label>
            <button
              type="button"
              className="text-[10px] uppercase tracking-wider font-semibold text-brand-text-muted hover:text-brand-primary transition"
            >
              Forgot?
            </button>
          </div>
          <input
            id="password"
            name="password"
            type="password"
            required
            autoComplete="current-password"
            className="w-full bg-transparent border-b border-brand-border focus:border-brand-primary py-2 text-sm text-brand-text-primary placeholder:text-brand-text-subtle focus:outline-none transition-colors"
          />
        </div>

        {/* Pill Sign In Button */}
        <div className="pt-4">
          <button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 px-6 rounded-full bg-brand-primary hover:bg-brand-primary-hover text-white text-xs font-bold uppercase tracking-[0.2em] shadow-xs hover:shadow transition duration-150 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
          >
            {loading ? (
              <>
                <svg className="animate-spin h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                </svg>
                <span>Signing in...</span>
              </>
            ) : (
              'Sign In'
            )}
          </button>
        </div>
      </form>

      {/* Provisioning Notice */}
      <div className="w-full pt-8 mt-4 text-center text-xs text-brand-text-muted">
        Accounts are provisioned by the school administrator.
        <div className="text-[11px] text-brand-text-subtle mt-0.5">
          Please contact the studio if you need access.
        </div>
      </div>
    </div>
  );
}
