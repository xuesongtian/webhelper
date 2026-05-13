"use client";

import { ExternalLink, FileText, Play, RefreshCw, Server, Square, Trash2 } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { apiFetch, type Project } from "@/lib/api";
import { requireSignedIn } from "@/lib/auth-gate";
import { Button } from "./Button";
import { ProgressBar } from "./ProgressBar";
import { StatusBadge } from "./StatusBadge";

type ProjectCardProps = {
  project: Project;
  onChanged: () => void;
};

export function ProjectCard({ project, onChanged }: ProjectCardProps) {
  const router = useRouter();
  const [sshPassword, setSshPassword] = useState("");
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState("");
  const needsPassword = project.server?.authType === "PASSWORD_ONCE" && !project.server.hasStoredPrivateKey;

  async function runAction(action: "deploy" | "redeploy" | "stop") {
    if (!requireSignedIn(router, `/projects/${project.id}`)) {
      return;
    }

    setError("");
    setBusy(action);
    try {
      await apiFetch(`/projects/${project.id}/${action}`, {
        method: "POST",
        body: needsPassword ? { sshPassword } : {},
      });
      setSshPassword("");
      onChanged();
    } catch (err) {
      setError(err instanceof Error ? err.message : "操作失败");
    } finally {
      setBusy(null);
    }
  }

  async function deleteProject() {
    if (!requireSignedIn(router, "/projects")) {
      return;
    }

    if (!window.confirm("只从平台移除此项目，不会删除服务器上的真实目录。继续吗？")) {
      return;
    }

    setError("");
    setBusy("delete");
    try {
      await apiFetch(`/projects/${project.id}`, { method: "DELETE" });
      onChanged();
    } catch (err) {
      setError(err instanceof Error ? err.message : "删除失败");
    } finally {
      setBusy(null);
    }
  }

  return (
    <article className="ios-card ios-touch p-5">
      <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-3">
            <Link href={`/projects/${project.id}`} className="truncate text-xl font-black tracking-[0] text-slate-950 hover:text-[#0a84ff]">
              {project.name}
            </Link>
            <StatusBadge status={project.status} />
          </div>
          <div className="mt-4 grid gap-2 text-sm text-slate-600 sm:grid-cols-2 2xl:grid-cols-3">
            <Info label="Git" value={project.gitRepo} />
            <Info label="分支" value={project.branch} />
            <Info label="域名" value={project.domain} />
            <Info label="服务器" value={project.server?.host ?? "未配置"} />
            <Info label="最近部署" value={project.lastDeployAt ? new Date(project.lastDeployAt).toLocaleString() : "暂无"} />
            <Info label="Commit" value={project.currentCommitHash ?? "暂无"} />
          </div>
        </div>

        <div className="flex shrink-0 flex-wrap gap-2">
          <a href={project.visitUrl} target="_blank" rel="noreferrer">
            <Button type="button" variant="secondary" icon={<ExternalLink size={16} />} title="访问网站">
              访问
            </Button>
          </a>
          <Button type="button" icon={<Play size={16} />} disabled={Boolean(busy)} onClick={() => runAction("deploy")} title="部署">
            部署
          </Button>
          <Button type="button" variant="secondary" icon={<RefreshCw size={16} />} disabled={Boolean(busy)} onClick={() => runAction("redeploy")} title="重新部署">
            重新部署
          </Button>
          <Link href={`/projects/${project.id}/logs`}>
            <Button type="button" variant="secondary" icon={<FileText size={16} />} title="查看日志">
              日志
            </Button>
          </Link>
          <Button type="button" variant="secondary" icon={<Square size={16} />} disabled={Boolean(busy)} onClick={() => runAction("stop")} title="停止容器">
            停止
          </Button>
          <Button type="button" variant="danger" icon={<Trash2 size={16} />} disabled={Boolean(busy)} onClick={deleteProject} title="删除项目">
            删除
          </Button>
        </div>
      </div>

      <div className="mt-5 grid gap-3 md:grid-cols-[1fr_280px] md:items-center">
        <ProgressBar status={project.status} />
        {needsPassword ? (
          <label className="flex items-center gap-2 text-xs text-slate-500">
            <Server size={16} />
            <input
              type="password"
              value={sshPassword}
              onChange={(event) => setSshPassword(event.target.value)}
              placeholder="一次性 SSH 密码"
              className="ios-input h-9 min-w-0 flex-1 text-sm"
            />
          </label>
        ) : (
          <div className="text-right text-xs text-slate-500">已保存加密 SSH 密钥</div>
        )}
      </div>

      {error ? <div className="mt-4 rounded-lg border border-red-200 bg-red-50/80 px-3 py-2 text-sm text-red-700">{error}</div> : null}
    </article>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <span className="min-w-0 rounded-lg bg-white/54 px-3 py-2">
      <span className="block text-xs font-semibold text-slate-400">{label}</span>
      <span className="mt-1 block truncate font-medium text-slate-700" title={value}>
        {value}
      </span>
    </span>
  );
}
