"use client";

import { useEffect, useMemo, useState } from "react";
import SearchableSelect, {
  SelectOption,
} from "@/app/_components/SearchableSelect";
import { useSearchableSelect } from "@/app/_hooks/useSearchableSelect";
import { get, post } from "@/lib/http";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogTrigger,
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";

type Props = {
  label?: string;
  placeholder?: string;
  value?: SelectOption | string | null;
  onChange?: (user: SelectOption) => void;
};

export default function UserSelectWithAdd({
  label = "选择用户",
  placeholder = "请选择用户",
  value,
  onChange,
}: Props) {
  const { toast } = useToast();
  const select = useSearchableSelect();
  const [options, setOptions] = useState<SelectOption[]>([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const [creating, setCreating] = useState(false);
  const [username, setUsername] = useState("");
  const [address, setAddress] = useState("");

  const fetchUsers = async (query: string) => {
    setLoading(true);
    try {
      const res = await get(`/users?search=${query}`);
      setOptions(res.data?.data || []);
    } catch (e: any) {
      toast({
        title: "获取用户失败",
        description: e?.message || "",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers("");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (select.query) fetchUsers(select.query);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [select.query]);

  const handleSelect = (user: SelectOption) => {
    const selected = select.handleSelect(user);
    onChange?.(selected);
  };

  const canSubmit = useMemo(
    () => username.trim().length > 0 && address.trim().length > 0,
    [username, address]
  );

  const handleCreate = async () => {
    if (!canSubmit) return;
    setCreating(true);
    try {
      const res = await post<{
        code: number;
        data: any;
        message?: string;
      }>("/users", {
        username,
        address,
      });
      const created = res?.data;
      if (res.code == 200) {
        const option: SelectOption = {
          id: created.id,
          username: created.username,
        };
        // Update list and select
        setOptions((prev) => [
          { id: created.id, username: created.username },
          ...prev,
        ]);
        onChange?.(option);
        toast({
          title: "创建成功",
          description: `已创建用户 ${created.username}`,
          variant: "success",
        });
        setOpen(false);
        setUsername("");
        setAddress("");
      }
    } catch (e: any) {
      toast({
        title: "创建失败",
        description: e?.message || "",
        variant: "destructive",
      });
    } finally {
      setCreating(false);
    }
  };

  const displayValue =
    typeof value === "string"
      ? value
      : value
      ? value.username ||
        value.name ||
        value.label ||
        value.value ||
        String(value.id)
      : select.selectedValue;

  return (
    <div className="space-y-2">
      {label && (
        <Label className="text-sm font-medium text-gray-700">{label}</Label>
      )}
      <div className="flex items-start gap-3">
        <div className="flex-1">
          <SearchableSelect
            label=""
            value={displayValue}
            placeholder={placeholder}
            options={options}
            loading={loading}
            query={select.query}
            onQueryChange={select.handleQueryChange}
            onSelect={handleSelect}
            onToggle={select.handleToggle}
            onClose={select.handleClose}
            isOpen={select.isOpen}
          />
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button type="button" className="shrink-0">
              添加
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>新增用户</DialogTitle>
              <DialogDescription>
                填写用户名与地址，创建后将自动选择该用户。
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-2">
              <div className="space-y-1">
                <Label htmlFor="new_username">用户名</Label>
                <Input
                  id="new_username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="请输入用户名"
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="new_address">地址</Label>
                <Input
                  id="new_address"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="请输入地址"
                />
              </div>
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="secondary"
                onClick={() => setOpen(false)}
              >
                取消
              </Button>
              <Button
                type="button"
                onClick={handleCreate}
                disabled={!canSubmit || creating}
              >
                {creating ? "创建中..." : "提交"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
