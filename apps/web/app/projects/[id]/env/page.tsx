"use client";

import { Plus, Save, Trash2 } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { Button } from "@/components/Button";
import { apiFetch, type Project } from "@/lib/api";

type EnvDraft = { key: string; value: string };

export default function ProjectEnvPage({ params }: { params: { id: string } }) {
  const [project, setProject] = useState<Project | null>(null);
  const [envVars, setEnvVars] = useState<EnvDraft[]>([]);
  const [error, setError] = useState("");
  const [saved, setSaved] = useState("");
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setError("");
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
    <div className="space-y-6">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-ink">环境变量设置</h1>
          <p className="mt-1 text-sm text-slate-500">{project?.name ?? "项目"} 的运行时变量</p>
        </div>
        <div className="flex gap-2">
          <Button type="button" variant="secondary" icon={<Plus size={17} />} onClick={() => setEnvVars((current) => [...current, { key: "", value: "" }])}>
            添加
          </Button>
          <Button type="button" icon={<Save size={17} />} onClick={() => void save()} disabled={saving}>
            保存
          </Button>
        </div>
      </header>

      {error ? <div className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div> : null}
      {saved ? <div className="rounded-md border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">{saved}</div> : null}

      <section className="rounded-lg border border-line bg-white p-5 shadow-soft">
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

const inputClass = "h-11 w-full rounded-md border border-line bg-white px-3 text-sm outline-none transition focus:border-brand";
