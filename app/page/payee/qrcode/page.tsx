"use client";

import { useEffect, useState } from "react";
import { get, post, put } from "@/lib/http";

interface QRCodeData {
  id: number;
  qrcode_url: string;
  qrcode_type: "wechat_pay" | "ali_pay";
  active: boolean;
  created_at: string;
  updated_at: string;
}

interface UploadForm {
  qrcode_type: "wechat_pay" | "ali_pay";
  file: File | null;
}

export default function QRCodeManagementPage() {
  const [qrCodes, setQrCodes] = useState<QRCodeData[]>([]);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState("");
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string>("");

  const [form, setForm] = useState<UploadForm>({
    qrcode_type: "wechat_pay",
    file: null,
  });

  // 获取二维码列表
  const fetchQRCodes = async () => {
    setLoading(true);
    try {
      const res = await get("/api/payee/qrcode");
      setQrCodes(res.data || []);
    } catch (error: any) {
      setMessage(error.message || "获取二维码列表失败");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchQRCodes();
  }, []);

  // 处理文件选择
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setForm((prev) => ({ ...prev, file }));

      // 生成预览URL
      const url = URL.createObjectURL(file);
      setPreviewUrl(url);
    }
  };

  // 上传二维码
  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!form.file) {
      setMessage("请选择二维码图片");
      return;
    }

    setUploading(true);
    setMessage("");

    try {
      // 先上传文件
      const formData = new FormData();
      formData.append("file", form.file);
      formData.append("qrcode_type", form.qrcode_type);

      const uploadRes = await fetch("/api/payee/upload", {
        method: "POST",
        body: formData,
      });

      const uploadResult = await uploadRes.json();

      if (!uploadRes.ok) {
        throw new Error(uploadResult.message || "上传失败");
      }

      // 创建二维码记录
      const createRes = await post("/api/payee/qrcode", {
        qrcode_type: form.qrcode_type,
        qrcode_url: uploadResult.url,
      });

      setMessage("上传成功");
      setForm({ qrcode_type: "wechat_pay", file: null });
      setPreviewUrl("");
      setShowUploadModal(false);
      fetchQRCodes(); // 刷新列表
    } catch (error: any) {
      setMessage(error.message || "上传失败");
    } finally {
      setUploading(false);
    }
  };

  // 切换二维码生效状态
  const handleToggleActive = async (
    qrcodeId: number,
    currentActive: boolean
  ) => {
    try {
      await put(`/api/payee/qrcode/${qrcodeId}`, {
        active: !currentActive,
      });

      setMessage(`${!currentActive ? "启用" : "禁用"}成功`);
      fetchQRCodes();
    } catch (error: any) {
      setMessage(error.message || "操作失败");
    }
  };

  // 删除二维码
  const handleDelete = async (qrcodeId: number) => {
    if (!confirm("确定要删除这个二维码吗？")) return;

    try {
      await fetch(`/api/payee/qrcode/${qrcodeId}`, { method: "DELETE" });
      setMessage("删除成功");
      fetchQRCodes();
    } catch (error: any) {
      setMessage(error.message || "删除失败");
    }
  };

  // 关闭模态框
  const handleCloseModal = () => {
    setShowUploadModal(false);
    setForm({ qrcode_type: "wechat_pay", file: null });
    setPreviewUrl("");
    setMessage("");
  };

  // 获取支付方式图标
  const getPaymentIcon = (type: string) => {
    return type === "wechat_pay"
      ? "/icons/wechat_pay.png"
      : "/icons/ali_pay.png";
  };

  // 获取支付方式名称
  const getPaymentName = (type: string) => {
    return type === "wechat_pay" ? "微信付款码" : "支付宝付款码";
  };

  // 格式化日期
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString("zh-CN");
  };

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-900">我的二维码</h1>
        <button
          onClick={() => setShowUploadModal(true)}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
        >
          <span>+</span>
          上传新二维码
        </button>
      </div>

      {/* 消息提示 */}
      {message && (
        <div
          className={`mb-4 p-3 rounded-lg ${
            message.includes("成功")
              ? "bg-green-100 text-green-700"
              : "bg-red-100 text-red-700"
          }`}
        >
          {message}
        </div>
      )}

      {/* 二维码列表 */}
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-gray-500">加载中...</div>
        ) : qrCodes.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            <div className="text-4xl mb-4">📱</div>
            <p>暂无二维码</p>
            <p className="text-sm text-gray-400 mt-2">
              点击上方按钮上传您的第一个二维码
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    二维码
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    支付方式
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    状态
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    创建时间
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    操作
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {qrCodes.map((qrCode) => (
                  <tr key={qrCode.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <img
                          src={qrCode.qrcode_url}
                          alt="二维码"
                          className="h-16 w-16 object-cover rounded border cursor-pointer hover:scale-105 transition-transform"
                          onClick={() =>
                            window.open(qrCode.qrcode_url, "_blank")
                          }
                        />
                        <div className="ml-3">
                          <div className="text-sm font-medium text-gray-900">
                            二维码 #{qrCode.id}
                          </div>
                          <div className="text-xs text-gray-500">
                            点击查看大图
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <img
                          src={getPaymentIcon(qrCode.qrcode_type)}
                          alt={getPaymentName(qrCode.qrcode_type)}
                          className="w-6 h-6 mr-2"
                        />
                        <span className="text-sm text-gray-900">
                          {getPaymentName(qrCode.qrcode_type)}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          qrCode.active
                            ? "bg-green-100 text-green-800"
                            : "bg-gray-100 text-gray-800"
                        }`}
                      >
                        {qrCode.active ? "生效中" : "已禁用"}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatDate(qrCode.created_at)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex space-x-2">
                        <button
                          onClick={() =>
                            handleToggleActive(qrCode.id, qrCode.active)
                          }
                          className={`px-3 py-1 text-xs rounded-md transition-colors ${
                            qrCode.active
                              ? "bg-yellow-100 text-yellow-800 hover:bg-yellow-200"
                              : "bg-green-100 text-green-800 hover:bg-green-200"
                          }`}
                        >
                          {qrCode.active ? "禁用" : "启用"}
                        </button>
                        <button
                          onClick={() => handleDelete(qrCode.id)}
                          className="px-3 py-1 text-xs bg-red-100 text-red-800 rounded-md hover:bg-red-200 transition-colors"
                        >
                          删除
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* 统计信息 */}
      {qrCodes.length > 0 && (
        <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white p-4 rounded-lg shadow">
            <div className="text-2xl font-bold text-blue-600">
              {qrCodes.length}
            </div>
            <div className="text-sm text-gray-600">总二维码数</div>
          </div>
          <div className="bg-white p-4 rounded-lg shadow">
            <div className="text-2xl font-bold text-green-600">
              {qrCodes.filter((qr) => qr.active).length}
            </div>
            <div className="text-sm text-gray-600">生效中</div>
          </div>
          <div className="bg-white p-4 rounded-lg shadow">
            <div className="text-2xl font-bold text-gray-600">
              {qrCodes.filter((qr) => !qr.active).length}
            </div>
            <div className="text-sm text-gray-600">已禁用</div>
          </div>
        </div>
      )}

      {/* 上传模态框 */}
      {showUploadModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg w-full max-w-md">
            <div className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-lg font-semibold">上传新二维码</h2>
                <button
                  onClick={handleCloseModal}
                  className="text-gray-400 hover:text-gray-600"
                >
                  ✕
                </button>
              </div>

              <form onSubmit={handleUpload}>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      支付方式
                    </label>
                    <select
                      value={form.qrcode_type}
                      onChange={(e) =>
                        setForm((prev) => ({
                          ...prev,
                          qrcode_type: e.target.value as
                            | "wechat_pay"
                            | "ali_pay",
                        }))
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="wechat_pay">微信付款码</option>
                      <option value="ali_pay">支付宝付款码</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      二维码图片
                    </label>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleFileChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      required
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      支持 JPG、PNG、GIF、WebP 格式，最大 5MB
                    </p>
                  </div>

                  {/* 预览 */}
                  {previewUrl && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        预览
                      </label>
                      <div className="border border-gray-300 rounded-md p-2">
                        <img
                          src={previewUrl}
                          alt="二维码预览"
                          className="max-h-32 mx-auto"
                        />
                      </div>
                    </div>
                  )}
                </div>

                <div className="flex justify-end space-x-3 mt-6">
                  <button
                    type="button"
                    onClick={handleCloseModal}
                    className="px-4 py-2 text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300"
                  >
                    取消
                  </button>
                  <button
                    type="submit"
                    disabled={uploading}
                    className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
                  >
                    {uploading ? "上传中..." : "上传"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
