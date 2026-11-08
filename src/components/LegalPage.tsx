import type { ReactNode } from "react";
import { Link } from "@tanstack/react-router";
import { ArrowLeft } from "lucide-react";

export function LegalPage({ title, updated, children }: { title: string; updated: string; children: ReactNode }) {
  return (
    <div className="min-h-screen bg-background px-4 py-8 sm:py-12">
      <div className="mx-auto max-w-3xl">
        <Link to="/entrar" className="mb-6 inline-flex items-center gap-2 text-base font-bold text-primary hover:underline"><ArrowLeft className="h-4 w-4" /> Voltar</Link>
        <article className="rounded-3xl border border-border bg-card p-6 shadow-soft sm:p-10">
          <div className="mb-6 flex items-center gap-3">
            <img src="/alugapratico.png" alt="" className="h-12 w-12 rounded-xl" />
            <span className="font-display text-xl font-extrabold text-foreground">Aluga<span className="text-primary">Pratico</span></span>
          </div>
          <h1 className="text-3xl font-extrabold text-foreground">{title}</h1>
          <p className="mt-1 text-sm text-muted-foreground">Atualizado em {updated}</p>
          <div className="mt-6 space-y-5 text-base leading-relaxed text-foreground [&_h2]:mt-8 [&_h2]:text-xl [&_h2]:font-bold [&_ul]:list-disc [&_ul]:space-y-1 [&_ul]:pl-6">{children}</div>
        </article>
      </div>
    </div>
  );
}
