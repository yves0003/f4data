import {
  Event,
  EventEmitter,
  ThemeIcon,
  TreeDataProvider,
  TreeItem,
  TreeItemCollapsibleState,
} from "vscode";
import { addSlashEnd, checkFileExistsSync } from "../helpers/helpers";

class Table extends TreeItem {
  valName: string;
  docLink: string = "";
  constructor(
    public readonly linkDir: string,
    public readonly label: string,
    public readonly collapsibleState: TreeItemCollapsibleState,
    public readonly isChild: boolean,
    public readonly desc?: string
  ) {
    super(label, collapsibleState);
    this.valName = label;
    this.tooltip = desc;
    this.description = desc || "";
    if (isChild) {
      this.iconPath = undefined;
    } else {
      this.docLink = `${addSlashEnd(
        `${addSlashEnd(linkDir)}Tables`
      )}${this.valName.toUpperCase()}.md`;

      const fileExist = checkFileExistsSync(this.docLink);
      if (fileExist) {
        this.contextValue = "parent_with_docs";
        this.iconPath = new ThemeIcon("folder-library");
      } else {
        this.contextValue = "parent_no_docs";
        this.iconPath = new ThemeIcon("symbol-folder");
        //this.iconPath = new ThemeIcon("folder");
      }
      this.command = {
        title: "selected table",
        command: "f4data.clickOnTable",
        arguments: [this],
      };
    }
  }
}
export class DicTabProvider implements TreeDataProvider<Table> {
  private data: list_tabs[] = [];
  private linkDir: string = "";
  private _onDidChangeTreeData: EventEmitter<Table | undefined | null | void> =
    new EventEmitter<Table | undefined | null | void>();
  readonly onDidChangeTreeData: Event<Table | undefined | null | void> =
    this._onDidChangeTreeData.event;
  constructor() {}
  setLink(link: string) {
    this.linkDir = link;
  }
  setData(data: list_tabs[]) {
    this.data = data;
    this._onDidChangeTreeData.fire();
  }
  getTreeItem(element: Table): Table {
    return element;
  }
  getChildren(element?: Table): Thenable<Table[]> {
    if (element) {
      //return Promise.resolve([element]);
      const description = new Table(
        this.linkDir,
        element.desc || "",
        TreeItemCollapsibleState.None,
        true
      );
      return Promise.resolve([description]);
    } else {
      return Promise.resolve(
        this.data.map((val) => {
          const table = new Table(
            this.linkDir,
            val.name,
            //TreeItemCollapsibleState.Collapsed,
            TreeItemCollapsibleState.None,
            false,
            val.description
          );
          return table;
        })
      );
    }
  }
  refresh(): void {
    this._onDidChangeTreeData.fire();
  }
}
