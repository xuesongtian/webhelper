"use client";

import { Boxes, FileText, Globe2, KeyRound, LayoutDashboard, LogOut, Plus, ServerCog } from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect } from "react";
import { clearToken, getToken } from "@/lib/api";
import { Button } from "./Button";

const navItems = [
  { href: "/projects", label: "项目", icon: LayoutDashboard },
  { href: "/projects/new", label: "创建项目", icon: Plus },
];

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    if (!getToken()) {
      router.replace("/login");
    }
  }, [router]);

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
    <div className="min-h-screen bg-[#f5f7fb]">
      <aside className="fixed inset-y-0 left-0 z-20 hidden w-72 border-r border-line bg-white px-4 py-5 lg:block">
        <Link href="/projects" className="flex items-center gap-3 px-2">
          <span className="grid h-10 w-10 place-items-center rounded-lg bg-ink text-white">
            <Globe2 size={20} />
          </span>
          <span>
            <span className="block text-base font-bold text-ink">建站助手</span>
            <span className="block text-xs text-slate-500">自动部署控制台</span>
          </span>
        </Link>

        <nav className="mt-8 space-y-1">
          {[...navItems, ...projectLinks].map((item) => {
            const Icon = item.icon;
            const active = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex h-10 items-center gap-3 rounded-md px-3 text-sm font-medium transition ${
                  active ? "bg-slate-900 text-white" : "text-slate-600 hover:bg-slate-100 hover:text-ink"
                }`}
              >
                <Icon size={18} />
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="absolute bottom-5 left-4 right-4">
          <Button
            variant="ghost"
            icon={<LogOut size={17} />}
            className="w-full justify-start"
            onClick={() => {
              clearToken();
              router.replace("/login");
            }}
          >
            退出登录
          </Button>
        </div>
      </aside>

      <main className="lg:pl-72">
        <div className="mx-auto w-full max-w-7xl px-4 py-6 sm:px-6 lg:px-8">{children}</div>
      </main>
    </div>
  );
}
