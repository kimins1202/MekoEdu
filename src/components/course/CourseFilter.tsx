import React from "react";
import AppFilter, { FilterOption } from "../common/AppFilter";

export type CourseFilterType = "all" | "learning" | "completed";

interface CourseFilterProps {
  activeFilter: CourseFilterType;
  totalCount: number;
  learningCount: number;
  completedCount: number;
  onChange: (filter: CourseFilterType) => void;
}

export default function CourseFilter({
  activeFilter,
  totalCount,
  learningCount,
  completedCount,
  onChange,
}: CourseFilterProps) {
  const filters: FilterOption<CourseFilterType>[] = [
    {
      key: "all",
      label: "Tất cả",
      count: totalCount,
    },
    {
      key: "learning",
      label: "Đang học",
      count: learningCount,
    },
    {
      key: "completed",
      label: "Hoàn thành",
      count: completedCount,
    },
  ];

  return (
    <AppFilter
      filters={filters}
      activeFilter={activeFilter}
      onChange={onChange}
    />
  );
}
