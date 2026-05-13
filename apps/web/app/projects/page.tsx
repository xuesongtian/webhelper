"use client";

import { Plus, RefreshCw } from "lucide-react";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { Button } from "@/components/Button";
import { ProjectCard } from "@/components/ProjectCard";
import { apiFetch, type Project } from "@/lib/api";

export default function ProjectsPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadProjects = useCallback(async () => {
    setError("");
    try {
      const data = await apiFetch<{ projects: Project[] }>("/projects");
      setProjects(data.projects);
    } catch (err) {
      setError(err instanceof Error ? err.message : "加载项目失败");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadProjects();
    const timer = window.setInterval(() => void loadProjects(), 15_000);
    return () => window.clearInterval(timer);
  }, [loadProjects]);

  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-ink">项目管理</h1>
          <p className="mt-1 text-sm text-slate-500">Git 仓库、域名、服务器和部署状态集中管理</p>
        </div>
        <div className="flex gap-2">
          <Button type="button" variant="secondary" icon={<RefreshCw size={17} />} onClick={() => void loadProjects()}>
            刷新
          </Button>
          <Link href="/projects/new">
            <Button type="button" icon={<Plus size={17} />}>
              创建项目
            </Button>
          </Link>
        </div>
      </header>

      {error ? <div className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div> : null}

      {loading ? (
        <div className="rounded-lg border border-line bg-white p-8 text-sm text-slate-500 shadow-soft">正在加载项目...</div>
      ) : projects.length === 0 ? (
        <div className="rounded-lg border border-line bg-white p-10 text-center shadow-soft">
          <h2 className="text-lg font-bold text-ink">还没有项目</h2>
          <p className="mt-2 text-sm text-slate-500">创建第一个项目后，就可以一键部署到 Ubuntu 服务器。</p>
          <Link href="/projects/new" className="mt-5 inline-block">
            <Button type="button" icon={<Plus size={17} />}>
              创建项目
            </Button>
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {projects.map((project) => (
            <ProjectCard key={project.id} project={project} onChanged={() => void loadProjects()} />
          ))}
        </div>
      )}
    </div>
  );
}
