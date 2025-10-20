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
  type: "events" | "payee";
  url: string;
  queryParams: Record<string, string>;
}

interface UseWebSocketOptions {
  connections?: WebSocketConnection[];
  onMessage?: (message: WebSocketMessage, connectionType: string) => void;
  onOrderMessage?: (message: WebSocketMessage) => void; // 订单相关消息
  onOpen?: (connectionType: string) => void;
  onClose?: (connectionType: string) => void;
  onError?: (error: Event, connectionType: string) => void;
  autoConnect?: boolean;
}

export function useWebSocket({
  connections = [],
  onMessage,
  onOrderMessage,
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
  const connectionAttempts = useRef<Record<string, number>>({});
  const connectionTimeouts = useRef<Record<string, NodeJS.Timeout>>({});

  // 使用 ref 存储回调函数，避免依赖项问题
  const callbacksRef = useRef({
    onMessage,
    onOrderMessage,
    onOpen,
    onClose,
    onError,
  });

  // 更新回调函数引用
  callbacksRef.current = {
    onMessage,
    onOrderMessage,
    onOpen,
    onClose,
    onError,
  };

  // 处理消息路由
  const handleMessage = useCallback(
    (message: WebSocketMessage, connectionType: string) => {
      setLastMessage(message);

      // 调用通用消息处理器
      callbacksRef.current.onMessage?.(message, connectionType);

      // 根据消息类型调用特定处理器
      if (connectionType === "events" || connectionType === "payee") {
        callbacksRef.current.onOrderMessage?.(message);
      }
    },
    []
  );

  // 连接单个WebSocket
  const connectSocket = useCallback(
    async (connection: WebSocketConnection) => {
      const { id, type, url, queryParams } = connection;

      // 检查连接尝试次数，避免频繁重试
      const attempts = connectionAttempts.current[id] || 0;
      if (attempts > 3) {
        console.warn(`Too many connection attempts for ${id}, skipping`);
        return;
      }

      // 清除之前的超时
      if (connectionTimeouts.current[id]) {
        clearTimeout(connectionTimeouts.current[id]);
        delete connectionTimeouts.current[id];
      }

      if (socketRefs.current[id]) {
        socketRefs.current[id].disconnect();
        delete socketRefs.current[id];
      }

      try {
        console.log(`Creating ${type} WebSocket connection for:`, url, {
          attempt: attempts + 1,
          queryParams,
        });
        const socketUrl = url ? `${BASE_URL}/${url}` : BASE_URL;

        socketRefs.current[id] = io(socketUrl, {
          query: queryParams,
          transports: ["websocket", "polling"],
          autoConnect: false,
          timeout: 10000, // 10秒超时
        });

        const socket = socketRefs.current[id];

        socket.on("connect", () => {
          console.log(`${type} WebSocket connected successfully:`, socket.id);
          setIsConnected((prev) => ({ ...prev, [id]: true }));
          setConnectionError((prev) => ({ ...prev, [id]: "" }));
          // 重置连接尝试次数
          connectionAttempts.current[id] = 0;

          callbacksRef.current.onOpen?.(type);
        });

        socket.on("disconnect", (reason) => {
          console.log(`${type} WebSocket disconnected:`, reason);
          setIsConnected((prev) => ({ ...prev, [id]: false }));

          callbacksRef.current.onClose?.(type);
        });

        socket.on("connect_error", (error) => {
          const errorMessage = `${type} WebSocket connection failed: ${error.message}`;
          console.error(`${type} WebSocket connection error:`, error);
          setConnectionError((prev) => ({ ...prev, [id]: errorMessage }));
          setIsConnected((prev) => ({ ...prev, [id]: false }));

          // 增加连接尝试次数
          connectionAttempts.current[id] =
            (connectionAttempts.current[id] || 0) + 1;

          // 设置重试超时
          connectionTimeouts.current[id] = setTimeout(() => {
            console.log(`Retrying connection for ${id}...`);
            connectSocket(connection);
          }, 5000); // 5秒后重试

          callbacksRef.current.onError?.(error as any, type);
        });

        // 为不同类型的连接设置不同的消息处理器
        if (type === "events") {
          socket.on("message", (data: WebSocketMessage) => {
            handleMessage(data, type);
          });
          socket.on("connected", (data: WebSocketMessage) => {
            handleMessage(data, type);
          });
          socket.on("new_order", (data: WebSocketMessage) => {
            handleMessage(data, type);
          });
          socket.on("order_grabbed", (data: WebSocketMessage) => {
            handleMessage(data, type);
          });

          socket.connect();
        }
      } catch (error) {
        const errorMessage = `Failed to create ${type} WebSocket connection: ${error}`;
        console.error(errorMessage, error);
        setConnectionError((prev) => ({ ...prev, [id]: errorMessage }));
      }
    },
    [handleMessage]
  );
  // 连接所有WebSocket
  const connect = useCallback(async () => {
    console.log("Attempting to connect WebSockets...", {
      connections: connections.length,
      isConnected,
      socketRefs: Object.keys(socketRefs.current),
    });

    for (const connection of connections) {
      const isAlreadyConnected = isConnected[connection.id];
      const hasSocketRef = !!socketRefs.current[connection.id];

      console.log(`Connection ${connection.id}:`, {
        isAlreadyConnected,
        hasSocketRef,
        shouldConnect: !isAlreadyConnected && !hasSocketRef,
      });

      if (!isAlreadyConnected && !hasSocketRef) {
        console.log(`Connecting to ${connection.id}...`);
        await connectSocket(connection);
      } else {
        console.log(
          `Skipping ${connection.id} - already connected or has socket ref`
        );
      }
    }
  }, [connections, connectSocket, isConnected]);

  // 断开所有连接
  const disconnect = useCallback(() => {
    // 清理所有超时
    Object.values(connectionTimeouts.current).forEach((timeout) => {
      clearTimeout(timeout);
    });
    connectionTimeouts.current = {};

    // 重置连接尝试次数
    connectionAttempts.current = {};

    // 断开所有socket连接
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
    if (autoConnect && connections.length > 0) {
      // 检查是否已经有连接，避免重复连接
      const hasActiveConnections = connections.some(
        (conn) => isConnected[conn.id] || socketRefs.current[conn.id]
      );

      if (!hasActiveConnections) {
        console.log("Auto-connecting WebSocket...");
        connect();
      }
    }

    return () => {
      disconnect();
    };
  }, [autoConnect, connections.length]); // 只依赖长度，避免重复连接

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
      connectSocket(
        connections.find((c) => c.type === "events" || c.type === "payee")!
      ),
  };
}
