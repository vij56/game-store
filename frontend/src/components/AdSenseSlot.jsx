import { useEffect, useMemo, useRef, useState } from "react";

function normalizeClient(client) {
  if (!client) return "";
  return client.startsWith("ca-pub-") ? client : `ca-pub-${client}`;
}

function loadAdsenseScript(client) {
  if (typeof window === "undefined") return Promise.resolve();
  if (window.adsbygoogle) return Promise.resolve();

  if (window.__adsenseScriptPromise) {
    return window.__adsenseScriptPromise;
  }

  window.__adsenseScriptPromise = new Promise((resolve, reject) => {
    const existingScript = document.querySelector(
      "script[data-adsense-script='true']",
    );

    if (existingScript) {
      existingScript.addEventListener("load", () => resolve(), { once: true });
      existingScript.addEventListener(
        "error",
        () => reject(new Error("AdSense script failed to load")),
        {
          once: true,
        },
      );
      return;
    }

    const script = document.createElement("script");
    script.async = true;
    script.src = `https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${encodeURIComponent(client)}`;
    script.crossOrigin = "anonymous";
    script.dataset.adsenseScript = "true";
    script.onload = () => resolve();
    script.onerror = () => reject(new Error("AdSense script failed to load"));
    document.head.appendChild(script);
  });

  return window.__adsenseScriptPromise;
}

function AdSenseSlot({
  slot,
  format = "auto",
  responsive = true,
  adClassName = "",
  fallbackClassName = "adsense-fallback",
}) {
  const rawClient = import.meta.env.VITE_ADSENSE_CLIENT;
  const isDev = import.meta.env.DEV;
  const client = useMemo(() => normalizeClient(rawClient), [rawClient]);
  const isConfigured = Boolean(client && slot);
  const adRef = useRef(null);
  const [isUnavailable, setIsUnavailable] = useState(false);
  const unavailableTimerRef = useRef(null);
  const observerRef = useRef(null);

  useEffect(() => {
    if (!isConfigured || typeof window === "undefined") return;
    setIsUnavailable(false);

    let isCancelled = false;

    const renderAd = async () => {
      try {
        await loadAdsenseScript(client);
        if (isCancelled || !adRef.current) return;

        // Avoid pushing an already initialized slot.
        if (adRef.current.getAttribute("data-adsbygoogle-status")) return;

        (window.adsbygoogle = window.adsbygoogle || []).push({});

        const updateAvailability = () => {
          if (!adRef.current) return;

          const adStatus = adRef.current.getAttribute("data-ad-status");
          const slotStatus = adRef.current.getAttribute(
            "data-adsbygoogle-status",
          );

          if (adStatus === "unfilled") {
            setIsUnavailable(true);
            return;
          }

          if (adStatus === "filled") {
            setIsUnavailable(false);
            return;
          }

          if (slotStatus === "done" && adStatus !== "filled") {
            setIsUnavailable(true);
          }
        };

        observerRef.current = new MutationObserver(updateAvailability);
        observerRef.current.observe(adRef.current, {
          attributes: true,
          attributeFilter: ["data-ad-status", "data-adsbygoogle-status"],
        });

        unavailableTimerRef.current = setTimeout(() => {
          if (isCancelled || !adRef.current) return;
          const adStatus = adRef.current.getAttribute("data-ad-status");
          if (!adStatus || adStatus === "unfilled") {
            setIsUnavailable(true);
          }
        }, 4000);
      } catch (error) {
        if (!isCancelled) {
          console.error("AdSense failed to render:", error);
          setIsUnavailable(true);
        }
      }
    };

    renderAd();

    return () => {
      isCancelled = true;
      if (unavailableTimerRef.current) {
        clearTimeout(unavailableTimerRef.current);
      }
      if (observerRef.current) {
        observerRef.current.disconnect();
      }
    };
  }, [client, isConfigured, slot]);

  if (!isConfigured) {
    return (
      <div className={fallbackClassName}>
        <p>Ad Space</p>
        <small>Add VITE_ADSENSE_CLIENT + slot IDs</small>
      </div>
    );
  }

  if (isUnavailable) {
    return (
      <div className={fallbackClassName}>
        <p>Ad Unavailable</p>
        <small>
          {isDev
            ? "No fill in local or blocked by extension"
            : "Ad network has no fill right now"}
        </small>
      </div>
    );
  }

  return (
    <ins
      ref={adRef}
      className={`adsbygoogle ${adClassName}`.trim()}
      style={{ display: "block" }}
      data-ad-client={client}
      data-ad-slot={slot}
      data-ad-format={format}
      data-full-width-responsive={responsive ? "true" : "false"}
      data-adtest={isDev ? "on" : undefined}
    />
  );
}

export default AdSenseSlot;
