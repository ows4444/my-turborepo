import { z } from 'zod';

export const clientSchema = z.object({
  NEXT_PUBLIC_API_URL: z.string().url(),
});

export type ClientEnv = z.infer<typeof clientSchema>;

export const parseClientEnv = () => clientSchema.parse(process.env);