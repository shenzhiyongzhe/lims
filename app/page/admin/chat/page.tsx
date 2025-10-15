"use client";

import { useState, useEffect } from "react";
import { get } from "@/lib/http";
import ChatBubble from "@/app/_components/ChatBubble";
import ChatWindow from "@/app/_components/ChatWindow";

interface ChatSession {
  id: string;
  loan_id: string;
  admin_id: number;
  user_id: number;
  created_at: string;
  updated_at: string;
  last_message_at: string;
  unread_count?: number;
  last_message?: {
    id: string;
    content: string;
    message_type: string;
    created_at: string;
    sender_type: string;
  };
  loan_account?: {
    id: string;
    loan_amount: number;
    status: string;
  };
  admin?: {
    id: number;
    username: string;
  };
  user?: {
    id: number;
    username: string;
    phone: string;
  };
}

export default function AdminChatPage() {
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [selectedSession, setSelectedSession] = useState<ChatSession | null>(
    null
  );
  const [loading, setLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState<any>(null);

  // 获取当前管理员信息
  useEffect(() => {
    const adminData = localStorage.getItem("admin");
    if (adminData) {
      setCurrentUser(JSON.parse(adminData));
    }
  }, []);

  // 获取聊天会话列表
  const fetchSessions = async () => {
    try {
      setLoading(true);
      const response = await get("/chat/sessions");
      if (response.code === 200) {
        setSessions(response.data);
      }
    } catch (error) {
      console.error("Failed to fetch chat sessions:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (currentUser) {
      fetchSessions();
    }
  }, [currentUser]);

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("zh-CN", {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const formatAmount = (amount: number) => {
    return `¥${amount.toLocaleString()}`;
  };

  if (!currentUser) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-600">加载中...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-lg shadow-md">
          <div className="p-6 border-b border-gray-200">
            <h1 className="text-2xl font-bold text-gray-800">聊天管理</h1>
            <p className="text-gray-600 mt-1">与用户的实时聊天</p>
          </div>

          <div className="flex h-[600px]">
            {/* 聊天会话列表 */}
            <div className="w-1/3 border-r border-gray-200">
              <div className="p-4 border-b border-gray-200">
                <button
                  onClick={fetchSessions}
                  className="w-full px-3 py-2 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700"
                  disabled={loading}
                >
                  {loading ? "刷新中..." : "刷新会话"}
                </button>
              </div>

              <div className="overflow-y-auto h-full">
                {sessions.length === 0 ? (
                  <div className="p-4 text-center text-gray-500">
                    暂无聊天会话
                  </div>
                ) : (
                  sessions.map((session) => (
                    <div
                      key={session.id}
                      onClick={() => setSelectedSession(session)}
                      className={`p-4 border-b border-gray-100 cursor-pointer hover:bg-gray-50 ${
                        selectedSession?.id === session.id
                          ? "bg-blue-50 border-blue-200"
                          : ""
                      }`}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center space-x-2">
                          <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center text-white text-sm font-medium">
                            {session.user?.username?.[0]?.toUpperCase() || "U"}
                          </div>
                          <div>
                            <p className="text-sm font-medium text-gray-900">
                              {session.user?.username || "未知用户"}
                            </p>
                            <p className="text-xs text-gray-500">
                              {session.loan_account?.status === "active"
                                ? "进行中"
                                : "已完成"}
                            </p>
                          </div>
                        </div>
                        {session.unread_count && session.unread_count > 0 && (
                          <span className="bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                            {session.unread_count > 99
                              ? "99+"
                              : session.unread_count}
                          </span>
                        )}
                      </div>

                      <div className="space-y-1">
                        <p className="text-sm text-gray-600 truncate">
                          {session.last_message?.content || "暂无消息"}
                        </p>
                        <p className="text-xs text-gray-400">
                          {formatTime(session.last_message_at)}
                        </p>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* 聊天窗口 */}
            <div className="flex-1">
              {selectedSession ? (
                <ChatWindow
                  loanId={selectedSession.loan_id}
                  userId={currentUser.id}
                  userType="admin"
                  onClose={() => setSelectedSession(null)}
                />
              ) : (
                <div className="h-full flex items-center justify-center text-gray-500">
                  <div className="text-center">
                    <svg
                      className="w-16 h-16 mx-auto mb-4 text-gray-300"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={1}
                        d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
                      />
                    </svg>
                    <p className="text-lg font-medium">选择一个聊天会话</p>
                    <p className="text-sm">从左侧选择要聊天的用户</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* 悬浮聊天气泡 - 用于快速聊天 */}
      <ChatBubble
        loanId="" // 管理员页面不需要特定loan_id
        userId={currentUser.id}
        userType="admin"
      />
    </div>
  );
}
