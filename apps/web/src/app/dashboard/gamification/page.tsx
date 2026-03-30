import { redirect } from 'next/navigation'
import { createClient } from '@/utils/supabase/server'
import ClientView from './client-view'

export const dynamic = 'force-dynamic';

export default async function GamificationPage() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        redirect('/login')
    }

    return <ClientView />
}
