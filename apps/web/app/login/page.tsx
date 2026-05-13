"use client";

import { ArrowRight, ShieldCheck } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/Button";
import { apiFetch, setToken } from "@/lib/api";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("demo@local.dev");
  const [password, setPassword] = useState("password123");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

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
    <main className="grid min-h-screen place-items-center bg-[#f5f7fb] px-4">
      <section className="w-full max-w-md rounded-lg border border-line bg-white p-6 shadow-soft">
        <div className="mb-6 flex items-center gap-3">
          <span className="grid h-11 w-11 place-items-center rounded-lg bg-ink text-white">
            <ShieldCheck size={22} />
          </span>
          <div>
            <h1 className="text-xl font-bold text-ink">建站助手</h1>
            <p className="text-sm text-slate-500">登录自动部署控制台</p>
          </div>
        </div>

        <form onSubmit={submit} className="space-y-4">
          <label className="block">
            <span className="text-sm font-medium text-slate-700">邮箱</span>
            <input
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              className="mt-1 h-11 w-full rounded-md border border-line px-3 outline-none focus:border-brand"
              required
            />
          </label>
          <label className="block">
            <span className="text-sm font-medium text-slate-700">密码</span>
            <input
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              className="mt-1 h-11 w-full rounded-md border border-line px-3 outline-none focus:border-brand"
              required
            />
          </label>

          {error ? <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</div> : null}

          <Button type="submit" className="w-full" icon={<ArrowRight size={17} />} disabled={loading}>
            {loading ? "登录中" : "进入控制台"}
          </Button>
        </form>
      </section>
    </main>
  );
}
