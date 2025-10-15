"use client";

import { useState } from "react";
import { useChat } from "@/app/_hooks/useChat";
import ChatWindow from "./ChatWindow";

interface ChatBubbleProps {
  loanId: string;
  userId: number;
  userType: "admin" | "user";
}

export default function ChatBubble({
  loanId,
  userId,
  userType,
}: ChatBubbleProps) {
  const [isOpen, setIsOpen] = useState(false);
  const { unreadCount, isConnected } = useChat({
    loanId,
    userId,
    userType,
    autoConnect: false,
  });

  const handleClick = () => {
    setIsOpen(!isOpen);
  };

  return (
    <>
      {/* 悬浮聊天气泡 */}
      <div className="fixed bottom-4 right-4 z-50">
        <button
          onClick={handleClick}
          className="relative bg-blue-500 hover:bg-blue-600 text-white rounded-full p-3 shadow-lg transition-colors duration-200"
        >
          {/* 聊天图标 */}
          <svg
            className="w-6 h-6"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
            />
          </svg>

          {/* 未读消息徽章 */}
          {unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
              {unreadCount > 99 ? "99+" : unreadCount}
            </span>
          )}

          {/* 在线状态指示器 */}
          <div
            className={`absolute -bottom-1 -right-1 w-3 h-3 rounded-full border-2 border-white ${
              isConnected ? "bg-green-500" : "bg-gray-400"
            }`}
          />
        </button>
      </div>

      {/* 聊天窗口 */}
      {isOpen && (
        <div className="fixed bottom-20 right-4 z-40">
          <ChatWindow
            loanId={loanId}
            userId={userId}
            userType={userType}
            onClose={() => setIsOpen(false)}
          />
        </div>
      )}
    </>
  );
}
