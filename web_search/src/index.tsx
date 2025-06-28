import { createRoot } from "react-dom/client";
import "./style.css";
import styled from "styled-components";
import { useEffect, useState } from "react";
import handleKeyDown from "./helpers/handleKeyDown";
import { dummy } from "./data/dummy";
import { searchWithHighlights } from "./helpers/searchWithHighlights";
import TabButtonElt from "./components/TabButtonElt";
import { Icons } from "./components/icons";
import { vscode } from "./helpers/vscode";

const allData: listTabsInfo[] = dummy as listTabsInfo[];
let listIcons = ["all", "tables", "vars", "maps"];

if (import.meta.env.DEV) {
  await import("@vscode-elements/webview-playground");
}

const tabs = [
  {
    id: "0",
    label: "Tous",
  },
  {
    id: "1",
    label: "Tables",
  },
  {
    id: "2",
    label: "Vars",
  },
  {
    id: "3",
    label: "Mappings",
  },
];

const SearchInput = styled.input`
  height: 2.2rem;
  border-radius: 2px;
  width: 100%;
  padding: 0 0 0 0.5rem;
  outline: 0;
  cursor: text;
  margin-top: 1.5rem;
  background-color: var(--vscode-input-background);
  color: var(--vscode-input-foreground);
  border: 1px solid var(--vscode-inputOption-activeBorder);
  margin-bottom: 0.5rem;
  &::placeholder {
    color: var(--vscode-input-placeholderForeground);
  }
  &:hover {
    background-color: var(--vscode-inputOption-hoverBackground);
  }
`;

const TabPanel = styled.div`
  z-index: 1;
  &[role="tabpanel"] {
    padding: 0 5px 0 5px;
    background: hsla(var(--surface4-hsl) / 0.5);
    min-height: 10em;
    width: 100%;
    overflow: auto;
  }

  &[role="tabpanel"].is-hidden {
    display: none;
  }

  &[role="tabpanel"] p {
    margin: 0;
  }
`;

const TabButtonContainer = styled.div`
  display: inline-flex;
  width: 100%;
  margin-bottom: 1rem;
`;

const ResContainer = styled.div`
  display: inline-flex;
  justify-content: space-between;
  width: 100%;
  background: var(--vscode-editor-background);
  border-radius: 2px;
  padding: 0.3rem;
  cursor: pointer;
  &:hover {
    background-color: var(--vscode-list-hoverBackground);
  }
`;
const ResDetail = styled.div`
  padding: 0.3rem;
  display: inline-flex;
  position: relative;
  svg {
    margin-right: 0.3rem;
  }
  span {
    overflow: hidden;
    white-space: nowrap;
    text-overflow: ellipsis;
    max-width: 50vw;
  }
  mark {
    background-color: var(--vscode-editor-findMatchHighlightBackground);
    color: inherit;
  }
`;

const ResDetail_info = styled.div<{ theme: { borderColor: string } }>`
  position: absolute;
  top: 50%;
  transform: translateY(-50%);
  right: 100%;
  font-size: 10px;
  background-color: ${(props) => `${props.theme.borderColor}`};
  padding: 2px 4px;
  border-radius: 2px;
  color: var(--vscode-editor-foreground);
`;

const ResLocation = styled.div`
  color: var(--vscode-badge-background);
  padding: 0.3rem;
  border-radius: 2px;
  font-size: 0.8rem;
  position: relative;
`;

const StaticDiv = styled.div`
  position: sticky;
  top: 0;
  z-index: 100;
  background-color: var(--vscode-editor-background);
`;

type resSearch = ReturnType<typeof searchWithHighlights>;

