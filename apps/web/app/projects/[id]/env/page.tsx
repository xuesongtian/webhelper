"use client";

import { Plus, Save, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { Button } from "@/components/Button";
import { apiFetch, getToken, type Project } from "@/lib/api";
import { requireSignedIn } from "@/lib/auth-gate";
import { demoProject } from "@/lib/demo";

type EnvDraft = { key: string; value: string };

export default function ProjectEnvPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const [project, setProject] = useState<Project | null>(null);
  const [envVars, setEnvVars] = useState<EnvDraft[]>([]);
  const [error, setError] = useState("");
  const [saved, setSaved] = useState("");
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setError("");
    if (!getToken()) {
      setProject(demoProject);
      setEnvVars(demoProject.envVars.map((envVar) => ({ key: envVar.key, value: "" })));
      return;
    }

    try {
      const data = await apiFetch<{ project: Project }>(`/projects/${params.id}`);
      setProject(data.project);
      setEnvVars(data.project.envVars.map((envVar) => ({ key: envVar.key, value: "" })));
    } catch (err) {
      setError(err instanceof Error ? err.message : "加载环境变量失败");
    }
  }, [params.id]);

  useEffect(() => {
    void load();
  }, [load]);

  async function save() {
    if (!requireSignedIn(router, `/projects/${params.id}/env`)) {
      return;
    }

    setError("");
    setSaved("");
    setSaving(true);

    try {
      const data = await apiFetch<{ project: Project }>(`/projects/${params.id}`, {
        method: "PUT",
        body: {
          envVars: envVars.filter((envVar) => envVar.key.trim()).map((envVar) => ({ key: envVar.key.trim(), value: envVar.value })),
          deleteMissingEnvVars: true,
        },
      });
      setProject(data.project);
      setEnvVars(data.project.envVars.map((envVar) => ({ key: envVar.key, value: "" })));
      setSaved("已保存");
    } catch (err) {
      setError(err instanceof Error ? err.message : "保存失败");
    } finally {
      setSaving(false);
    }
  }

  function updateEnv(index: number, key: keyof EnvDraft, value: string) {
    setEnvVars((current) => current.map((envVar, itemIndex) => (itemIndex === index ? { ...envVar, [key]: value } : envVar)));
  }

  return (
    <div className="space-y-5">
      <header className="liquid-panel-strong rounded-lg p-5">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-black tracking-[0] text-slate-950">环境变量设置</h1>
          <p className="mt-2 text-sm text-slate-500">{project?.name ?? "项目"} 的运行时变量。可以先编辑，保存时再登录。</p>
        </div>
        <div className="flex gap-2">
          <Button type="button" variant="secondary" icon={<Plus size={17} />} onClick={() => setEnvVars((current) => [...current, { key: "", value: "" }])}>
            添加
          </Button>
          <Button type="button" icon={<Save size={17} />} onClick={() => void save()} disabled={saving}>
            保存
          </Button>
        </div>
        </div>
      </header>

      {error ? <div className="rounded-lg border border-red-200 bg-red-50/80 px-4 py-3 text-sm text-red-700 backdrop-blur-xl">{error}</div> : null}
      {saved ? <div className="rounded-lg border border-emerald-200 bg-emerald-50/80 px-4 py-3 text-sm text-emerald-700 backdrop-blur-xl">{saved}</div> : null}

      <section className="ios-card p-5">
        <div className="space-y-3">
          {envVars.length === 0 ? <div className="text-sm text-slate-500">暂无环境变量</div> : null}
          {envVars.map((envVar, index) => (
            <div key={index} className="grid gap-3 md:grid-cols-[240px_1fr_44px]">
              <input className={inputClass} value={envVar.key} onChange={(event) => updateEnv(index, "key", event.target.value)} placeholder="KEY" />
              <input className={inputClass} type="password" value={envVar.value} onChange={(event) => updateEnv(index, "value", event.target.value)} placeholder="留空则保留原值" />
              <Button
                type="button"
                variant="ghost"
                title="删除"
                icon={<Trash2 size={17} />}
                onClick={() => setEnvVars((current) => current.filter((_, itemIndex) => itemIndex !== index))}
              />
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

const inputClass = "ios-input text-sm";
