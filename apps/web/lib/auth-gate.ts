"use client";

import { getToken } from "./api";

type RouterLike = {
  push: (href: string) => void;
};

export function isSignedIn(): boolean {
  return Boolean(getToken());
}

export function loginUrl(nextPath?: string): string {
  const next = nextPath && nextPath.startsWith("/") ? nextPath : typeof window !== "undefined" ? `${window.location.pathname}${window.location.search}` : "/projects";
  return `/login?next=${encodeURIComponent(next)}`;
}

export function requireSignedIn(router: RouterLike, nextPath?: string): boolean {
  if (isSignedIn()) {
    return true;
  }

  router.push(loginUrl(nextPath));
  return false;
}
