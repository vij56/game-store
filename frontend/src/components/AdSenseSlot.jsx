import { useEffect, useMemo } from "react";

function normalizeClient(client) {
  if (!client) return "";
  return client.startsWith("ca-pub-") ? client : `ca-pub-${client}`;
}

function AdSenseSlot({
  slot,
  format = "auto",
  responsive = true,
  adClassName = "",
  fallbackClassName = "adsense-fallback",
}) {
  const rawClient = import.meta.env.VITE_ADSENSE_CLIENT;
  const client = useMemo(() => normalizeClient(rawClient), [rawClient]);
  const isConfigured = Boolean(client && slot);

  useEffect(() => {
    if (!isConfigured || typeof window === "undefined") return;

    if (!window.__adsenseScriptAdded) {
      const script = document.createElement("script");
      script.async = true;
      script.src = `https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${encodeURIComponent(client)}`;
      script.crossOrigin = "anonymous";
      document.head.appendChild(script);
      window.__adsenseScriptAdded = true;
    }
  }, [client, isConfigured]);

  useEffect(() => {
    if (!isConfigured || typeof window === "undefined") return;

    try {
      (window.adsbygoogle = window.adsbygoogle || []).push({});
    } catch (error) {
      console.error("AdSense failed to render:", error);
    }
  }, [isConfigured, slot]);

  if (!isConfigured) {
    return (
      <div className={fallbackClassName}>
        <p>Ad Space</p>
        <small>Add VITE_ADSENSE_CLIENT + slot IDs</small>
      </div>
    );
  }

  return (
    <ins
      className={`adsbygoogle ${adClassName}`.trim()}
      style={{ display: "block" }}
      data-ad-client={client}
      data-ad-slot={slot}
      data-ad-format={format}
      data-full-width-responsive={responsive ? "true" : "false"}
    />
  );
}

export default AdSenseSlot;
