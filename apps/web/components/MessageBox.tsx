"use client";

import { EyeOff, Loader2, MessageSquareText, Send, Sparkles, X } from "lucide-react";
import { type FormEvent, useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { Button } from "@/components/Button";
import { apiFetch, type GuestMessage } from "@/lib/api";

const fallbackMessages: GuestMessage[] = [
  {
    id: "fallback-1",
    content: "欢迎把想上线的站点、卡住的部署问题，或者产品建议丢到这里。",
    hasContact: false,
    createdAt: "2026-05-13T00:00:00.000Z",
  },
  {
    id: "fallback-2",
    content: "如果留下联系方式，页面只显示已隐藏，真实联系方式不会公开展示。",
    hasContact: true,
    createdAt: "2026-05-13T00:00:00.000Z",
  },
];

export function MessageBox() {
  const [messages, setMessages] = useState<GuestMessage[]>(fallbackMessages);
  const [open, setOpen] = useState(false);
  const [content, setContent] = useState("");
  const [contact, setContact] = useState("");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    let active = true;

    async function loadMessages() {
      setLoading(true);
      try {
        const data = await apiFetch<{ messages: GuestMessage[] }>("/messages?limit=20");
        if (!active) {
          return;
        }
        setMessages(data.messages.length > 0 ? data.messages : fallbackMessages);
        setError("");
      } catch {
        if (active) {
          setMessages(fallbackMessages);
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    void loadMessages();
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    setMounted(true);
  }, []);

  const tickerMessages = useMemo(() => {
    const ordered = [...messages].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    return ordered.length > 1 ? [...ordered, ...ordered] : ordered;
  }, [messages]);

  function submitForm(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    void submitMessage();
  }

  async function submitMessage() {
    setError("");
    setNotice("");

    if (content.trim().length < 2) {
      setError("留言至少需要 2 个字。");
      return;
    }

    setSubmitting(true);
    try {
      const data = await apiFetch<{ message: GuestMessage }>("/messages", {
        method: "POST",
        body: { content, contact },
      });
      setMessages((current) => [data.message, ...current.filter((message) => !message.id.startsWith("fallback-"))]);
      setContent("");
      setContact("");
      setOpen(false);
      setNotice("留言已收到。联系方式如果填写了，会只在后台加密保存。");
    } catch (err) {
      setError(err instanceof Error ? err.message : "留言失败，请稍后再试。");
    } finally {
      setSubmitting(false);
    }
  }

  const modal = (
    <div className="fixed inset-0 z-50 grid place-items-center bg-slate-950/24 p-4 backdrop-blur-sm" role="dialog" aria-modal="true" aria-label="留言箱">
      <form onSubmit={submitForm} className="w-full max-w-lg rounded-lg border border-white/78 bg-white/92 p-5 shadow-[0_28px_90px_rgba(15,23,42,0.18)] backdrop-blur-2xl">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h3 className="text-lg font-black tracking-[0] text-slate-950">写一条留言</h3>
            <p className="mt-1 text-sm text-slate-500">联系方式不必填，填写后不会公开展示。</p>
          </div>
          <button
            type="button"
            aria-label="关闭留言箱"
            className="ios-touch grid h-9 w-9 place-items-center rounded-lg border border-slate-200 bg-white text-slate-500 hover:text-slate-950"
            onClick={() => setOpen(false)}
          >
            <X size={17} />
          </button>
        </div>

        <label className="mt-5 block text-sm font-semibold text-slate-700">
          留言内容
          <textarea
            value={content}
            onChange={(event) => setContent(event.target.value)}
            maxLength={300}
            className="ios-input ios-textarea mt-2 h-32 resize-none"
            placeholder="想上线什么项目？遇到了什么部署问题？"
          />
        </label>

        <label className="mt-4 block text-sm font-semibold text-slate-700">
          联系方式
          <input
            value={contact}
            onChange={(event) => setContact(event.target.value)}
            maxLength={120}
            className="ios-input mt-2"
            placeholder="邮箱 / 微信 / 电话，选填"
          />
        </label>

        <div className="mt-3 flex items-center gap-2 rounded-lg border border-[#d9ecff] bg-[#ecf5ff]/78 px-3 py-2 text-xs font-semibold text-[#337ecc]">
          <EyeOff size={15} />
          填写联系方式后，留言窗口只展示“联系方式已隐藏”。
        </div>

        {error ? <div className="mt-4 rounded-lg border border-[#fde2e2] bg-[#fef0f0] px-3 py-2 text-sm text-[#f56c6c]">{error}</div> : null}

        <div className="mt-5 flex justify-end gap-2">
          <button
            type="button"
            className="ios-touch inline-flex h-10 items-center justify-center rounded-lg border border-white/70 bg-white/70 px-4 text-sm font-semibold text-slate-900 shadow-[0_10px_24px_rgba(31,41,55,0.06)] backdrop-blur-xl hover:bg-white"
            onClick={() => setOpen(false)}
          >
            取消
          </button>
          <button
            type="button"
            className="ios-touch inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-[#409eff] px-4 text-sm font-semibold text-white shadow-[0_12px_28px_rgba(64,158,255,0.24)] hover:bg-[#337ecc] disabled:cursor-not-allowed disabled:opacity-55 disabled:hover:translate-y-0"
            disabled={submitting}
            onClick={() => void submitMessage()}
          >
            {submitting ? <Loader2 className="animate-spin" size={16} /> : <Send size={16} />}
            {submitting ? "提交中" : "提交留言"}
          </button>
        </div>
      </form>
    </div>
  );

  return (
    <section className="message-box-panel liquid-panel-strong rounded-lg p-5">
      <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_380px] xl:items-center">
        <div className="min-w-0">
          <div className="inline-flex items-center gap-2 rounded-full border border-[#d9ecff] bg-[#ecf5ff]/90 px-3 py-1 text-xs font-semibold text-[#409eff]">
            <MessageSquareText size={14} />
            留言箱
          </div>
          <h2 className="mt-3 text-xl font-black tracking-[0] text-slate-950">把建站想法和问题留在这里</h2>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">
            联系方式可选；填写后只会显示“联系方式已隐藏”，不会在页面公开。
          </p>
          <div className="mt-4 flex flex-wrap items-center gap-2">
            <Button type="button" icon={<Send size={16} />} onClick={() => setOpen(true)}>
              写留言
            </Button>
            {notice ? <span className="rounded-full border border-[#e1f3d8] bg-[#f0f9eb] px-3 py-1 text-xs font-semibold text-[#67c23a]">{notice}</span> : null}
          </div>
        </div>

        <div className="rounded-lg border border-white/72 bg-white/68 p-3 shadow-[0_16px_38px_rgba(64,158,255,0.1)] backdrop-blur-xl">
          <div className="mb-2 flex items-center justify-between text-xs font-semibold text-slate-500">
            <span className="inline-flex items-center gap-1 text-[#9b6cff]">
              <Sparkles size={14} />
              最新留言
            </span>
            <span>{loading ? "加载中" : `${messages.length} 条`}</span>
          </div>
          <div className="message-ticker h-40 overflow-hidden rounded-lg border border-[#eef2ff] bg-gradient-to-br from-white via-[#fbfdff] to-[#ecf5ff]/72">
            <div className={tickerMessages.length > messages.length ? "message-ticker-track p-3" : "p-3"}>
              {tickerMessages.map((message, index) => (
                <MessageItem key={`${message.id}-${index}`} message={message} />
              ))}
            </div>
          </div>
        </div>
      </div>

      {error ? <div className="mt-4 rounded-lg border border-[#fde2e2] bg-[#fef0f0] px-3 py-2 text-sm text-[#f56c6c]">{error}</div> : null}

      {open && mounted ? createPortal(modal, document.body) : null}
    </section>
  );
}

function MessageItem({ message }: { message: GuestMessage }) {
  return (
    <div className="mb-3 rounded-lg border border-white/78 bg-white/84 px-3 py-2 shadow-[0_8px_20px_rgba(31,41,55,0.04)]">
      <p className="line-clamp-2 text-sm font-medium leading-5 text-slate-700">{message.content}</p>
      <div className="mt-2 flex flex-wrap items-center justify-between gap-2 text-xs text-slate-400">
        <span>{formatMessageTime(message.createdAt)}</span>
        {message.hasContact ? (
          <span className="inline-flex items-center gap-1 rounded-full border border-[#ebe0ff] bg-[#f4f0ff] px-2 py-0.5 font-semibold text-[#9b6cff]">
            <EyeOff size={12} />
            联系方式已隐藏
          </span>
        ) : null}
      </div>
    </div>
  );
}

function formatMessageTime(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return "刚刚";
  }

  return date.toLocaleDateString("zh-CN", {
    month: "2-digit",
    day: "2-digit",
  });
}
