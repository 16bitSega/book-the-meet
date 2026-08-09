"use client";

import React, { useState, useRef, useEffect } from "react";

export interface CustomSelectOption {
  label: string;
  value: string | number;
}

interface CustomSelectProps {
  options: CustomSelectOption[];
  value: string | number;
  onChange: (value: any) => void;
  placeholder?: string;
  className?: string;
}

export function CustomSelect({
  options,
  value,
  onChange,
  placeholder = "Select option",
  className = "",
}: CustomSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const selectedOption = options.find((opt) => String(opt.value) === String(value));

  // Close menu on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className={`relative w-full ${className}`} ref={dropdownRef}>
      {/* Trigger Button */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full bg-white border border-[var(--color-frozen-water)] text-[var(--color-jungle-teal)] text-sm font-bold py-2.5 px-4 rounded-xl flex items-center justify-between shadow-2xs hover:bg-[var(--color-azure-mist)] transition-colors focus:outline-none focus:ring-2 focus:ring-[var(--color-jungle-teal)] cursor-pointer truncate"
      >
        <span className="truncate pr-2">
          {selectedOption ? selectedOption.label : placeholder}
        </span>
        <svg
          className={`w-4 h-4 text-[var(--color-jungle-teal)] transition-transform duration-200 shrink-0 ${
            isOpen ? "rotate-180" : ""
          }`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {/* Popover Menu */}
      {isOpen && (
        <div className="absolute left-0 right-0 top-full mt-1.5 z-50 bg-white border border-[var(--color-frozen-water)] rounded-xl shadow-lg max-h-60 overflow-y-auto p-1.5 animate-in fade-in zoom-in-95 duration-150">
          {options.map((opt) => {
            const isSelected = String(opt.value) === String(value);
            return (
              <button
                key={opt.value}
                type="button"
                onClick={() => {
                  onChange(opt.value);
                  setIsOpen(false);
                }}
                className={`w-full text-left px-3.5 py-2.5 rounded-lg text-xs sm:text-sm font-semibold transition-colors flex items-center justify-between ${
                  isSelected
                    ? "bg-[var(--color-jungle-teal)] text-white"
                    : "text-gray-700 hover:bg-[var(--color-azure-mist)] hover:text-[var(--color-jungle-teal)]"
                }`}
              >
                <span className="truncate pr-2">{opt.label}</span>
                {isSelected && (
                  <svg className="w-4 h-4 text-white shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" />
                  </svg>
                )}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default CustomSelect;
