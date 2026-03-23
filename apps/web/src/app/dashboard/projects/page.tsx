import { Suspense } from 'react'
import { getProjects } from '@/actions/project'
import { ProjectListClient } from './project-list-client'
import { Layers } from 'lucide-react'

export const metadata = {
    title: 'Projects | Dashboard',
}

export default async function ProjectsPage() {
    const projects = await getProjects()

    return (
        <div className="mx-auto w-full max-w-5xl space-y-6 px-4 pb-20 pt-16 sm:px-6 md:pt-20">
            <header className="mb-8">
                <div className="mb-4 inline-flex items-center justify-center rounded-2xl bg-indigo-500/10 p-3 shadow-inner ring-1 ring-inset ring-indigo-500/20">
                    <Layers className="h-6 w-6 text-indigo-400" />
                </div>
                <h1 className="text-3xl font-extrabold tracking-tight text-white sm:text-4xl">
                    Long-Term Projects
                </h1>
                <p className="mt-2 text-base text-zinc-400 max-w-2xl">
                    Link your daily tasks to broader goals. Track overall completion, total time spent, and approaching deadlines.
                </p>
            </header>

            <Suspense fallback={<div className="text-zinc-500 animate-pulse">Loading projects...</div>}>
                <ProjectListClient initialProjects={projects} />
            </Suspense>
        </div>
    )
}
