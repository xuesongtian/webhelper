"use client";

import { Activity, Globe2, Plus, RefreshCw, Rocket, ServerCog, Sparkles } from "lucide-react";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { Button } from "@/components/Button";
import { MessageBox } from "@/components/MessageBox";
import { ProjectCard } from "@/components/ProjectCard";
import { apiFetch, getToken, type Project } from "@/lib/api";
import { demoProjects } from "@/lib/demo";

export default function ProjectsPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [guestMode, setGuestMode] = useState(false);

  const loadProjects = useCallback(async () => {
    setError("");
    if (!getToken()) {
      setProjects(demoProjects);
      setGuestMode(true);
      setLoading(false);
      return;
    }

    try {
      const data = await apiFetch<{ projects: Project[] }>("/projects");
      setProjects(data.projects);
      setGuestMode(false);
    } catch (err) {
      if (err instanceof Error && err.message.toLowerCase().includes("token")) {
        setProjects(demoProjects);
        setGuestMode(true);
      } else {
        setError(err instanceof Error ? err.message : "加载项目失败");
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadProjects();
    const timer = window.setInterval(() => void loadProjects(), 15_000);
    return () => window.clearInterval(timer);
  }, [loadProjects]);

  const runningCount = projects.filter((project) => project.status === "RUNNING").length;
  const failedCount = projects.filter((project) => project.status === "FAILED").length;
  const serverCount = projects.filter((project) => project.server).length;

  return (
    <div className="space-y-5">
      <header className="element-hero liquid-panel-strong rounded-lg p-5">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-[#d9ecff] bg-[#ecf5ff]/90 px-3 py-1 text-xs font-semibold text-[#409eff]">
              <Activity size={14} />
              {guestMode ? "访客预览模式" : "实时工作区"}
            </div>
            <h1 className="mt-3 text-3xl font-black tracking-[0] text-slate-950">项目面板</h1>
            <p className="mt-2 text-sm leading-6 text-slate-500">Git、域名、服务器和部署任务都在这里收口，关键操作再完成账号密码确认。</p>
            <div className="mt-4 flex flex-wrap gap-2 text-xs font-semibold">
              <span className="rounded-full border border-[#d9ecff] bg-[#ecf5ff] px-3 py-1 text-[#409eff]">GitHub</span>
              <span className="rounded-full border border-[#e1f3d8] bg-[#f0f9eb] px-3 py-1 text-[#67c23a]">Docker</span>
              <span className="rounded-full border border-[#faecd8] bg-[#fdf6ec] px-3 py-1 text-[#e6a23c]">HTTPS</span>
              <span className="rounded-full border border-[#ebe0ff] bg-[#f4f0ff] px-3 py-1 text-[#9b6cff]">Webhook</span>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button type="button" variant="secondary" icon={<RefreshCw size={17} />} onClick={() => void loadProjects()}>
              刷新
            </Button>
            <Link href="/projects/new">
              <Button type="button" icon={<Plus size={17} />}>
                新建站点
              </Button>
            </Link>
          </div>
        </div>
      </header>

      <section className="grid gap-3 md:grid-cols-4">
        <MetricCard icon={<Rocket size={18} />} label="项目" value={String(projects.length)} tone="blue" />
        <MetricCard icon={<Globe2 size={18} />} label="运行中" value={String(runningCount)} tone="green" />
        <MetricCard icon={<ServerCog size={18} />} label="服务器" value={String(serverCount)} tone="orange" />
        <MetricCard icon={<Activity size={18} />} label="异常" value={String(failedCount)} tone="red" />
      </section>

      <MessageBox />

      {guestMode ? (
        <div className="flex items-center gap-3 rounded-lg border border-[#d9ecff] bg-[#ecf5ff]/88 px-4 py-3 text-sm text-[#337ecc] shadow-[0_12px_34px_rgba(64,158,255,0.08)] backdrop-blur-xl">
          <Sparkles size={17} />
          当前展示安全演示项目；部署、保存和删除会进入账号密码登录页。
        </div>
      ) : null}

      {error ? <div className="rounded-lg border border-red-200 bg-red-50/80 px-4 py-3 text-sm text-red-700 backdrop-blur-xl">{error}</div> : null}

      {loading ? (
        <div className="ios-card p-8 text-sm text-slate-500">正在加载项目...</div>
      ) : projects.length === 0 ? (
        <div className="ios-card p-10 text-center">
          <h2 className="text-lg font-bold text-slate-950">还没有项目</h2>
          <p className="mt-2 text-sm text-slate-500">先打开创建页填写站点资料，提交建站时再登录。</p>
          <Link href="/projects/new" className="mt-5 inline-block">
            <Button type="button" icon={<Plus size={17} />}>
              新建站点
            </Button>
          </Link>
        </div>
      ) : (
        <div className="grid gap-4">
          {projects.map((project) => (
            <ProjectCard key={project.id} project={project} onChanged={() => void loadProjects()} />
          ))}
        </div>
      )}
    </div>
  );
}

function MetricCard({ icon, label, value, tone }: { icon: React.ReactNode; label: string; value: string; tone: "blue" | "green" | "orange" | "red" }) {
  const toneClass = {
    blue: "text-[#409eff] bg-[#ecf5ff] border-[#d9ecff]",
    green: "text-[#67c23a] bg-[#f0f9eb] border-[#e1f3d8]",
    orange: "text-[#e6a23c] bg-[#fdf6ec] border-[#faecd8]",
    red: "text-[#f56c6c] bg-[#fef0f0] border-[#fde2e2]",
  }[tone];
  const lineClass = {
    blue: "before:bg-[#409eff]",
    green: "before:bg-[#67c23a]",
    orange: "before:bg-[#e6a23c]",
    red: "before:bg-[#f56c6c]",
  }[tone];

  return (
    <div className={`ios-card relative overflow-hidden p-4 before:absolute before:inset-x-0 before:top-0 before:h-1 ${lineClass}`}>
      <div className={`grid h-9 w-9 place-items-center rounded-lg border ${toneClass}`}>{icon}</div>
      <div className="mt-4 text-3xl font-black tracking-[0] text-slate-950">{value}</div>
      <div className="mt-1 text-sm text-slate-500">{label}</div>
    </div>
  );
}
