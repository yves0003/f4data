export const ZoomControls = ({
  scale,
  onZoom,
  editorWidth,
}: {
  scale: number;
  onZoom: (delta: number, mx?: number, my?: number) => void;
  editorWidth: number;
}) => (
  <div
    style={{
      position: "absolute",
      bottom: "1rem",
      left: editorWidth,
      width: `calc(100% - ${editorWidth}px)`,
      textAlign: "center",
    }}
  >
    <button onClick={() => onZoom(-0.1)}>-</button>
    <span style={{ margin: "0 1rem" }}>
      {new Intl.NumberFormat("fr-FR", { style: "percent" }).format(scale)}
    </span>
    <button onClick={() => onZoom(0.1)}>+</button>
  </div>
);
