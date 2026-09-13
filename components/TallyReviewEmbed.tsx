"use client";

import Script from "next/script";

declare global {
  interface Window {
    Tally?: { loadEmbeds: () => void };
  }
}

export function TallyReviewEmbed({ embedUrl }: { embedUrl: string }) {
  const loadEmbed = () => window.Tally?.loadEmbeds();

  return (
    <>
      <iframe
        data-tally-src={embedUrl}
        loading="lazy"
        width="100%"
        height="720"
        frameBorder="0"
        marginHeight={0}
        marginWidth={0}
        title="READ ME 후기 작성 폼"
        className="block min-h-[720px] w-full bg-[var(--paper)]"
      />
      <Script src="https://tally.so/widgets/embed.js" strategy="afterInteractive" onLoad={loadEmbed} onReady={loadEmbed} />
    </>
  );
}
