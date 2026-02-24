import { addDays, startOfDay } from 'date-fns';

export type DifficultyRating = 'easy' | 'medium' | 'hard';

/**
 * Spaced Repetition Logic (SRS)
 * Easy: +14 days (Progressive: 14 * min(reviewCount + 1, 4))
 * Medium: +7 days
 * Hard: +2 days
 */
export function calculateNextReviewDate(difficulty: DifficultyRating, currentReviewCount: number): Date {
    let daysToAdd = 7; // Default medium

    const today = startOfDay(new Date());

    switch (difficulty) {
        case 'easy':
            const multiplier = Math.min(currentReviewCount + 1, 4);
            daysToAdd = 14 * multiplier;
            break;
        case 'medium':
            daysToAdd = 7;
            break;
        case 'hard':
            daysToAdd = 2;
            break;
    }

    return addDays(today, daysToAdd);
}
