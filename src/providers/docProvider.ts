import {
  Event,
  EventEmitter,
  ThemeIcon,
  TreeDataProvider,
  TreeItem,
} from "vscode";

class Doc extends TreeItem {
  constructor(public readonly label: string, public readonly filePath: string) {
    super(label);
    this.iconPath = new ThemeIcon("markdown");
    this.filePath = filePath;
  }
  command = {
    title: "selected Doc",
    command: "f4data.clickOnDoc",
    arguments: [this],
  };
}
export class DocProvider implements TreeDataProvider<Doc> {
  private data: MarkdownFileInfo[] = [];
  private _onDidChangeTreeData: EventEmitter<Doc | undefined | null | void> =
    new EventEmitter<Doc | undefined | null | void>();
  readonly onDidChangeTreeData: Event<Doc | undefined | null | void> =
    this._onDidChangeTreeData.event;
  constructor() {}
  setData(data: MarkdownFileInfo[]) {
    this.data = data;
    this._onDidChangeTreeData.fire();
  }
  getTreeItem(element: Doc): Doc {
    return element;
  }
  getChildren(element?: Doc): Thenable<Doc[]> {
    if (element) {
      return Promise.resolve([element]);
    } else {
      return Promise.resolve(
        this.data.map((info) => new Doc(info.filename, info.filePath))
      );
    }
  }
  refresh(): void {
    this._onDidChangeTreeData.fire();
  }
}
