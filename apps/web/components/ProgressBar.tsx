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
          status === "FAILED" && "bg-[#ff3b30]",
          status === "RUNNING" && "bg-[#34c759]",
          status === "BUILDING" && "bg-[#0a84ff]",
          status === "STOPPED" && "bg-[#ff9f0a]",
          status === "UNDEPLOYED" && "bg-slate-300",
        )}
        style={{ width: `${progressByStatus[status]}%` }}
      />
    </div>
  );
}
