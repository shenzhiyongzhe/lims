import { useEffect, useRef, useState, useCallback } from "react";
import { io, Socket } from "socket.io-client";
import { get } from "@/lib/http";

const BASE_URL = process.env.NEXT_PUBLIC_API_BASE || "http://localhost:3000";

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

interface UseChatOptions {
  loanId?: string;
  userId?: number;
  userType?: "admin" | "user";
  autoConnect?: boolean;
}

export function useChat({
  loanId,
  userId,
  userType,
  autoConnect = true,
}: UseChatOptions = {}) {
  const [isConnected, setIsConnected] = useState(false);
  const [currentSession, setCurrentSession] = useState<ChatSession | null>(
    null
  );
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const socketRef = useRef<Socket | null>(null);

  // 获取聊天会话列表
  const fetchSessions = useCallback(async () => {
    if (!userId || !userType) return;

    try {
      setIsLoading(true);
      const response = await get(`/chat/sessions`);
      if (response.code === 200) {
        setSessions(response.data);
      }
    } catch (error) {
      console.error("Failed to fetch chat sessions:", error);
    } finally {
      setIsLoading(false);
    }
  }, [userId, userType]);

  // 获取或创建聊天会话
  const getOrCreateSession = useCallback(
    async (targetLoanId: string) => {
      if (!userId || !userType) return;

      try {
        const response = await get(`/chat/sessions`, {
          params: {
            loan_id: targetLoanId,
            ...(userType === "admin"
              ? { admin_id: userId }
              : { user_id: userId }),
          },
        });

        if (response.code === 200) {
          setCurrentSession(response.data);
          return response.data;
        }
      } catch (error) {
        console.error("Failed to get or create chat session:", error);
      }
    },
    [userId, userType]
  );

  // 获取会话消息历史
  const fetchMessages = useCallback(async (sessionId: string) => {
    try {
      setIsLoading(true);
      const response = await get(`/chat/sessions/${sessionId}`);
      if (response.code === 200) {
        setCurrentSession(response.data);
        setMessages(response.data.messages || []);
      }
    } catch (error) {
      console.error("Failed to fetch messages:", error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // 发送消息
  const sendMessage = useCallback(
    async (
      sessionId: string,
      content: string,
      messageType: "text" | "image" = "text"
    ) => {
      if (!socketRef.current || !isConnected) {
        throw new Error("聊天连接未建立");
      }

      try {
        socketRef.current.emit("chat_message", {
          loan_id: loanId,
          message_type: messageType,
          content,
        });
      } catch (error) {
        console.error("Failed to send message:", error);
        throw error;
      }
    },
    [isConnected]
  );

  // 连接聊天服务器
  const connect = useCallback(async () => {
    if (!userId || !userType || !loanId) {
      console.warn("Missing required parameters for chat connection");
      return;
    }

    if (socketRef.current) {
      socketRef.current.disconnect();
    }

    try {
      // 构建查询参数
      const queryParams: Record<string, string> = {
        type: userType === "admin" ? "payee" : "customer",
        loan_id: loanId,
      };

      if (userType === "admin") {
        // 管理员需要从localStorage获取admin_id
        const adminData = localStorage.getItem("admin");
        if (adminData) {
          const admin = JSON.parse(adminData);
          if (admin.id) {
            queryParams.admin_id = admin.id.toString();
          }
        }
      } else {
        queryParams.user_id = userId.toString();
      }

      socketRef.current = io(BASE_URL, {
        query: queryParams,
        transports: ["websocket", "polling"],
        autoConnect: false,
      });

      socketRef.current.on("connect", () => {
        console.log("Chat connected successfully");
        setIsConnected(true);
      });

      socketRef.current.on("chat_session_joined", (data) => {
        console.log("Chat session joined:", data);
        setCurrentSession(data.session);
        setMessages(data.session.messages || []);
      });

      socketRef.current.on("new_message", (data) => {
        console.log("New message received:", data);
        setMessages((prev) => [...prev, data.message]);

        // 如果消息不是当前用户发送的，增加未读计数
        if (data.message.sender_id !== userId) {
          setUnreadCount((prev) => prev + 1);
        }
      });

      socketRef.current.on("messages_read", (data) => {
        console.log("Messages marked as read:", data);
        // 更新本地消息的已读状态
        setMessages((prev) =>
          prev.map((msg) =>
            msg.session_id === data.session_id && msg.sender_id !== userId
              ? { ...msg, is_read: true }
              : msg
          )
        );
      });

      socketRef.current.on("unread_count", (data) => {
        console.log("Unread count updated:", data);
        if (data.unread_count !== undefined) {
          setUnreadCount(data.unread_count);
        }
      });

      socketRef.current.on("disconnect", (reason) => {
        console.log("Chat disconnected:", reason);
        setIsConnected(false);
      });

      socketRef.current.on("connect_error", (error) => {
        console.error("Chat connection error:", error);
        setIsConnected(false);
      });

      socketRef.current.connect();

      // 连接后立即获取会话列表和未读计数
      await fetchSessions();
      socketRef.current.emit("get_unread_count");
    } catch (error) {
      console.error("Failed to connect to chat:", error);
    }
  }, [userId, userType, loanId, fetchSessions]);

  // 断开连接
  const disconnect = useCallback(() => {
    if (socketRef.current) {
      socketRef.current.disconnect();
      socketRef.current = null;
    }
    setIsConnected(false);
  }, []);

  // 加入聊天室
  const joinChat = useCallback(
    (targetLoanId: string) => {
      if (!socketRef.current || !isConnected) {
        console.warn("Chat not connected");
        return;
      }

      socketRef.current.emit("join_chat", {
        loan_id: targetLoanId,
        ...(userType === "admin" ? { admin_id: userId } : { user_id: userId }),
      });
    },
    [isConnected, userId, userType]
  );

  // 标记消息为已读
  const markAsRead = useCallback(
    (sessionId: string) => {
      if (!socketRef.current || !isConnected) {
        console.warn("Chat not connected");
        return;
      }

      socketRef.current.emit("mark_read", { session_id: sessionId });
    },
    [isConnected]
  );

  // 自动连接
  useEffect(() => {
    if (autoConnect && userId && userType && loanId) {
      connect();
    }

    return () => {
      disconnect();
    };
  }, [autoConnect, userId, userType, loanId, connect, disconnect]);

  return {
    // 状态
    isConnected,
    currentSession,
    messages,
    sessions,
    unreadCount,
    isLoading,

    // 方法
    connect,
    disconnect,
    sendMessage,
    joinChat,
    markAsRead,
    fetchSessions,
    fetchMessages,
    getOrCreateSession,
  };
}
