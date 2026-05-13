"use client";

import { useEffect } from "react";

const OPEN_COUNT_KEY = "jianzhan-assistant-open-count";

export function ConsoleEasterEgg() {
  useEffect(() => {
    const currentCount = Number(window.localStorage.getItem(OPEN_COUNT_KEY) ?? "0");
    const nextCount = Number.isFinite(currentCount) ? currentCount + 1 : 1;
    window.localStorage.setItem(OPEN_COUNT_KEY, String(nextCount));
    window.dispatchEvent(new CustomEvent("jianzhan:open-count", { detail: { count: nextCount } }));

    console.log(
      "%c建站助手 · 隐藏控制台",
      "border-radius:8px;background:#409eff;color:#fff;font-size:16px;font-weight:800;padding:8px 12px;",
    );
    console.log("%c你已经打开这个网站 %d 次。", "color:#67c23a;font-weight:700;", nextCount);
    console.log("%c留言箱已启动：联系方式会加密保存，不会公开展示。", "color:#9b6cff;font-weight:700;");
  }, []);

  return null;
}
