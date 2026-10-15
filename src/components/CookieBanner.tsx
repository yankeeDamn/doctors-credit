"use client";

import { useEffect, useRef, useState } from "react";
import { useLanguage } from "@/components/LanguageProvider";

const KEY = "dc-cookie";

export default function CookieBanner() {
  const { t } = useLanguage();
  const [on, setOn] = useState(false);
  const [leaving, setLeaving] = useState(false);
  const timer = useRef<number | undefined>(undefined);

  useEffect(() => {
    // Storage can throw (blocked cookies, some private windows). Then the banner simply shows
    // every visit instead of the page failing to render.
    try {
      setOn(!window.localStorage.getItem(KEY));
    } catch {
      setOn(true);
    }
    return () => window.clearTimeout(timer.current);
  }, []);

  if (!on) return null;

  const accept = () => {
    try {
      window.localStorage.setItem(KEY, "1");
    } catch {
      // Not saved; it will show again next visit.
    }
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setOn(false);
      return;
    }
    setLeaving(true);
    timer.current = window.setTimeout(() => setOn(false), 220);
  };

  return (
    <div className={leaving ? "cookie is-leaving" : "cookie"} role="dialog" aria-label={t.cookie.aria}>
      <p>{t.cookie.text}</p>
      <button type="button" onClick={accept} disabled={leaving}>
        {t.cookie.button}
      </button>
    </div>
  );
}
