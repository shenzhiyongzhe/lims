"use client";
import { ReactNode } from "react";
import { usePathname } from "next/navigation";
import Sidebar from "../_components/Sidebar";

export default function DashboardLayout({ children }: { children: ReactNode }) {
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
