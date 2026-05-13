import { clsx } from "clsx";
import type { DeploymentLog } from "@/lib/api";

export function LogPanel({ logs }: { logs: DeploymentLog[] }) {
  return (
    <div className="log-scrollbar h-[520px] overflow-auto rounded-lg bg-slate-950 p-4 font-mono text-xs leading-6 text-slate-200 shadow-soft">
      {logs.length === 0 ? (
        <div className="text-slate-500">暂无部署日志</div>
      ) : (
        logs.map((log) => (
          <div key={log.id} className="grid grid-cols-[150px_76px_1fr] gap-3 border-b border-white/5 py-1 last:border-b-0">
            <span className="text-slate-500">{new Date(log.createdAt).toLocaleString()}</span>
            <span
              className={clsx(
                "font-semibold uppercase",
                log.level === "error" && "text-red-300",
                log.level === "warn" && "text-amber-300",
                log.level === "success" && "text-emerald-300",
                log.level === "info" && "text-sky-300",
              )}
            >
              {log.level}
            </span>
            <span className="break-words">{log.message}</span>
          </div>
        ))
      )}
    </div>
  );
}
