import React from "react";

const btnStyle: React.CSSProperties = {
  width: "24px",
  height: "24px",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  border: "none",
  borderRadius: "4px",
  background: "transparent",
  color: "var(--vscode-foreground, #cccccc)",
  fontSize: "16px",
  lineHeight: 1,
  cursor: "pointer",
  padding: 0,
  flexShrink: 0,
};

const hoverOn = (e: React.MouseEvent<HTMLButtonElement>) => {
  e.currentTarget.style.background =
    "var(--vscode-toolbar-hoverBackground, rgba(128,128,128,0.2))";
};
const hoverOff = (e: React.MouseEvent<HTMLButtonElement>) => {
  e.currentTarget.style.background = "transparent";
};

const Divider = () => (
  <div
    style={{
      width: "1px",
      height: "16px",
      background: "var(--vscode-panel-border, rgba(128,128,128,0.35))",
      flexShrink: 0,
      margin: "0 0.1rem",
    }}
  />
);

export const ZoomControls = ({
  scale,
  onZoom,
  onExportPng,
  editorWidth,
}: {
  scale: number;
  onZoom: (delta: number, mx?: number, my?: number) => void;
  onExportPng: () => void;
  editorWidth: number;
}) => (
  <div
    style={{
      position: "absolute",
      bottom: "1.25rem",
      left: editorWidth,
      width: `calc(100% - ${editorWidth}px)`,
      display: "flex",
      justifyContent: "center",
      pointerEvents: "none",
    }}
  >
    <div
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: "0.25rem",
        padding: "0.3rem 0.5rem",
        borderRadius: "6px",
        background: "var(--vscode-editor-background, #1e1e1e)",
        border: "1px solid var(--vscode-panel-border, rgba(128,128,128,0.35))",
        boxShadow: "0 2px 8px var(--vscode-widget-shadow, rgba(0,0,0,0.36))",
        pointerEvents: "auto",
      }}
    >
      <button
        onClick={() => onZoom(-0.1)}
        title="Zoom out"
        style={btnStyle}
        onMouseEnter={hoverOn}
        onMouseLeave={hoverOff}
      >
        −
      </button>

      <span
        style={{
          minWidth: "48px",
          textAlign: "center",
          fontSize: "11px",
          fontFamily: "var(--vscode-font-family, sans-serif)",
          color: "var(--vscode-foreground, #cccccc)",
          userSelect: "none",
        }}
      >
        {new Intl.NumberFormat("fr-FR", { style: "percent" }).format(scale)}
      </span>

      <button
        onClick={() => onZoom(0.1)}
        title="Zoom in"
        style={btnStyle}
        onMouseEnter={hoverOn}
        onMouseLeave={hoverOff}
      >
        +
      </button>

      <Divider />

      <button
        onClick={onExportPng}
        title="Export as PNG"
        style={btnStyle}
        onMouseEnter={hoverOn}
        onMouseLeave={hoverOff}
      >
        <svg
          width="14"
          height="14"
          viewBox="0 0 16 16"
          fill="currentColor"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path d="M8 10.5L4.5 7H7V2h2v5h2.5L8 10.5z" />
          <path d="M2 13h12v1H2v-1z" />
        </svg>
      </button>
    </div>
  </div>
);