const App = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedTab, setSelectedTab] = useState<string>("0");
  const [alldata, setAlldata] = useState<resSearch["matches"]>();
  const [payload, setPayload] = useState<listTabsInfo[]>([]);
  const [nbAll, setNbAll] = useState<number>(0);
  const [nbTables, setNbTables] = useState<number>(0);
  const [nbVars, setNbVars] = useState<number>(0);
  const [nbMap, setNbMap] = useState<number>(0);

  useEffect(() => {
    const handleMessage = (
      event: MessageEvent<{
        type: string;
        payload: listTabsInfo;
      }>
    ) => {
      if (event.data.type === "init" || event.data.type === "refresh") {
        setPayload([event.data.payload]);
        setAlldata([]);
        setSearchQuery("");
        setNbAll(0);
        setNbMap(0);
        setNbTables(0);
        setNbVars(0);
      }
    };
    window.addEventListener("message", handleMessage);

    vscode.postMessage({ type: "ready" }); //1
    return () => window.removeEventListener("message", handleMessage);
  }, []);

  useEffect(() => {
    const allTabs = Array.from(
      document.querySelectorAll<HTMLDivElement>('[role="tab"]')
    );
    allTabs.forEach((e, i) => {
      e.addEventListener("keydown", (event) => {
        handleKeyDown(event, i, allTabs.length, "tab-");
      });
    });
    return () => {
      allTabs.forEach((e, i) => {
        e.removeEventListener("keydown", (event) => {
          handleKeyDown(event, i, allTabs.length, "tab-");
        });
      });
    };
    // }, [selectedTab]);
  }, []);
  return (
    <>
      {import.meta.env.DEV ? <vscode-dev-toolbar></vscode-dev-toolbar> : null}
      <main className="container">
        <StaticDiv>
          <SearchInput
            type="search"
            name=""
            id=""
            className="vscode-input-background"
            value={searchQuery}
            placeholder={"Cherchez"}
            onChange={(e) => {
              e.preventDefault();
              setSearchQuery(e.target.value);
              if (import.meta.env.DEV) {
                let res = searchWithHighlights(allData, e.target.value);
                setAlldata(res.matches);
                setNbAll(getNumberFilter(res.matches));
                setNbMap(getNumberFilter(res.matches, "Mappings"));
                setNbTables(getNumberFilter(res.matches, "Tables"));
                setNbVars(getNumberFilter(res.matches, "Vars"));
              } else {
                let res = searchWithHighlights(payload, e.target.value);
                setAlldata(res.matches);
                setNbAll(getNumberFilter(res.matches));
                setNbMap(getNumberFilter(res.matches, "Mappings"));
                setNbTables(getNumberFilter(res.matches, "Tables"));
                setNbVars(getNumberFilter(res.matches, "Vars"));
              }
            }}
          />
          <TabButtonContainer
            role="tablist"
            aria-labelledby="tablist-1"
            className="manual"
          >
            {tabs.map((tab, i) => (
              <TabButtonElt
                key={`TabButton${tab.label}`}
                id={`tab-${i}`}
                type="button"
                role="tab"
                aria-controls={`tabpanel-${i}`}
                tabIndex={i === 0 ? 0 : -1}
                selected={selectedTab === i.toString()}
                onClick={() => setSelectedTab(i.toString())}
                style={{ width: `calc(100% / ${tabs.length})` }}
              >
                <Icons
                  //stroke="var(--vscode-input-foreground)"
                  icon={listIcons[i] as any}
                  color={
                    listIcons[i] === "tables"
                      ? "var(--vscode-inputValidation-warningBorder)"
                      : listIcons[i] === "vars"
                      ? "var(--vscode-inputValidation-errorBorder)"
                      : listIcons[i] === "maps"
                      ? "var(--vscode-inputValidation-infoBorder)"
                      : "var(--vscode-input-foreground)"
                  }
                  width={"1rem"}
                  height={"1rem"}
                />
                <span className="focus">{`${tab.label}`}</span>
                <span style={{ fontSize: "0.6rem" }}>
                  {displayNumber(listIcons[i], nbAll, nbTables, nbVars, nbMap)}
                </span>
              </TabButtonElt>
            ))}
          </TabButtonContainer>
        </StaticDiv>
        {tabs.map((tab, i) => (
          <TabPanel
            key={`tabPanel${tab.id}`}
            id={`tabpanel-${i}`}
            role="tabpanel"
            aria-labelledby={`tab-${i}`}
            className={selectedTab === i.toString() ? "" : "is-hidden"}
          >
            {searchQuery === ""
              ? []
              : alldata &&
                (tab.label === "Tous"
                  ? alldata.filter((data) => !data.path.includes("link"))
                  : alldata.filter((data) =>
                      tab.label === "Tables"
                        ? data.path.includes("table") &&
                          !data.path.includes("variables")
                        : tab.label === "Vars"
                        ? data.path.includes("variables")
                        : tab.label === "Mappings"
                        ? data.path.includes("members") ||
                          data.path.includes("enum")
                        : undefined
                    )
                ).map((val) => (
                  <ResContainer>
                    <ResDetail>
                      <Icons
                        stroke="var(--vscode-input-foreground)"
                        icon={getIcon(tab.label, val) as any}
                        width={"1rem"}
                        height={"1rem"}
                      />
                      <span
                        dangerouslySetInnerHTML={{ __html: val.highlighted }}
                      ></span>
                    </ResDetail>
                    <ResLocation>
                      <ResDetail_info
                        theme={{
                          borderColor:
                            val.path[1] === "table"
                              ? "var(--vscode-inputValidation-warningBorder)"
                              : val.path[1] === "variables"
                              ? "var(--vscode-inputValidation-errorBorder)"
                              : val.path[1] === "enum"
                              ? "var(--vscode-inputValidation-infoBorder)"
                              : "",
                        }}
                      >
                        {val.path[0]}
                      </ResDetail_info>
                      <span>{`${uniVal(tab.label, val)} / ${val.field.substring(
                        0,
                        4
                      )}`}</span>
                    </ResLocation>
                  </ResContainer>
                ))}
          </TabPanel>
        ))}
      </main>
    </>
  );
};

