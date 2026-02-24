import { redirect } from 'next/navigation'
import { createClient } from '@/utils/supabase/server'
import { getNotes } from '@/actions/notes'
import NotesClientView from './client-view'

export default async function NotesPage() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        redirect('/login')
    }

    const notes = await getNotes()

    return <NotesClientView initialNotes={notes} />
}
