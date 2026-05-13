"use client";

import { RefreshCw } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { Button } from "@/components/Button";
import { LogPanel } from "@/components/LogPanel";
import { apiFetch, type DeploymentLog, type Project } from "@/lib/api";

export default function ProjectLogsPage({ params }: { params: { id: string } }) {
  const [project, setProject] = useState<Project | null>(null);
  const [logs, setLogs] = useState<DeploymentLog[]>([]);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    setError("");
    try {
      const [projectData, logData] = await Promise.all([
        apiFetch<{ project: Project }>(`/projects/${params.id}`),
        apiFetch<{ logs: DeploymentLog[] }>(`/projects/${params.id}/logs`),
      ]);
      setProject(projectData.project);
      setLogs(logData.logs);
    } catch (err) {
      setError(err instanceof Error ? err.message : "加载日志失败");
    }
  }, [params.id]);

  useEffect(() => {
    void load();
    const timer = window.setInterval(() => void load(), 5000);
    return () => window.clearInterval(timer);
  }, [load]);

  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-ink">部署日志</h1>
          <p className="mt-1 text-sm text-slate-500">{project?.name ?? "项目"} 的部署输出</p>
        </div>
        <Button type="button" variant="secondary" icon={<RefreshCw size={17} />} onClick={() => void load()}>
          刷新
        </Button>
      </header>

      {error ? <div className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div> : null}
      <LogPanel logs={logs} />
    </div>
  );
}
