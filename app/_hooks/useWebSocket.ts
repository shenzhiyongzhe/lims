import { useEffect, useRef, useState, useCallback } from "react";
import { io, Socket } from "socket.io-client";

const BASE_URL = process.env.NEXT_PUBLIC_API_BASE || "http://localhost:3000";

export interface WebSocketMessage {
  type: string;
  data: any;
  timestamp?: string;
}

export interface WebSocketConnection {
  id: string;
  type: "events" | "chat";
  url: string;
  queryParams: Record<string, string>;
}

interface UseWebSocketOptions {
  connections?: WebSocketConnection[];
  onMessage?: (message: WebSocketMessage, connectionType: string) => void;
  onOrderMessage?: (message: WebSocketMessage) => void; // 订单相关消息
  onChatMessage?: (message: WebSocketMessage) => void; // 聊天相关消息
  onOpen?: (connectionType: string) => void;
  onClose?: (connectionType: string) => void;
  onError?: (error: Event, connectionType: string) => void;
  autoConnect?: boolean;
}

export function useWebSocket({
  connections = [],
  onMessage,
  onOrderMessage,
  onChatMessage,
  onOpen,
  onClose,
  onError,
  autoConnect = true,
}: UseWebSocketOptions = {}) {
  const [isConnected, setIsConnected] = useState<Record<string, boolean>>({});
  const [lastMessage, setLastMessage] = useState<WebSocketMessage | null>(null);
  const [connectionError, setConnectionError] = useState<
    Record<string, string>
  >({});
  const [unreadCount, setUnreadCount] = useState(0);
  const socketRefs = useRef<Record<string, Socket>>({});

  // 处理消息路由
  const handleMessage = useCallback(
    (message: WebSocketMessage, connectionType: string) => {
      setLastMessage(message);

      // 调用通用消息处理器
      onMessage?.(message, connectionType);

      // 根据消息类型调用特定处理器
      if (connectionType === "events") {
        onOrderMessage?.(message);
      } else if (connectionType === "chat") {
        onChatMessage?.(message);

        // 如果是聊天消息且不是当前用户发送的，增加未读计数
        if (message.type !== "connected" && message.data?.sender_id) {
          // 这里需要从localStorage或其他地方获取当前用户ID来判断
          const currentUserId =
            localStorage.getItem("admin") || localStorage.getItem("user");
          if (currentUserId) {
            try {
              const user = JSON.parse(currentUserId);
              if (message.data.sender_id !== user.id) {
                setUnreadCount((prev) => prev + 1);
              }
            } catch (e) {
              console.warn("Failed to parse user data for unread count");
            }
          }
        }
      }
    },
    [onMessage, onOrderMessage, onChatMessage]
  );

  // 连接单个WebSocket
  const connectSocket = useCallback(
    async (connection: WebSocketConnection) => {
      const { id, type, url, queryParams } = connection;

      if (socketRefs.current[id]) {
        socketRefs.current[id].disconnect();
      }

      try {
        console.log(`Creating ${type} WebSocket connection for:`, url);
        const socketUrl = url ? `${BASE_URL}/${url}` : BASE_URL;

        socketRefs.current[id] = io(socketUrl, {
          query: queryParams,
          transports: ["websocket", "polling"],
          autoConnect: false,
        });

        const socket = socketRefs.current[id];

        socket.on("connect", () => {
          console.log(`${type} WebSocket connected successfully:`, socket.id);
          setIsConnected((prev) => ({ ...prev, [id]: true }));
          setConnectionError((prev) => ({ ...prev, [id]: "" }));
          onOpen?.(type);
        });

        socket.on("disconnect", (reason) => {
          console.log(`${type} WebSocket disconnected:`, reason);
          setIsConnected((prev) => ({ ...prev, [id]: false }));
          onClose?.(type);
        });

        socket.on("connect_error", (error) => {
          const errorMessage = `${type} WebSocket connection failed: ${error.message}`;
          console.error(`${type} WebSocket connection error:`, error);
          setConnectionError((prev) => ({ ...prev, [id]: errorMessage }));
          setIsConnected((prev) => ({ ...prev, [id]: false }));
          onError?.(error as any, type);
        });

        // 为不同类型的连接设置不同的消息处理器
        if (type === "events") {
          socket.on("message", (data: WebSocketMessage) => {
            handleMessage(data, "events");
          });
          socket.on("connected", (data: WebSocketMessage) => {
            handleMessage(data, "events");
          });
          socket.on("new_order", (data: WebSocketMessage) => {
            handleMessage(data, "events");
          });
          socket.on("order_grabbed", (data: WebSocketMessage) => {
            handleMessage(data, "events");
          });
        } else if (type === "chat") {
          socket.on("message", (data: WebSocketMessage) => {
            handleMessage(data, "chat");
          });
          socket.on("connected", (data: WebSocketMessage) => {
            handleMessage(data, "chat");
          });
          socket.on("chat_session_joined", (data: WebSocketMessage) => {
            handleMessage(data, "chat");
          });
          socket.on("new_message", (data: WebSocketMessage) => {
            handleMessage(data, "chat");
          });
          socket.on("messages_read", (data: WebSocketMessage) => {
            handleMessage(data, "chat");
          });
          socket.on("unread_count", (data: WebSocketMessage) => {
            if (data.data?.unread_count !== undefined) {
              setUnreadCount(data.data.unread_count);
            }
            handleMessage(data, "chat");
          });
        }

        socket.connect();
      } catch (error) {
        const errorMessage = `Failed to create ${type} WebSocket connection: ${error}`;
        console.error(errorMessage, error);
        setConnectionError((prev) => ({ ...prev, [id]: errorMessage }));
      }
    },
    [handleMessage, onOpen, onClose, onError]
  );

  // 连接所有WebSocket
  const connect = useCallback(async () => {
    for (const connection of connections) {
      if (!isConnected[connection.id]) {
        await connectSocket(connection);
      }
    }
  }, [connections, connectSocket, isConnected]);

  // 断开所有连接
  const disconnect = useCallback(() => {
    Object.values(socketRefs.current).forEach((socket) => {
      if (socket) {
        socket.disconnect();
      }
    });
    socketRefs.current = {};
    setIsConnected({});
    setConnectionError({});
  }, []);

  // 发送消息到特定连接
  const sendMessage = useCallback(
    (connectionId: string, event: string, data: any) => {
      const socket = socketRefs.current[connectionId];
      if (socket && socket.connected) {
        socket.emit(event, data);
      } else {
        console.warn(`Socket ${connectionId} not connected`);
      }
    },
    []
  );

  // 获取连接状态
  const getConnectionStatus = useCallback(
    (connectionId: string) => {
      return {
        isConnected: isConnected[connectionId] || false,
        error: connectionError[connectionId] || null,
      };
    },
    [isConnected, connectionError]
  );

  // 自动连接
  useEffect(() => {
    if (
      autoConnect &&
      connections.length > 0 &&
      Object.keys(isConnected).length === 0
    ) {
      connect();
    }

    return () => {
      disconnect();
    };
  }, [autoConnect, connections, connect, disconnect, isConnected]);

  return {
    // 状态
    isConnected,
    lastMessage,
    connectionError,
    unreadCount,

    // 方法
    connect,
    disconnect,
    sendMessage,
    getConnectionStatus,

    // 便捷方法
    connectEvents: () =>
      connectSocket(connections.find((c) => c.type === "events")!),
    connectChat: () =>
      connectSocket(connections.find((c) => c.type === "chat")!),
  };
}
