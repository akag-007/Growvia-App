import { redirect } from 'next/navigation'
import { createClient } from '@/utils/supabase/server'
import { getChallenges } from '@/actions/challenges'
import { ChallengesView } from '@/components/challenges/challenges-view'

export default async function ChallengesPage() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) redirect('/login')

    const initialChallenges = await getChallenges()

    return <ChallengesView initialChallenges={initialChallenges} />
}
