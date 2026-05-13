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
        "inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-semibold",
        status === "UNDEPLOYED" && "border-slate-200 bg-slate-100 text-slate-600",
        status === "BUILDING" && "border-blue-200 bg-blue-50 text-blue-700",
        status === "RUNNING" && "border-emerald-200 bg-emerald-50 text-emerald-700",
        status === "FAILED" && "border-red-200 bg-red-50 text-red-700",
        status === "STOPPED" && "border-amber-200 bg-amber-50 text-amber-700",
      )}
    >
      {statusText[status]}
    </span>
  );
}

export function statusLabel(status: ProjectStatus): string {
  return statusText[status];
}
