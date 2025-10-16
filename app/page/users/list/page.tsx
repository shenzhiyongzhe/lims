"use client";
import { useEffect, useState } from "react";
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

  const fetchUsers = async (page = 1) => {
    setLoading(true);
    try {
      const res = await get(
        `/users?page=${page}&pageSize=${pagination.pageSize}`
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

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">用户列表</h1>
        <div className="text-sm text-muted-foreground">
          共 {pagination.total} 个用户
        </div>
      </div>

      <div className="border rounded-md">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>ID</TableHead>
              <TableHead>用户名</TableHead>
              <TableHead>手机号</TableHead>
              <TableHead>地址</TableHead>
              <TableHead>等级</TableHead>
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
                  <TableCell className="font-medium">{user.username}</TableCell>
                  <TableCell>{user.phone}</TableCell>
                  <TableCell className="max-w-xs truncate">
                    {user.address}
                  </TableCell>
                  <TableCell>{user.lv}</TableCell>
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
    </div>
  );
}
