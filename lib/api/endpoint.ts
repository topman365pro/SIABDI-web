import Cookies from "js-cookie";

export const API_ENDPOINT_STORAGE_KEY = "attendance_api_base_url";
export const API_ENDPOINT_COOKIE_NAME = "attendance_api_base_url";
export const DEFAULT_API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:3000/api/v1";

export function normalizeApiBaseUrl(value: string) {
  const trimmed = value.trim().replace(/\/+$/, "");
  const url = new URL(trimmed);
  const pathname = url.pathname.replace(/\/+$/, "");

  if (pathname === "" || pathname === "/") {
    url.pathname = "/api/v1";
  } else if (pathname === "/api") {
    url.pathname = "/api/v1";
  } else if (!pathname.endsWith("/api/v1")) {
    url.pathname = `${pathname}/api/v1`.replace(/\/{2,}/g, "/");
  }

  url.search = "";
  url.hash = "";

  return url.toString().replace(/\/+$/, "");
}

export function isValidApiBaseUrl(value: string) {
  try {
    const url = new URL(normalizeApiBaseUrl(value));
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
}

export function getClientApiBaseUrl() {
  if (typeof window === "undefined") {
    return normalizeApiBaseUrl(DEFAULT_API_BASE_URL);
  }

  const stored = window.localStorage.getItem(API_ENDPOINT_STORAGE_KEY);
  return normalizeApiBaseUrl(stored || DEFAULT_API_BASE_URL);
}

export function persistClientApiBaseUrl(value: string) {
  const normalized = normalizeApiBaseUrl(value);
  window.localStorage.setItem(API_ENDPOINT_STORAGE_KEY, normalized);
  Cookies.set(API_ENDPOINT_COOKIE_NAME, normalized, {
    sameSite: "lax",
    expires: 30
  });
  return normalized;
}

export function resetClientApiBaseUrl() {
  window.localStorage.removeItem(API_ENDPOINT_STORAGE_KEY);
  Cookies.remove(API_ENDPOINT_COOKIE_NAME);
}
