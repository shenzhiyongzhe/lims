// lib/http.ts
const BASE_URL = process.env.NEXT_PUBLIC_API_BASE || "";

export type ApiResponse<T = unknown> = {
  code?: number;
  message?: string;
  data?: T;
  [key: string]: any;
};

type RequestOptions = {
  params?: Record<string, any>;
  headers?: HeadersInit;
  timeout?: number; // ms
  // 仅 POST/PUT/PATCH 用
  body?: any;
  // 是否自动 JSON 序列化（默认 true）
  json?: boolean;
  // 是否在非 2xx 时抛错（默认 true）
  throwOnHTTPError?: boolean;
};

function buildQuery(params?: Record<string, any>) {
  if (!params) return "";
  const usp = new URLSearchParams();
  Object.entries(params).forEach(([k, v]) => {
    if (v === undefined || v === null) return;
    usp.append(k, String(v));
  });
  const q = usp.toString();
  return q ? `?${q}` : "";
}

async function coreFetch<T>(
  url: string,
  method: "GET" | "POST" | "PUT" | "DELETE",
  opts: RequestOptions = {}
): Promise<T> {
  const {
    params,
    headers,
    timeout = 15000,
    body,
    json = true,
    throwOnHTTPError = true,
  } = opts;

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeout);

  const finalUrl = `${BASE_URL}${url}${buildQuery(params)}`;
  // 从 localStorage 获取用户信息并添加到 Authorization header
  const getAuthHeaders = (): Record<string, string> => {
    if (typeof window !== "undefined") {
      const adminData = localStorage.getItem("admin");
      if (adminData) {
        try {
          const admin = JSON.parse(adminData);
          return {
            Authorization: `Bearer ${Buffer.from(
              JSON.stringify(admin)
            ).toString("base64")}`,
          };
        } catch (e) {
          console.error("Failed to parse admin data:", e);
        }
      }
    }
    return {};
  };

  const init: RequestInit = {
    method,
    headers: {
      ...(json && method !== "GET"
        ? { "Content-Type": "application/json" }
        : {}),
      ...getAuthHeaders(), // 添加认证头
      ...(headers as Record<string, string>),
    },
    credentials: "include", // 确保发送 cookie
    signal: controller.signal,
  };

  // 对于 FormData，不要设置 Content-Type，让浏览器自动设置
  if (body instanceof FormData) {
    delete (init.headers as any)["Content-Type"];
  }

  if (method !== "GET" && body !== undefined) {
    init.body = json ? JSON.stringify(body) : body;
  }

  try {
    const res = await fetch(finalUrl, init);

    if (throwOnHTTPError && !res.ok) {
      let errMsg = `HTTP ${res.status}`;
      try {
        const errJson = await res.json();
        errMsg = errJson?.message || errMsg;
      } catch {}
      throw new Error(errMsg);
    }

    // 尝试解析 JSON；如果不是 JSON，返回原始文本
    const contentType = res.headers.get("content-type") || "";
    if (contentType.includes("application/json")) {
      return (await res.json()) as T;
    }
    return (await res.text()) as unknown as T;
  } finally {
    clearTimeout(timer);
  }
}

export function get<T = ApiResponse<any>>(
  url: string,
  options?: Omit<RequestOptions, "body">
) {
  return coreFetch<T>(url, "GET", options);
}

export function post<T = ApiResponse<any>>(
  url: string,
  body?: any,
  options?: Omit<RequestOptions, "body">
) {
  return coreFetch<T>(url, "POST", { ...options, body });
}

export function put<T = ApiResponse<any>>(
  url: string,
  body?: any,
  options?: Omit<RequestOptions, "body">
) {
  return coreFetch<T>(url, "PUT", { ...options, body });
}

export function del<T = ApiResponse<any>>(
  url: string,
  options?: Omit<RequestOptions, "body">
) {
  return coreFetch<T>(url, "DELETE", options);
}
