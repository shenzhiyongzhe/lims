"use client";
import { ReactNode, Suspense } from "react";
import { usePathname } from "next/navigation";
import Sidebar from "../_components/Sidebar";

function DashboardContent({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const hideSidebarRoutes = ["/page/login", "/page/shared"]; // 需要隐藏侧边栏的路由
  const hideSidebar = hideSidebarRoutes.includes(pathname);

  if (hideSidebar) {
    return (
      <div className="min-h-screen bg-gray-100">
        <main className=" ">{children}</main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <div className="flex min-h-screen">
        <Sidebar />
        <main className="flex-1 p-6 md:p-8 overflow-auto">{children}</main>
      </div>
    </div>
  );
}

export default function DashboardLayout({ children }: { children: ReactNode }) {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-gray-100">
          <div className="flex items-center justify-center h-screen">
            <div className="animate-pulse">
              <div className="h-8 bg-gray-200 rounded w-1/3 mx-auto mb-4"></div>
              <div className="h-4 bg-gray-200 rounded w-1/4 mx-auto"></div>
            </div>
          </div>
        </div>
      }
    >
      <DashboardContent>{children}</DashboardContent>
    </Suspense>
  );
}
