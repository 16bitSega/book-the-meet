"use client";

import React from "react";

export function GridSkeleton() {
  return (
    <div className="w-full bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden animate-pulse">
      {/* Header Skeleton */}
      <div className="p-4 border-b border-slate-200 flex justify-between items-center bg-slate-50/50">
        <div className="h-8 w-32 bg-slate-200 rounded-lg"></div>
        <div className="h-10 w-48 bg-slate-200 rounded-lg"></div>
      </div>

      {/* Grid Body Skeleton */}
      <div className="overflow-x-auto">
        <div className="min-w-[900px]">
          {/* Days Header */}
          <div className="grid grid-cols-[60px_repeat(7,1fr)] border-b border-slate-200 bg-slate-100/70">
            <div className="p-3"></div>
            {Array.from({ length: 7 }).map((_, i) => (
              <div key={i} className="p-3 border-l border-slate-200">
                <div className="h-4 w-12 bg-slate-200 rounded-md mx-auto mb-2"></div>
                <div className="h-6 w-8 bg-slate-200 rounded-md mx-auto"></div>
              </div>
            ))}
          </div>

          {/* Time Slots */}
          {Array.from({ length: 20 }).map((_, i) => (
            <div key={i} className="grid grid-cols-[60px_repeat(7,1fr)] border-b border-slate-100">
              <div className="p-2 border-r border-slate-100 bg-slate-50/50">
                <div className="h-3 w-8 bg-slate-200 rounded-md ml-auto"></div>
              </div>
              {Array.from({ length: 7 }).map((_, j) => (
                <div key={j} className="p-1 border-l border-slate-100 min-h-[44px]">
                  <div className="h-full w-full bg-slate-100/80 rounded-md"></div>
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export function DashboardSkeleton() {
  return (
    <div className="space-y-4 animate-pulse">
      {Array.from({ length: 5 }).map((_, i) => (
        <div
          key={i}
          className="bg-white p-5 rounded-2xl border border-slate-200 flex justify-between items-center shadow-xs"
        >
          <div className="space-y-2">
            <div className="h-4 w-48 bg-slate-200 rounded-md"></div>
            <div className="h-3 w-32 bg-slate-200 rounded-md"></div>
          </div>
          <div className="h-8 w-24 bg-slate-200 rounded-lg"></div>
        </div>
      ))}
    </div>
  );
}
