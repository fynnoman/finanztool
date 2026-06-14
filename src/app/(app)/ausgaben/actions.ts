"use server";

import { prisma } from "@/lib/db";
import { revalidatePath } from "next/cache";
import { round2 } from "@/lib/money";

const CATEGORIES = [
  "Software",
  "Büro",
  "Werbung",
  "Fortbildung",
  "Fahrtkosten",
  "Telefon/Internet",
  "Steuerberater",
  "Versicherung",
  "Sonstiges",
];

export const expenseCategories = () => CATEGORIES;

export async function createExpense(formData: FormData) {
  const details = String(formData.get("details") ?? "").trim();
  const gross = Number(String(formData.get("gross") ?? "0").replace(",", ".")) || 0;
  const vatRate = Number(String(formData.get("vatRate") ?? "19").replace(",", ".")) || 0;
  const date = new Date(String(formData.get("date") || new Date().toISOString().slice(0, 10)));
  const category = String(formData.get("category") ?? "Sonstiges");
  const notes = String(formData.get("notes") ?? "");
  if (!details || gross <= 0) throw new Error("Beschreibung und Brutto-Betrag erforderlich");

  const net = round2(gross / (1 + vatRate / 100));
  const vatAmount = round2(gross - net);

  await prisma.deductibleExpense.create({
    data: { details, gross, net, vatAmount, vatRate, date, category, notes },
  });
  revalidatePath("/ausgaben");
  revalidatePath("/steuern");
}

export async function deleteExpense(id: string) {
  await prisma.deductibleExpense.delete({ where: { id } });
  revalidatePath("/ausgaben");
  revalidatePath("/steuern");
}
