import { z } from "zod";

export const apiResponseSchema = <T extends z.ZodTypeAny>(dataSchema: T) =>
  z.object({
    data: dataSchema,
    meta: z
      .object({
        nextStep: z.string().optional(),
      })
      .optional(),
    error: z.string().optional(),
  });
