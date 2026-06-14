import { format, parseISO, addDays } from "date-fns";
import { de } from "date-fns/locale";

export const fmtDate = (d: Date | string | null | undefined): string => {
  if (!d) return "—";
  const date = typeof d === "string" ? parseISO(d) : d;
  return format(date, "dd.MM.yyyy", { locale: de });
};

export const fmtDateTime = (d: Date | string | null | undefined): string => {
  if (!d) return "—";
  const date = typeof d === "string" ? parseISO(d) : d;
  return format(date, "dd.MM.yyyy HH:mm", { locale: de });
};

export const fmtMonth = (d: Date): string => format(d, "LLLL yyyy", { locale: de });

export const toInputDate = (d: Date | string | null | undefined): string => {
  if (!d) return "";
  const date = typeof d === "string" ? parseISO(d) : d;
  return format(date, "yyyy-MM-dd");
};

export { addDays };
