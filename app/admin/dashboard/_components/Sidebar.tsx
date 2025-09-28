"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";

const navItems = [
  { href: "/admin/dashboard/users", label: "后台用户管理", icon: "🏠" },
  { href: "/admin/dashboard/risk_controller", label: "风控人页面", icon: "🏠" },
  { href: "/admin/dashboard/collector", label: "负责人管理", icon: "🏠" },
  {
    href: "/admin/dashboard/payee/management",
    label: "添加收款人",
    icon: "🏠",
  },
  { href: "/admin/dashboard/payee/qrcode", label: "添加收款码", icon: "🏠" },
  { href: "/admin/dashboard/stats", label: "统计", icon: "🏠" },
];

export default function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();

  async function handleLogout(e: React.MouseEvent) {
    e.preventDefault();
    try {
      await fetch("/api/auth/logout", { method: "POST" });
    } finally {
      router.replace("/admin/login");
    }
  }

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
      <div className="p-4 border-t border-gray-200">
        <button
          onClick={handleLogout}
          className="flex items-center px-3 py-2 text-sm text-gray-600 hover:bg-gray-50 rounded-md w-full text-left"
        >
          <span className="mr-3">🚪</span>
          退出登录
        </button>
      </div>
    </aside>
  );
}
