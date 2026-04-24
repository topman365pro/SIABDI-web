import { z } from "zod";
import { isValidApiBaseUrl } from "@/lib/api/endpoint";

export const loginFormSchema = z.object({
  username: z.string().min(3, "Username wajib diisi."),
  password: z.string().min(6, "Password minimal 6 karakter."),
  apiBaseUrl: z
    .string()
    .min(1, "API endpoint wajib diisi.")
    .refine(isValidApiBaseUrl, "Masukkan URL API yang valid, contoh: http://IP-VPS:3000/api/v1")
});

export type LoginFormValues = z.infer<typeof loginFormSchema>;
