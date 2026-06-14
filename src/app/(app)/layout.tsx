import { Sidebar } from "@/components/Sidebar";
import { Providers } from "@/components/Providers";
import { prisma } from "@/lib/db";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
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
