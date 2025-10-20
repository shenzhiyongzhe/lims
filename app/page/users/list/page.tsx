"use client";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { get } from "@/lib/http";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
  PaginationEllipsis,
} from "@/components/ui/pagination";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

type User = {
  id: number;
  username: string;
  phone: string;
  address: string;
  lv: string;
};

type PaginationInfo = {
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
};

export default function UsersListPage() {
  const router = useRouter();
  const [data, setData] = useState<User[]>([]);
  const [pagination, setPagination] = useState<PaginationInfo>({
    page: 1,
    pageSize: 20,
    total: 0,
    totalPages: 0,
    hasNext: false,
    hasPrev: false,
  });
  const [loading, setLoading] = useState(false);
  const [keyword, setKeyword] = useState("");

  const fetchUsers = async (page = 1, kw = keyword) => {
    setLoading(true);
    try {
      const res = await get(
        `/users?page=${page}&pageSize=${
          pagination.pageSize
        }&search=${encodeURIComponent(kw)}`
      );
      if (res.code === 200) {
        setData(res.data.data || []);
        setPagination(
          res.data.pagination || {
            page: 1,
            pageSize: 20,
            total: 0,
            totalPages: 0,
            hasNext: false,
            hasPrev: false,
          }
        );
      }
    } catch (error) {
      console.error("Failed to fetch users:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handlePageChange = (newPage: number) => {
    if (newPage >= 1 && newPage <= pagination.totalPages) {
      fetchUsers(newPage);
    }
  };

  const renderPaginationItems = () => {
    const items = [];
    const { page, totalPages } = pagination;

    // Always show first page
    if (page > 1) {
      items.push(
        <PaginationItem key={1}>
          <PaginationLink onClick={() => handlePageChange(1)}>1</PaginationLink>
        </PaginationItem>
      );
    }

    // Show ellipsis if needed
    if (page > 3) {
      items.push(
        <PaginationItem key="ellipsis1">
          <PaginationEllipsis />
        </PaginationItem>
      );
    }

    // Show current page and adjacent pages
    const start = Math.max(2, page - 1);
    const end = Math.min(totalPages - 1, page + 1);

    for (let i = start; i <= end; i++) {
      if (i === page) {
        items.push(
          <PaginationItem key={i}>
            <PaginationLink isActive>{i}</PaginationLink>
          </PaginationItem>
        );
      } else {
        items.push(
          <PaginationItem key={i}>
            <PaginationLink onClick={() => handlePageChange(i)}>
              {i}
            </PaginationLink>
          </PaginationItem>
        );
      }
    }

    // Show ellipsis if needed
    if (page < totalPages - 2) {
      items.push(
        <PaginationItem key="ellipsis2">
          <PaginationEllipsis />
        </PaginationItem>
      );
    }

    // Always show last page
    if (page < totalPages) {
      items.push(
        <PaginationItem key={totalPages}>
          <PaginationLink onClick={() => handlePageChange(totalPages)}>
            {totalPages}
          </PaginationLink>
        </PaginationItem>
      );
    }

    return items;
  };

  const headerRight = useMemo(
    () => (
      <div className="flex items-center gap-3">
        <div className="text-sm text-muted-foreground">
          共 {pagination.total} 个用户
        </div>
      </div>
    ),
    [pagination.total]
  );

  return (
    <div className="p-6 space-y-6">
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between">
            <div>
              <CardTitle>用户列表</CardTitle>
              <CardDescription>查看并管理系统中的客户信息</CardDescription>
            </div>
            {headerRight}
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Toolbar */}
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-2 w-full sm:max-w-md">
              <Input
                placeholder="搜索用户名或手机号"
                value={keyword}
                onChange={(e) => setKeyword(e.target.value)}
              />
              <Button onClick={() => fetchUsers(1, keyword)} disabled={loading}>
                搜索
              </Button>
              <Button
                variant="secondary"
                onClick={() => {
                  setKeyword("");
                  fetchUsers(1, "");
                }}
                disabled={loading}
              >
                重置
              </Button>
            </div>
          </div>

          <div className="border rounded-md overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="bg-gray-50/60 sticky top-0 z-10">
                  <TableHead className="w-16">ID</TableHead>
                  <TableHead>用户名</TableHead>
                  <TableHead>手机号</TableHead>
                  <TableHead>地址</TableHead>
                  <TableHead className="w-24">等级</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-8">
                      加载中...
                    </TableCell>
                  </TableRow>
                ) : data.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={5}
                      className="text-center py-8 text-muted-foreground"
                    >
                      暂无用户数据
                    </TableCell>
                  </TableRow>
                ) : (
                  data.map((user) => (
                    <TableRow
                      key={user.id}
                      className="cursor-pointer hover:bg-muted/50"
                    >
                      <TableCell>{user.id}</TableCell>
                      <TableCell className="font-medium">
                        {user.username}
                      </TableCell>
                      <TableCell>{user.phone}</TableCell>
                      <TableCell className="max-w-xs truncate">
                        {user.address}
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary">{user.lv}</Badge>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>

          {pagination.totalPages > 1 && (
            <Pagination>
              <PaginationContent>
                <PaginationItem>
                  <PaginationPrevious
                    onClick={() => handlePageChange(pagination.page - 1)}
                    className={
                      !pagination.hasPrev
                        ? "pointer-events-none opacity-50"
                        : "cursor-pointer"
                    }
                  />
                </PaginationItem>

                {renderPaginationItems()}

                <PaginationItem>
                  <PaginationNext
                    onClick={() => handlePageChange(pagination.page + 1)}
                    className={
                      !pagination.hasNext
                        ? "pointer-events-none opacity-50"
                        : "cursor-pointer"
                    }
                  />
                </PaginationItem>
              </PaginationContent>
            </Pagination>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
