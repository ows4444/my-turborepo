"use client";

import Script from "next/script";

type Props = {
  src: string;
  nonce: string | undefined;
  strategy?: "beforeInteractive" | "afterInteractive" | "lazyOnload";
};

export function ExternalScript({ src, nonce, strategy = "afterInteractive" }: Readonly<Props>) {
  return <Script src={src} nonce={nonce ?? undefined} strategy={strategy} />;
}
