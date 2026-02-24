'use server'

import { createClient } from '@/utils/supabase/server'
import { revalidatePath } from 'next/cache'
import { calculateNextReviewDate, DifficultyRating } from '@/lib/revisits-logic'

export type RevisitType = 'tech' | 'leetcode' | 'math' | 'college' | 'book' | 'misc' | 'custom';
export type RevisitStatus = 'active' | 'done' | 'archived';

export type Revisit = {
    id: string;
    user_id: string;
    title: string;
    type: RevisitType;
    custom_type: string | null;
    resource_url: string | null;
    reason_to_return: string | null;
    notes: string | null;
    estimated_time_min: number;
    difficulty: number;
    review_count: number;
    status: RevisitStatus;
    created_at: string;
    last_reviewed_at: string | null;
    next_review_at: string;
    updated_at: string;
};

export async function getRevisits() {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) return [];

    const { data, error } = await supabase
        .from('revisits')
        .select('*')
        .neq('status', 'archived')
        .order('next_review_at', { ascending: true });

    if (error) {
        console.error('Error fetching revisits:', error);
        return [];
    }

    return data as Revisit[];
}

export async function createRevisit(formData: FormData) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) return { error: 'Unauthorized' };

    const title = formData.get('title') as string;
    const type = (formData.get('type') || 'misc') as RevisitType;
    const custom_type = (formData.get('custom_type') as string) || null;
    const resource_url = formData.get('resource_url') as string;
    const reason_to_return = formData.get('reason_to_return') as string;
    const estimated_time_min = parseInt(formData.get('estimated_time_min') as string || '15');

    const next_review_at_raw = formData.get('next_review_at') as string
    // Use user-chosen date, fall back to today if not provided
    const next_review_at = next_review_at_raw || new Date().toISOString().split('T')[0]

    const { data, error } = await supabase
        .from('revisits')
        .insert({
            user_id: user.id,
            title,
            type,
            custom_type,
            resource_url,
            reason_to_return,
            estimated_time_min,
            next_review_at: next_review_at,
        })
        .select()
        .single();

    if (error) return { error: error.message };

    revalidatePath('/dashboard/revisits');
    return { success: true, data };
}

export async function completeReview(id: string, difficulty: DifficultyRating) {
    const supabase = await createClient();

    // 1. Get current revisit
    const { data: revisit, error: fetchError } = await supabase
        .from('revisits')
        .select('review_count')
        .eq('id', id)
        .single();

    if (fetchError || !revisit) return { error: 'Revisit not found' };

    // 2. Calculate next date
    const nextDate = calculateNextReviewDate(difficulty, revisit.review_count);

    // 3. Update — also reset status to active (un-masters if re-reviewed)
    const { error: updateError } = await supabase
        .from('revisits')
        .update({
            review_count: revisit.review_count + 1,
            next_review_at: nextDate.toISOString().split('T')[0],
            last_reviewed_at: new Date().toISOString(),
            status: 'active',
        })
        .eq('id', id);

    if (updateError) return { error: updateError.message };

    revalidatePath('/dashboard/revisits');
    return { success: true };
}

export async function snoozeRevisit(id: string, days: number) {
    const supabase = await createClient();

    const nextDate = new Date();
    nextDate.setDate(nextDate.getDate() + days);

    const { error } = await supabase
        .from('revisits')
        .update({
            next_review_at: nextDate.toISOString().split('T')[0],
        })
        .eq('id', id);

    if (error) return { error: error.message };

    revalidatePath('/dashboard/revisits');
    return { success: true };
}

export async function markMastered(id: string) {
    const supabase = await createClient();

    const { error } = await supabase
        .from('revisits')
        .update({
            status: 'done',
        })
        .eq('id', id);

    if (error) return { error: error.message };

    revalidatePath('/dashboard/revisits');
    return { success: true };
}

export async function deleteRevisit(id: string) {
    const supabase = await createClient();

    const { error } = await supabase
        .from('revisits')
        .delete()
        .eq('id', id);

    if (error) return { error: error.message };

    revalidatePath('/dashboard/revisits');
    return { success: true };
}

export async function updateRevisit(id: string, patch: Partial<Omit<Revisit, 'id' | 'user_id' | 'created_at' | 'updated_at'>>) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) return { error: 'Unauthorized' };

    const { error } = await supabase
        .from('revisits')
        .update(patch)
        .eq('id', id)
        .eq('user_id', user.id);

    if (error) return { error: error.message };

    revalidatePath('/dashboard/revisits');
    return { success: true };
}
