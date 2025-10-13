"use client";

import { useEffect, useState, useRef } from "react";
import { useSearchParams } from "next/navigation";
import { useSSE } from "@/app/_hooks/useSSE";
import { get, post } from "@/lib/http";

const BASE_URL = process.env.NEXT_PUBLIC_API_BASE || "http://localhost:3000";
const colorMap: { [key: string]: string } = {
  pending: "bg-yellow-100 text-yellow-800",
  active: "bg-blue-100 text-blue-800",
  paid: "bg-green-100 text-green-800",
  overtime: "bg-orange-100 text-orange-800",
  overdue: "bg-red-100 text-red-800",
};

export default function ShareRepaymentPage() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>("");
  const [summary, setSummary] = useState<any>(null);

  const [orderStatus, setOrderStatus] = useState<
    "pending" | "grabbed" | "failed"
  >("pending");
  const [grabbedPayee, setGrabbedPayee] = useState<any>(null);

  const [form, setForm] = useState<any>({
    user_id: 0,
    loan_id: 0,
    payment_method: "wechat_pay",
    payment_periods: 1,
    amount: 0,
    remark: "",
  });
  const [haveSubmit, setHaveSubmit] = useState(false);

  const [qrcodeLoading, setQrcodeLoading] = useState(false);
  const [qrcode, setQrcode] = useState<any>(null);
  const [countdown, setCountdown] = useState<{
    text: string;
    overtime: boolean;
  }>({ text: "--", overtime: false });

  // 定时器引用
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  // 构建完整的图片URL
  const getFullImageUrl = (url: string) => {
    if (url.startsWith("http")) {
      return url; // 已经是完整URL
    }
    return `${BASE_URL}${url}`;
  };

  // SSE连接 - 不自动连接，手动控制
  const { isConnected, connect, disconnect } = useSSE({
    autoConnect: false, // 不自动连接
    onMessage: (message) => {
      if (message.type === "order_grabbed") {
        // 清除超时定时器
        if (timeoutRef.current) {
          clearTimeout(timeoutRef.current);
          timeoutRef.current = null;
        }

        setOrderStatus("grabbed");
        setGrabbedPayee(message.data);
        // 抢单成功后获取二维码
        fetchQrcode(message.data.payeeId);
      }
    },
  });

  const handleSubmit = async () => {
    if (!form.amount || form.amount <= 0) {
      setError("请输入有效金额");
      return;
    }

    setHaveSubmit(true);
    setOrderStatus("pending");

    // 在提交订单时连接SSE
    if (!isConnected) {
      console.log("form.user_id", form.user_id);
      const sseUrl = `/events?type=customer&user_id=${form.user_id}`;
      connect(sseUrl);
    }

    // 发送订单到SSE服务
    const orderData = {
      id: `${token}`,
      share_id: token,
      customer_id: form.user_id,
      customer: {
        username: summary.user.username,
        phone: summary.user.phone,
        address: summary.user.address,
      },
      amount: form.amount,
      payment_method: form.payment_method,
      remark: form.remark,
      loan_id: form.loan_id,
      payment_periods: form.payment_periods,
      expires_at: summary.expires_at,
    };

    try {
      const response = await post("/events", {
        type: "submit_order",
        data: orderData,
      });

      const result = await response.data;
      if (!result.success) {
        throw new Error(result.message);
      }

      // 等待抢单结果
      timeoutRef.current = setTimeout(() => {
        if (orderStatus === "pending") {
          console.log("orderStatus === 'pending'");
          setOrderStatus("failed");
          setError("暂无收款人接单，请稍后再试");
          // 超时后断开SSE连接
          disconnect();
        }
        timeoutRef.current = null;
      }, 60000); // 60秒超时
    } catch (error: any) {
      // 清除超时定时器
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }

      setError(error.message);
      setOrderStatus("failed");
      // 出错后断开SSE连接
      disconnect();
    }
  };

  const fetchQrcode = async (payeeId: number) => {
    try {
      setQrcodeLoading(true);
      console.log(
        `🔍 获取收款人 ${payeeId} 的二维码，支付方式: ${form.payment_method}`
      );

      const result = await get(
        `/payees/qrcode?payment_method=${form.payment_method}&active=true&payee_id=${payeeId}`
      );

      console.log("📱 二维码API响应:", result);

      if (result.code != 200) {
        throw new Error(result.message || "获取数据失败");
      }

      if (
        !result.data ||
        !Array.isArray(result.data) ||
        result.data.length === 0
      ) {
        throw new Error("没有找到匹配的二维码");
      }

      const qrcodeData = result.data[0];
      console.log("📱 找到二维码数据:", qrcodeData);

      setQrcode(qrcodeData.qrcode_url);
    } catch (error: any) {
      console.error("❌ 获取二维码失败:", error);
      setError(error.message);
    } finally {
      setQrcodeLoading(false);
    }
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await get(`/share-links/${token}`);
        if (response.code != 200) {
          throw new Error(response.message || "获取数据失败");
        }
        setSummary(response.data.summary);
        setForm((prev: any) => ({
          ...prev,
          user_id: response.data.summary.user.id,
          loan_id: response.data.summary.loan_id,
          payment_periods: response.data.summary.count,
        }));
        console.log(
          "result.summary.user.user_id",
          response.data.summary.user.id
        );
      } catch (error: any) {
        setError(error.message);
      } finally {
        setLoading(false);
      }
    };

    if (token) {
      fetchData();
    }
  }, [token]);

  // 倒计时：根据 summary.due_end_date 与当前时间差显示
  useEffect(() => {
    if (!summary?.due_end_date) return;
    const parseDue = () => {
      // 兼容字符串日期
      const due = new Date(summary.due_end_date);
      return isNaN(due.getTime())
        ? new Date(`${summary.due_end_date}T00:00:00+08:00`)
        : due;
    };

    const pad = (n: number) => (n < 10 ? `0${n}` : `${n}`);
    const fmt = (ms: number) => {
      const abs = Math.abs(ms);
      const totalSec = Math.floor(abs / 1000);
      const days = Math.floor(totalSec / 86400);
      const hours = Math.floor((totalSec % 86400) / 3600);
      const mins = Math.floor((totalSec % 3600) / 60);
      const secs = totalSec % 60;
      const dh = days > 0 ? `${days}天 ` : "";
      return `${dh}${pad(hours)}:${pad(mins)}:${pad(secs)}`;
    };

    const update = () => {
      const now = new Date();
      const due = parseDue();
      const diff = due.getTime() - now.getTime();
      if (diff >= 0) {
        setCountdown({ text: `剩余 ${fmt(diff)}`, overtime: false });
      } else {
        setCountdown({ text: `超时 ${fmt(diff)}`, overtime: true });
      }
    };

    update();
    const timer = setInterval(update, 1000);
    return () => clearInterval(timer);
  }, [summary?.due_end_date]);

  // 组件卸载时断开SSE连接并清除定时器
  useEffect(() => {
    return () => {
      // 清除超时定时器
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
      // 断开SSE连接
      disconnect();
    };
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-500 mx-auto"></div>
          <p className="mt-4 text-gray-600">加载中...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-500 text-6xl mb-4">⚠️</div>
          <h1 className="text-2xl font-bold text-gray-800 mb-2">访问失败</h1>
          <p className="text-gray-600">{error}</p>
        </div>
      </div>
    );
  }

  if (!summary) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-800">数据不存在</h1>
        </div>
      </div>
    );
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("zh-CN");
  };

  const formatAmount = (amount: string) => {
    return `¥${parseFloat(amount).toLocaleString()}`;
  };

  const getStatusText = (status: string) => {
    const statusMap: { [key: string]: string } = {
      pending: "待还款",
      active: "进行中",
      paid: "已还清",
      overtime: "超时",
      overdue: "逾期",
    };
    return statusMap[status] || status;
  };

  const getStatusColor = (status: string) => {
    return colorMap[status] || "bg-gray-100 text-gray-800";
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <div className="grid grid-cols-1  gap-4">
            <div className="flex  items-center justify-between">
              <div>3</div>
              <div className="bg-yellow-400 text-white px-2 py-1 rounded-md">
                尊敬的{summary.user.lv}
              </div>
            </div>
            <div className="flex items-center justify-center">
              <span
                className={`font-bold text-2xl ${
                  countdown.overtime ? "text-red-600" : "text-gray-900"
                }`}
              >
                {countdown.text}
              </span>
            </div>
            <div className="flex flex-col">
              <div className="text-sm text-gray-600 mb-2">还款进度</div>
              <div className="w-full bg-gray-200 rounded-full h-3 relative overflow-hidden">
                <div
                  className="bg-gradient-to-r from-blue-500 to-green-500 h-3 rounded-full transition-all duration-1000 ease-out relative"
                  style={{
                    width: `${(
                      (summary.repaid_periods / summary.total_periods) *
                      100
                    ).toFixed(1)}%`,
                  }}
                >
                  {/* 流动的光效 */}
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white to-transparent opacity-40 transform -skew-x-12 animate-pulse"></div>
                </div>
                {/* 进度数值 */}
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-xs font-bold text-white drop-shadow-sm">
                    {(
                      (summary.repaid_periods / summary.total_periods) *
                      100
                    ).toFixed(1)}
                    %
                  </span>
                </div>
              </div>
              <div className="flex justify-between text-xs text-gray-500 mt-1">
                <span>
                  已还:
                  {summary.repaid_periods}
                </span>
                <span>总期数: {summary.total_periods}</span>
              </div>
            </div>
            <div className="flex flex-col gap-2">
              <div className="flex gap-4 items-center flex-wrap">
                <label className="inline-flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={form.payment_method === "wechat_pay"}
                    onChange={(e) => {
                      if (e.target.checked)
                        setForm({ ...form, payment_method: "wechat_pay" });
                    }}
                  />
                  <span className="text-sm text-gray-700">微信</span>
                </label>
                <label className="inline-flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={form.payment_method === "ali_pay"}
                    onChange={(e) => {
                      if (e.target.checked)
                        setForm({ ...form, payment_method: "ali_pay" });
                    }}
                  />
                  <span className="text-sm text-gray-700">支付宝</span>
                </label>
                <span className="inline-flex items-center bg-yellow-500 text-white px-2 py-1 rounded-md text-sm">
                  {summary.count}期
                </span>
              </div>
              <div className="flex gap-2 justify-between">
                <input
                  type="text"
                  placeholder="其他金额"
                  className="flex-1 input-base"
                  value={form.amount}
                  onChange={(e) => setForm({ ...form, amount: e.target.value })}
                />
                <button
                  onClick={handleSubmit}
                  className="bg-blue-500 text-white px-4 py-2 rounded-md hover:bg-blue-600 transition-colors cursor-pointer"
                >
                  提交
                </button>
              </div>
              <div>
                <textarea
                  placeholder="备注留言:"
                  className="input-base-w"
                  value={form.remark}
                  onChange={(e) => setForm({ ...form, remark: e.target.value })}
                />
              </div>
            </div>
          </div>
        </div>
        {/* 订单状态显示 */}
        {haveSubmit && (
          <div className="bg-white rounded-lg shadow-md p-4 mb-6">
            <div className="flex items-center justify-center">
              {orderStatus === "pending" && (
                <div className="text-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-2"></div>
                  <p className="text-blue-600">等待收款人抢单中...</p>
                  <p className="text-sm text-gray-500 mt-1">
                    连接状态: {isConnected ? "已连接" : "连接中..."}
                  </p>
                </div>
              )}
              {orderStatus === "grabbed" && grabbedPayee && (
                <div className="text-center">
                  <div className="text-green-500 text-2xl mb-2">✓</div>
                  <p className="text-green-600 font-medium">
                    订单已被 {grabbedPayee.payeeName} 接单
                  </p>
                </div>
              )}
              {orderStatus === "failed" && (
                <div className="text-center">
                  <div className="text-red-500 text-2xl mb-2">⚠</div>
                  <p className="text-red-600">暂无收款人接单</p>
                </div>
              )}
            </div>
          </div>
        )}
        {haveSubmit && (
          <div className="bg-white rounded-lg shadow-md p-6 mb-6">
            {qrcodeLoading ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
                <p className="text-gray-600">正在加载二维码...</p>
              </div>
            ) : qrcode ? (
              <div className="text-center">
                <div className="mb-4">
                  <h3 className="text-lg font-semibold text-gray-800 mb-2">
                    请使用
                    {form.payment_method === "wechat_pay" ? "微信" : "支付宝"}
                    扫码支付
                  </h3>
                  <div className="inline-block p-4 bg-white border-2 border-gray-200 rounded-lg shadow-sm">
                    <img
                      src={getFullImageUrl(qrcode)}
                      alt="支付二维码"
                      className="w-48 h-48 object-contain"
                      onError={(e) => {
                        console.error("❌ 二维码图片加载失败:", e);
                        setError("二维码加载失败，请刷新页面重试");
                      }}
                      onLoad={() => {
                        console.log("✅ 二维码图片加载成功");
                      }}
                    />
                  </div>
                </div>

                <div className="bg-gray-50 rounded-lg p-4 mb-4">
                  <div className="text-sm text-gray-600 mb-2">支付信息</div>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-gray-600">支付方式:</span>
                      <span className="font-medium">
                        {form.payment_method === "wechat_pay"
                          ? "微信支付"
                          : "支付宝"}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">支付金额:</span>
                      <span className="font-bold text-lg text-blue-600">
                        {form.amount
                          ? `¥${parseFloat(form.amount).toLocaleString()}`
                          : formatAmount(summary.payable_amount)}
                      </span>
                    </div>
                    {form.remark && (
                      <div className="flex justify-between">
                        <span className="text-gray-600">备注:</span>
                        <span className="text-sm text-gray-800">
                          {form.remark}
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <div className="flex items-center justify-center mb-2">
                    <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse mr-2"></div>
                    <span className="text-sm font-medium text-blue-800">
                      等待支付中...
                    </span>
                  </div>
                  <p className="text-xs text-blue-600">
                    请使用
                    {form.payment_method === "wechat_pay" ? "微信" : "支付宝"}
                    扫描上方二维码完成支付
                  </p>
                </div>
              </div>
            ) : (
              <div className="text-center py-8">
                <div className="text-red-500 text-4xl mb-4">⚠️</div>
                <h3 className="text-lg font-semibold text-gray-800 mb-2">
                  暂无可用二维码
                </h3>
                <p className="text-gray-600">
                  {form.payment_method === "wechat_pay" ? "微信" : "支付宝"}
                  收款码暂不可用，请稍后再试或联系客服
                </p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
