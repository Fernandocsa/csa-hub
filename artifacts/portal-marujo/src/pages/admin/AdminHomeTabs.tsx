import { Link, useLocation } from "wouter";
import { AlertTriangle } from "lucide-react";

export function AdminHomeTabs({ divergenceCount }: { divergenceCount?: number | null }) {
  const [location] = useLocation();
  const onDivergences = location.startsWith("/admin/divergencias");

  return (
    <div className="flex gap-1 mb-6 border-b">
      <Link
        href="/admin"
        className={`px-3 py-2 text-sm font-medium border-b-2 -mb-px transition-colors ${
          !onDivergences
            ? "border-[#1B3A6B] text-[#1B3A6B]"
            : "border-transparent text-gray-500 hover:text-gray-800"
        }`}
      >
        Visão geral
      </Link>
      <Link
        href="/admin/divergencias"
        className={`px-3 py-2 text-sm font-medium border-b-2 -mb-px transition-colors inline-flex items-center gap-1.5 ${
          onDivergences
            ? "border-[#1B3A6B] text-[#1B3A6B]"
            : "border-transparent text-gray-500 hover:text-gray-800"
        }`}
      >
        <AlertTriangle size={14} />
        Divergências
        {divergenceCount != null && (
          <span className="text-xs text-gray-400">({divergenceCount})</span>
        )}
      </Link>
    </div>
  );
}
