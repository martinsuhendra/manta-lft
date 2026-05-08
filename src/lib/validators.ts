import { z } from "zod";

function normalizePhoneNumber(value: string) {
  return value.replace(/\D/g, "");
}

// Sign in schema
export const signInFormSchema = z.object({
  email: z.string().email({ message: "Invalid email address" }),
  password: z.string().min(6, { message: "Password must be at least 6 characters" }),
  remember: z.preprocess((value) => value === true || value === "true" || value === "on", z.boolean()).default(false),
});

const signUpFieldsBaseSchema = z.object({
  name: z.string().min(1, { message: "Name is required" }),
  email: z.string().email({ message: "Invalid email address" }),
  phoneNo: z
    .string()
    .min(10, { message: "Phone number must be at least 10 digits" })
    .max(15, { message: "Phone number must be at most 15 digits" })
    .regex(/^[0-9+\-\s()]+$/, { message: "Invalid phone number format" }),
  emergencyContact: z
    .string()
    .min(10, { message: "Emergency contact must be at least 10 digits" })
    .max(15, { message: "Emergency contact must be at most 15 digits" })
    .regex(/^[0-9+\-\s()]+$/, { message: "Invalid emergency contact format" }),
  emergencyContactName: z.string().min(1, { message: "Emergency contact name is required" }),
  birthday: z
    .string({ required_error: "Birthday is required" })
    .min(1, { message: "Birthday is required" })
    .refine((s) => !Number.isNaN(new Date(s).getTime()), { message: "Invalid date" })
    .refine((s) => new Date(s).getTime() < Date.now(), { message: "Birthday must be in the past" }),
  waiverVersion: z.number().int().positive({ message: "Waiver version is required" }),
  acceptWaiver: z.boolean().refine((value) => value, { message: "You must agree to the waiver" }),
  password: z.string().min(6, { message: "Password must be at least 6 characters" }),
  confirmPassword: z.string().min(6, { message: "Confirm password must be at least 6 characters" }),
});

// Sign up (fields only — used for `.pick()` on register API)
export const signUpFormFieldsSchema = signUpFieldsBaseSchema.superRefine((data, ctx) => {
  if (normalizePhoneNumber(data.phoneNo) !== normalizePhoneNumber(data.emergencyContact)) return;
  ctx.addIssue({
    code: "custom",
    message: "Emergency contact must be different from phone number",
    path: ["emergencyContact"],
  });
});

// Full sign-up form (includes confirm password check)
export const signUpFormSchema = signUpFormFieldsSchema.refine((data) => data.password === data.confirmPassword, {
  path: ["confirmPassword"],
  message: "Passwords do not match",
});

/** Body for `POST /api/auth/register` (no confirmPassword) */
export const registerBodySchema = signUpFieldsBaseSchema.pick({
  email: true,
  password: true,
  name: true,
  phoneNo: true,
  emergencyContact: true,
  emergencyContactName: true,
  birthday: true,
  waiverVersion: true,
  acceptWaiver: true,
});
