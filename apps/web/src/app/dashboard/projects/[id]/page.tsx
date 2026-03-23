import { getProjects } from '@/actions/project'
import { ProjectDetailClient } from './project-detail-client'

export const metadata = {
    title: 'Project Details | Dashboard',
}

export default async function ProjectDetailPage(props: { params: Promise<{ id: string }> }) {
    const params = await props.params;
    const projects = await getProjects()
    const project = projects.find(p => p.id === params.id)

    if (!project) {
        return (
            <div className="p-20 text-center">
                <h1 className="text-2xl text-white">Project Not Found</h1>
                <p className="text-zinc-400 mt-4">We could not find a project with ID: <code>{params.id}</code>.</p>
                <pre className="text-left mt-8 p-4 bg-black/50 text-xs text-zinc-300 rounded overflow-auto">
                    Available IDs: {projects.map(p => p.id).join(', ')}
                </pre>
            </div>
        )
    }

    // We pass tasks here. A robust solution might fetch tasks specifically for this project,
    // but getProjects() already eager-loads linked tasks. For performance, we'd normally paginated tasks.

    return (
        <div className="mx-auto w-full max-w-4xl space-y-6 px-4 pb-20 pt-16 sm:px-6 md:pt-20">
            <ProjectDetailClient project={project} />
        </div>
    )
}
