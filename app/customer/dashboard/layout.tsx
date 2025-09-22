import Link from "next/link";
import { ReactNode } from "react";
import UserSidebar from "./_components/UserSidebar";

export default function UserDashboardLayout({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="flex min-h-screen">
        <UserSidebar />
        <main className="flex-1 p-6 md:p-8 overflow-auto">{children}</main>
      </div>
    </div>
  );
}
