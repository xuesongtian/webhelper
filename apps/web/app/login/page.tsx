"use client";

import {
  ArrowRight,
  CheckCircle2,
  Eye,
  EyeOff,
  Github,
  Globe2,
  Loader2,
  LockKeyhole,
  Server,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { apiFetch, setToken } from "@/lib/api";

const deploymentFlow = [
  {
    label: "Repository",
    value: "github / main",
    icon: Github,
    tone: "text-[#0a84ff]",
  },
  {
    label: "Runtime",
    value: "Docker Compose",
    icon: Server,
    tone: "text-[#34c759]",
  },
  {
    label: "Gateway",
    value: "Caddy HTTPS",
    icon: Globe2,
    tone: "text-[#ff9f0a]",
  },
] as const;

const deploymentLogs = [
  "ssh tunnel established",
  "docker compose build --pull",
  "caddy certificate issued",
] as const;

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("demo@local.dev");
  const [password, setPassword] = useState("password123");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [nextPath, setNextPath] = useState("/projects");

  useEffect(() => {
    const next = new URLSearchParams(window.location.search).get("next");
    if (next?.startsWith("/")) {
      setNextPath(next);
    }
  }, []);

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setLoading(true);

    try {
      const data = await apiFetch<{ token: string }>("/auth/login", {
        method: "POST",
        body: { email, password },
      });
      setToken(data.token);
      router.replace(nextPath);
    } catch (err) {
      setError(err instanceof Error ? err.message : "登录失败");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="login-stage min-h-screen overflow-x-hidden px-5 py-6 text-slate-950 sm:px-8 lg:px-10">
      <div className="mx-auto grid min-h-[calc(100vh-48px)] w-full max-w-6xl items-center gap-8 lg:grid-cols-[1.06fr_0.94fr]">
        <section className="hidden lg:block">
          <div className="mb-8 inline-flex items-center gap-3 rounded-lg border border-white/80 bg-white/70 px-3 py-2 text-sm text-slate-600 shadow-[0_20px_80px_rgba(31,41,55,0.08)] backdrop-blur-2xl">
            <span className="grid h-8 w-8 place-items-center rounded-lg bg-white text-[#0a84ff] shadow-sm">
              <ShieldCheck size={18} />
            </span>
            <span className="font-semibold text-slate-950">建站助手</span>
            <span className="h-4 w-px bg-slate-200" />
            <span>Login Gate</span>
          </div>

          <div className="max-w-[620px]">
            <p className="mb-5 inline-flex items-center gap-2 text-sm font-semibold uppercase text-[#0a84ff]">
              <Sparkles size={15} />
              Secure action
            </p>
            <h1 className="max-w-[560px] text-[48px] font-black leading-[0.98] tracking-[0] text-slate-950">
              <span className="block">只在关键操作前</span>
              <span className="block">确认身份。</span>
            </h1>
            <p className="mt-5 max-w-[540px] text-base leading-7 text-slate-500">
              面板、状态、日志可以先浏览。创建站点、部署、保存环境变量和删除项目时，再通过这个轻量登录门。
            </p>
          </div>

          <div className="mt-7 grid max-w-[560px] gap-2.5">
            {deploymentFlow.map((item, index) => {
              const Icon = item.icon;
              return (
                <div
                  key={item.label}
                  className="ios-card group grid grid-cols-[44px_1fr_auto] items-center gap-4 p-2.5 transition duration-300 hover:-translate-y-0.5"
                >
                  <span className="grid h-11 w-11 place-items-center rounded-lg bg-white shadow-sm">
                    <Icon className={item.tone} size={20} />
                  </span>
                  <span>
                    <span className="block text-sm font-semibold text-slate-950">{item.label}</span>
                    <span className="block text-sm text-slate-500">{item.value}</span>
                  </span>
                  <span className="flex items-center gap-2 text-xs font-semibold text-[#0a84ff]">
                    <span className="h-2 w-2 rounded-full bg-[#34c759] shadow-[0_0_18px_rgba(52,199,89,0.35)]" />
                    0{index + 1}
                  </span>
                </div>
              );
            })}
          </div>

          <div className="mt-4 max-w-[560px] rounded-lg border border-white/80 bg-white/70 p-3.5 text-sm text-slate-600 shadow-[0_22px_70px_rgba(31,41,55,0.08)] backdrop-blur-2xl">
            <div className="space-y-2">
              {deploymentLogs.map((line) => (
                <div key={line} className="login-log-line flex items-center gap-3">
                  <CheckCircle2 className="text-[#34c759]" size={16} />
                  <span>{line}</span>
                </div>
              ))}
            </div>
            <div className="deploy-meter mt-4 h-1.5 overflow-hidden rounded-full bg-white shadow-inner" />
          </div>
        </section>

        <section className="liquid-panel-strong mx-auto w-full max-w-[470px] rounded-lg p-5 sm:p-7">
          <div className="mb-7 flex items-start justify-between gap-4">
            <div className="flex items-center gap-3">
              <span className="grid h-12 w-12 place-items-center rounded-lg bg-white text-[#0a84ff] shadow-[0_16px_36px_rgba(10,132,255,0.14)]">
                <LockKeyhole size={22} />
              </span>
              <div>
                <h2 className="text-2xl font-black tracking-[0] text-slate-950">登录后继续</h2>
                <p className="mt-1 text-sm text-slate-500">将返回 {nextPath}</p>
              </div>
            </div>
            <span className="rounded-lg border border-blue-100 bg-blue-50 px-2.5 py-1 text-xs font-semibold text-[#0a84ff]">
              Secure
            </span>
          </div>

          <form onSubmit={submit} className="space-y-4">
            <label className="block">
              <span className="text-sm font-semibold text-slate-700">邮箱</span>
              <input
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                className="ios-input mt-2"
                autoComplete="email"
                required
              />
            </label>

            <label className="block">
              <span className="text-sm font-semibold text-slate-700">密码</span>
              <span className="mt-2 flex h-12 items-center rounded-lg border border-slate-900/10 bg-white/72 pr-2 transition duration-200 focus-within:border-[#0a84ff]/60 focus-within:bg-white focus-within:shadow-[0_0_0_4px_rgba(10,132,255,0.12)]">
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  className="h-full min-w-0 flex-1 border-0 bg-transparent px-3.5 text-slate-950 outline-none"
                  autoComplete="current-password"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((visible) => !visible)}
                  className="grid h-8 w-8 place-items-center rounded-lg text-slate-400 transition hover:bg-slate-100 hover:text-slate-950"
                  aria-label={showPassword ? "隐藏密码" : "显示密码"}
                >
                  {showPassword ? <EyeOff size={17} /> : <Eye size={17} />}
                </button>
              </span>
            </label>

            {error ? (
              <div className="rounded-lg border border-red-200 bg-red-50/80 px-3.5 py-3 text-sm text-red-700">
                {error}
              </div>
            ) : null}

            <button
              type="submit"
              disabled={loading}
              className="ios-touch group mt-2 inline-flex h-12 w-full items-center justify-center gap-2 rounded-lg bg-[#0a84ff] px-4 text-sm font-black text-white shadow-[0_18px_52px_rgba(10,132,255,0.22)] disabled:translate-y-0 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading ? <Loader2 className="animate-spin" size={18} /> : <ArrowRight className="transition group-hover:translate-x-0.5" size={18} />}
              {loading ? "正在进入" : "进入控制台"}
            </button>
          </form>

          <div className="mt-5 grid grid-cols-3 gap-2 text-center text-xs text-slate-500">
            <span className="rounded-lg border border-white/70 bg-white/62 px-2 py-2">Git</span>
            <span className="rounded-lg border border-white/70 bg-white/62 px-2 py-2">Docker</span>
            <span className="rounded-lg border border-white/70 bg-white/62 px-2 py-2">HTTPS</span>
          </div>
        </section>
      </div>
    </main>
  );
}
