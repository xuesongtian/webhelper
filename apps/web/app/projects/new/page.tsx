import { ProjectForm } from "@/components/ProjectForm";

export default function NewProjectPage() {
  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-bold text-ink">创建项目</h1>
        <p className="mt-1 text-sm text-slate-500">填写 Git、域名和服务器信息后即可生成部署任务。</p>
      </header>
      <ProjectForm />
    </div>
  );
}
