"use server";

import { prisma } from "@/lib/db";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";

const CustomerSchema = z.object({
  name: z.string().trim().min(1, "Name fehlt"),
  company: z.string().optional().default(""),
  email: z.string().optional().default(""),
  phone: z.string().optional().default(""),
  address: z.string().optional().default(""),
  taxId: z.string().optional().default(""),
  notes: z.string().optional().default(""),
});

export async function createCustomer(formData: FormData) {
  const parsed = CustomerSchema.parse({
    name: formData.get("name"),
    company: formData.get("company") ?? "",
    email: formData.get("email") ?? "",
    phone: formData.get("phone") ?? "",
    address: formData.get("address") ?? "",
    taxId: formData.get("taxId") ?? "",
    notes: formData.get("notes") ?? "",
  });

  // Idempotenz-Netz: gleicher Kunde (name + email) in den letzten 15 s → wiederverwenden.
  // Schützt vor Mehrfach-Submits durch zappelnde Klicks während Cold-Start.
  const recent = await prisma.customer.findFirst({
    where: {
      name: parsed.name,
      email: parsed.email,
      createdAt: { gte: new Date(Date.now() - 15_000) },
    },
    orderBy: { createdAt: "desc" },
  });
  if (recent) {
    revalidatePath("/kunden");
    redirect(`/kunden/${recent.id}`);
  }

  const created = await prisma.customer.create({ data: parsed });
  revalidatePath("/kunden");
  redirect(`/kunden/${created.id}`);
}

export async function updateCustomer(id: string, formData: FormData) {
  const parsed = CustomerSchema.parse({
    name: formData.get("name"),
    company: formData.get("company") ?? "",
    email: formData.get("email") ?? "",
    phone: formData.get("phone") ?? "",
    address: formData.get("address") ?? "",
    taxId: formData.get("taxId") ?? "",
    notes: formData.get("notes") ?? "",
  });
  await prisma.customer.update({ where: { id }, data: parsed });
  revalidatePath("/kunden");
  revalidatePath(`/kunden/${id}`);
}

export async function deleteCustomer(id: string) {
  await prisma.customer.delete({ where: { id } });
  revalidatePath("/kunden");
  redirect("/kunden");
}
