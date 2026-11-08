import { supportLink } from "@/lib/support";

function WhatsAppIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className={className} fill="currentColor">
      <path d="M17.47 14.38c-.3-.15-1.76-.87-2.03-.97-.27-.1-.47-.15-.67.15-.2.3-.77.97-.94 1.17-.17.2-.35.22-.65.07-.3-.15-1.26-.46-2.4-1.48-.89-.79-1.49-1.77-1.66-2.07-.17-.3-.02-.46.13-.61.13-.13.3-.35.45-.52.15-.17.2-.3.3-.5.1-.2.05-.37-.02-.52-.08-.15-.67-1.62-.92-2.22-.24-.58-.49-.5-.67-.51h-.57c-.2 0-.52.07-.8.37-.27.3-1.04 1.02-1.04 2.48s1.07 2.88 1.21 3.08c.15.2 2.1 3.2 5.08 4.49.71.31 1.26.49 1.7.63.71.23 1.36.2 1.87.12.57-.08 1.76-.72 2-1.41.25-.7.25-1.29.17-1.41-.07-.13-.27-.2-.57-.35M12.05 21.5h-.01a9.4 9.4 0 0 1-4.8-1.32l-.34-.2-3.56.93.95-3.47-.23-.36a9.4 9.4 0 0 1-1.44-5.02c0-5.2 4.23-9.43 9.44-9.43a9.4 9.4 0 0 1 9.43 9.44c0 5.2-4.23 9.43-9.44 9.43m8.03-17.46A11.3 11.3 0 0 0 12.05.7C5.78.7.68 5.8.67 12.07c0 2 .52 3.96 1.52 5.69L.57 23.7l6.08-1.6a11.3 11.3 0 0 0 5.4 1.38h.01c6.27 0 11.37-5.1 11.38-11.37a11.3 11.3 0 0 0-3.36-8.05" />
    </svg>
  );
}

export { WhatsAppIcon };

/** Botão flutuante de atendimento. Só aparece quando o número oficial está configurado. */
export function SupportButton() {
  const href = supportLink();
  if (!href) return null;
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Falar com o atendimento pelo WhatsApp"
      title="Atendimento pelo WhatsApp"
      className="whatsapp-pulse fixed bottom-24 right-4 z-30 flex h-14 w-14 items-center justify-center rounded-full bg-whatsapp text-whatsapp-foreground shadow-soft transition-transform hover:scale-105 lg:bottom-6 lg:right-6"
    >
      <WhatsAppIcon className="h-7 w-7" />
    </a>
  );
}
