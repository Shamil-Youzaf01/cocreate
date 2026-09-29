import { z } from "zod";

const registerSchema = z.object({
  body: z.object({
    name: z
      .string()
      .trim()
      .min(2, "Name must be at least 2 characters")
      .max(50),

    email: z
      .string()
      .trim()
      .email("Invalid email address")
      .transform((value) => value.toLowerCase()),

    password: z.string().min(8, "Password must be at least 8 characters"),

    role: z.enum(["CREATOR", "BRAND"]),
  }),
});

const loginSchema = z.object({
  body: z.object({
    email: z.string().trim().email("Invalid email address"),

    password: z.string().min(1, "Password is required"),
  }),
});

export { registerSchema, loginSchema };
