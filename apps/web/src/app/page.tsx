import { brandConfig } from "@app/shared";
import { createClient } from '@/utils/supabase/server';
import { signOut } from '@/app/auth/actions';
import { redirect } from "next/navigation";
import Link from 'next/link';

export default async function Home() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (user) {
    redirect('/dashboard');
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-50 font-sans dark:bg-black">
      <main className="flex min-h-screen w-full max-w-3xl flex-col items-center justify-between py-32 px-16 bg-white dark:bg-black sm:items-start">
        <div className="flex w-full items-center justify-between">
          <h1 className="text-4xl font-bold">{brandConfig.appName}</h1>
          <Link href="/login" className="text-sm font-medium text-indigo-600 hover:text-indigo-500">
            Sign in
          </Link>
        </div>

        <div className="w-full mt-10">
          <p className="text-zinc-600 dark:text-zinc-400">
            Welcome to the future of productivity.
          </p>
        </div>
      </main>
    </div>
  );
}
