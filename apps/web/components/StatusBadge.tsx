import { clsx } from "clsx";
import type { ProjectStatus } from "@/lib/api";

const statusText: Record<ProjectStatus, string> = {
  UNDEPLOYED: "未部署",
  BUILDING: "构建中",
  RUNNING: "运行中",
  FAILED: "失败",
  STOPPED: "已停止",
};

export function StatusBadge({ status }: { status: ProjectStatus }) {
  return (
    <span
      className={clsx(
        "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-semibold backdrop-blur-xl",
        status === "UNDEPLOYED" && "border-slate-200/80 bg-white/62 text-slate-600",
        status === "BUILDING" && "border-blue-200/80 bg-blue-50/70 text-blue-700",
        status === "RUNNING" && "border-emerald-200/80 bg-emerald-50/70 text-emerald-700",
        status === "FAILED" && "border-red-200/80 bg-red-50/70 text-red-700",
        status === "STOPPED" && "border-amber-200/80 bg-amber-50/70 text-amber-700",
      )}
    >
      <span
        className={clsx(
          "h-1.5 w-1.5 rounded-full",
          status === "UNDEPLOYED" && "bg-slate-400",
          status === "BUILDING" && "bg-blue-500",
          status === "RUNNING" && "status-pulse bg-emerald-500",
          status === "FAILED" && "bg-red-500",
          status === "STOPPED" && "bg-amber-500",
        )}
      />
      {statusText[status]}
    </span>
  );
}

export function statusLabel(status: ProjectStatus): string {
  return statusText[status];
}
