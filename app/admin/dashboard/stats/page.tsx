export default function StatsPage() {
  const todayTotal = 12890.5;
  const historyTotal = 1034589.75;
  const records = [
    { id: "r1", date: "2025-09-11", user: "张三", amount: 1200 },
    { id: "r2", date: "2025-09-11", user: "李四", amount: 860 },
    { id: "r3", date: "2025-09-10", user: "王五", amount: 1500 },
  ];

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-semibold text-gray-900">统计</h2>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-white border rounded-lg p-6">
          <div className="text-gray-500 text-sm">今日已还款总金额</div>
          <div className="mt-2 text-2xl font-bold text-gray-900">
            ￥{todayTotal.toLocaleString()}
          </div>
        </div>
        <div className="bg-white border rounded-lg p-6">
          <div className="text-gray-500 text-sm">历史总金额</div>
          <div className="mt-2 text-2xl font-bold text-gray-900">
            ￥{historyTotal.toLocaleString()}
          </div>
        </div>
      </div>

      <div className="bg-white border rounded-lg overflow-hidden">
        <div className="px-4 py-3 border-b text-sm text-gray-700">还款记录</div>
        <table className="min-w-full text-sm">
          <thead className="bg-gray-50">
            <tr>
              <th className="text-left px-4 py-2 font-medium text-gray-600">
                日期
              </th>
              <th className="text-left px-4 py-2 font-medium text-gray-600">
                用户
              </th>
              <th className="text-left px-4 py-2 font-medium text-gray-600">
                金额
              </th>
            </tr>
          </thead>
          <tbody>
            {records.map((r) => (
              <tr key={r.id} className="border-t text-gray-600">
                <td className="px-4 py-2">{r.date}</td>
                <td className="px-4 py-2">{r.user}</td>
                <td className="px-4 py-2">￥{r.amount.toLocaleString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
