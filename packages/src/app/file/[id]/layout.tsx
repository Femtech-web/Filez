import { AnimatedSidebar } from "@/components/animated-sidebar";

export default function FileLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex h-screen overflow-hidden">
      <div className="hidden lg:block">
        <AnimatedSidebar variant="desktop" />
      </div>
      <AnimatedSidebar variant="mobile" />
      <main className="flex-1 overflow-y-auto w-full pt-16 lg:pt-0">
        {children}
      </main>
    </div>
  );
}
