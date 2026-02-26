import { z } from 'zod';

export const PRIORITY_VALUES = [
    'important_urgent',
    'important_not_urgent',
    'not_important_urgent',
    'not_important_not_urgent',
] as const;

export type PriorityValue = typeof PRIORITY_VALUES[number];

export const PRIORITY_META: Record<PriorityValue, { label: string; sublabel: string; color: string; bg: string }> = {
    important_urgent: {
        label: 'Important + Urgent',
        sublabel: 'Do First',
        color: '#ef4444',
        bg: 'rgba(239,68,68,0.12)',
    },
    important_not_urgent: {
        label: 'Important + Not Urgent',
        sublabel: 'Schedule',
        color: '#f59e0b',
        bg: 'rgba(245,158,11,0.12)',
    },
    not_important_urgent: {
        label: 'Not Important + Urgent',
        sublabel: 'Delegate',
        color: '#3b82f6',
        bg: 'rgba(59,130,246,0.12)',
    },
    not_important_not_urgent: {
        label: 'Not Important + Not Urgent',
        sublabel: 'Eliminate',
        color: '#6b7280',
        bg: 'rgba(107,114,128,0.12)',
    },
};

export const createCategorySchema = z.object({
    name: z.string().min(1, "Category name is required"),
    color: z.string().regex(/^#([0-9a-f]{3}){1,2}$/i, "Invalid hex color"),
});

export const createTaskSchema = z.object({
    title: z.string().min(1, "Title is required"),
    description: z.string().optional(),
    estimated_duration: z.number().min(1).optional(),
    category_id: z.string().uuid().optional(),
    new_category: createCategorySchema.optional(),
    due_date: z.string().optional(),
    priority: z.enum(PRIORITY_VALUES).optional(),
});

export const updateTaskSchema = z.object({
    id: z.string().uuid(),
    title: z.string().min(1).optional(),
    description: z.string().optional(),
    is_completed: z.boolean().optional(),
    estimated_duration: z.number().min(1).optional(),
    category_id: z.string().uuid().nullable().optional(),
    due_date: z.string().optional(),
    priority: z.enum(PRIORITY_VALUES).optional().nullable(),
});

export type CreateCategoryInput = z.infer<typeof createCategorySchema>;
export type CreateTaskInput = z.infer<typeof createTaskSchema>;
export type UpdateTaskInput = z.infer<typeof updateTaskSchema>;
