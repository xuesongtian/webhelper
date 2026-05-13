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
    <div className="h-2 w-full overflow-hidden rounded-full bg-slate-200">
      <div
        className={clsx(
          "h-full rounded-full transition-all",
          status === "FAILED" && "bg-danger",
          status === "RUNNING" && "bg-mint",
          status === "BUILDING" && "bg-brand",
          status === "STOPPED" && "bg-amber",
          status === "UNDEPLOYED" && "bg-slate-400",
        )}
        style={{ width: `${progressByStatus[status]}%` }}
      />
    </div>
  );
}
