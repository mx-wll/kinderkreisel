import { BottomNav } from "@/components/bottom-nav";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-svh flex-col">
      <main className="flex-1 pb-20">{children}</main>
      <BottomNav />
    </div>
  );
}
