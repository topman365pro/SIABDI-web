import { format } from "date-fns";

export function formatDisplayDate(value?: string | Date | null) {
  if (!value) {
    return "-";
  }

  return format(new Date(value), "dd MMM yyyy");
}

export function formatTime(value?: string | null) {
  if (!value) {
    return "-";
  }

  if (/^\d{2}:\d{2}/.test(value)) {
    return value.slice(0, 5);
  }

  const date = new Date(value);

  if (!Number.isNaN(date.getTime())) {
    return format(date, "HH:mm");
  }

  return value.slice(0, 5);
}

export function titleCase(value: string) {
  return value
    .replace(/[-_]/g, " ")
    .replace(/\b\w/g, (char) => char.toUpperCase());
}
