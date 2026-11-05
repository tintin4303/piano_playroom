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
