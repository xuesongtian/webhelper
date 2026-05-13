"use client";

import { ExternalLink, FileText, RefreshCw, Rocket, ServerCog, Square } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { Button } from "@/components/Button";
import { LogPanel } from "@/components/LogPanel";
import { ProgressBar } from "@/components/ProgressBar";
import { StatusBadge } from "@/components/StatusBadge";
import { apiBaseUrl, apiFetch, getToken, type DeploymentLog, type Project } from "@/lib/api";
import { requireSignedIn } from "@/lib/auth-gate";
import { demoLogs, demoProject } from "@/lib/demo";

export default function ProjectDetailPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const [project, setProject] = useState<Project | null>(null);
  const [logs, setLogs] = useState<DeploymentLog[]>([]);
  const [guestMode, setGuestMode] = useState(false);
  const [sshPassword, setSshPassword] = useState("");
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    setError("");
    if (!getToken()) {
      setProject(demoProject);
      setLogs(demoLogs);
      setGuestMode(true);
      return;
    }

    try {
      const [projectData, logData] = await Promise.all([
        apiFetch<{ project: Project }>(`/projects/${params.id}`),
        apiFetch<{ logs: DeploymentLog[] }>(`/projects/${params.id}/logs`),
      ]);
      setProject(projectData.project);
      setLogs(logData.logs.slice(-80));
      setGuestMode(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "加载项目失败");
    }
  }, [params.id]);

  useEffect(() => {
    void load();
    const timer = window.setInterval(() => void load(), 10_000);
    return () => window.clearInterval(timer);
  }, [load]);

  async function runAction(action: "deploy" | "redeploy" | "stop") {
    if (!project) {
      return;
    }
    if (!requireSignedIn(router, `/projects/${project.id}`)) {
      return;
    }

    setBusy(action);
    try {
      await apiFetch(`/projects/${project.id}/${action}`, {
        method: "POST",
        body: sshPassword ? { sshPassword } : {},
      });
      setSshPassword("");
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "操作失败");
    } finally {
      setBusy(null);
    }
  }

  if (!project) {
    return <div className="ios-card p-8 text-sm text-slate-500">正在加载项目...</div>;
  }

  const webhookUrl = `${apiBaseUrl()}${project.githubWebhook?.endpoint ?? `/webhooks/github/${project.id}`}`;

  return (
    <div className="space-y-5">
      <header className="liquid-panel-strong rounded-lg p-5">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
        <div>
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="text-3xl font-black tracking-[0] text-slate-950">{project.name}</h1>
            <StatusBadge status={project.status} />
          </div>
          <p className="mt-2 text-sm text-slate-500">{project.gitRepo}</p>
          {guestMode ? <p className="mt-3 text-sm text-blue-700">访客正在查看安全演示项目。部署、停止等动作会要求登录。</p> : null}
        </div>
        <div className="flex flex-wrap gap-2">
          <a href={project.visitUrl} target="_blank" rel="noreferrer">
            <Button type="button" variant="secondary" icon={<ExternalLink size={17} />}>
              访问
            </Button>
          </a>
          <Button type="button" icon={<Rocket size={17} />} disabled={Boolean(busy)} onClick={() => runAction("deploy")}>
            部署
          </Button>
          <Button type="button" variant="secondary" icon={<RefreshCw size={17} />} disabled={Boolean(busy)} onClick={() => runAction("redeploy")}>
            重新部署
          </Button>
          <Button type="button" variant="secondary" icon={<Square size={17} />} disabled={Boolean(busy)} onClick={() => runAction("stop")}>
            停止
          </Button>
        </div>
        </div>
      </header>

      {error ? <div className="rounded-lg border border-red-200 bg-red-50/80 px-4 py-3 text-sm text-red-700 backdrop-blur-xl">{error}</div> : null}

      <section className="ios-card p-5">
        <div className="grid gap-5 lg:grid-cols-[1fr_280px] lg:items-center">
          <ProgressBar status={project.status} />
          {project.server?.authType === "PASSWORD_ONCE" && !project.server.hasStoredPrivateKey ? (
            <input
              type="password"
              value={sshPassword}
              onChange={(event) => setSshPassword(event.target.value)}
              placeholder="一次性 SSH 密码"
              className="ios-input"
            />
          ) : (
            <div className="text-right text-sm text-slate-500">SSH 私钥已加密保存</div>
          )}
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <Info label="分支" value={project.branch} />
        <Info label="域名" value={project.domain} />
        <Info label="服务器" value={project.server?.host ?? "未配置"} />
        <Info label="Commit" value={project.currentCommitHash ?? "暂无"} />
      </section>

      <section className="grid gap-4 xl:grid-cols-[1fr_360px]">
        <div>
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-base font-black text-slate-950">部署日志</h2>
            <Link href={`/projects/${project.id}/logs`}>
              <Button type="button" variant="secondary" icon={<FileText size={16} />}>
                全部日志
              </Button>
            </Link>
          </div>
          <LogPanel logs={logs} />
        </div>

        <div className="space-y-4">
          <Panel title="GitHub Webhook">
            <div className="break-all rounded-md bg-slate-100 p-3 font-mono text-xs text-slate-700">{webhookUrl}</div>
            <div className="mt-3 text-sm text-slate-500">最近触发：{project.githubWebhook?.lastDeliveryAt ? new Date(project.githubWebhook.lastDeliveryAt).toLocaleString() : "暂无"}</div>
          </Panel>
          <Panel title="快捷入口">
            <div className="grid gap-2">
              <Link href={`/projects/${project.id}/server`}>
                <Button type="button" variant="secondary" icon={<ServerCog size={16} />} className="w-full justify-start">
                  服务器连接状态
                </Button>
              </Link>
              <Link href={`/projects/${project.id}/env`}>
                <Button type="button" variant="secondary" icon={<FileText size={16} />} className="w-full justify-start">
                  环境变量设置
                </Button>
              </Link>
            </div>
          </Panel>
        </div>
      </section>
    </div>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div className="ios-card p-4">
      <div className="text-xs font-semibold uppercase text-slate-400">{label}</div>
      <div className="mt-2 truncate text-sm font-semibold text-slate-950">{value}</div>
    </div>
  );
}

function Panel({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="ios-card p-4">
      <h2 className="text-base font-black text-slate-950">{title}</h2>
      <div className="mt-3">{children}</div>
    </div>
  );
}
