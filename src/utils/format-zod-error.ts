import { ZodError } from "zod";

export const formatZodError = (error: ZodError) => {
  return error.issues.map((issue) => issue.message).join("\n");
};
