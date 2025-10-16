"use client";

import { useEffect, useState, useRef, useCallback, useMemo } from "react";
import { get, post } from "@/lib/http";
import { useWebSocket } from "@/app/_hooks/useWebSocket";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Send, MessageCircle, User, Clock } from "lucide-react";
import { cn } from "@/lib/utils";

interface ChatSession {
  id: string;
  loan_id: string;
  admin_id: number;
  user_id: number;
  created_at: string;
  updated_at: string;
  last_message_at: string;
  unread_count: number;
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

interface ChatMessage {
  id: string;
  session_id: string;
  sender_id: number;
  sender_type: string;
  message_type: string;
  content: string;
  is_read: boolean;
  created_at: string;
}

interface AuthenticatedRequest {
  user: {
    id: number;
    role: string;
  };
  clientId?: string;
}

export default function ChatPage() {
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [selectedSession, setSelectedSession] = useState<ChatSession | null>(
    null
  );
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [messageInput, setMessageInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [sendingMessage, setSendingMessage] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [currentUser, setCurrentUser] = useState<{
    id: number;
    role: string;
  } | null>(null);

  const [clientId, setClientId] = useState<string | null>(null);
  const [showUsernameDialog, setShowUsernameDialog] = useState(false);
  const [usernameInput, setUsernameInput] = useState("");

  // 初始化客户端ID
  useEffect(() => {
    if (typeof window !== "undefined") {
      const existingClientId = getClientId();
      if (existingClientId) {
        setClientId(existingClientId);
      } else {
        // 没有客户端ID时，显示用户名输入对话框
        setShowUsernameDialog(true);
      }
    }
  }, []);

  // 处理用户名提交
  const handleUsernameSubmit = () => {
    if (!usernameInput.trim()) return;

    const newClientId = `user_${usernameInput.trim()}`;
    document.cookie = `client_id=${newClientId}; path=/; max-age=${
      30 * 24 * 60 * 60
    }; SameSite=Strict`;
    setClientId(newClientId);
    setShowUsernameDialog(false);
  };

  // 获取用户信息或初始化普通用户
  useEffect(() => {
    const initializeUser = async () => {
      // 聊天页面不需要认证，直接设置为普通用户模式
      console.log("设置为普通用户模式");
      setCurrentUser(null);
    };
    initializeUser();
  }, []);

  // 获取客户端ID
  const getClientId = () => {
    // 确保只在客户端环境中运行
    if (typeof window === "undefined") {
      return null;
    }

    // 从cookie中获取客户端ID
    const cookies = document.cookie.split(";");
    for (const cookie of cookies) {
      const [name, value] = cookie.trim().split("=");
      if (name === "client_id") {
        return value;
      }
    }
    return null;
  };

  // WebSocket钩子
  const { isConnected, sendMessage, connect, lastMessage } = useWebSocket({
    connections: useMemo(
      () => [
        {
          id: "chat",
          type: "chat" as const,
          url: "",
          queryParams: {
            ...(currentUser?.id && { user_id: currentUser.id.toString() }),
            user_type: currentUser?.role || "user",
            client_id: clientId || "",
          },
        },
      ],
      [currentUser?.id, currentUser?.role, clientId]
    ),
    onChatMessage: (message) => {
      if (message.type === "new_message") {
        const newMessage = message.data?.message;
        if (newMessage) {
          setMessages((prev) => [...prev, newMessage]);
          // 更新会话列表中的最后消息
          setSessions((prev) =>
            prev.map((session) =>
              session.id === newMessage.session_id
                ? {
                    ...session,
                    last_message_at: newMessage.created_at,
                    last_message: {
                      id: newMessage.id,
                      content: newMessage.content,
                      message_type: newMessage.message_type,
                      created_at: newMessage.created_at,
                      sender_type: newMessage.sender_type,
                    },
                    unread_count:
                      newMessage.sender_type !== (currentUser?.role || "user")
                        ? (session.unread_count || 0) + 1
                        : session.unread_count || 0,
                  }
                : session
            )
          );
        }
      }
    },
    onOpen: () => {
      console.log("聊天WebSocket连接成功");
      if (clientId) {
        fetchChatSessions();
      }
    },
    autoConnect: !!clientId,
  });

  // 获取聊天会话列表
  const fetchChatSessions = useCallback(async () => {
    if (!clientId) return;

    try {
      setLoading(true);
      const response = await get(`/chat/sessions?client_id=${clientId}`);
      if (response && Array.isArray(response)) {
        setSessions(response);
      }
    } catch (error) {
      console.error("获取聊天会话失败:", error);
    } finally {
      setLoading(false);
    }
  }, [clientId]);

  // 获取聊天消息历史
  const fetchMessages = useCallback(async (sessionId: string) => {
    try {
      const response = await get(`/chat/sessions/${sessionId}`);
      if (response && response.messages) {
        setMessages(response.messages);
        // 标记消息为已读
        await get(`/chat/sessions/${sessionId}/mark-read`);
        // 更新会话未读数
        setSessions((prev) =>
          prev.map((session) =>
            session.id === sessionId ? { ...session, unread_count: 0 } : session
          )
        );
      }
    } catch (error) {
      console.error("获取聊天消息失败:", error);
    }
  }, []);

  // 发送消息
  const handleSendMessage = async () => {
    if (!messageInput.trim() || !selectedSession || sendingMessage) return;

    try {
      setSendingMessage(true);

      // 调用API发送消息
      await post("/chat/messages", {
        session_id: selectedSession.id,
        message_type: "text",
        content: messageInput.trim(),
      });

      setMessageInput("");
    } catch (error) {
      console.error("发送消息失败:", error);
    } finally {
      setSendingMessage(false);
    }
  };

  // 选择聊天会话
  const handleSelectSession = (session: ChatSession) => {
    setSelectedSession(session);
    fetchMessages(session.id);
  };

  // 格式化时间
  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);

    if (diffInHours < 24) {
      return date.toLocaleTimeString("zh-CN", {
        hour: "2-digit",
        minute: "2-digit",
      });
    } else {
      return date.toLocaleDateString("zh-CN", {
        month: "short",
        day: "numeric",
      });
    }
  };

