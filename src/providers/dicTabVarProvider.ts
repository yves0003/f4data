import {
  Event,
  EventEmitter,
  ThemeIcon,
  ThemeColor,
  TreeDataProvider,
  TreeItem,
  TreeItemCollapsibleState,
} from "vscode";

class Variables extends TreeItem {
  docLink: string = "";
  constructor(
    public readonly linkDir: string,
    public readonly valName: string,
    public readonly collapsibleState: TreeItemCollapsibleState,
    public readonly isChild: boolean,
    public readonly desc?: string,
    public readonly type?: string,
    public readonly cle?: boolean,
    public readonly hasMapping?: boolean
  ) {
    super(valName, collapsibleState);

    const hasTypeLabel = type ? ` (${type})` : "";

    if (isChild) {
      this.tooltip = "";
      this.iconPath = undefined;
      this.command = undefined;
      this.description = "";
      return;
    }

    // Set common label
    this.label = `${valName}${hasTypeLabel}`;
    this.tooltip = desc;
    this.description = desc;

    // Set context
    this.contextValue = hasMapping ? "parent_with_map" : "parent_no_map";

    // Set default icon
    const baseIcon = hasMapping ? "info" : "circle-large-outline";
    const color = cle ? new ThemeColor("charts.blue") : undefined;
    this.iconPath = new ThemeIcon(baseIcon, color);

    // Set command if not mapped
    if (!hasMapping) {
      this.command = {
        title: "",
        command: "f4data.clickOnVar",
        arguments: [this],
      };
    }
  }
}

export class DicTabVarProvider implements TreeDataProvider<Variables> {
  private data: list_vars_tabs[] = [];
  private linkDir: string = "";
  private _onDidChangeTreeData: EventEmitter<
    Variables | undefined | null | void
  > = new EventEmitter<Variables | undefined | null | void>();
  readonly onDidChangeTreeData: Event<Variables | undefined | null | void> =
    this._onDidChangeTreeData.event;
  constructor() {}
  setLink(link: string) {
    this.linkDir = link;
  }
  setData(data: list_vars_tabs[]) {
    this.data = data;
    this._onDidChangeTreeData.fire();
  }
  getTreeItem(element: Variables): Variables {
    return element;
  }
  getChildren(element?: Variables): Thenable<Variables[]> {
    if (element) {
      //return Promise.resolve([element]);
      const description = new Variables(
        this.linkDir,
        //element.desc || "",
        "Display mapping",
        TreeItemCollapsibleState.None,
        true
      );
      return Promise.resolve([description]);
    } else {
      return Promise.resolve(
        this.data.map((val) => {
          // const collapsibleState = val.hasMapping
          //   ? TreeItemCollapsibleState.Collapsed
          //   : TreeItemCollapsibleState.None;
          const collapsibleState = TreeItemCollapsibleState.None;
          const variables = new Variables(
            this.linkDir,
            val.name,
            collapsibleState,
            false,
            val.desc,
            val.type,
            val.cle,
            val.hasMapping
          );
          return variables;
        })
      );
    }
  }
}
