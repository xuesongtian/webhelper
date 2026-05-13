"use client";

import { Activity, Globe2, Plus, RefreshCw, Rocket, ServerCog } from "lucide-react";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { Button } from "@/components/Button";
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
      <header className="liquid-panel-strong rounded-lg p-5">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-white/80 bg-white/70 px-3 py-1 text-xs font-semibold text-[#0a84ff]">
              <Activity size={14} />
              {guestMode ? "访客预览模式" : "实时工作区"}
            </div>
            <h1 className="mt-3 text-3xl font-black tracking-[0] text-slate-950">项目面板</h1>
            <p className="mt-2 text-sm leading-6 text-slate-500">一进来就能查看项目、状态、日志和服务器概况；真正建站时再登录。</p>
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

      {guestMode ? (
        <div className="rounded-lg border border-blue-100 bg-blue-50/80 px-4 py-3 text-sm text-blue-800 backdrop-blur-xl">
          当前展示的是安全演示面板。你可以浏览详情、日志、状态和表单；点击部署、保存、删除时会进入登录页。
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
    blue: "text-[#0a84ff] bg-blue-50",
    green: "text-[#34c759] bg-emerald-50",
    orange: "text-[#ff9f0a] bg-orange-50",
    red: "text-[#ff3b30] bg-red-50",
  }[tone];

  return (
    <div className="ios-card p-4">
      <div className={`grid h-9 w-9 place-items-center rounded-lg ${toneClass}`}>{icon}</div>
      <div className="mt-4 text-3xl font-black tracking-[0] text-slate-950">{value}</div>
      <div className="mt-1 text-sm text-slate-500">{label}</div>
    </div>
  );
}
