import { Sidebar } from "@/components/Sidebar";
import { prisma } from "@/lib/db";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";

// Alle geschützten App-Pages sind dynamisch — sie lesen jederzeit aktuelle DB-Daten,
// dürfen also nicht zur Build-Zeit pre-rendered werden.
export const dynamic = "force-dynamic";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  // Echte Auth-Prüfung passiert hier, nicht in der Middleware — so kann
  // die Middleware Edge-light bleiben und der Layout-Check JWT + DB-Zugriff machen.
  // Wir fangen Fehler ab, damit ein verfälschter Cookie keine 500er auslöst:
  // im Zweifel zurück zum Login.
  // Auth-Verifikation und Settings-Lookup parallel — Auth ist ein JWT-decode
  // (CPU-bound), Settings ist ein DB-Call. Sequenziell wären das zwei Wartezeiten.
  const [session, existing] = await Promise.all([
    auth().catch(() => null),
    prisma.businessSettings.findFirst(),
  ]);
  if (!session?.user) redirect("/login");

  // Stammdaten-Zeile idempotent sicherstellen — sonst crashen PDF-/ZUGFeRD-
  // Endpoints, Numbering und die Einstellungs-Seite, sobald jemand die App
  // mit frischer DB ohne Seed startet.
  const settings =
    existing ??
    (await prisma.businessSettings.create({
      data: { businessName: "Mein Unternehmen" },
    }));
  const businessName = settings.businessName;

  return (
    <div className="flex min-h-screen">
      <Sidebar businessName={businessName} />
      <main className="flex-1 overflow-x-auto">
        <div className="mx-auto max-w-6xl px-8 py-8">{children}</div>
      </main>
    </div>
  );
}
