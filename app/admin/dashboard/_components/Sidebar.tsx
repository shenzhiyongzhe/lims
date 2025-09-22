"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const navItems = [
  { href: "/admin/dashboard/users", label: "后台用户管理", icon: "🏠" },
  { href: "/admin/dashboard/risk_controller", label: "风控人页面", icon: "🏠" },
  { href: "/admin/dashboard/collector", label: "负责人管理", icon: "🏠" },
  { href: "/admin/dashboard/payee", label: "收款人页面", icon: "🏠" },
  { href: "/admin/dashboard/stats", label: "统计", icon: "🏠" },
];

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="w-64 bg-white border-r border-gray-200 hidden md:flex md:flex-col">
      <div className="h-16 flex items-center px-4 border-b border-gray-200">
        <span className="text-lg font-semibold text-gray-900">管理后台</span>
      </div>
      <nav className="flex-1 p-3 space-y-1">
        {navItems.map((item) => {
          const isActive =
            pathname === item.href || pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={
                `block px-3 py-2 rounded-md text-sm transition ` +
                (isActive
                  ? "bg-blue-50 text-blue-700 border border-blue-200"
                  : "text-gray-700 hover:bg-gray-50")
              }
            >
              <span className="mr-3 text-lg">{item.icon}</span>
              {item.label}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
