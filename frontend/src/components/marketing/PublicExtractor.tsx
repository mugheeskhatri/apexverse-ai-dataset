"use client";

import React, { useState } from "react";
import { I, Spin } from "@/components/Icons";

type ExtractResult = {
  title: string;
  collected_url: string;
  chunk_count: number;
  page_word_count: number;
  source_strategy: string;
  filename: string;
  download_url: string;
};

async function downloadExport(downloadUrl: string, fileName: string) {
  const response = await fetch(downloadUrl);
  if (!response.ok) {
    throw new Error("The JSON export could not be downloaded.");
  }

  const blob = await response.blob();
  const objectUrl = window.URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = objectUrl;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.URL.revokeObjectURL(objectUrl);
}

export function PublicExtractor() {
  const [url, setUrl] = useState("");
  const [testing, setTesting] = useState(false);
  const [error, setError] = useState("");
  const [lastExport, setLastExport] = useState<ExtractResult | null>(null);

  const handleExtract = async () => {
    setTesting(true);
    setError("");

    try {
      const response = await fetch("/api/public-extract", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ url }),
      });

      const payload = await response.json().catch(() => null);
      if (!response.ok || !payload?.ok) {
        throw new Error(payload?.detail ?? "Extraction failed.");
      }

      const nextExport: ExtractResult = {
        title: payload.summary.title,
        collected_url: payload.summary.collected_url,
        chunk_count: payload.summary.chunk_count,
        page_word_count: payload.summary.page_word_count,
        source_strategy: payload.summary.source_strategy,
        filename: payload.export.filename,
        download_url: payload.export.download_url,
      };
      setLastExport(nextExport);
    } catch (caughtError) {
      setError(caughtError instanceof Error ? caughtError.message : "Extraction failed.");
    } finally {
      setTesting(false);
    }
  };

  const handleRedownload = async () => {
    if (!lastExport) {
      return;
    }

    setTesting(true);
    setError("");
    try {
      await downloadExport(lastExport.download_url, lastExport.filename);
    } catch (caughtError) {
      setError(caughtError instanceof Error ? caughtError.message : "The export download failed.");
    } finally {
      setTesting(false);
    }
  };

  return (
    <div
      className="ch"
      style={{
        background: "white",
        borderRadius: 32,
        boxShadow: "var(--sh3)",
        border: "1px solid var(--border)",
        padding: "28px 24px 22px",
        maxWidth: 720,
        margin: "0 auto",
        width: "100%",
        textAlign: "left",
        position: "relative",
        zIndex: 1,
      }}
    >
      <div style={{ fontWeight: 700, fontSize: 16, marginBottom: 4 }}>Test website extraction on any public URL</div>
      <div style={{ color: "var(--text3)", fontSize: 15, marginBottom: 16 }}>
        Run a public extraction and download the structured output as JSON. Intended for evaluation use. Production deployments should use authentication and rate limiting.
      </div>
      <div style={{ display: "flex", gap: 0 }}>
        <input
          type="text"
          placeholder="https://docs.yourproduct.com"
          style={{
            flex: 1,
            fontSize: 15,
            padding: "10px 12px",
            border: "1.5px solid #ececec",
            borderRadius: "8px 0 0 8px",
            outline: "none",
            background: "#faf9f7",
            color: "var(--text)",
            fontWeight: 500,
            fontFamily: "inherit",
          }}
          value={url}
          onChange={(event) => setUrl(event.target.value)}
          disabled={testing}
        />
        <button
          type="button"
          onClick={() => void handleExtract()}
          style={{
            background: "var(--text)",
            color: "white",
            fontWeight: 700,
            fontSize: 15,
            border: "none",
            borderRadius: "0 8px 8px 0",
            padding: "0 18px",
            cursor: testing || !url ? "not-allowed" : "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            minHeight: 38,
            opacity: testing || !url ? 0.7 : 1,
          }}
          disabled={testing || !url}
        >
          {testing ? (
            <Spin s={16} />
          ) : (
            <>
              <span style={{ fontSize: 16, marginRight: 6 }}>⚡</span>
              Extract JSON
            </>
          )}
        </button>
      </div>

      {error ? (
        <div style={{ marginTop: 14, color: "#b42318", fontSize: 14, lineHeight: 1.6 }}>{error}</div>
      ) : null}

      {lastExport ? (
        <div
          className="result-card"
          style={{
            marginTop: 18,
            padding: "24px 20px 18px 20px",
            borderRadius: 20,
            background: "rgba(255,255,255,0.92)",
            border: "1.5px solid var(--border)",
            boxShadow: "0 8px 32px 0 rgba(31,38,135,0.10)",
            backdropFilter: "blur(10px)",
            WebkitBackdropFilter: "blur(10px)",
            display: "flex",
            flexDirection: "column",
            gap: 12,
            maxWidth: 600,
            marginLeft: "auto",
            marginRight: "auto",
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 12 }}>
            <div>
              <div style={{ fontWeight: 700, fontSize: 15, color: "var(--green)", marginBottom: 2 }}>Extraction completed</div>
              <div style={{ fontSize: 20, fontWeight: 800, fontFamily: 'var(--ffd)', marginBottom: 2 }}>
                {lastExport.title?.trim() || lastExport.collected_url?.trim() || (lastExport.collected_url ? new URL(lastExport.collected_url).hostname : "Unknown Source")}
              </div>
              <a href={lastExport.collected_url} target="_blank" rel="noopener noreferrer" style={{ color: "var(--brand)", fontSize: 14, textDecoration: "underline" }}>{lastExport.collected_url}</a>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 8, alignItems: "flex-end" }}>
              <button
                type="button"
                onClick={() => void handleRedownload()}
                className="btn btn-primary"
                disabled={testing}
                style={{ minHeight: 38, fontWeight: 700 }}
              >
                <I n="download" s={14} />
                <span style={{ marginLeft: 8 }}>Download JSON</span>
              </button>
              <button
                type="button"
                className="btn btn-secondary"
                style={{ minHeight: 32, fontSize: 14 }}
                onClick={async () => {
                  try {
                    await navigator.clipboard.writeText(lastExport.download_url);
                    alert('Link copied to clipboard!');
                  } catch {
                    alert('Failed to copy link.');
                  }
                }}
              >
                Copy Link
              </button>
              <button
                type="button"
                className="btn btn-ghost"
                style={{ minHeight: 32, fontSize: 14, marginTop: 8 }}
                onClick={() => {
                  setLastExport(null);
                  setUrl("");
                }}
              >
                Clear
              </button>
            </div>
          </div>
          <div style={{ display: "flex", gap: 18, margin: "10px 0 0 0", flexWrap: "wrap" }}>
            <div><strong>{lastExport.chunk_count}</strong><span style={{ color: 'var(--text3)', marginLeft: 4 }}>Chunks</span></div>
            <div><strong>{lastExport.page_word_count}</strong><span style={{ color: 'var(--text3)', marginLeft: 4 }}>Words</span></div>
            <div><strong>{lastExport.source_strategy}</strong><span style={{ color: 'var(--text3)', marginLeft: 4 }}>Method</span></div>
            <div><strong>{lastExport.filename?.endsWith('.json') ? 'JSON' : lastExport.filename?.split('.').pop()?.toUpperCase() || 'File'}</strong><span style={{ color: 'var(--text3)', marginLeft: 4 }}>Format</span></div>
            <div><strong>—</strong><span style={{ color: 'var(--text3)', marginLeft: 4 }}>File size</span></div>
            <div><strong>{new Date().toLocaleString()}</strong><span style={{ color: 'var(--text3)', marginLeft: 4 }}>Extracted</span></div>
          </div>
        </div>
      ) : null}

      <div style={{ marginTop: 14, fontSize: 14, color: "var(--text3)", lineHeight: 1.75 }}>
        Public test mode includes a single-page JSON export.<br />
        Paid plans add multi-page crawling, scheduled recrawls, chunk-level exports, team workspaces, and vector database delivery.
      </div>
    </div>
  );
}
