"use server";

import { prisma } from "@/lib/db";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

type LeadStatus = "NEW" | "CONTACTED" | "MEETING" | "PROPOSAL" | "WON" | "LOST";

export async function createLead(formData: FormData) {
  const name = String(formData.get("name") ?? "").trim();
  if (!name) throw new Error("Name erforderlich");
  const expected = String(formData.get("expectedValue") ?? "").replace(",", ".");
  await prisma.lead.create({
    data: {
      name,
      company: String(formData.get("company") ?? ""),
      email: String(formData.get("email") ?? ""),
      phone: String(formData.get("phone") ?? ""),
      source: String(formData.get("source") ?? ""),
      offerDescription: String(formData.get("offerDescription") ?? ""),
      expectedValue: expected ? Number(expected) : null,
      status: "NEW",
    },
  });
  revalidatePath("/leads");
}

export async function setLeadStatus(id: string, status: LeadStatus) {
  await prisma.lead.update({
    where: { id },
    data: { status, lastContactAt: new Date() },
  });
  revalidatePath("/leads");
}

export async function deleteLead(id: string) {
  await prisma.lead.delete({ where: { id } });
  revalidatePath("/leads");
}

export async function convertLeadToCustomer(id: string) {
  const lead = await prisma.lead.findUnique({ where: { id } });
  if (!lead) throw new Error("Lead nicht gefunden");
  const customer = await prisma.customer.create({
    data: {
      name: lead.name,
      company: lead.company,
      email: lead.email,
      phone: lead.phone,
      notes: `Aus Lead konvertiert. Quelle: ${lead.source || "—"}\n${lead.notes}`,
    },
  });
  await prisma.lead.update({ where: { id }, data: { status: "WON", lastContactAt: new Date() } });
  revalidatePath("/leads");
  revalidatePath("/kunden");
  redirect(`/kunden/${customer.id}`);
}
