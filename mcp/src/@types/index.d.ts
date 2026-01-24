interface ClientContext {
  type: "vscode-extension" | "cli" | "agent";
  name?: string;
  version?: string;
  capabilities: {
    editor?: boolean;
    workspace?: boolean;
    config?: boolean;
  };
}
type listDicoDir = { name?: string; link?: string; work_dir?: string }[];
