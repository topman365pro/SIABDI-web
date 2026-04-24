import { describe, expect, it } from "vitest";
import { loginFormSchema } from "@/lib/forms/login";

describe("login form validation", () => {
  it("accepts a valid login payload and normalizable API endpoint", () => {
    const parsed = loginFormSchema.safeParse({
      username: "guru.mapel",
      password: "Password123!",
      apiBaseUrl: "http://localhost:3000"
    });

    expect(parsed.success).toBe(true);
  });

  it("rejects short passwords and invalid endpoints", () => {
    const parsed = loginFormSchema.safeParse({
      username: "gu",
      password: "123",
      apiBaseUrl: "not-a-url"
    });

    expect(parsed.success).toBe(false);
  });
});
