"use client";

import { Download } from "lucide-react";

interface ExportButtonProps {
  onClick: () => void;
  label?: string;
  disabled?: boolean;
}

export function ExportButton({ onClick, label = "Export CSV", disabled = false }: ExportButtonProps) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className="flex items-center gap-2 px-4 py-2 text-sm rounded-lg bg-[var(--whop-accent)] text-white hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
    >
      <Download className="h-4 w-4" />
      {label}
    </button>
  );
}
