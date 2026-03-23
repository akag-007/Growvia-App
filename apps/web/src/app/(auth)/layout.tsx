import Image from 'next/image';

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="relative min-h-screen w-full flex items-center justify-center overflow-hidden bg-zinc-950">
      {/* Background Layer */}
      <div className="absolute inset-0 z-0">
        <Image
          src="/backgrounds/auth_bg.png"
          alt="Scenic Mountain Background"
          fill
          priority
          className="object-cover scale-[1.05]"
          style={{ filter: 'blur(8px)' }}
          quality={100}
        />
        <div className="absolute inset-0 bg-black/35 pointer-events-none" />
        
        {/* Subtle radial gradient to focus on the center where card will be */}
        <div className="absolute inset-0 bg-radial-[at_50%_50%] from-transparent via-black/20 to-black/60 pointer-events-none" />
      </div>

      {/* Children Layer (Contains Auth Card and Floating Widgets) */}
      <div className="relative z-10 w-full flex items-center justify-center h-full sm:p-4 md:p-8">
        {children}
      </div>
    </div>
  );
}
