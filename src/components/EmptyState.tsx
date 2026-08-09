"use client";

import React from "react";

interface EmptyStateProps {
  title: string;
  message: string;
  icon?: React.ReactNode;
  action?: React.ReactNode;
}

export function EmptyState({ title, message, icon, action }: EmptyStateProps) {
  return (
    <div className="w-full max-w-full flex flex-col items-center justify-center p-6 sm:p-8 text-center bg-white rounded-xl border border-dashed border-[var(--color-frozen-water)] shadow-2xs overflow-hidden">
      <div className="mb-3 text-[var(--color-jungle-teal)]">
        {icon || (
          <div className="w-12 h-12 rounded-full bg-[var(--color-azure-mist)] flex items-center justify-center mx-auto text-[var(--color-jungle-teal)]">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.75}
                d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
              />
            </svg>
          </div>
        )}
      </div>
      <h3 className="text-base font-bold text-gray-900 mb-1 leading-snug">{title}</h3>
      <p className="text-xs text-gray-500 max-w-xs sm:max-w-sm mb-4 leading-relaxed">{message}</p>
      {action && <div className="mt-1">{action}</div>}
    </div>
  );
}

export default EmptyState;
