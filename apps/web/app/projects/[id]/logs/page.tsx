"use client";

import { RefreshCw } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { Button } from "@/components/Button";
import { LogPanel } from "@/components/LogPanel";
import { apiFetch, getToken, type DeploymentLog, type Project } from "@/lib/api";
import { demoLogs, demoProject } from "@/lib/demo";

export default function ProjectLogsPage({ params }: { params: { id: string } }) {
  const [project, setProject] = useState<Project | null>(null);
  const [logs, setLogs] = useState<DeploymentLog[]>([]);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    setError("");
    if (!getToken()) {
      setProject(demoProject);
      setLogs(demoLogs);
      return;
    }

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
    <div className="space-y-5">
      <header className="liquid-panel-strong rounded-lg p-5">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-black tracking-[0] text-slate-950">部署日志</h1>
          <p className="mt-2 text-sm text-slate-500">{project?.name ?? "项目"} 的部署输出</p>
        </div>
        <Button type="button" variant="secondary" icon={<RefreshCw size={17} />} onClick={() => void load()}>
          刷新
        </Button>
        </div>
      </header>

      {error ? <div className="rounded-lg border border-red-200 bg-red-50/80 px-4 py-3 text-sm text-red-700 backdrop-blur-xl">{error}</div> : null}
      <LogPanel logs={logs} />
    </div>
  );
}
