import "./style.css";
import { createRoot } from "react-dom/client";
import { useEffect, useState } from "react";
import { vscode } from "./utilities/vscode";
import { WindowContextProvider } from "./context/WindowsContext";
import Canvas from "./components/Canvas2";
import { ast_to_data2 } from "./helpers/ast_to_data2";
import { transformRefs } from "./helpers/transformRefs";
import { exemple } from "./constants/exemple";
import { dummy } from "./constants/dummy";
if (import.meta.env.DEV) {
  await import("@vscode-elements/webview-playground");
}

const allData: ReturnType<typeof ast_to_data2> = dummy[0] as ReturnType<
  typeof ast_to_data2
>;

const App = () => {
  const [arrange, setArrange] = useState(false);
  const [listLinks, setListLinks] = useState<Transformed[]>([]);
  const [payload, setPayload] = useState<ReturnType<typeof ast_to_data2>>({
    tables: [],
    mappings: [],
    links: [],
  });

  useEffect(() => {
    const handleMessage = (
      event: MessageEvent<{
        type: string;
        payload: ReturnType<typeof ast_to_data2>;
      }>
    ) => {
      if (import.meta.env.DEV) {
        setPayload(allData);
        const links = transformRefs(allData.links);
        setListLinks(links);
      }
      if (event.data.type === "init" || event.data.type === "refresh") {
        setPayload(event.data.payload);
        const links = transformRefs(event.data.payload.links);
        setListLinks(links);
      }
      if (event.data.type === "refresh") {
        setArrange(true);
      }
    };
    window.addEventListener("message", handleMessage);

    vscode.postMessage({ type: "ready" }); //1
    return () => window.removeEventListener("message", handleMessage);
  }, []);

  return (
    <>
      {import.meta.env.DEV ? <vscode-dev-toolbar></vscode-dev-toolbar> : null}
      <WindowContextProvider ecart={0}>
        <Canvas
          listTables={payload.tables}
          arrange={arrange}
          setArrange={setArrange}
          listLinks={listLinks}
        />
      </WindowContextProvider>
    </>
  );
};

const container = document.getElementById("app");
if (container) {
  const root = createRoot(container);
  root.render(<App />);
}
