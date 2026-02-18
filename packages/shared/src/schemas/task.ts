import { z } from 'zod';

export const createCategorySchema = z.object({
    name: z.string().min(1, "Category name is required"),
    color: z.string().regex(/^#([0-9a-f]{3}){1,2}$/i, "Invalid hex color"),
});

export const createTaskSchema = z.object({
    title: z.string().min(1, "Title is required"),
    description: z.string().optional(),
    estimated_duration: z.number().min(1).optional(),
    category_id: z.string().uuid().optional(),
    // For creating a new category inline
    new_category: createCategorySchema.optional(),
    due_date: z.string().optional(), // ISO date string
});

export const updateTaskSchema = z.object({
    id: z.string().uuid(),
    title: z.string().min(1).optional(),
    description: z.string().optional(),
    is_completed: z.boolean().optional(),
    estimated_duration: z.number().min(1).optional(),
    category_id: z.string().uuid().nullable().optional(),
    due_date: z.string().optional(),
});

export type CreateCategoryInput = z.infer<typeof createCategorySchema>;
export type CreateTaskInput = z.infer<typeof createTaskSchema>;
export type UpdateTaskInput = z.infer<typeof updateTaskSchema>;
