"use client";

import React from "react";
import Select from "react-select";

interface MultiSelectProps {
  options: { label: string; value: string }[];
  value: string[];
  onChange: (selectedValues: string[]) => void;
  placeholder?: string;
  className?: string;
}

export const MultiSelect: React.FC<MultiSelectProps> = ({
  options,
  value,
  onChange,
  placeholder = "Add Tags",
  className = "",
}) => {
  return (
    <Select
      options={options}
      isMulti
      value={options.filter((option) => value.includes(option.value))}
      onChange={(selectedOptions) =>
        onChange(selectedOptions.map((opt) => opt.value))
      }
      placeholder={placeholder}
      className={className}
      styles={{
        control: (base) => ({
          ...base,
          width: "100%",
          borderRadius: "0.4rem",
          borderColor: "#d1d5db",
        }),
      }}
    />
  );
};
