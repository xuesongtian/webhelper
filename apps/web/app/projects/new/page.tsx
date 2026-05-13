import { ProjectForm } from "@/components/ProjectForm";

export default function NewProjectPage() {
  return (
    <div className="space-y-5">
      <header className="liquid-panel-strong rounded-lg p-5">
        <div className="inline-flex items-center rounded-full border border-white/80 bg-white/70 px-3 py-1 text-xs font-semibold text-[#0a84ff]">Setup</div>
        <h1 className="mt-3 text-3xl font-black tracking-[0] text-slate-950">新建站点</h1>
        <p className="mt-2 text-sm leading-6 text-slate-500">可以先填写资料和基础配置；点击创建或部署时，如果还没登录，会自动进入登录页继续。</p>
      </header>
      <ProjectForm />
    </div>
  );
}
