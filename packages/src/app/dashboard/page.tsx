import { Suspense } from "react";
import DashboardPage from "./DashboardPage";

export const dynamic = "force-dynamic"; // optional but useful

export default function Page() {
  return (
    <Suspense
      fallback={<div className="p-8 text-center">Loading dashboard…</div>}
    >
      <DashboardPage />
    </Suspense>
  );
}