function displayNumber(
  filter: string,
  nbAll: number,
  nbTables: number,
  nbVars: number,
  nbMap: number
) {
  let number = nbAll;
  if (number <= 0) {
    return "";
  } else {
    if (filter === "tables") {
      number = nbTables;
    }
    if (filter === "vars") {
      number = nbVars;
    }
    if (filter === "maps") {
      number = nbMap;
    }
    return `(${number})`;
  }
}
function getNumberFilter(
  alldata: resSearch["matches"],
  filter?: "Tables" | "Vars" | "Mappings"
): number {
  const data = alldata.filter((data) => !data.path.includes("link"));
  if (filter === "Tables") {
    return data.filter(
      (data) => data.path.includes("table") && !data.path.includes("variables")
    ).length;
  }
  if (filter === "Vars") {
    return data.filter((data) => data.path.includes("variables")).length;
  }
  if (filter === "Mappings") {
    return data.filter(
      (data) => data.path.includes("members") || data.path.includes("enum")
    ).length;
  }
  return data.length;
}

function uniVal(val?: string, search?: resSearch["matches"][0]) {
  if (val === "Vars") return "Vars";
  if (val === "Tables") return "Tables";
  if (val === "Mappings") return "Mappings";
  if (val === "Tous") {
    if (search) {
      if (search.path.includes("variables")) return "Vars";
      if (search.path.includes("table")) return "Tables";
      if (search.path.includes("members")) return "Mappings";
      if (search.path.includes("enum")) return "Mappings";
    }
  }
}
function getIcon(val?: string, search?: resSearch["matches"][0]) {
  if (val === "Tables") return "tables";
  if (val === "Vars") return "vars";
  if (val === "Mappings") return "maps";
  if (val === undefined) return "all";
  if (val === "Tous") {
    if (search) {
      if (search.path.includes("variables")) return "vars";
      if (search.path.includes("table")) return "tables";
      if (search.path.includes("members")) return "maps";
      if (search.path.includes("enum")) return "maps";
    }
  }
}
const container = document.getElementById("app");
if (container) {
  const root = createRoot(container);
  root.render(<App />);
}
