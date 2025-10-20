"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { Role } from "@/lib/constants";

type NavItem = {
  href: string;
  label: string;
  icon: string;
  roles?: Role[]; // 若不填表示仅管理员；管理员始终可见全部
};

const NAV_ITEMS: NavItem[] = [
  {
    href: "/page/admin/management",
    label: "后台用户",
    icon: "🏠",
    roles: ["管理员"],
  },
  {
    href: "/page/admin/visitors",
    label: "访客统计",
    icon: "📊",
    roles: ["管理员"],
  },
  {
    href: "/page/users/management",
    label: "客户管理",
    icon: "🏠",
    roles: ["收款人", "负责人", "风控人"],
  },
  {
    href: "/page/users/list",
    label: "客户列表",
    icon: "🏠",
    roles: ["收款人", "负责人", "风控人"],
  },
  {
    href: "/page/loan/list",
    label: "贷款列表",
    icon: "🏠",
    roles: ["收款人", "负责人", "风控人"],
  },
  {
    href: "/page/loan/add",
    label: "添加贷款计划",
    icon: "🏠",
    roles: ["管理员", "风控人"],
  },
  {
    href: "/page/risk_controller",
    label: "风控人页面",
    icon: "🏠",
    roles: ["风控人"],
  },
  {
    href: "/page/collector",
    label: "负责人页面",
    icon: "🏠",
    roles: ["负责人"],
  },
  {
    href: "/page/payee/management",
    label: "添加收款人",
    icon: "🏠",
  },
  {
    href: "/page/payee",
    label: "收款人页面",
    icon: "🏠",
    roles: ["收款人"],
  },
  {
    href: "/page/payee/qrcode",
    label: "添加收款码",
    icon: "🏠",
    roles: ["收款人"],
  },
  {
    href: "/page/feedback",
    label: "反馈管理",
    icon: "🏠",
    roles: ["管理员", "风控人", "负责人", "收款人", "打款人", "财务员"],
  },
];

export default function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const [role, setRole] = useState<Role | "">("");
  const [mounted, setMounted] = useState(false);

  async function handleLogout(e: React.MouseEvent) {
    e.preventDefault();
    try {
      await fetch("/auth/logout", { method: "POST" });
    } finally {
      router.replace("/page/login");
    }
  }

  // 读取登录角色（优先 localStorage，其次 cookie）
  useEffect(() => {
    try {
      const fromLS =
        typeof window !== "undefined" && localStorage.getItem("admin");
      if (fromLS) {
        const parsed = JSON.parse(fromLS);
        if (parsed?.role) setRole(parsed.role as Role);
        setMounted(true);
        return;
      }
      const cookie = typeof document !== "undefined" ? document.cookie : "";
      const m = cookie.match(/(?:^|; )admin=([^;]+)/);
      if (m) {
        const decoded = decodeURIComponent(m[1]);
        const parsed = JSON.parse(decoded);
        if (parsed?.role) setRole(parsed.role as Role);
      }
      setMounted(true);
    } catch {}
  }, []);

  const filteredItems = useMemo(() => {
    if (role === "管理员" || !role) return NAV_ITEMS;
    return NAV_ITEMS.filter((it) => {
      if (!it.roles) return false; // 未显式授权则默认仅管理员可见
      return it.roles.includes(role);
    });
  }, [role]);

  // 浮动导航球（仅移动端显示）
  const [fabOpen, setFabOpen] = useState(false);
  const [pos, setPos] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const dragging = useRef(false);
  const offset = useRef<{ x: number; y: number }>({ x: 0, y: 0 });

  useEffect(() => {
    // 初始定位到右下角
    const init = () => {
      const vw = window.innerWidth;
      const vh = window.innerHeight;
      const size = 56; // 直径
      setPos({ x: vw - size - 16, y: vh - size - 24 });
    };
    init();
    window.addEventListener("resize", init);
    return () => window.removeEventListener("resize", init);
  }, []);

  useEffect(() => {
    const onMove = (e: MouseEvent | TouchEvent) => {
      if (!dragging.current) return;
      const p = "touches" in e ? e.touches[0] : (e as MouseEvent);
      setPos({
        x: p.clientX - offset.current.x,
        y: p.clientY - offset.current.y,
      });
    };
    const onUp = () => {
      dragging.current = false;
    };
    window.addEventListener("mousemove", onMove, { passive: false });
    window.addEventListener("mouseup", onUp);
    window.addEventListener("touchmove", onMove, { passive: false });
    window.addEventListener("touchend", onUp);
    return () => {
      window.removeEventListener("mousemove", onMove as any);
      window.removeEventListener("mouseup", onUp);
      window.removeEventListener("touchmove", onMove as any);
      window.removeEventListener("touchend", onUp);
    };
  }, []);

  const onFabDown = (e: React.MouseEvent | React.TouchEvent) => {
    const p = ("touches" in e ? e.touches[0] : (e as React.MouseEvent)) as any;
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    dragging.current = true;
    offset.current = { x: p.clientX - rect.left, y: p.clientY - rect.top };
  };

  return (
    <>
      {/* 桌面侧边栏 */}
      <aside className="w-64 bg-white border-r border-gray-200 hidden md:flex md:flex-col">
        <div className="h-16 flex items-center px-4 border-b border-gray-200">
          <span className="text-lg font-semibold text-gray-900">管理后台</span>
        </div>
        <nav className="flex-1 p-3 space-y-1">
          {(mounted ? filteredItems : []).map((item) => {
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

      {/* 移动端悬浮球导航 */}
      <div
        className="md:hidden fixed z-50"
        style={{ left: `${pos.x}px`, top: `${pos.y}px` }}
      >
        <button
          onClick={() => setFabOpen((v) => !v)}
          onMouseDown={onFabDown}
          onTouchStart={onFabDown}
          className="w-14 h-14 rounded-full shadow-lg bg-blue-600 text-white flex items-center justify-center active:opacity-90"
          aria-label="打开导航"
        >
          ☰
        </button>
        {fabOpen && (
          <div className="absolute right-16 bottom-0 bg-white border rounded-lg shadow-lg p-2 min-w-[200px]">
            <div className="text-xs text-gray-500 px-2 py-1">快速导航</div>
            <div className="max-h-80 overflow-auto">
              {(mounted ? filteredItems : []).map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className="block px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 rounded"
                  onClick={() => setFabOpen(false)}
                >
                  {item.label}
                </Link>
              ))}
              <button
                onClick={(e) => {
                  e.preventDefault();
                  setFabOpen(false);
                  handleLogout(e as any);
                }}
                className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 rounded"
              >
                退出登录
              </button>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
