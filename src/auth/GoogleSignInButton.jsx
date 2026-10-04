import { useEffect, useRef, useState } from "react";

const GIS_SRC = "https://accounts.google.com/gsi/client";

// Loads the Google Identity Services script once and shares it between renders
let gisPromise;
const loadGis = () => {
  if (window.google?.accounts?.id) return Promise.resolve();
  if (!gisPromise) {
    gisPromise = new Promise((resolve, reject) => {
      const script = document.createElement("script");
      script.src = GIS_SRC;
      script.async = true;
      script.defer = true;
      script.onload = resolve;
      script.onerror = () => {
        gisPromise = undefined;
        reject(new Error("Không tải được Google Sign-In"));
      };
      document.head.appendChild(script);
    });
  }
  return gisPromise;
};

// Official "Sign in with Google" button; onCredential receives the Google ID token
const GoogleSignInButton = ({ clientId, onCredential, onError, disabled }) => {
  const containerRef = useRef(null);
  const callbackRef = useRef(onCredential);
  const errorRef = useRef(onError);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    callbackRef.current = onCredential;
    errorRef.current = onError;
  }, [onCredential, onError]);

  useEffect(() => {
    let cancelled = false;
    loadGis()
      .then(() => {
        if (cancelled || !containerRef.current) return;
        window.google.accounts.id.initialize({
          client_id: clientId,
          callback: (response) => callbackRef.current?.(response.credential),
          ux_mode: "popup",
          hd: "fpt.edu.vn",
        });
        window.google.accounts.id.renderButton(containerRef.current, {
          type: "standard",
          theme: "outline",
          size: "large",
          shape: "pill",
          text: "signin_with",
          logo_alignment: "center",
          locale: "vi",
          width: Math.min(containerRef.current.offsetWidth || 400, 400),
        });
        setReady(true);
      })
      .catch((err) => errorRef.current?.(err.message));
    return () => {
      cancelled = true;
    };
  }, [clientId]);

  return (
    <div className={`relative flex justify-center ${disabled ? "pointer-events-none opacity-50" : ""}`}>
      <div ref={containerRef} className="w-full flex justify-center min-h-[44px]" />
      {!ready && (
        <span className="absolute inset-0 flex items-center justify-center text-xs text-[#9E958C]">
          Đang tải Google...
        </span>
      )}
    </div>
  );
};

export default GoogleSignInButton;
