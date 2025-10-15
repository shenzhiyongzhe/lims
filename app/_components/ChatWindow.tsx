"use client";

import { useState, useRef, useEffect } from "react";
import { useChat } from "@/app/_hooks/useChat";

interface ChatWindowProps {
  loanId: string;
  userId: number;
  userType: "admin" | "user";
  onClose: () => void;
}

interface ChatMessage {
  id: string;
  session_id: string;
  sender_id: number;
  sender_type: "admin" | "user";
  message_type: "text" | "image";
  content: string;
  is_read: boolean;
  created_at: string;
}

export default function ChatWindow({
  loanId,
  userId,
  userType,
  onClose,
}: ChatWindowProps) {
  const [message, setMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const {
    isConnected,
    currentSession,
    messages,
    sessions,
    unreadCount,
    connect,
    sendMessage,
    joinChat,
    markAsRead,
  } = useChat({
    loanId,
    userId,
    userType,
    autoConnect: true,
  });

  // 自动滚动到最新消息
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // 连接聊天室
  useEffect(() => {
    if (isConnected && loanId) {
      joinChat(loanId);
    }
  }, [isConnected, loanId, joinChat]);

  const handleSendMessage = async () => {
    if (!message.trim() || !currentSession) return;

    setIsLoading(true);
    try {
      await sendMessage(currentSession.id, message.trim(), "text");
      setMessage("");
    } catch (error) {
      console.error("发送消息失败:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString("zh-CN", {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const isOwnMessage = (senderType: string) => {
    return senderType === userType;
  };

  if (!isConnected) {
    return (
      <div className="bg-white rounded-lg shadow-xl border border-gray-200 w-80 h-96 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-2"></div>
          <p className="text-gray-600">连接中...</p>
          <button
            onClick={connect}
            className="mt-2 text-blue-500 hover:text-blue-600 text-sm"
          >
            重试连接
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-xl border border-gray-200 w-80 h-96 flex flex-col">
      {/* 头部 */}
      <div className="p-4 border-b border-gray-200 flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-gray-800">聊天</h3>
          {currentSession && (
            <p className="text-sm text-gray-600">
              与 {userType === "admin" ? "用户" : "管理员"} 对话
            </p>
          )}
        </div>
        <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
          ✕
        </button>
      </div>

      {/* 消息列表 */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {messages.length === 0 ? (
          <div className="text-center text-gray-500 py-8">
            暂无消息，开始聊天吧！
          </div>
        ) : (
          messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex ${
                isOwnMessage(msg.sender_type) ? "justify-end" : "justify-start"
              }`}
            >
              <div
                className={`max-w-xs px-3 py-2 rounded-lg ${
                  isOwnMessage(msg.sender_type)
                    ? "bg-blue-500 text-white"
                    : "bg-gray-200 text-gray-800"
                }`}
              >
                {msg.message_type === "image" ? (
                  <img
                    src={msg.content}
                    alt="图片消息"
                    className="max-w-full h-auto rounded"
                  />
                ) : (
                  <p className="text-sm">{msg.content}</p>
                )}
                <p
                  className={`text-xs mt-1 ${
                    isOwnMessage(msg.sender_type)
                      ? "text-blue-100"
                      : "text-gray-500"
                  }`}
                >
                  {formatTime(msg.created_at)}
                </p>
              </div>
            </div>
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* 输入区域 */}
      <div className="p-4 border-t border-gray-200">
        <div className="flex space-x-2">
          <input
            type="text"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="输入消息..."
            className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            disabled={isLoading}
          />
          <button
            onClick={handleSendMessage}
            disabled={!message.trim() || isLoading}
            className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:bg-gray-300 disabled:cursor-not-allowed"
          >
            {isLoading ? "发送中..." : "发送"}
          </button>
        </div>
      </div>
    </div>
  );
}