  // 自动滚动到底部
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // 初始化
  useEffect(() => {
    if (currentUser) {
      fetchChatSessions();
    }
  }, [currentUser, fetchChatSessions]);

  // 聊天功能现在对所有用户开放，无需登录检查

  // 如果没有客户端ID，显示用户名输入对话框
  if (showUsernameDialog) {
    return (
      <div className="container mx-auto p-6 h-screen flex items-center justify-center">
        <Dialog open={showUsernameDialog} onOpenChange={setShowUsernameDialog}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>请输入您的用户名</DialogTitle>
              <DialogDescription>
                请为您的聊天会话设置一个用户名，这将用于标识您的对话。
              </DialogDescription>
            </DialogHeader>
            <div className="flex items-center space-x-2">
              <div className="grid flex-1 gap-2">
                <Input
                  placeholder="请输入用户名"
                  value={usernameInput}
                  onChange={(e) => setUsernameInput(e.target.value)}
                  onKeyPress={(e) => {
                    if (e.key === "Enter") {
                      handleUsernameSubmit();
                    }
                  }}
                />
              </div>
            </div>
            <DialogFooter>
              <Button
                type="submit"
                onClick={handleUsernameSubmit}
                disabled={!usernameInput.trim()}
              >
                开始聊天
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 h-screen">
      <div className="grid grid-cols-12 gap-6 h-full">
        {/* 聊天会话列表 */}
        <div className="col-span-4">
          <Card className="h-full">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MessageCircle className="h-5 w-5" />
                聊天对话
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <ScrollArea className="h-[calc(100vh-12rem)]">
                {loading ? (
                  <div className="p-4 text-center text-muted-foreground">
                    加载中...
                  </div>
                ) : sessions.length === 0 ? (
                  <div className="p-4 text-center text-muted-foreground">
                    暂无聊天对话
                  </div>
                ) : (
                  <div className="space-y-1">
                    {sessions.map((session) => (
                      <div
                        key={session.id}
                        className={cn(
                          "p-3 cursor-pointer hover:bg-muted/50 transition-colors",
                          selectedSession?.id === session.id && "bg-muted"
                        )}
                        onClick={() => handleSelectSession(session)}
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <User className="h-4 w-4 text-muted-foreground" />
                              <span className="font-medium truncate">
                                {currentUser?.role === "admin"
                                  ? session.user?.username ||
                                    `用户${session.user_id}`
                                  : session.admin?.username ||
                                    `管理员${session.admin_id}`}
                              </span>
                              {session.unread_count > 0 && (
                                <Badge
                                  variant="destructive"
                                  className="ml-auto"
                                >
                                  {session.unread_count}
                                </Badge>
                              )}
                            </div>
                            <p className="text-sm text-muted-foreground truncate mb-1">
                              {session.last_message?.content || "暂无消息"}
                            </p>
                            <div className="flex items-center gap-1 text-xs text-muted-foreground">
                              <Clock className="h-3 w-3" />
                              {formatTime(session.last_message_at)}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </ScrollArea>
            </CardContent>
          </Card>
        </div>

        {/* 聊天消息区域 */}
        <div className="col-span-8">
          <Card className="h-full flex flex-col">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                {selectedSession ? (
                  <>
                    <User className="h-5 w-5" />
                    {currentUser?.role === "admin"
                      ? selectedSession.user?.username ||
                        `用户${selectedSession.user_id}`
                      : selectedSession.admin?.username ||
                        `管理员${selectedSession.admin_id}`}
                  </>
                ) : (
                  "选择对话"
                )}
              </CardTitle>
            </CardHeader>

            {/* 消息列表 */}
            <CardContent className="flex-1 p-0">
              <ScrollArea className="h-full p-4">
                {selectedSession ? (
                  messages.length === 0 ? (
                    <div className="flex items-center justify-center h-full text-muted-foreground">
                      <div className="text-center">
                        <MessageCircle className="mx-auto h-12 w-12 opacity-50" />
                        <p className="mt-2">暂无消息记录</p>
                        <p className="text-sm">开始与对方对话吧</p>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {messages.map((message) => {
                        const isOwn =
                          message.sender_type === (currentUser?.role || "user");
                        return (
                          <div
                            key={message.id}
                            className={cn(
                              "flex",
                              isOwn ? "justify-end" : "justify-start"
                            )}
                          >
                            <div
                              className={cn(
                                "max-w-[70%] rounded-lg px-3 py-2",
                                isOwn
                                  ? "bg-primary text-primary-foreground"
                                  : "bg-muted"
                              )}
                            >
                              <p className="text-sm">{message.content}</p>
                              <p
                                className={cn(
                                  "text-xs mt-1",
                                  isOwn
                                    ? "text-primary-foreground/70"
                                    : "text-muted-foreground"
                                )}
                              >
                                {formatTime(message.created_at)}
                              </p>
                            </div>
                          </div>
                        );
                      })}
                      <div ref={messagesEndRef} />
                    </div>
                  )
                ) : (
                  <div className="flex items-center justify-center h-full text-muted-foreground">
                    <div className="text-center">
                      <MessageCircle className="mx-auto h-12 w-12 opacity-50" />
                      <p className="mt-2">请选择一个对话</p>
                    </div>
                  </div>
                )}
              </ScrollArea>
            </CardContent>

            {/* 消息输入区 */}
            {selectedSession && (
              <>
                <Separator />
                <div className="p-4">
                  <div className="flex gap-2">
                    <Input
                      value={messageInput}
                      onChange={(e) => setMessageInput(e.target.value)}
                      placeholder="输入消息..."
                      onKeyPress={(e) => {
                        if (e.key === "Enter" && !e.shiftKey) {
                          e.preventDefault();
                          handleSendMessage();
                        }
                      }}
                      disabled={sendingMessage}
                    />
                    <Button
                      onClick={handleSendMessage}
                      disabled={!messageInput.trim() || sendingMessage}
                    >
                      <Send className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
}
