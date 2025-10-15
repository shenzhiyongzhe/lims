import { useEffect, useRef, useState } from "react";
import { io, Socket } from "socket.io-client";

// 使用NestJS后端地址，端口3000
const BASE_URL = process.env.NEXT_PUBLIC_API_BASE || "http://localhost:3000";

interface SSEMessage {
  type: string;
  data: any;
}

interface UseSSEOptions {
  url?: string;
  onMessage?: (message: SSEMessage) => void;
  onOpen?: () => void;
  onClose?: () => void;
  onError?: (error: Event) => void;
  autoConnect?: boolean; // 新增：是否自动连接
}

export function useSSE({
  url,
  onMessage,
  onOpen,
  onClose,
  onError,
  autoConnect = true, // 默认自动连接
}: UseSSEOptions) {
  const [isConnected, setIsConnected] = useState(false);
  const [lastMessage, setLastMessage] = useState<SSEMessage | null>(null);
  const [connectionError, setConnectionError] = useState<string | null>(null);
  const socketRef = useRef<Socket | null>(null);

  const connect = async (connectUrl?: string) => {
    const targetUrl = connectUrl || url;
    if (!targetUrl) {
      console.warn("No URL provided for Socket.IO connection");
      setConnectionError("No URL provided for Socket.IO connection");
      return;
    }

    // 如果已经连接，先断开
    if (socketRef.current) {
      disconnect();
    }

    // 从localStorage获取admin信息并构建查询参数
    let queryParams: Record<string, string> = {};

    // 解析URL中的查询参数
    let urlType = "customer";
    let urlParams: Record<string, string> = {};

    // 解析URL中的查询参数
    if (targetUrl.includes("?")) {
      const urlObj = new URL(
        targetUrl.startsWith("http") ? targetUrl : `${BASE_URL}${targetUrl}`
      );
      urlObj.searchParams.forEach((value, key) => {
        urlParams[key] = value;
      });
      if (urlParams.type) {
        urlType = urlParams.type;
      }
    }

    queryParams.type = urlType;

    if (urlType === "payee") {
      try {
        // 从localStorage获取admin信息
        const adminData = localStorage.getItem("admin");
        if (!adminData) {
          setConnectionError("No admin data found in localStorage");
          return;
        }

        const admin = JSON.parse(adminData);
        if (!admin.id) {
          setConnectionError("Invalid admin data: missing id");
          return;
        }

        queryParams.admin_id = admin.id.toString();
        console.log("Admin ID from localStorage:", admin.id);
      } catch (error) {
        console.error("Error parsing admin data:", error);
        setConnectionError("Failed to parse admin data from localStorage");
        return;
      }
    } else if (urlType === "customer") {
      // 对于customer类型，从URL参数中获取user_id
      if (urlParams.user_id) {
        queryParams.user_id = urlParams.user_id;
        console.log("User ID from URL:", urlParams.user_id);
      } else {
        console.warn("No user_id found in URL for customer connection");
      }
    }

    // 构建Socket.IO服务器URL
    const serverUrl = BASE_URL;

    console.log("Socket.IO connection details:", {
      targetUrl,
      serverUrl,
      queryParams,
    });

    // 测试Socket.IO服务器连接
    console.log("Testing Socket.IO server connection...");
    console.log("Server URL:", serverUrl);
    console.log("Query params:", queryParams);
    console.log("Admin data from localStorage:", localStorage.getItem("admin"));

    // 清除之前的错误
    setConnectionError(null);

    try {
      console.log("Creating Socket.IO connection for:", serverUrl);
      socketRef.current = io(serverUrl, {
        query: queryParams,
        transports: ["websocket", "polling"],
        autoConnect: false,
      });

      socketRef.current.on("connect", () => {
        console.log("Socket.IO connected successfully:", {
          id: socketRef.current?.id,
          connected: socketRef.current?.connected,
        });
        setIsConnected(true);
        onOpen?.();
      });

      socketRef.current.on("message", (data: SSEMessage) => {
        console.log("Received Socket.IO message:", data);
        setLastMessage(data);
        onMessage?.(data);
      });

      socketRef.current.on("connected", (data: SSEMessage) => {
        console.log("Socket.IO connected event:", data);
      });

      socketRef.current.on("disconnect", (reason) => {
        console.log("Socket.IO connection disconnected:", reason);
        setIsConnected(false);
        onClose?.();
      });

      socketRef.current.on("connect_error", (error) => {
        const errorMessage = `Socket.IO connection failed: ${error.message}`;
        console.error("Socket.IO connection error details:", {
          error,
          errorMessage,
        });
        setConnectionError(errorMessage);
        setIsConnected(false);
        onError?.(error as any);
      });

      // 手动连接
      socketRef.current.connect();
    } catch (error) {
      const errorMessage = `Failed to create Socket.IO connection: ${error}`;
      console.error("Failed to create Socket.IO connection:", error);
      setConnectionError(errorMessage);
    }
  };

  const disconnect = () => {
    if (socketRef.current) {
      console.log("Disconnecting Socket.IO:", socketRef.current.id);
      socketRef.current.disconnect();
      socketRef.current = null;
    }
    setIsConnected(false);
  };

  useEffect(() => {
    if (autoConnect && url) {
      connect().catch((error) => {
        console.error("Failed to connect to Socket.IO:", error);
        setConnectionError(`Failed to connect: ${error.message}`);
      });
    }

    return () => {
      disconnect();
    };
  }, [url, autoConnect]);

  return {
    isConnected,
    lastMessage,
    connectionError,
    connect,
    disconnect,
  };
}
