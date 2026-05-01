import { z } from 'zod';

export const CreateLinkSchema = z.object({
  title: z.string().min(1),
  url: z.string().url(),
  description: z.string(),
});

export const UpdateLinkSchema = CreateLinkSchema.partial();

export type CreateLink = z.infer<typeof CreateLinkSchema>;
export type UpdateLink = z.infer<typeof UpdateLinkSchema>;
