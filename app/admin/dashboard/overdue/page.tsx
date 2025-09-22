export default function OverduePage() {
  const overdueHistory = [
    {
      id: "o1",
      user: "张三",
      phone: "13800138000",
      amount: 800,
      days: 5,
      lastDate: "2025-09-06",
    },
    {
      id: "o2",
      user: "李四",
      phone: "13900139000",
      amount: 1200,
      days: 2,
      lastDate: "2025-09-09",
    },
  ];

  const todayAlerts = [
    {
      id: "a1",
      user: "王五",
      phone: "13700137000",
      dueAmount: 600,
      dueDate: "2025-09-11",
    },
  ];

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-semibold text-gray-900">
        历史逾期与当日预警
      </h2>

      <div className="bg-white border rounded-lg overflow-hidden">
        <div className="px-4 py-3 border-b text-sm text-gray-700">
          历史逾期信息
        </div>
        <table className="min-w-full text-sm">
          <thead className="bg-gray-50">
            <tr>
              <th className="text-left px-4 py-2 font-medium text-gray-600">
                用户
              </th>
              <th className="text-left px-4 py-2 font-medium text-gray-600">
                手机号
              </th>
              <th className="text-left px-4 py-2 font-medium text-gray-600">
                逾期金额
              </th>
              <th className="text-left px-4 py-2 font-medium text-gray-600">
                逾期天数
              </th>
              <th className="text-left px-4 py-2 font-medium text-gray-600">
                最近日期
              </th>
            </tr>
          </thead>
          <tbody>
            {overdueHistory.map((o) => (
              <tr key={o.id} className="border-t text-gray-600">
                <td className="px-4 py-2">{o.user}</td>
                <td className="px-4 py-2">{o.phone}</td>
                <td className="px-4 py-2">￥{o.amount.toLocaleString()}</td>
                <td className="px-4 py-2">{o.days}</td>
                <td className="px-4 py-2">{o.lastDate}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="bg-white border rounded-lg overflow-hidden">
        <div className="px-4 py-3 border-b text-sm text-gray-700">
          当日预警信息
        </div>
        <table className="min-w-full text-sm">
          <thead className="bg-gray-50">
            <tr>
              <th className="text-left px-4 py-2 font-medium text-gray-600">
                用户
              </th>
              <th className="text-left px-4 py-2 font-medium text-gray-600">
                手机号
              </th>
              <th className="text-left px-4 py-2 font-medium text-gray-600">
                应还金额
              </th>
              <th className="text-left px-4 py-2 font-medium text-gray-600">
                应还日期
              </th>
            </tr>
          </thead>
          <tbody>
            {todayAlerts.map((a) => (
              <tr key={a.id} className="border-t text-gray-600">
                <td className="px-4 py-2">{a.user}</td>
                <td className="px-4 py-2">{a.phone}</td>
                <td className="px-4 py-2">￥{a.dueAmount.toLocaleString()}</td>
                <td className="px-4 py-2">{a.dueDate}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
