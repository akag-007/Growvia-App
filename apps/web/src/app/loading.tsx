import { Loader2 } from 'lucide-react';

export default function Loading() {
  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-zinc-950/80 backdrop-blur-sm">
      <div className="flex flex-col items-center gap-4">
        <div className="relative flex items-center justify-center">
          <div className="absolute inset-0 rounded-full bg-indigo-500/20 blur-xl"></div>
          <Loader2 className="w-10 h-10 animate-spin text-indigo-500 relative z-10" />
        </div>
        <p className="text-sm font-medium text-white/60 tracking-wider uppercase animate-pulse">Loading</p>
      </div>
    </div>
  );
}
