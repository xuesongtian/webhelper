"use client";

import { KeyRound, Plus, Rocket, Save, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Button } from "@/components/Button";
import { apiFetch, getToken, type Project, type ProjectFormPayload, type SshAuthType } from "@/lib/api";
import { loginUrl } from "@/lib/auth-gate";

type EnvDraft = { key: string; value: string };

const emptyEnv: EnvDraft = { key: "", value: "" };
const DRAFT_KEY = "jianzhan-project-draft";

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

  useEffect(() => {
    const rawDraft = window.sessionStorage.getItem(DRAFT_KEY);
    if (!rawDraft) {
      return;
    }

    try {
      const draft = JSON.parse(rawDraft) as Partial<typeof form> & { envKeys?: string[] };
      setForm((current) => ({
        ...current,
        name: draft.name ?? current.name,
        gitRepo: draft.gitRepo ?? current.gitRepo,
        branch: draft.branch ?? current.branch,
        domain: draft.domain ?? current.domain,
        serverIp: draft.serverIp ?? current.serverIp,
        sshUsername: draft.sshUsername ?? current.sshUsername,
        sshPort: draft.sshPort ?? current.sshPort,
        sshAuthType: draft.sshAuthType ?? current.sshAuthType,
      }));
      if (draft.envKeys?.length) {
        setEnvVars(draft.envKeys.map((key) => ({ key, value: "" })));
      }
      window.sessionStorage.removeItem(DRAFT_KEY);
      setError("已恢复登录前填写的基础信息。SSH 密码、私钥和变量值不会临时保存，请重新填写。");
    } catch {
      window.sessionStorage.removeItem(DRAFT_KEY);
    }
  }, []);

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
      if (!getToken()) {
        window.sessionStorage.setItem(
          DRAFT_KEY,
          JSON.stringify({
            name: form.name,
            gitRepo: form.gitRepo,
            branch: form.branch,
            domain: form.domain,
            serverIp: form.serverIp,
            sshUsername: form.sshUsername,
            sshPort: form.sshPort,
            sshAuthType: form.sshAuthType,
            envKeys: envVars.map((item) => item.key.trim()).filter(Boolean),
          }),
        );
        router.push(loginUrl("/projects/new"));
        return;
      }

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

      window.sessionStorage.removeItem(DRAFT_KEY);
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
      className="space-y-5"
      onSubmit={(event) => {
        event.preventDefault();
        void submit(false);
      }}
    >
      {error ? <div className="rounded-lg border border-blue-200 bg-blue-50/80 px-4 py-3 text-sm text-blue-800 backdrop-blur-xl">{error}</div> : null}

      <section className="ios-card p-5">
        <h2 className="text-base font-black text-slate-950">项目</h2>
        <p className="mt-1 text-sm text-slate-500">先把站点资料填好，真正提交创建时再进入登录。</p>
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

      <section className="ios-card p-5">
        <h2 className="text-base font-black text-slate-950">服务器连接</h2>
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
                className={`${inputClass} ios-textarea resize-y font-mono text-xs`}
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

      <section className="ios-card p-5">
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-base font-black text-slate-950">环境变量</h2>
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

      <p className="flex items-center gap-2 rounded-lg border border-white/70 bg-white/60 px-3 py-2 text-xs text-slate-500 backdrop-blur-xl">
        <KeyRound size={14} />
        密钥和环境变量只在登录后提交；未登录时不会把 SSH 密码、私钥、变量值临时保存。
      </p>
    </form>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="text-sm font-semibold text-slate-700">{label}</span>
      <div className="mt-2">{children}</div>
    </label>
  );
}

const inputClass = "ios-input text-sm";
