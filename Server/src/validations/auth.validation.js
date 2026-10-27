import { z } from "zod";

const loginSchema = z.object({
  body: z.object({
    email: z.string().trim().email("Invalid email address"),

    password: z.string().min(1, "Password is required"),
  }),
});

export { loginSchema };
