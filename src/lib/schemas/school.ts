import { z } from 'zod';

export const circuitSchema = z.object({
  name: z.string().min(2, 'Circuit name is required'),
  code: z.string().optional().default(''),
  is_active: z.boolean().default(true),
});

export type CircuitInput = z.infer<typeof circuitSchema>;

export const schoolSchema = z.object({
  name: z.string().min(2, 'School name is required'),
  status: z.enum(['public', 'private']),
  circuit_id: z.string().uuid('Please select an active circuit'),
  emis_code: z.string().optional().default(''),
  town: z.string().optional().default(''),
  default_levels: z
    .array(z.enum(['creche', 'kg', 'primary', 'jhs', 'shs']))
    .min(1, 'Select at least one starting level'),
  headteacher_name: z.string().optional().default(''),
  headteacher_phone: z.string().optional().default(''),
  assistant_headteacher_name: z.string().optional().default(''),
  assistant_headteacher_phone: z.string().optional().default(''),
  is_active: z.boolean().default(true),
});

export type SchoolInput = z.infer<typeof schoolSchema>;

export const roundSchema = z.object({
  title: z.string().min(3, 'Round title is required (e.g. 2025/2026 Academic Year)'),
  instructions: z.string().optional().default(''),
  opening_date: z.string().min(4, 'Opening date is required'),
  deadline: z.string().min(4, 'Deadline date and time are required'),
  is_active: z.boolean().default(false),
  is_locked: z.boolean().default(false),
});

export type RoundInput = z.infer<typeof roundSchema>;

// Bulk school import row schema
export const bulkImportRowSchema = z.object({
  school_name: z.string().min(2, 'School name is required'),
  status: z.enum(['public', 'private']),
  circuit: z.string().min(1, 'Circuit is required'),
  levels: z.string().optional().default('Primary'),
  town: z.string().optional().default(''),
  emis_code: z.string().optional().default(''),
});

export type BulkImportRow = z.infer<typeof bulkImportRowSchema>;
