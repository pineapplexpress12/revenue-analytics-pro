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
      className="inline-flex items-center gap-2 px-4 py-2 bg-gray-a3 hover:bg-gray-a4 text-gray-12 rounded-2 text-3 font-medium transition disabled:opacity-50 disabled:cursor-not-allowed border border-gray-a6"
    >
      <Download className="h-4 w-4" />
      {label}
    </button>
  );
}
