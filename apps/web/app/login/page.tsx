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
  TerminalSquare,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { apiFetch, setToken } from "@/lib/api";

const deploymentFlow = [
  {
    label: "Repository",
    value: "github / main",
    icon: Github,
    tone: "text-[#d6ff65]",
  },
  {
    label: "Runtime",
    value: "Docker Compose",
    icon: Server,
    tone: "text-[#8ee6ff]",
  },
  {
    label: "Gateway",
    value: "Caddy HTTPS",
    icon: Globe2,
    tone: "text-[#f7c873]",
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
      router.replace("/projects");
    } catch (err) {
      setError(err instanceof Error ? err.message : "登录失败");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="login-stage min-h-screen overflow-x-hidden px-5 py-6 text-[#f5f5f0] sm:px-8 lg:px-10">
      <div className="mx-auto grid min-h-[calc(100vh-48px)] w-full max-w-6xl items-center gap-8 lg:grid-cols-[1.06fr_0.94fr]">
        <section className="hidden lg:block">
          <div className="mb-8 inline-flex items-center gap-3 rounded-md border border-[#30362d] bg-[#11130d]/80 px-3 py-2 text-sm text-[#d8dfce] shadow-[0_20px_80px_rgba(0,0,0,0.22)]">
            <span className="grid h-8 w-8 place-items-center rounded-md bg-[#d6ff65] text-[#11130d]">
              <ShieldCheck size={18} />
            </span>
            <span className="font-semibold">建站助手</span>
            <span className="h-4 w-px bg-[#30362d]" />
            <span className="text-[#9ca896]">Deploy Console</span>
          </div>

          <div className="max-w-[620px]">
            <p className="mb-5 text-sm font-semibold uppercase text-[#d6ff65]">AKESHEN SITEOPS</p>
            <h1 className="max-w-[560px] text-[48px] font-black leading-[0.98] text-[#f5f5f0]">
              <span className="block">Git 到 HTTPS</span>
              <span className="block">部署上线。</span>
            </h1>
            <p className="mt-5 max-w-[540px] text-base leading-7 text-[#c7d2bd]">
              登录后接管仓库、服务器、域名与发布流水线，部署过程以可追踪日志和状态面板呈现。
            </p>
          </div>

          <div className="mt-7 grid max-w-[560px] gap-2.5">
            {deploymentFlow.map((item, index) => {
              const Icon = item.icon;
              return (
                <div
                  key={item.label}
                  className="group grid grid-cols-[44px_1fr_auto] items-center gap-4 rounded-lg border border-[#30362d] bg-[#11130d]/82 p-2.5 shadow-[0_18px_60px_rgba(0,0,0,0.16)] transition duration-300 hover:-translate-y-0.5 hover:border-[#6b7d48]"
                >
                  <span className="grid h-11 w-11 place-items-center rounded-md border border-[#394035] bg-[#151711]">
                    <Icon className={item.tone} size={20} />
                  </span>
                  <span>
                    <span className="block text-sm font-semibold text-[#f1f6df]">{item.label}</span>
                    <span className="block text-sm text-[#9ca896]">{item.value}</span>
                  </span>
                  <span className="flex items-center gap-2 text-xs font-semibold text-[#d6ff65]">
                    <span className="h-2 w-2 rounded-full bg-[#d6ff65] shadow-[0_0_18px_rgba(214,255,101,0.75)]" />
                    0{index + 1}
                  </span>
                </div>
              );
            })}
          </div>

          <div className="mt-4 max-w-[560px] rounded-lg border border-[#30362d] bg-[#0b0d0b]/90 p-3.5 font-mono text-sm shadow-[0_22px_70px_rgba(0,0,0,0.2)]">
            <div className="mb-3 flex items-center justify-between border-b border-[#252b22] pb-3 text-[#9ca896]">
              <span className="inline-flex items-center gap-2">
                <TerminalSquare size={16} />
                deploy stream
              </span>
              <span className="text-[#d6ff65]">live</span>
            </div>
            <div className="space-y-2">
              {deploymentLogs.map((line) => (
                <div key={line} className="login-log-line flex items-center gap-3 text-[#d8dfce]">
                  <CheckCircle2 className="text-[#d6ff65]" size={16} />
                  <span>{line}</span>
                </div>
              ))}
            </div>
            <div className="deploy-meter mt-4 h-1.5 overflow-hidden rounded-full bg-[#252b22]" />
          </div>
        </section>

        <section className="mx-auto w-full max-w-[470px] rounded-lg border border-[#30362d] bg-[#11130d]/90 p-5 shadow-[0_28px_100px_rgba(0,0,0,0.32)] backdrop-blur-xl sm:p-7">
          <div className="mb-7 flex items-start justify-between gap-4">
            <div className="flex items-center gap-3">
              <span className="grid h-12 w-12 place-items-center rounded-lg bg-[#d6ff65] text-[#11130d] shadow-[0_0_32px_rgba(214,255,101,0.22)]">
                <LockKeyhole size={22} />
              </span>
              <div>
                <h2 className="text-2xl font-black text-[#f5f5f0]">登录控制台</h2>
                <p className="mt-1 text-sm text-[#9ca896]">Akeshen Deploy Workspace</p>
              </div>
            </div>
            <span className="rounded-md border border-[#30362d] bg-[#151711] px-2.5 py-1 text-xs font-semibold text-[#d6ff65]">
              Secure
            </span>
          </div>

          <form onSubmit={submit} className="space-y-4">
            <label className="block">
              <span className="text-sm font-semibold text-[#d8dfce]">邮箱</span>
              <input
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                className="mt-2 h-12 w-full rounded-md border border-[#394035] bg-[#0c0d0b] px-3.5 text-[#f5f5f0] outline-none transition duration-200 placeholder:text-[#687260] focus:border-[#d6ff65] focus:shadow-[0_0_0_3px_rgba(214,255,101,0.12)]"
                autoComplete="email"
                required
              />
            </label>

            <label className="block">
              <span className="text-sm font-semibold text-[#d8dfce]">密码</span>
              <span className="mt-2 flex h-12 items-center rounded-md border border-[#394035] bg-[#0c0d0b] pr-2 transition duration-200 focus-within:border-[#d6ff65] focus-within:shadow-[0_0_0_3px_rgba(214,255,101,0.12)]">
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  className="h-full min-w-0 flex-1 border-0 bg-transparent px-3.5 text-[#f5f5f0] outline-none"
                  autoComplete="current-password"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((visible) => !visible)}
                  className="grid h-8 w-8 place-items-center rounded-md text-[#9ca896] transition hover:bg-[#1b2017] hover:text-[#f5f5f0]"
                  aria-label={showPassword ? "隐藏密码" : "显示密码"}
                >
                  {showPassword ? <EyeOff size={17} /> : <Eye size={17} />}
                </button>
              </span>
            </label>

            {error ? (
              <div className="rounded-md border border-[#613232] bg-[#2b1111] px-3.5 py-3 text-sm text-[#ffd6d6]">
                {error}
              </div>
            ) : null}

            <button
              type="submit"
              disabled={loading}
              className="group mt-2 inline-flex h-12 w-full items-center justify-center gap-2 rounded-md bg-[#d6ff65] px-4 text-sm font-black text-[#11130d] shadow-[0_18px_52px_rgba(214,255,101,0.18)] transition duration-200 hover:-translate-y-0.5 hover:bg-[#e3ff89] disabled:translate-y-0 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading ? <Loader2 className="animate-spin" size={18} /> : <ArrowRight className="transition group-hover:translate-x-0.5" size={18} />}
              {loading ? "正在进入" : "进入控制台"}
            </button>
          </form>

          <div className="mt-5 grid grid-cols-3 gap-2 text-center text-xs text-[#9ca896]">
            <span className="rounded-md border border-[#30362d] bg-[#151711] px-2 py-2">Git</span>
            <span className="rounded-md border border-[#30362d] bg-[#151711] px-2 py-2">Docker</span>
            <span className="rounded-md border border-[#30362d] bg-[#151711] px-2 py-2">HTTPS</span>
          </div>
        </section>
      </div>
    </main>
  );
}
