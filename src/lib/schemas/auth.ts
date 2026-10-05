import { z } from 'zod';

export const headteacherLoginSchema = z.object({
  school_login_id: z
    .string()
    .min(1, 'School Login ID is required')
    .transform((val) => val.trim().toUpperCase())
    .refine((val) => /^AMD-\d{4,}$/.test(val), {
      message: 'Format must be AMD-XXXX (e.g. AMD-0042)',
    }),
  pin: z
    .string()
    .min(1, 'PIN is required')
    .refine((val) => /^\d{6}$/.test(val), {
      message: 'PIN must be exactly 6 digits',
    }),
});

export type HeadteacherLoginInput = z.infer<typeof headteacherLoginSchema>;

export const adminLoginSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

export type AdminLoginInput = z.infer<typeof adminLoginSchema>;

export const changePinSchema = z
  .object({
    current_pin: z.string().min(6, 'Current PIN must be 6 digits'),
    new_pin: z.string().regex(/^\d{6}$/, 'New PIN must be exactly 6 digits'),
    confirm_pin: z.string().regex(/^\d{6}$/, 'Confirm PIN must be exactly 6 digits'),
  })
  .refine((data) => data.new_pin === data.confirm_pin, {
    message: "New PIN and Confirmation PIN do not match",
    path: ['confirm_pin'],
  })
  .refine((data) => data.current_pin !== data.new_pin, {
    message: 'New PIN must be different from current PIN',
    path: ['new_pin'],
  });

export type ChangePinInput = z.infer<typeof changePinSchema>;
