import { useState } from "react";
import { SelectOption } from "@/app/_components/SearchableSelect";

export function useSearchableSelect(initialValue: string = "") {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [selectedValue, setSelectedValue] = useState(initialValue);

  const handleToggle = () => {
    setIsOpen(!isOpen);
    if (!isOpen) {
      setQuery(""); // 打开时清空搜索
    }
  };

  const handleClose = () => {
    setIsOpen(false);
    setQuery("");
  };

  const handleSelect = (option: SelectOption) => {
    const displayText =
      option.username ||
      option.name ||
      option.label ||
      option.value ||
      String(option.id);
    setSelectedValue(displayText);
    setIsOpen(false);
    setQuery("");
    return option; // 返回选中的选项对象
  };

  const handleQueryChange = (newQuery: string) => {
    setQuery(newQuery);
  };

  const reset = () => {
    setSelectedValue("");
    setQuery("");
    setIsOpen(false);
  };

  return {
    isOpen,
    query,
    selectedValue,
    handleToggle,
    handleClose,
    handleSelect,
    handleQueryChange,
    reset,
  };
}
