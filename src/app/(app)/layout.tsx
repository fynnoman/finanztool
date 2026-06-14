import { Sidebar } from "@/components/Sidebar";
import { Providers } from "@/components/Providers";
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
  const session = await auth().catch(() => null);
  if (!session?.user) redirect("/login");

  const settings = await prisma.businessSettings.findFirst();
  const businessName = settings?.businessName ?? "Mein Unternehmen";

  return (
    <Providers>
      <div className="flex min-h-screen">
        <Sidebar businessName={businessName} />
        <main className="flex-1 overflow-x-auto">
          <div className="mx-auto max-w-6xl px-8 py-8">{children}</div>
        </main>
      </div>
    </Providers>
  );
}
