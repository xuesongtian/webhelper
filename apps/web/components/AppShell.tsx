"use client";

import { Boxes, FileText, Globe2, KeyRound, LayoutDashboard, LogIn, LogOut, Plus, ServerCog, Sparkles } from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { clearToken, getToken } from "@/lib/api";
import { loginUrl } from "@/lib/auth-gate";
import { Button } from "./Button";

const navItems = [
  { href: "/projects", label: "项目", icon: LayoutDashboard },
  { href: "/projects/new", label: "创建项目", icon: Plus },
];

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [signedIn, setSignedIn] = useState(false);

  useEffect(() => {
    setSignedIn(Boolean(getToken()));
  }, [pathname]);

  const projectMatch = pathname.match(/^\/projects\/([^/]+)/);
  const projectId = projectMatch?.[1];
  const projectLinks =
    projectId && projectId !== "new"
      ? [
          { href: `/projects/${projectId}`, label: "项目详情", icon: Boxes },
          { href: `/projects/${projectId}/logs`, label: "部署日志", icon: FileText },
          { href: `/projects/${projectId}/server`, label: "服务器", icon: ServerCog },
          { href: `/projects/${projectId}/env`, label: "环境变量", icon: KeyRound },
        ]
      : [];

  return (
    <div className="app-bg">
      <aside className="fixed inset-y-4 left-4 z-20 hidden w-72 rounded-lg liquid-panel px-4 py-5 lg:block">
        <Link href="/projects" className="flex items-center gap-3 px-2">
          <span className="grid h-10 w-10 place-items-center rounded-lg bg-white text-[#0a84ff] shadow-[0_14px_32px_rgba(10,132,255,0.16)]">
            <Globe2 size={20} />
          </span>
          <span>
            <span className="block text-base font-bold text-slate-950">建站助手</span>
            <span className="block text-xs text-slate-500">Liquid Deploy Console</span>
          </span>
        </Link>

        <div className="mt-5 rounded-lg border border-white/70 bg-white/60 p-3 text-xs text-slate-600 shadow-sm">
          <div className="flex items-center gap-2 font-semibold text-slate-950">
            <Sparkles size={15} className="text-[#0a84ff]" />
            {signedIn ? "已登录工作区" : "访客可预览"}
          </div>
          <p className="mt-1 leading-5">可以先浏览面板、日志和状态；部署、保存、删除时再登录。</p>
        </div>

        <nav className="mt-5 space-y-1">
          {[...navItems, ...projectLinks].map((item) => {
            const Icon = item.icon;
            const active = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`ios-touch flex h-10 items-center gap-3 rounded-lg px-3 text-sm font-medium ${
                  active ? "bg-slate-950 text-white shadow-[0_12px_28px_rgba(15,23,42,0.16)]" : "text-slate-600 hover:bg-white/72 hover:text-slate-950"
                }`}
              >
                <Icon size={18} />
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="absolute bottom-5 left-4 right-4">
          {signedIn ? (
            <Button
              variant="ghost"
              icon={<LogOut size={17} />}
              className="w-full justify-start"
              onClick={() => {
                clearToken();
                setSignedIn(false);
                router.replace("/projects");
              }}
            >
              退出登录
            </Button>
          ) : (
            <Button type="button" variant="secondary" icon={<LogIn size={17} />} className="w-full justify-start" onClick={() => router.push(loginUrl(pathname))}>
              登录后建站
            </Button>
          )}
        </div>
      </aside>

      <header className="sticky top-0 z-10 border-b border-white/70 bg-white/70 px-4 py-3 backdrop-blur-2xl lg:hidden">
        <div className="flex items-center justify-between gap-3">
          <Link href="/projects" className="flex items-center gap-2 font-bold text-slate-950">
            <span className="grid h-9 w-9 place-items-center rounded-lg bg-white text-[#0a84ff] shadow-sm">
              <Globe2 size={18} />
            </span>
            建站助手
          </Link>
          <Button type="button" variant="secondary" icon={signedIn ? <LogOut size={16} /> : <LogIn size={16} />} onClick={() => (signedIn ? (clearToken(), setSignedIn(false), router.replace("/projects")) : router.push(loginUrl(pathname)))}>
            {signedIn ? "退出" : "登录"}
          </Button>
        </div>
        <nav className="mt-3 flex gap-2 overflow-x-auto pb-1">
          {[...navItems, ...projectLinks].map((item) => {
            const Icon = item.icon;
            const active = pathname === item.href;
            return (
              <Link key={item.href} href={item.href} className={`inline-flex h-9 shrink-0 items-center gap-2 rounded-lg px-3 text-sm font-semibold ${active ? "bg-slate-950 text-white" : "bg-white/62 text-slate-600"}`}>
                <Icon size={16} />
                {item.label}
              </Link>
            );
          })}
        </nav>
      </header>

      <main className="lg:pl-[304px]">
        <div className="mx-auto w-full max-w-7xl px-4 py-5 sm:px-6 lg:px-8 lg:py-8">{children}</div>
      </main>
    </div>
  );
}
