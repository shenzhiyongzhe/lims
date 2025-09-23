"use client";

import { useEffect, useRef } from "react";

// 通用的选项类型
export interface SelectOption {
  id: number | string;
  username?: string;
  name?: string;
  label?: string;
  value?: string;
  [key: string]: any; // 允许其他属性
}

interface SearchableSelectProps {
  label: string;
  value: string;
  placeholder: string;
  options: SelectOption[];
  loading: boolean;
  query: string;
  onQueryChange: (query: string) => void;
  onSelect: (option: SelectOption) => void;
  onToggle: () => void;
  onClose: () => void;
  isOpen: boolean;
  disabled?: boolean;
  searchKey?: string; // 搜索的字段名，默认为 'username'
  displayKey?: string; // 显示的字段名，默认为 'username'
  className?: string; // 自定义样式类
}

export default function SearchableSelect({
  label,
  value,
  placeholder,
  options,
  loading,
  query,
  onQueryChange,
  onSelect,
  onToggle,
  isOpen,
  onClose,
  disabled = false,
  searchKey = "username",
  displayKey = "username",
  className = "",
}: SearchableSelectProps) {
  const dropdownRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    function onClickOutside(e: MouseEvent) {
      if (!dropdownRef.current?.contains(e.target as Node)) {
        onClose();
      }
    }
    if (isOpen) document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, [isOpen, onClose]);

  // 获取显示文本
  const getDisplayText = (option: SelectOption) => {
    return (
      option[displayKey] ||
      option.name ||
      option.label ||
      option.value ||
      String(option.id)
    );
  };

  // 过滤选项
  const filtered = query
    ? options.filter((option) => {
        const searchText =
          option[searchKey] ||
          option.name ||
          option.label ||
          option.value ||
          String(option.id);
        return searchText?.toLowerCase().includes(query.toLowerCase());
      })
    : options;

  return (
    <div ref={dropdownRef} className={`relative ${className}`}>
      <label className="block text-sm text-gray-600 mb-1">{label}</label>
      <button
        type="button"
        onClick={onToggle}
        disabled={disabled}
        className="input-base-w flex items-center justify-between disabled:opacity-50"
      >
        <span>{value || placeholder}</span>
        <svg
          className={`w-4 h-4 transition ${isOpen ? "rotate-180" : ""}`}
          viewBox="0 0 24 24"
          fill="none"
        >
          <path
            d="M6 9l6 6 6-6"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </button>

      {isOpen && (
        <div className="absolute z-50 mt-2 w-full bg-white border border-gray-200 rounded-lg shadow-lg">
          <div className="p-2 border-b">
            <input
              value={query}
              onChange={(e) => onQueryChange(e.target.value)}
              placeholder={`搜索${label}`}
              className="input-base-w"
            />
          </div>
          <div className="max-h-64 overflow-auto">
            {loading ? (
              <div className="p-3 text-sm text-gray-500">加载中...</div>
            ) : filtered.length === 0 ? (
              <div className="p-3 text-sm text-gray-500">暂无匹配选项</div>
            ) : (
              filtered.map((option) => (
                <button
                  key={option.id}
                  type="button"
                  onClick={() => onSelect(option)}
                  className="w-full text-left px-3 py-2 hover:bg-gray-50 text-sm text-gray-500"
                >
                  {getDisplayText(option)}
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
