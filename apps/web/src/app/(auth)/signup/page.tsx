'use client'

import { useActionState } from 'react'
import { signup } from '@/app/auth/actions'
import { brandConfig } from '@app/shared'
import Link from 'next/link'
import { LucideUserPlus } from 'lucide-react'

const initialState = {
    error: '',
}

export default function SignupPage() {
    const [state, formAction, isPending] = useActionState(async (prevState: any, formData: FormData) => {
        const result = await signup(formData);
        if (result?.error) {
            return { error: result.error };
        }
        return prevState;
    }, initialState)

    return (
        <div className="flex min-h-screen flex-col items-center justify-center bg-zinc-50 dark:bg-black px-4">
            <div className="w-full max-w-sm space-y-8">
                <div className="text-center">
                    <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-black dark:bg-white text-white dark:text-black">
                        <LucideUserPlus size={24} />
                    </div>
                    <h2 className="mt-6 text-3xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100">
                        Create your account
                    </h2>
                    <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
                        Already have an account?{' '}
                        <Link href="/login" className="font-medium text-indigo-600 hover:text-indigo-500 dark:text-indigo-400">
                            Sign in to {brandConfig.appName}
                        </Link>
                    </p>
                </div>

                <form action={formAction} className="mt-8 space-y-6">
                    <div className="-space-y-px rounded-md shadow-sm">
                        <div>
                            <label htmlFor="name" className="sr-only">
                                Full Name
                            </label>
                            <input
                                id="name"
                                name="name"
                                type="text"
                                autoComplete="name"
                                required
                                className="relative block w-full rounded-t-md border-0 py-1.5 text-zinc-900 ring-1 ring-inset ring-zinc-300 placeholder:text-zinc-400 focus:z-10 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6 dark:bg-zinc-900 dark:text-white dark:ring-zinc-700"
                                placeholder="Full Name"
                            />
                        </div>
                        <div>
                            <label htmlFor="email-address" className="sr-only">
                                Email address
                            </label>
                            <input
                                id="email-address"
                                name="email"
                                type="email"
                                autoComplete="email"
                                required
                                className="relative block w-full border-0 py-1.5 text-zinc-900 ring-1 ring-inset ring-zinc-300 placeholder:text-zinc-400 focus:z-10 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6 dark:bg-zinc-900 dark:text-white dark:ring-zinc-700"
                                placeholder="Email address"
                            />
                        </div>
                        <div>
                            <label htmlFor="password" className="sr-only">
                                Password
                            </label>
                            <input
                                id="password"
                                name="password"
                                type="password"
                                autoComplete="new-password"
                                required
                                className="relative block w-full rounded-b-md border-0 py-1.5 text-zinc-900 ring-1 ring-inset ring-zinc-300 placeholder:text-zinc-400 focus:z-10 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6 dark:bg-zinc-900 dark:text-white dark:ring-zinc-700"
                                placeholder="Password (min 6 chars)"
                            />
                        </div>
                    </div>

                    {state?.error && (
                        <div className="text-red-500 text-sm text-center">
                            {state.error}
                        </div>
                    )}

                    <div>
                        <button
                            type="submit"
                            disabled={isPending}
                            className="group relative flex w-full justify-center rounded-md bg-indigo-600 px-3 py-2 text-sm font-semibold text-white hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {isPending ? 'Creating account...' : 'Sign up'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    )
}
