import { z } from 'zod';

export const RegisterSchema = z.object({
  email: z.email(),
  password: z.string().min(6),
});

export const LoginSchema = z.object({
  identifier: z.string().min(1),
  password: z.string(),
});

export const RefreshSchema = z.object({
  refreshToken: z.string(),
});

export type LoginIdentifier =
  | { type: 'email'; value: string }
  | { type: 'phone'; value: string };

export type RegisterInput = z.infer<typeof RegisterSchema>;
export type LoginInput = z.infer<typeof LoginSchema>;
export type RefreshInput = z.infer<typeof RefreshSchema>;
