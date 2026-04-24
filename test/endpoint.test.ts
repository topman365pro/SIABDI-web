import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  API_ENDPOINT_STORAGE_KEY,
  isValidApiBaseUrl,
  normalizeApiBaseUrl,
  persistClientApiBaseUrl
} from "@/lib/api/endpoint";

describe("api endpoint helpers", () => {
  beforeEach(() => {
    const store = new Map<string, string>();

    vi.stubGlobal("window", {
      localStorage: {
        getItem: (key: string) => store.get(key) ?? null,
        setItem: (key: string, value: string) => store.set(key, value),
        removeItem: (key: string) => store.delete(key)
      }
    });
  });

  it("normalizes an origin to the backend versioned prefix", () => {
    expect(normalizeApiBaseUrl("http://localhost:3000")).toBe("http://localhost:3000/api/v1");
  });

  it("normalizes /api to /api/v1", () => {
    expect(normalizeApiBaseUrl("https://school.test/api/")).toBe("https://school.test/api/v1");
  });

  it("validates only http and https URLs", () => {
    expect(isValidApiBaseUrl("https://school.test/api/v1")).toBe(true);
    expect(isValidApiBaseUrl("ftp://school.test/api/v1")).toBe(false);
  });

  it("persists the normalized endpoint", () => {
    const normalized = persistClientApiBaseUrl("http://127.0.0.1:3000");

    expect(normalized).toBe("http://127.0.0.1:3000/api/v1");
    expect(window.localStorage.getItem(API_ENDPOINT_STORAGE_KEY)).toBe(normalized);
  });
});
