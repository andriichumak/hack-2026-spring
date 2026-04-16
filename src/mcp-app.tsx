import type { App, McpUiHostContext } from "@modelcontextprotocol/ext-apps";
import { useApp } from "@modelcontextprotocol/ext-apps/react";
import type { CallToolResult } from "@modelcontextprotocol/sdk/types.js";
import { StrictMode, useEffect, useState } from "react";
import { createRoot } from "react-dom/client";
import styles from "./mcp-app.module.css";

function extractVisualizationId(result: CallToolResult): string {
  const textContent = result.content?.find((c) => c.type === "text");
  if (!textContent || textContent.type !== "text") return "unknown";
  try {
    const data = JSON.parse(textContent.text);
    return data.visualizationId ?? "unknown";
  } catch {
    return "unknown";
  }
}

function VisualizationApp() {
  const [toolResult, setToolResult] = useState<CallToolResult | null>(null);
  const [hostContext, setHostContext] = useState<McpUiHostContext | undefined>();

  const { app, error } = useApp({
    appInfo: { name: "Visualization App", version: "1.0.0" },
    capabilities: {},
    onAppCreated: (app) => {
      app.onteardown = async () => ({ });

      app.ontoolinput = async (input) => {
        console.info("Received tool input:", input);
      };

      app.ontoolresult = async (result) => {
        console.info("Received tool result:", result);
        setToolResult(result);
      };

      app.ontoolcancelled = (params) => {
        console.info("Tool call cancelled:", params.reason);
      };

      app.onerror = console.error;

      app.onhostcontextchanged = (params) => {
        setHostContext((prev) => ({ ...prev, ...params }));
      };
    },
  });

  useEffect(() => {
    if (app) {
      setHostContext(app.getHostContext());
    }
  }, [app]);

  if (error) return <div className={styles.error}>Error: {error.message}</div>;
  if (!app) return <div className={styles.loading}>Connecting...</div>;

  return (
    <VisualizationView
      app={app}
      toolResult={toolResult}
      hostContext={hostContext}
    />
  );
}

interface VisualizationViewProps {
  app: App;
  toolResult: CallToolResult | null;
  hostContext?: McpUiHostContext;
}

function VisualizationView({ toolResult, hostContext }: VisualizationViewProps) {
  const visualizationId = toolResult
    ? extractVisualizationId(toolResult)
    : null;

  return (
    <main
      className={styles.container}
      style={{
        paddingTop: hostContext?.safeAreaInsets?.top,
        paddingRight: hostContext?.safeAreaInsets?.right,
        paddingBottom: hostContext?.safeAreaInsets?.bottom,
        paddingLeft: hostContext?.safeAreaInsets?.left,
      }}
    >
      <div className={styles.card}>
        <div className={styles.header}>
          <span className={styles.title}>Visualization</span>
          {visualizationId && (
            <code className={styles.vizId}>{visualizationId}</code>
          )}
        </div>
        <div className={styles.placeholder}>
          <svg
            className={styles.placeholderIcon}
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <rect x="3" y="3" width="7" height="9" rx="1" />
            <rect x="14" y="3" width="7" height="5" rx="1" />
            <rect x="14" y="12" width="7" height="9" rx="1" />
            <rect x="3" y="16" width="7" height="5" rx="1" />
          </svg>
          <span className={styles.placeholderText}>
            {visualizationId
              ? `Visualization "${visualizationId}" will render here.`
              : "Waiting for visualization data..."}
          </span>
        </div>
      </div>
    </main>
  );
}

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <VisualizationApp />
  </StrictMode>,
);
