// lucide-react deliberately ships no brand/logo icons, so these three are
// hand-drawn (standard, widely-reused glyph shapes — not exact logo
// reproductions) to match the size/currentColor conventions of every other
// icon in this codebase.
import type { SVGProps } from "react";

export function FacebookIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" {...props}>
      <path d="M22 12.06C22 6.5 17.52 2 12 2S2 6.5 2 12.06c0 5 3.66 9.15 8.44 9.94v-7.03H7.9v-2.91h2.54V9.41c0-2.51 1.49-3.89 3.77-3.89 1.09 0 2.24.2 2.24.2v2.47h-1.26c-1.24 0-1.63.78-1.63 1.58v1.89h2.78l-.44 2.91h-2.34v7.03C18.34 21.21 22 17.06 22 12.06Z" />
    </svg>
  );
}

export function InstagramIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <rect width="20" height="20" x="2" y="2" rx="5" />
      <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37Z" />
      <line x1="17.5" x2="17.51" y1="6.5" y2="6.5" />
    </svg>
  );
}

export function WhatsappIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" {...props}>
      <path d="M17.6 6.32A8.86 8.86 0 0 0 12.05 4a8.94 8.94 0 0 0-7.75 13.4L3 21l3.72-1.24a8.9 8.9 0 0 0 4.32 1.1h.01a8.94 8.94 0 0 0 8.9-8.94 8.87 8.87 0 0 0-2.35-5.6ZM12.05 19.2a7.4 7.4 0 0 1-3.77-1.03l-.27-.16-2.8.93.94-2.72-.18-.28a7.4 7.4 0 0 1 6.08-11.4 7.34 7.34 0 0 1 5.22 2.16 7.32 7.32 0 0 1 2.16 5.2 7.4 7.4 0 0 1-7.38 7.3Zm4.06-5.53c-.22-.11-1.3-.64-1.5-.72-.2-.07-.35-.11-.5.11-.15.22-.57.72-.7.87-.13.15-.26.16-.48.05-.22-.1-.94-.35-1.79-1.1-.66-.59-1.1-1.32-1.23-1.54-.13-.22-.01-.34.1-.45.11-.11.25-.29.37-.43.12-.15.16-.25.24-.42.08-.16.04-.3-.03-.42-.07-.11-.6-1.45-.82-1.98-.22-.53-.44-.46-.6-.47h-.5c-.17 0-.44.06-.68.31-.24.25-.9.88-.9 2.14 0 1.27.92 2.5 1.05 2.67.13.17 1.77 2.72 4.3 3.7 2.52.98 2.52.65 2.98.61.45-.04 1.44-.59 1.65-1.16.2-.57.2-1.06.14-1.16-.06-.11-.22-.17-.44-.28Z" />
    </svg>
  );
}
