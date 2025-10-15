"use client";
import { ReactNode, Suspense, useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import Sidebar from "../_components/Sidebar";

function DashboardContent({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const hideSidebarRoutes = ["/page/login", "/page/share-links"]; // 需要隐藏侧边栏的路由
  const hideSidebar = hideSidebarRoutes.includes(pathname);

  // 客户端路由守卫（适配 static export，无需 middleware）
  useEffect(() => {
    // 分享链接页始终公开访问
    if (pathname.startsWith("/page/share-links")) {
      return;
    }

    // 公共（无需登录）路由白名单
    const publicPrefixes = [
      "/page/login",
      "/page/share-links",
      "/page/feedback",
    ];

    // 需要登录的路由前缀（根据你的实际业务自行增减）
    const protectedPrefixes = [
      "/page/admin",
      "/page/users",
      "/page/collector",
      "/page/payee",
      "/page/risk_controller",
      "/page/loan",
    ];

    const isPublic = publicPrefixes.some((p) => pathname.startsWith(p));
    const isProtected = protectedPrefixes.some((p) => pathname.startsWith(p));

    if (!isProtected || isPublic) return;

    try {
      const admin =
        typeof window !== "undefined" && localStorage.getItem("admin");
      const user =
        typeof window !== "undefined" && localStorage.getItem("user");
      if (!admin && !user) {
        const search =
          typeof window !== "undefined" ? window.location.search : "";
        const redirect = encodeURIComponent(`${pathname}${search}`);
        router.replace(`/page/login?redirect=${redirect}`);
      }
    } catch {
      // 读取本地存储异常时，兜底跳转登录
      router.replace("/page/login");
    }
  }, [pathname, router]);

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
