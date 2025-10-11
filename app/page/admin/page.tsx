import Link from "next/link";

export default function DashboardHome() {
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
      <p className="text-gray-600">请选择左侧菜单进入对应功能。</p>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 text-gray-600">
        <Link
          href="/page/admin/management"
          className="p-4 bg-white rounded-lg border hover:shadow-sm"
        >
          后台用户管理
        </Link>
        <Link
          href="/page/users"
          className="p-4 bg-white rounded-lg border hover:shadow-sm"
        >
          前台用户管理
        </Link>
        <Link
          href="/page/payee/management"
          className="p-4 bg-white rounded-lg border hover:shadow-sm"
        >
          收款用户管理
        </Link>
        <Link
          href="/page/loan/add"
          className="p-4 bg-white rounded-lg border hover:shadow-sm"
        >
          添加贷款方案
        </Link>
        <Link
          href="/page/loan/list"
          className="p-4 bg-white rounded-lg border hover:shadow-sm"
        >
          所有贷款方案
        </Link>
        <Link
          href="/admin/dashboard/overdue"
          className="p-4 bg-white rounded-lg border hover:shadow-sm"
        >
          逾期与预警
        </Link>
      </div>
    </div>
  );
}
