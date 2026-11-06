import Image from 'next/image';
import Link from 'next/link';

interface LogoProps {
  size?: 'sm' | 'md' | 'lg';
  showText?: boolean;
  clickable?: boolean;
  className?: string;
}

export default function Logo({
  size = 'md',
  showText = true,
  clickable = true,
  className = '',
}: LogoProps) {
  const dimensions = {
    sm: { width: 32, height: 32, textClass: 'text-base', subtextClass: 'text-[10px]' },
    md: { width: 44, height: 44, textClass: 'text-lg', subtextClass: 'text-xs' },
    lg: { width: 64, height: 64, textClass: 'text-2xl', subtextClass: 'text-sm' },
  }[size];

  const content = (
    <div className={`flex items-center gap-3 ${className}`}>
      <div className="relative overflow-hidden rounded-xl shadow-sm ring-1 ring-black/5 bg-brand-primary flex-shrink-0">
        <Image
          src="/brand/logo.jpg"
          alt="Piano Playroom Logo"
          width={dimensions.width}
          height={dimensions.height}
          className="object-cover"
          priority
        />
      </div>

      {showText && (
        <div className="flex flex-col leading-none">
          <span className={`font-black tracking-tight text-brand-text-primary ${dimensions.textClass}`}>
            Piano Playroom
          </span>
        </div>
      )}
    </div>
  );

  if (clickable) {
    return (
      <Link href="/" className="inline-flex items-center hover:opacity-95 transition-opacity">
        {content}
      </Link>
    );
  }

  return content;
}
