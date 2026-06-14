"use server";

import { prisma } from "@/lib/db";
import { revalidatePath } from "next/cache";

export async function createCashIncome(formData: FormData) {
  const details = String(formData.get("details") ?? "").trim();
  const amount = Number(String(formData.get("amount") ?? "0").replace(",", ".")) || 0;
  const date = new Date(String(formData.get("date") || new Date().toISOString().slice(0, 10)));
  const customerId = String(formData.get("customerId") ?? "") || null;
  const notes = String(formData.get("notes") ?? "");
  if (!details || amount <= 0) throw new Error("Beschreibung und Betrag erforderlich");
  await prisma.cashIncome.create({
    data: { details, amount, date, notes, customerId: customerId || undefined },
  });
  revalidatePath("/bareinnahmen");
  revalidatePath("/dashboard");
}

export async function deleteCashIncome(id: string) {
  await prisma.cashIncome.delete({ where: { id } });
  revalidatePath("/bareinnahmen");
  revalidatePath("/dashboard");
}
