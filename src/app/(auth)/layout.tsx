export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-brand-canvas text-brand-text-body flex flex-col justify-between py-8 px-4 sm:px-6">
      {/* Top Bar with Language Toggle */}
      <div className="max-w-md w-full mx-auto flex justify-end">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-brand-surface border border-brand-border text-[11px] font-semibold text-brand-text-muted shadow-xs">
          <span className="text-brand-text-primary font-bold cursor-pointer">EN</span>
          <span className="text-brand-text-subtle">|</span>
          <span className="hover:text-brand-text-primary cursor-pointer transition">TH</span>
        </div>
      </div>

      {/* Main Centered Content */}
      <div className="max-w-md w-full mx-auto my-auto py-6">
        {children}
      </div>

      {/* Subtle Footer */}
      <div className="max-w-md w-full mx-auto text-center text-[11px] text-brand-text-subtle font-medium">
        Piano Playroom Studio Platform
      </div>
    </div>
  );
}
