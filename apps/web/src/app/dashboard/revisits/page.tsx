import { redirect } from 'next/navigation'
import { createClient } from '@/utils/supabase/server'
import { getRevisits } from '@/actions/revisits'
import { RevisitsView } from '@/components/revisits/revisits-view'

export default async function RevisitsPage() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        redirect('/login')
    }

    const revisits = await getRevisits()

    return <RevisitsView initialRevisits={revisits} />
}
