"use client";

import { Activity, CheckCircle2, RefreshCw, ServerCog, XCircle } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { Button } from "@/components/Button";
import { StatusBadge } from "@/components/StatusBadge";
import { apiFetch, getToken, type Project } from "@/lib/api";
import { demoProject } from "@/lib/demo";

type StatusResponse = {
  status: {
    projectId: string;
    projectStatus: Project["status"];
    serverStatus: Project["server"] extends infer S ? S extends { status: infer T } ? T : string : string;
    domain: string;
    visitUrl: string;
    currentCommitHash: string | null;
    lastDeployAt: string | null;
  };
};

export default function ServerStatusPage({ params }: { params: { id: string } }) {
  const [project, setProject] = useState<Project | null>(null);
  const [status, setStatus] = useState<StatusResponse["status"] | null>(null);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    setError("");
    if (!getToken()) {
      setProject(demoProject);
      setStatus({
        projectId: demoProject.id,
        projectStatus: demoProject.status,
        serverStatus: demoProject.server?.status ?? "UNKNOWN",
        domain: demoProject.domain,
        visitUrl: demoProject.visitUrl,
        currentCommitHash: demoProject.currentCommitHash,
        lastDeployAt: demoProject.lastDeployAt,
      });
      return;
    }

    try {
      const [projectData, statusData] = await Promise.all([
        apiFetch<{ project: Project }>(`/projects/${params.id}`),
        apiFetch<StatusResponse>(`/projects/${params.id}/status`),
      ]);
      setProject(projectData.project);
      setStatus(statusData.status);
    } catch (err) {
      setError(err instanceof Error ? err.message : "加载服务器状态失败");
    }
  }, [params.id]);

  useEffect(() => {
    void load();
  }, [load]);

  const connected = status?.serverStatus === "CONNECTED";

  return (
    <div className="space-y-5">
      <header className="liquid-panel-strong rounded-lg p-5">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-black tracking-[0] text-slate-950">服务器连接状态</h1>
          <p className="mt-2 text-sm text-slate-500">{project?.server?.username}@{project?.server?.host}</p>
        </div>
        <Button type="button" variant="secondary" icon={<RefreshCw size={17} />} onClick={() => void load()}>
          刷新
        </Button>
        </div>
      </header>

      {error ? <div className="rounded-lg border border-red-200 bg-red-50/80 px-4 py-3 text-sm text-red-700 backdrop-blur-xl">{error}</div> : null}

      <section className="grid gap-4 lg:grid-cols-3">
        <StateTile icon={<ServerCog size={22} />} label="服务器" value={project?.server?.host ?? "未配置"} />
        <StateTile icon={<Activity size={22} />} label="连接状态" value={status?.serverStatus ?? "UNKNOWN"} tone={connected ? "success" : "neutral"} />
        <StateTile icon={connected ? <CheckCircle2 size={22} /> : <XCircle size={22} />} label="项目状态" value={project?.status ?? "UNDEPLOYED"} tone={connected ? "success" : "neutral"} />
      </section>

      {project ? (
        <section className="ios-card p-5">
          <div className="flex flex-wrap items-center gap-3">
            <h2 className="text-base font-black text-slate-950">{project.name}</h2>
            <StatusBadge status={project.status} />
          </div>
          <div className="mt-4 grid gap-3 text-sm text-slate-600 md:grid-cols-2">
            <span>SSH：{project.server?.username}@{project.server?.host}:{project.server?.sshPort}</span>
            <span>认证：{project.server?.hasStoredPrivateKey ? "加密私钥" : "一次性密码"}</span>
            <span>域名：{project.domain}</span>
            <span>最近部署：{project.lastDeployAt ? new Date(project.lastDeployAt).toLocaleString() : "暂无"}</span>
          </div>
        </section>
      ) : null}
    </div>
  );
}

function StateTile({ icon, label, value, tone = "neutral" }: { icon: React.ReactNode; label: string; value: string; tone?: "success" | "neutral" }) {
  return (
    <div className="ios-card p-5">
      <div className={tone === "success" ? "text-[#34c759]" : "text-slate-500"}>{icon}</div>
      <div className="mt-4 text-xs font-semibold uppercase text-slate-400">{label}</div>
      <div className="mt-2 truncate text-base font-black text-slate-950">{value}</div>
    </div>
  );
}
