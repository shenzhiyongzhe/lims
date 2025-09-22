"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const navItems = [
  { href: "/user/dashboard", label: "首页", icon: "🏠" },
  { href: "/user/dashboard/profile", label: "个人信息", icon: "👤" },
  { href: "/user/dashboard/history", label: "还款记录", icon: "📋" },
];

export default function UserSidebar() {
  const pathname = usePathname();

  return (
    <aside className="w-64 bg-white border-r border-gray-200 hidden md:flex md:flex-col">
      <div className="h-16 flex items-center px-4 border-b border-gray-200">
        <span className="text-lg font-semibold text-gray-900">用户中心</span>
      </div>
      <nav className="flex-1 p-3 space-y-1">
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={
                `flex items-center px-3 py-2 rounded-md text-sm transition ` +
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
        <Link
          href="/"
          className="flex items-center px-3 py-2 text-sm text-gray-600 hover:bg-gray-50 rounded-md"
        >
          <span className="mr-3">🚪</span>
          退出登录
        </Link>
      </div>
    </aside>
  );
}
