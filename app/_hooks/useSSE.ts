import { useEffect, useRef, useState } from "react";

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
  const eventSourceRef = useRef<EventSource | null>(null);

  const connect = (connectUrl?: string) => {
    const targetUrl = connectUrl || url;
    if (!targetUrl) {
      console.warn("No URL provided for SSE connection");
      return;
    }

    // 如果已经连接，先断开
    if (eventSourceRef.current) {
      disconnect();
    }

    try {
      console.log("Connecting to SSE:", targetUrl);
      eventSourceRef.current = new EventSource(targetUrl);

      eventSourceRef.current.onopen = () => {
        console.log("SSE connected:", targetUrl);
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
        console.error("SSE connection error:", error);
        setIsConnected(false);
        onError?.(error);
      };

      eventSourceRef.current.addEventListener("close", () => {
        setIsConnected(false);
        onClose?.();
      });
    } catch (error) {
      console.error("Failed to create SSE connection:", error);
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
      connect();
    }

    return () => {
      disconnect();
    };
  }, [url, autoConnect]);

  return {
    isConnected,
    lastMessage,
    connect,
    disconnect,
  };
}
