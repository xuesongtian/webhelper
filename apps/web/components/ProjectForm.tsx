"use client";

import { KeyRound, Plus, Rocket, Save, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/Button";
import { apiFetch, type Project, type ProjectFormPayload, type SshAuthType } from "@/lib/api";

type EnvDraft = { key: string; value: string };

const emptyEnv: EnvDraft = { key: "", value: "" };

export function ProjectForm() {
  const router = useRouter();
  const [form, setForm] = useState({
    name: "",
    gitRepo: "",
    branch: "main",
    domain: "",
    serverIp: "",
    sshUsername: "root",
    sshPort: 22,
    sshAuthType: "PASSWORD_ONCE" as SshAuthType,
    sshPrivateKey: "",
    sshKeyPassphrase: "",
    sshPassword: "",
  });
  const [envVars, setEnvVars] = useState<EnvDraft[]>([{ ...emptyEnv }]);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function submit(createAndDeploy: boolean) {
    setError("");
    setSubmitting(true);

    const payload: ProjectFormPayload = {
      name: form.name,
      gitRepo: form.gitRepo,
      branch: form.branch,
      domain: form.domain,
      serverIp: form.serverIp,
      sshUsername: form.sshUsername,
      sshPort: Number(form.sshPort),
      sshAuthType: form.sshAuthType,
      sshPrivateKey: form.sshPrivateKey || undefined,
      sshKeyPassphrase: form.sshKeyPassphrase || undefined,
      envVars: envVars.filter((item) => item.key.trim()).map((item) => ({ key: item.key.trim(), value: item.value })),
    };

    try {
      const data = await apiFetch<{ project: Project; webhookSecret: string }>("/projects", {
        method: "POST",
        body: payload,
      });

      if (createAndDeploy) {
        await apiFetch(`/projects/${data.project.id}/deploy`, {
          method: "POST",
          body: form.sshPassword ? { sshPassword: form.sshPassword } : {},
        });
      }

      router.replace(`/projects/${data.project.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "创建项目失败");
    } finally {
      setSubmitting(false);
    }
  }

  function updateEnv(index: number, key: keyof EnvDraft, value: string) {
    setEnvVars((current) => current.map((item, itemIndex) => (itemIndex === index ? { ...item, [key]: value } : item)));
  }

  return (
    <form
      className="space-y-6"
      onSubmit={(event) => {
        event.preventDefault();
        void submit(false);
      }}
    >
      {error ? <div className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div> : null}

      <section className="rounded-lg border border-line bg-white p-5 shadow-soft">
        <h2 className="text-base font-bold text-ink">项目</h2>
        <div className="mt-4 grid gap-4 md:grid-cols-2">
          <Field label="项目名称">
            <input className={inputClass} value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} required />
          </Field>
          <Field label="Git 仓库地址">
            <input className={inputClass} value={form.gitRepo} onChange={(event) => setForm({ ...form, gitRepo: event.target.value })} required />
          </Field>
          <Field label="分支">
            <input className={inputClass} value={form.branch} onChange={(event) => setForm({ ...form, branch: event.target.value })} required />
          </Field>
          <Field label="域名">
            <input className={inputClass} value={form.domain} onChange={(event) => setForm({ ...form, domain: event.target.value })} placeholder="example.com" required />
          </Field>
        </div>
      </section>

      <section className="rounded-lg border border-line bg-white p-5 shadow-soft">
        <h2 className="text-base font-bold text-ink">服务器连接</h2>
        <div className="mt-4 grid gap-4 md:grid-cols-2">
          <Field label="云服务器 IP">
            <input className={inputClass} value={form.serverIp} onChange={(event) => setForm({ ...form, serverIp: event.target.value })} required />
          </Field>
          <Field label="SSH 用户名">
            <input className={inputClass} value={form.sshUsername} onChange={(event) => setForm({ ...form, sshUsername: event.target.value })} required />
          </Field>
          <Field label="SSH 端口">
            <input
              className={inputClass}
              type="number"
              min={1}
              max={65535}
              value={form.sshPort}
              onChange={(event) => setForm({ ...form, sshPort: Number(event.target.value) })}
              required
            />
          </Field>
          <Field label="认证方式">
            <select className={inputClass} value={form.sshAuthType} onChange={(event) => setForm({ ...form, sshAuthType: event.target.value as SshAuthType })}>
              <option value="PASSWORD_ONCE">一次性密码</option>
              <option value="PRIVATE_KEY">SSH 私钥</option>
            </select>
          </Field>
        </div>

        {form.sshAuthType === "PRIVATE_KEY" ? (
          <div className="mt-4 grid gap-4 md:grid-cols-2">
            <Field label="SSH 私钥">
              <textarea
                className={`${inputClass} h-36 resize-y py-3 font-mono text-xs`}
                value={form.sshPrivateKey}
                onChange={(event) => setForm({ ...form, sshPrivateKey: event.target.value })}
                placeholder="-----BEGIN OPENSSH PRIVATE KEY-----"
              />
            </Field>
            <Field label="私钥 Passphrase">
              <input
                className={inputClass}
                type="password"
                value={form.sshKeyPassphrase}
                onChange={(event) => setForm({ ...form, sshKeyPassphrase: event.target.value })}
              />
            </Field>
          </div>
        ) : (
          <div className="mt-4">
            <Field label="一次性 SSH 密码">
              <input
                className={inputClass}
                type="password"
                value={form.sshPassword}
                onChange={(event) => setForm({ ...form, sshPassword: event.target.value })}
                placeholder="只用于本次部署，不会保存"
              />
            </Field>
          </div>
        )}
      </section>

      <section className="rounded-lg border border-line bg-white p-5 shadow-soft">
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-base font-bold text-ink">环境变量</h2>
          <Button type="button" variant="secondary" icon={<Plus size={16} />} onClick={() => setEnvVars((current) => [...current, { ...emptyEnv }])}>
            添加
          </Button>
        </div>
        <div className="mt-4 space-y-3">
          {envVars.map((envVar, index) => (
            <div key={index} className="grid gap-3 md:grid-cols-[220px_1fr_44px]">
              <input className={inputClass} value={envVar.key} onChange={(event) => updateEnv(index, "key", event.target.value)} placeholder="KEY" />
              <input className={inputClass} type="password" value={envVar.value} onChange={(event) => updateEnv(index, "value", event.target.value)} placeholder="VALUE" />
              <Button
                type="button"
                variant="ghost"
                icon={<Trash2 size={17} />}
                title="删除变量"
                onClick={() => setEnvVars((current) => current.filter((_, itemIndex) => itemIndex !== index))}
              />
            </div>
          ))}
        </div>
      </section>

      <div className="flex flex-wrap justify-end gap-3">
        <Button type="submit" variant="secondary" icon={<Save size={17} />} disabled={submitting}>
          创建项目
        </Button>
        <Button type="button" icon={<Rocket size={17} />} disabled={submitting} onClick={() => void submit(true)}>
          创建并部署
        </Button>
      </div>

      <p className="flex items-center gap-2 text-xs text-slate-500">
        <KeyRound size={14} />
        密钥和环境变量会加密保存，一次性密码只随本次部署请求发送。
      </p>
    </form>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="text-sm font-medium text-slate-700">{label}</span>
      <div className="mt-1">{children}</div>
    </label>
  );
}

const inputClass = "h-11 w-full rounded-md border border-line bg-white px-3 text-sm outline-none transition focus:border-brand";
