"use client";

import { ExternalLink, FileText, Play, RefreshCw, Server, Square, Trash2 } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { apiFetch, type Project } from "@/lib/api";
import { Button } from "./Button";
import { ProgressBar } from "./ProgressBar";
import { StatusBadge } from "./StatusBadge";

type ProjectCardProps = {
  project: Project;
  onChanged: () => void;
};

export function ProjectCard({ project, onChanged }: ProjectCardProps) {
  const [sshPassword, setSshPassword] = useState("");
  const [busy, setBusy] = useState<string | null>(null);
  const needsPassword = project.server?.authType === "PASSWORD_ONCE" && !project.server.hasStoredPrivateKey;

  async function runAction(action: "deploy" | "redeploy" | "stop") {
    setBusy(action);
    try {
      await apiFetch(`/projects/${project.id}/${action}`, {
        method: "POST",
        body: needsPassword ? { sshPassword } : {},
      });
      setSshPassword("");
      onChanged();
    } finally {
      setBusy(null);
    }
  }

  async function deleteProject() {
    if (!window.confirm("只从平台移除此项目，不会删除服务器上的真实目录。继续吗？")) {
      return;
    }

    setBusy("delete");
    try {
      await apiFetch(`/projects/${project.id}`, { method: "DELETE" });
      onChanged();
    } finally {
      setBusy(null);
    }
  }

  return (
    <article className="rounded-lg border border-line bg-white p-5 shadow-soft">
      <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-3">
            <Link href={`/projects/${project.id}`} className="truncate text-lg font-bold text-ink hover:text-brand">
              {project.name}
            </Link>
            <StatusBadge status={project.status} />
          </div>
          <div className="mt-3 grid gap-2 text-sm text-slate-600 md:grid-cols-2">
            <span className="truncate">Git：{project.gitRepo}</span>
            <span>分支：{project.branch}</span>
            <span>域名：{project.domain}</span>
            <span>服务器：{project.server?.host ?? "未配置"}</span>
            <span>最近部署：{project.lastDeployAt ? new Date(project.lastDeployAt).toLocaleString() : "暂无"}</span>
            <span>Commit：{project.currentCommitHash ?? "暂无"}</span>
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
              className="h-9 min-w-0 flex-1 rounded-md border border-line px-3 text-sm text-ink outline-none focus:border-brand"
            />
          </label>
        ) : (
          <div className="text-right text-xs text-slate-500">已保存加密 SSH 密钥</div>
        )}
      </div>
    </article>
  );
}
