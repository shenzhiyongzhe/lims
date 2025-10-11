import { useEffect, useRef, useState } from "react";
import { get } from "@/lib/http";

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
  const eventSourceRef = useRef<EventSource | null>(null);

  const connect = async (connectUrl?: string) => {
    const targetUrl = connectUrl || url;
    if (!targetUrl) {
      console.warn("No URL provided for SSE connection");
      setConnectionError("No URL provided for SSE connection");
      return;
    }

    // 如果已经连接，先断开
    if (eventSourceRef.current) {
      disconnect();
    }

    // 从localStorage获取admin信息并添加到URL参数
    let finalUrl = targetUrl;

    if (targetUrl.includes("type=payee")) {
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

        // 将admin.id添加到URL参数
        const urlObj = new URL(
          targetUrl.startsWith("http") ? targetUrl : `${BASE_URL}${targetUrl}`
        );
        urlObj.searchParams.set("admin_id", admin.id.toString());
        finalUrl = urlObj.toString();

        console.log("Admin ID from localStorage:", admin.id);
      } catch (error) {
        console.error("Error parsing admin data:", error);
        setConnectionError("Failed to parse admin data from localStorage");
        return;
      }
    }

    // 构建完整的 SSE URL
    const fullUrl = finalUrl.startsWith("http")
      ? finalUrl
      : `${BASE_URL}${finalUrl}`;

    console.log("SSE connection details:", {
      targetUrl,
      baseUrl: BASE_URL,
      fullUrl,
      readyState: eventSourceRef.current?.readyState,
    });

    // 测试NestJS服务器连接
    console.log("Testing NestJS server connection...");
    console.log("BASE_URL:", BASE_URL);
    console.log("Full URL:", fullUrl);
    console.log("Admin data from localStorage:", localStorage.getItem("admin"));

    // 清除之前的错误
    setConnectionError(null);

    try {
      console.log("Creating EventSource for:", fullUrl);
      eventSourceRef.current = new EventSource(fullUrl);

      eventSourceRef.current.onopen = () => {
        console.log("SSE connected successfully:", {
          url: fullUrl,
          readyState: eventSourceRef.current?.readyState,
        });
        setIsConnected(true);
        onOpen?.();
      };

      eventSourceRef.current.onmessage = (event) => {
        try {
          const message: SSEMessage = JSON.parse(event.data);
          setLastMessage(message);
          onMessage?.(message);
        } catch (error) {
          console.error("Failed to parse SSE message:", error);
        }
      };

      eventSourceRef.current.onerror = (error) => {
        const errorMessage = `SSE connection failed: ${eventSourceRef.current?.url} (readyState: ${eventSourceRef.current?.readyState})`;
        console.error("SSE connection error details:", {
          error,
          readyState: eventSourceRef.current?.readyState,
          url: eventSourceRef.current?.url,
          type: error.type,
          target: error.target,
          timeStamp: error.timeStamp,
          errorMessage,
        });
        setConnectionError(errorMessage);
        setIsConnected(false);
        onError?.(error);
      };

      eventSourceRef.current.addEventListener("close", () => {
        setIsConnected(false);
        onClose?.();
      });
    } catch (error) {
      const errorMessage = `Failed to create SSE connection: ${error}`;
      console.error("Failed to create SSE connection:", error);
      setConnectionError(errorMessage);
    }
  };

  const disconnect = () => {
    if (eventSourceRef.current) {
      console.log("Disconnecting SSE:", eventSourceRef.current.url);
      eventSourceRef.current.close();
      eventSourceRef.current = null;
    }
    setIsConnected(false);
  };

  useEffect(() => {
    if (autoConnect && url) {
      connect().catch((error) => {
        console.error("Failed to connect to SSE:", error);
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
