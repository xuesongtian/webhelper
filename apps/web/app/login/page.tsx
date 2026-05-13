"use client";

import {
  ArrowRight,
  CheckCircle2,
  Eye,
  EyeOff,
  Github,
  Globe2,
  KeyRound,
  Loader2,
  LockKeyhole,
  Mail,
  Server,
  ShieldCheck,
  Sparkles,
  UserPlus,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { apiFetch, setToken } from "@/lib/api";

type AuthMode = "login" | "register";

const deploymentFlow = [
  {
    label: "Repository",
    value: "GitHub / main",
    icon: Github,
    tone: "text-[#409eff]",
    bg: "bg-[#ecf5ff]",
  },
  {
    label: "Runtime",
    value: "Docker Compose",
    icon: Server,
    tone: "text-[#67c23a]",
    bg: "bg-[#f0f9eb]",
  },
  {
    label: "Gateway",
    value: "Caddy HTTPS",
    icon: Globe2,
    tone: "text-[#e6a23c]",
    bg: "bg-[#fdf6ec]",
  },
] as const;

const deploymentLogs = [
  "账号密码确认身份",
  "SSH 凭证只在部署时使用",
  "成功后自动回到控制台",
] as const;

export default function LoginPage() {
  const router = useRouter();
  const [mode, setMode] = useState<AuthMode>("login");
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [password, setPassword] = useState("");
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
      const path = mode === "login" ? "/auth/login" : "/auth/register";
      const data = await apiFetch<{ token: string }>(path, {
        method: "POST",
        body: {
          email: email.trim(),
          password,
          ...(mode === "register" && name.trim() ? { name: name.trim() } : {}),
        },
      });
      setToken(data.token);
      router.replace(nextPath);
    } catch (err) {
      setError(err instanceof Error ? err.message : mode === "login" ? "登录失败" : "注册失败");
    } finally {
      setLoading(false);
    }
  }

  const isRegister = mode === "register";

  return (
    <main className="login-stage min-h-screen overflow-x-hidden px-5 py-6 text-slate-950 sm:px-8 lg:px-10">
      <div className="mx-auto grid min-h-[calc(100vh-48px)] w-full max-w-6xl items-center gap-8 lg:grid-cols-[1.03fr_0.97fr]">
        <section className="hidden lg:block">
          <div className="mb-8 inline-flex items-center gap-3 rounded-lg border border-white/80 bg-white/72 px-3 py-2 text-sm text-slate-600 shadow-[0_20px_80px_rgba(64,158,255,0.1)] backdrop-blur-2xl">
            <span className="grid h-8 w-8 place-items-center rounded-lg bg-[#ecf5ff] text-[#409eff] shadow-sm">
              <ShieldCheck size={18} />
            </span>
            <span className="font-semibold text-slate-950">建站助手</span>
            <span className="h-4 w-px bg-slate-200" />
            <span>Account Gate</span>
          </div>

          <div className="max-w-[620px]">
            <p className="mb-5 inline-flex items-center gap-2 text-sm font-semibold uppercase text-[#409eff]">
              <Sparkles size={15} />
              Secure action
            </p>
            <h1 className="max-w-[590px] text-[50px] font-black leading-[0.98] tracking-[0] text-slate-950">
              <span className="block">账号密码进入，</span>
              <span className="block">建站操作更安心。</span>
            </h1>
            <p className="mt-5 max-w-[560px] text-base leading-7 text-slate-500">
              面板和日志可以先浏览。创建站点、部署、保存环境变量和删除项目时，再用账号密码完成身份确认。
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
                  <span className={`grid h-11 w-11 place-items-center rounded-lg ${item.bg} shadow-sm`}>
                    <Icon className={item.tone} size={20} />
                  </span>
                  <span>
                    <span className="block text-sm font-semibold text-slate-950">{item.label}</span>
                    <span className="block text-sm text-slate-500">{item.value}</span>
                  </span>
                  <span className="flex items-center gap-2 text-xs font-semibold text-[#409eff]">
                    <span className="h-2 w-2 rounded-full bg-[#67c23a] shadow-[0_0_18px_rgba(103,194,58,0.35)]" />
                    0{index + 1}
                  </span>
                </div>
              );
            })}
          </div>

          <div className="mt-4 max-w-[560px] rounded-lg border border-white/80 bg-white/72 p-3.5 text-sm text-slate-600 shadow-[0_22px_70px_rgba(64,158,255,0.1)] backdrop-blur-2xl">
            <div className="space-y-2">
              {deploymentLogs.map((line) => (
                <div key={line} className="login-log-line flex items-center gap-3">
                  <CheckCircle2 className="text-[#67c23a]" size={16} />
                  <span>{line}</span>
                </div>
              ))}
            </div>
            <div className="deploy-meter mt-4 h-1.5 overflow-hidden rounded-full bg-white shadow-inner" />
          </div>
        </section>

        <section className="liquid-panel-strong mx-auto w-full max-w-[480px] rounded-lg p-5 sm:p-7">
          <div className="mb-6 flex items-start justify-between gap-4">
            <div className="flex items-center gap-3">
              <span className="grid h-12 w-12 place-items-center rounded-lg bg-[#ecf5ff] text-[#409eff] shadow-[0_16px_36px_rgba(64,158,255,0.16)]">
                {isRegister ? <UserPlus size={22} /> : <LockKeyhole size={22} />}
              </span>
              <div>
                <h2 className="text-2xl font-black tracking-[0] text-slate-950">{isRegister ? "注册账号" : "账号登录"}</h2>
                <p className="mt-1 text-sm text-slate-500">成功后返回 {nextPath}</p>
              </div>
            </div>
            <span className="rounded-lg border border-[#d9ecff] bg-[#ecf5ff] px-2.5 py-1 text-xs font-semibold text-[#409eff]">
              Password
            </span>
          </div>

          <div className="mb-5 grid grid-cols-2 rounded-lg border border-white/80 bg-white/62 p-1 shadow-inner">
            <button
              type="button"
              onClick={() => {
                setMode("login");
                setError("");
              }}
              className={`h-10 rounded-lg text-sm font-bold transition ${
                mode === "login" ? "bg-[#409eff] text-white shadow-[0_12px_28px_rgba(64,158,255,0.22)]" : "text-slate-500 hover:text-slate-950"
              }`}
            >
              登录
            </button>
            <button
              type="button"
              onClick={() => {
                setMode("register");
                setError("");
              }}
              className={`h-10 rounded-lg text-sm font-bold transition ${
                mode === "register" ? "bg-[#67c23a] text-white shadow-[0_12px_28px_rgba(103,194,58,0.2)]" : "text-slate-500 hover:text-slate-950"
              }`}
            >
              注册
            </button>
          </div>

          <form onSubmit={submit} className="space-y-4">
            {isRegister ? (
              <label className="block">
                <span className="text-sm font-semibold text-slate-700">昵称</span>
                <input
                  type="text"
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                  className="ios-input mt-2"
                  autoComplete="name"
                  placeholder="例如 Akeshen"
                />
              </label>
            ) : null}

            <label className="block">
              <span className="text-sm font-semibold text-slate-700">账号（邮箱）</span>
              <span className="mt-2 flex h-12 items-center rounded-lg border border-slate-900/10 bg-white/76 px-3 transition duration-200 focus-within:border-[#409eff]/60 focus-within:bg-white focus-within:shadow-[0_0_0_4px_rgba(64,158,255,0.13)]">
                <Mail className="shrink-0 text-[#409eff]" size={17} />
                <input
                  type="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  className="h-full min-w-0 flex-1 border-0 bg-transparent px-3 text-slate-950 outline-none"
                  autoComplete="email"
                  placeholder="name@example.com"
                  required
                />
              </span>
            </label>

            <label className="block">
              <span className="text-sm font-semibold text-slate-700">密码</span>
              <span className="mt-2 flex h-12 items-center rounded-lg border border-slate-900/10 bg-white/76 px-3 transition duration-200 focus-within:border-[#409eff]/60 focus-within:bg-white focus-within:shadow-[0_0_0_4px_rgba(64,158,255,0.13)]">
                <KeyRound className="shrink-0 text-[#67c23a]" size={17} />
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  className="h-full min-w-0 flex-1 border-0 bg-transparent px-3 text-slate-950 outline-none"
                  autoComplete={isRegister ? "new-password" : "current-password"}
                  minLength={isRegister ? 8 : 6}
                  placeholder={isRegister ? "至少 8 位密码" : "输入密码"}
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
              <div className="rounded-lg border border-[#fde2e2] bg-[#fef0f0]/90 px-3.5 py-3 text-sm text-[#f56c6c]">
                {error}
              </div>
            ) : null}

            <button
              type="submit"
              disabled={loading}
              className={`ios-touch group mt-2 inline-flex h-12 w-full items-center justify-center gap-2 rounded-lg px-4 text-sm font-black text-white disabled:translate-y-0 disabled:cursor-not-allowed disabled:opacity-60 ${
                isRegister
                  ? "bg-[#67c23a] shadow-[0_18px_52px_rgba(103,194,58,0.22)]"
                  : "bg-[#409eff] shadow-[0_18px_52px_rgba(64,158,255,0.24)]"
              }`}
            >
              {loading ? <Loader2 className="animate-spin" size={18} /> : <ArrowRight className="transition group-hover:translate-x-0.5" size={18} />}
              {loading ? "处理中" : isRegister ? "注册并进入" : "登录控制台"}
            </button>
          </form>

          <div className="mt-5 grid grid-cols-3 gap-2 text-center text-xs text-slate-500">
            <span className="rounded-lg border border-[#d9ecff] bg-[#ecf5ff] px-2 py-2 text-[#409eff]">Git</span>
            <span className="rounded-lg border border-[#e1f3d8] bg-[#f0f9eb] px-2 py-2 text-[#67c23a]">Docker</span>
            <span className="rounded-lg border border-[#faecd8] bg-[#fdf6ec] px-2 py-2 text-[#e6a23c]">HTTPS</span>
          </div>
        </section>
      </div>
    </main>
  );
}
