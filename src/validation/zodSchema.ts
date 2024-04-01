import { z } from "zod";
export const paginationQuery = z.object({
  limit: z.coerce.number(),
  page: z.coerce.number(),
});

export const createSchemaValidation = z.object({
  name: z.string().min(1, { message: "name required" }),
  email: z.string().email(),
});

export const updateSchemaValidation = createSchemaValidation.extend({
  id: z.coerce.number(),
});

export const deleteParamsSchema = z.object({
  id: z.coerce.number(),
});

export const ratingSchemaValidation = z.object({
  student_id: z.coerce.number(),
  teacher_id: z.coerce.number(),
  rate: z.coerce
    .number()
    .min(1.0)
    .max(5.0)
    .refine(
      (value) => {
        const increment = 0.1;
        return (value * 10) % (increment * 10) === 0;
      },
      {
        message: "Rate must be in the range 1.0 to 5.0 with increments of 0.1",
      }
    ),
});
