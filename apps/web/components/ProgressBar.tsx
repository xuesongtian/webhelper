import { clsx } from "clsx";
import type { ProjectStatus } from "@/lib/api";

const progressByStatus: Record<ProjectStatus, number> = {
  UNDEPLOYED: 8,
  BUILDING: 58,
  RUNNING: 100,
  FAILED: 100,
  STOPPED: 35,
};

export function ProgressBar({ status }: { status: ProjectStatus }) {
  return (
    <div className="h-2 w-full overflow-hidden rounded-full bg-white/70 shadow-inner">
      <div
        className={clsx(
          "h-full rounded-full transition-all duration-500",
          status === "FAILED" && "bg-[#f56c6c]",
          status === "RUNNING" && "bg-gradient-to-r from-[#67c23a] to-[#409eff]",
          status === "BUILDING" && "bg-gradient-to-r from-[#409eff] to-[#9b6cff]",
          status === "STOPPED" && "bg-[#e6a23c]",
          status === "UNDEPLOYED" && "bg-slate-300",
        )}
        style={{ width: `${progressByStatus[status]}%` }}
      />
    </div>
  );
}
