"use server";

import { prisma } from "@/lib/db";
import { revalidatePath } from "next/cache";

export async function createIssue(customerId: string, formData: FormData) {
  const title = String(formData.get("title") ?? "").trim();
  if (!title) throw new Error("Titel fehlt");
  const priceRaw = String(formData.get("price") ?? "").replace(",", ".");
  const details = String(formData.get("details") ?? "");
  await prisma.issue.create({
    data: {
      title,
      details,
      price: priceRaw ? Number(priceRaw) : null,
      customerId,
    },
  });
  revalidatePath(`/kunden/${customerId}`);
  revalidatePath("/dashboard");
}

export async function toggleIssue(id: string) {
  const i = await prisma.issue.findUnique({ where: { id } });
  if (!i) return;
  await prisma.issue.update({
    where: { id },
    data: { done: !i.done, doneAt: !i.done ? new Date() : null },
  });
  revalidatePath(`/kunden/${i.customerId}`);
}

export async function deleteIssue(id: string) {
  const i = await prisma.issue.findUnique({ where: { id } });
  if (!i) return;
  await prisma.issue.delete({ where: { id } });
  revalidatePath(`/kunden/${i.customerId}`);
}
