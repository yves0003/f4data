declare module "@vscode-elements/webview-playground";

declare namespace JSX {
  interface IntrinsicElements {
    "vscode-dev-toolbar": React.DetailedHTMLProps<
      React.HTMLAttributes<HTMLElement>,
      HTMLElement
    >;
  }
}

interface OutputVariable {
  _id: string;
  name: string;
  desc: string;
  type: string;
  cle: boolean;
  color: string;
  typeVar: string;
  settings: string[];
  hasMapping: boolean;
}

type OutputTable = {
  cursorIsIn: boolean;
  position: {
    pos_x: number;
    pos_y: number;
  };
  _id: string;
  name: string;
  description: string;
  variables: OutputVariable[];
  date: string;
  __v: number;
};
type MemberNode = {
  key: string;
  description: string;
  note: string;
};
type EnumNode = {
  type: "Enum";
  name: string;
  members: MemberNode[];
};

type RefNode = {
  type: "Ref";
  left: string;
  relationship: string;
  right: string;
};

type listTabsInfo = {
  tables: OutputTable[];
  mappings: EnumNode[];
  links: RefNode[];
};
