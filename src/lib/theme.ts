import { useEffect, useState } from "react";

export type ThemeMode = "claro" | "escuro" | "automatico";
const KEY = "alugapratico:tema";

export function readTheme(): ThemeMode {
  try {
    const v = localStorage.getItem(KEY);
    if (v === "claro" || v === "escuro" || v === "automatico") return v;
  } catch { /* indisponível */ }
  return "claro";
}

export function applyTheme(mode: ThemeMode) {
  const dark = mode === "escuro" || (mode === "automatico" && window.matchMedia("(prefers-color-scheme: dark)").matches);
  document.documentElement.classList.toggle("dark", dark);
  document.documentElement.style.colorScheme = dark ? "dark" : "light";
}

/** Script inline para aplicar o tema antes da página aparecer (evita piscar em branco). */
export const THEME_BOOT_SCRIPT = `(function(){try{var m=localStorage.getItem("${KEY}")||"claro";var d=m==="escuro"||(m==="automatico"&&matchMedia("(prefers-color-scheme: dark)").matches);if(d){document.documentElement.classList.add("dark");document.documentElement.style.colorScheme="dark";}}catch(e){}})();`;

/** Tema atual + alteração; o modo automático acompanha o aparelho em tempo real. */
export function useTheme() {
  const [mode, setMode] = useState<ThemeMode>("claro");
  useEffect(() => { setMode(readTheme()); }, []);
  useEffect(() => {
    applyTheme(mode);
    if (mode !== "automatico") return;
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    const on = () => applyTheme("automatico");
    mq.addEventListener("change", on);
    return () => mq.removeEventListener("change", on);
  }, [mode]);
  const set = (m: ThemeMode) => {
    try { localStorage.setItem(KEY, m); } catch { /* indisponível */ }
    setMode(m);
  };
  return { mode, setMode: set };
}

/** Mantém o modo automático sincronizado em todas as páginas. */
export function useThemeSync() {
  useEffect(() => {
    applyTheme(readTheme());
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    const on = () => { if (readTheme() === "automatico") applyTheme("automatico"); };
    mq.addEventListener("change", on);
    return () => mq.removeEventListener("change", on);
  }, []);
}
