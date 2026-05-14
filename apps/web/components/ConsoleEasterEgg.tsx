"use client";

import { useEffect } from "react";
import { apiBaseUrl } from "@/lib/api";

const VISIT_RECORDED_KEY = "jianzhan-assistant-site-visit-recorded";

export function ConsoleEasterEgg() {
  useEffect(() => {
    let cancelled = false;

    async function loadVisitCount() {
      const shouldRecordVisit = window.sessionStorage.getItem(VISIT_RECORDED_KEY) !== "true";
      if (shouldRecordVisit) {
        window.sessionStorage.setItem(VISIT_RECORDED_KEY, "true");
      }

      const response = await fetch(`${apiBaseUrl()}/visits`, {
        method: shouldRecordVisit ? "POST" : "GET",
        headers: shouldRecordVisit ? { "Content-Type": "application/json" } : undefined,
      });

      if (!response.ok) {
        throw new Error(`Visit counter failed with ${response.status}`);
      }

      const data = (await response.json()) as { count?: number };
      const count = Number(data.count);

      if (!cancelled && Number.isFinite(count)) {
        window.dispatchEvent(new CustomEvent("jianzhan:visit-count", { detail: { count, scope: "global" } }));
        printConsoleMessage(count);
      }
    }

    void loadVisitCount().catch(() => {
      if (!cancelled) {
        printConsoleMessage();
      }
    });

    return () => {
      cancelled = true;
    };
  }, []);

  return null;
}

function printConsoleMessage(count?: number) {
  console.log(
    "%c建站助手 · 隐藏控制台",
    "border-radius:8px;background:#409eff;color:#fff;font-size:16px;font-weight:800;padding:8px 12px;",
  );
  console.log(
    "%c%s",
    "color:#67c23a;font-weight:700;",
    typeof count === "number"
      ? `累计有 ${new Intl.NumberFormat("zh-CN").format(count)} 人访问，赶快构建属于你的自动网站吧。`
      : "累计访问人数正在连接中，赶快构建属于你的自动网站吧。",
  );
  console.log("%c留言箱已启动：联系方式会加密保存，不会公开展示。", "color:#9b6cff;font-weight:700;");
}
