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
        status === "UNDEPLOYED" && "border-[#dcdfe6] bg-white/70 text-[#909399]",
        status === "BUILDING" && "border-[#d9ecff] bg-[#ecf5ff]/82 text-[#409eff]",
        status === "RUNNING" && "border-[#e1f3d8] bg-[#f0f9eb]/82 text-[#67c23a]",
        status === "FAILED" && "border-[#fde2e2] bg-[#fef0f0]/82 text-[#f56c6c]",
        status === "STOPPED" && "border-[#faecd8] bg-[#fdf6ec]/82 text-[#e6a23c]",
      )}
    >
      <span
        className={clsx(
          "h-1.5 w-1.5 rounded-full",
          status === "UNDEPLOYED" && "bg-slate-400",
          status === "BUILDING" && "bg-[#409eff]",
          status === "RUNNING" && "status-pulse bg-[#67c23a]",
          status === "FAILED" && "bg-[#f56c6c]",
          status === "STOPPED" && "bg-[#e6a23c]",
        )}
      />
      {statusText[status]}
    </span>
  );
}

export function statusLabel(status: ProjectStatus): string {
  return statusText[status];
}
