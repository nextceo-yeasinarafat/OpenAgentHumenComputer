import { useCallback, useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { HugeiconsIcon } from "@hugeicons/react";
import Copy01Icon from "@hugeicons/core-free-icons/Copy01Icon";

import { copyText } from "./settings_clipboard.ts";
import { fetchApiToken } from "./settings_api_token.ts";



const API_BASE_URL = "http://127.0.0.1:7071";


function CopyIconButton({
  copied,
  label,
  onCopy,
}: {
  copied: boolean;
  label: string;
  onCopy: () => void;
}) {
  return (
    <motion.button
      type="button"
      className="oc-api__icon"
      data-copied={copied}
      aria-label={copied ? "Copied" : label}
      title={copied ? "Copied" : label}
      whileTap={{ scale: 0.92 }}
      onClick={onCopy}
    >
      <AnimatePresence mode="wait" initial={false}>
        {copied ? (
          <motion.span
            key="copied"
            style={{ display: "grid", placeItems: "center" }}
            initial={{ opacity: 0, scale: 0.7 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.7 }}
            transition={{ duration: 0.14, ease: "easeOut" }}
          >
            <svg className="oc-api__check" viewBox="0 0 12 12" fill="none" aria-hidden="true">
              <path
                d="M2 6.5 4.8 9.2 10 3.4"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </motion.span>
        ) : (
          <motion.span
            key="copy"
            style={{ display: "grid", placeItems: "center" }}
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            transition={{ duration: 0.14, ease: "easeOut" }}
          >
            <HugeiconsIcon icon={Copy01Icon} size={16} color="currentColor" />
          </motion.span>
        )}
      </AnimatePresence>
    </motion.button>
  );
}

export default function SettingsApiToken() {
  const [token, setToken] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(0);
  const [urlCopied, setUrlCopied] = useState(0);
  const copiedTimer = useRef<number | null>(null);
  const urlCopiedTimer = useRef<number | null>(null);

  useEffect(() => {
    let live = true;
    fetchApiToken()
      .then((word) => live && setToken(word))
      .catch((cause) => live && setError(String(cause)));
    return () => {
      live = false;
    };
  }, []);

  useEffect(() => {
    return () => {
      if (copiedTimer.current !== null) window.clearTimeout(copiedTimer.current);
      if (urlCopiedTimer.current !== null) window.clearTimeout(urlCopiedTimer.current);
    };
  }, []);

  const copyToken = useCallback(async () => {
    if (!(await copyText(token))) return;
    setCopied((count) => count + 1);
    if (copiedTimer.current !== null) window.clearTimeout(copiedTimer.current);
    copiedTimer.current = window.setTimeout(() => setCopied(0), 1600);
  }, [token]);

  const copyBaseUrl = useCallback(async () => {
    if (!(await copyText(API_BASE_URL))) return;
    setUrlCopied((count) => count + 1);
    if (urlCopiedTimer.current !== null) window.clearTimeout(urlCopiedTimer.current);
    urlCopiedTimer.current = window.setTimeout(() => setUrlCopied(0), 1600);
  }, []);

  return (
    <>
      <style>{`
        .oc-api {
          padding: 18px 20px;
          border: 1px solid #26282C;
          border-radius: 0;
          background: #0E0E0E;
          box-shadow: none;
        }

        .oc-api__label {
          display: block;
          margin-bottom: 5px;
          color: #9A968E;
          font-family: ui-monospace, "SF Mono", Menlo, Consolas, monospace;
          font-size: 10px;
          letter-spacing: 0.14em;
          text-transform: uppercase;
        }

        .oc-api__field + .oc-api__label {
          margin-top: 16px;
        }

        .oc-api__field {
          position: relative;
          display: flex;
          align-items: center;
        }

        .oc-api__input {
          width: 100%;
          height: 34px;
          box-sizing: border-box;
          padding: 0 40px 0 10px;
          border: 1px solid #26282C;
          border-radius: 0;
          background: #212121;
          color: #ECEAE5;
          font-family: ui-monospace, "SF Mono", Menlo, Consolas, monospace;
          font-size: 13px;
          outline: none;
          color-scheme: dark;
          transition: border-color 150ms ease;
        }

        .oc-api__input--icons2 {
          padding-right: 72px;
        }

        .oc-api__input:focus {
          border-color: #D6E2F0;
        }

        .oc-api__icons {
          position: absolute;
          top: 50%;
          right: 3px;
          display: flex;
          align-items: center;
          gap: 2px;
          transform: translateY(-50%);
        }

        .oc-api__icon {
          display: grid;
          place-items: center;
          width: 28px;
          height: 28px;
          padding: 0;
          border: 0;
          border-radius: 0;
          background: transparent;
          color: #9A968E;
          cursor: default;
          transition:
            background 120ms ease,
            color 120ms ease;
        }

        .oc-api__icon:hover {
          background: #212121;
          color: #ECEAE5;
        }

        .oc-api__icon[data-copied="true"] {
          color: #30D158;
        }

        .oc-api__icon:focus-visible,
        .oc-api__input:focus-visible {
          outline: 1px solid #D6E2F0;
          outline-offset: 2px;
        }

        .oc-api__check {
          width: 12px;
          height: 12px;
        }
      `}</style>

      <div className="oc-settings__card oc-api">
        <span className="oc-api__label">API Token</span>
        <div className="oc-api__field">
          <input
            className="oc-api__input oc-api__input--icons2"
            type="password"
            value={token}
            readOnly
            spellCheck={false}
            aria-label="the agent api token"
          />
          <div className="oc-api__icons">
            <CopyIconButton
              copied={copied > 0}
              label="Copy the token"
              onCopy={() => void copyToken()}
            />
          </div>
        </div>

        <span className="oc-api__label">Base URL</span>
        <div className="oc-api__field">
          <input
            className="oc-api__input"
            type="text"
            value={API_BASE_URL}
            readOnly
            spellCheck={false}
            aria-label="the api base url"
          />
          <div className="oc-api__icons">
            <CopyIconButton
              copied={urlCopied > 0}
              label="Copy the base url"
              onCopy={() => void copyBaseUrl()}
            />
          </div>
        </div>

        {error ? <div className="oc-settings__card-error">{error}</div> : null}
      </div>
    </>
  );
}
