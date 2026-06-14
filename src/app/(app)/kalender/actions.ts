"use server";

import { prisma } from "@/lib/db";
import { revalidatePath } from "next/cache";

export async function createEvent(formData: FormData) {
  const title = String(formData.get("title") ?? "").trim();
  if (!title) throw new Error("Titel fehlt");
  const startStr = String(formData.get("start") ?? "");
  if (!startStr) throw new Error("Datum fehlt");
  const start = new Date(startStr);
  const endStr = String(formData.get("end") ?? "");
  const end = endStr ? new Date(endStr) : start;
  const details = String(formData.get("details") ?? "");
  const customerId = String(formData.get("customerId") ?? "") || null;

  await prisma.calendarEvent.create({
    data: {
      title,
      details,
      start,
      end,
      allDay: true,
      kind: "TERMIN",
      customerId: customerId || undefined,
    },
  });

  revalidatePath("/kalender");
}

export async function toggleEventComplete(id: string) {
  const e = await prisma.calendarEvent.findUnique({ where: { id } });
  if (!e) return;
  await prisma.calendarEvent.update({ where: { id }, data: { completed: !e.completed } });
  revalidatePath("/kalender");
}

export async function deleteEvent(id: string) {
  await prisma.calendarEvent.delete({ where: { id } });
  revalidatePath("/kalender");
}
