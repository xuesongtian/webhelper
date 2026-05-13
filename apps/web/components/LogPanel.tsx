import { clsx } from "clsx";
import type { DeploymentLog } from "@/lib/api";

export function LogPanel({ logs }: { logs: DeploymentLog[] }) {
  return (
    <div className="log-scrollbar h-[520px] overflow-auto rounded-lg border border-slate-900/10 bg-[#0b1020] p-4 font-mono text-xs leading-6 text-slate-200 shadow-[0_20px_60px_rgba(15,23,42,0.18)]">
      {logs.length === 0 ? (
        <div className="text-slate-500">暂无部署日志</div>
      ) : (
        logs.map((log) => (
          <div key={log.id} className="grid gap-2 border-b border-white/5 py-1.5 last:border-b-0 md:grid-cols-[150px_76px_1fr]">
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
