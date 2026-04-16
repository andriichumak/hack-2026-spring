import type { App, McpUiHostContext } from "@modelcontextprotocol/ext-apps";
import { useApp } from "@modelcontextprotocol/ext-apps/react";
import type { CallToolResult } from "@modelcontextprotocol/sdk/types.js";
import { StrictMode, useCallback, useEffect, useState } from "react";
import { createRoot } from "react-dom/client";
import styles from "./mcp-app.module.css";

type ToolData =
  | { tool: "show-visualization"; visualizationId: string }
  | { tool: "show-kda"; kdaId: string };

function parseToolData(result: CallToolResult): ToolData | null {
  const textContent = result.content?.find((c) => c.type === "text");
  if (!textContent || textContent.type !== "text") return null;
  try {
    return JSON.parse(textContent.text) as ToolData;
  } catch {
    return null;
  }
}

function AnalyticsApp() {
  const [toolData, setToolData] = useState<ToolData | null>(null);
  const [hostContext, setHostContext] = useState<McpUiHostContext | undefined>();

  const { app, error } = useApp({
    appInfo: { name: "Analytics App", version: "1.0.0" },
    capabilities: {},
    onAppCreated: (app) => {
      app.onteardown = async () => ({});

      app.ontoolinput = async (input) => {
        console.info("Received tool input:", input);
      };

      app.ontoolresult = async (result) => {
        console.info("Received tool result:", result);
        const data = parseToolData(result);
        if (data) setToolData(data);
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

  return <AppRouter app={app} toolData={toolData} hostContext={hostContext} />;
}

interface AppRouterProps {
  app: App;
  toolData: ToolData | null;
  hostContext?: McpUiHostContext;
}

function AppRouter({ app, toolData, hostContext }: AppRouterProps) {
  const safeAreaStyle = {
    paddingTop: hostContext?.safeAreaInsets?.top,
    paddingRight: hostContext?.safeAreaInsets?.right,
    paddingBottom: hostContext?.safeAreaInsets?.bottom,
    paddingLeft: hostContext?.safeAreaInsets?.left,
  };

  if (!toolData) {
    return (
      <main className={styles.container} style={safeAreaStyle}>
        <div className={styles.card}>
          <div className={styles.header}>
            <span className={styles.title}>Analytics</span>
          </div>
          <div className={styles.placeholder}>
            <span className={styles.placeholderText}>Waiting for data...</span>
          </div>
        </div>
      </main>
    );
  }

  if (toolData.tool === "show-visualization") {
    return <VisualizationView app={app} id={toolData.visualizationId} safeAreaStyle={safeAreaStyle} />;
  }

  return <KdaView id={toolData.kdaId} safeAreaStyle={safeAreaStyle} />;
}

interface ViewProps {
  id: string;
  safeAreaStyle: React.CSSProperties;
}

interface VisualizationViewProps extends ViewProps {
  app: App;
}

function VisualizationView({ app, id, safeAreaStyle }: VisualizationViewProps) {
  const [sending, setSending] = useState(false);

  const handleRunKda = useCallback(async () => {
    setSending(true);
    try {
      const kdaId = "kda-42";
      const { isError } = await app.sendMessage(
        {
          role: "user",
          content: [
            {
              type: "text",
              text: `Run Key Driver Analysis (KDA) for visualization "${id}". Use KDA ID: "${kdaId}"`,
            },
          ],
        },
        { signal: AbortSignal.timeout(10000) },
      );
      if (isError) {
        console.error("Host rejected the message");
      }
    } catch (e) {
      console.error("Failed to send message:", e);
    } finally {
      setSending(false);
    }
  }, [app, id]);

  return (
    <main className={styles.container} style={safeAreaStyle}>
      <div className={styles.card}>
        <div className={styles.header}>
          <span className={styles.title}>Visualization</span>
          <code className={styles.itemId}>{id}</code>
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
            Visualization "{id}" will render here.
          </span>
        </div>
        <div className={styles.actions}>
          <button className={styles.actionButton} onClick={handleRunKda} disabled={sending}>
            {sending ? "Requesting..." : "Run KDA"}
          </button>
        </div>
      </div>
    </main>
  );
}

function KdaView({ id, safeAreaStyle }: ViewProps) {
  return (
    <main className={styles.container} style={safeAreaStyle}>
      <div className={styles.card}>
        <div className={styles.header}>
          <span className={styles.title}>Key Driver Analysis</span>
          <code className={styles.itemId}>{id}</code>
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
            <circle cx="12" cy="12" r="3" />
            <line x1="12" y1="3" x2="12" y2="7" />
            <line x1="12" y1="17" x2="12" y2="21" />
            <line x1="3" y1="12" x2="7" y2="12" />
            <line x1="17" y1="12" x2="21" y2="12" />
            <line x1="5.6" y1="5.6" x2="8.5" y2="8.5" />
            <line x1="15.5" y1="15.5" x2="18.4" y2="18.4" />
            <line x1="5.6" y1="18.4" x2="8.5" y2="15.5" />
            <line x1="15.5" y1="8.5" x2="18.4" y2="5.6" />
          </svg>
          <span className={styles.placeholderText}>
            KDA "{id}" will render here.
          </span>
        </div>
      </div>
    </main>
  );
}

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <AnalyticsApp />
  </StrictMode>,
);
