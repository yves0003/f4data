import {
  Event,
  EventEmitter,
  ThemeIcon,
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
    this.description = "";
    this.command = undefined;
    if (isChild) {
      this.tooltip = "";
      this.iconPath = undefined;
    } else {
      if (hasMapping) {
        this.contextValue = "parent_with_map";
        //this.label = `🔍 ${valName}${type ? ` (${type})` : ""}`;
        this.label = `${valName}${type ? ` (${type})` : ""}`;
      } else {
        this.contextValue = "parent_no_map";
        this.command = {
          title: "",
          command: "f4data.clickOnVar",
          arguments: [this],
        };
        this.label = `${valName}${type ? ` (${type})` : ""}`;
      }

      this.tooltip = desc;
      this.description = desc;

      if (cle) {
        this.iconPath = new ThemeIcon("star-full");
      }
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
          const collapsibleState = val.hasMapping
            ? TreeItemCollapsibleState.Collapsed
            : TreeItemCollapsibleState.None;
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
