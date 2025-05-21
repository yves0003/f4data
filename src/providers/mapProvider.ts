import {
  CancellationToken,
  WebviewView,
  WebviewViewProvider,
  WebviewViewResolveContext,
} from "vscode";
import { getHtmlForWeb } from "../helpers/helpers";

export class MapProvider implements WebviewViewProvider {
  public readonly viewType = "mappingApanel";
  private _view?: WebviewView;
  private _data: any[] = [];
  private _label: string = "";
  constructor() {}

  public setData<T>(data: T[], label: string) {
    this._data = data;
    this._label = label;
  }

  public resolveWebviewView(
    webviewView: WebviewView,
    context: WebviewViewResolveContext,
    _token: CancellationToken
  ) {
    this._view = webviewView;

    // Set the initial HTML content for the webview
    webviewView.webview.options = {
      enableScripts: true,
    };

    webviewView.webview.html = this.getHtmlForWebview(
      this._data,
      `Mapping: ${this._label}`
    );
  }

  // Function to update the content of the webview
  public setDataAndUpdateContent(csvData?: any[], label?: string) {
    if (csvData) {
      this._data = csvData;
    }
    if (label) {
      this._label = label;
    }

    if (this._view) {
      this._view.title = `Dictionary: ${this._label}`;
      this._view.webview.html = this.getHtmlForWebview(
        this._data,
        `Mapping: ${this._label}`
      );
    }
  }

  // Function to generate HTML content for the webview
  private getHtmlForWebview = getHtmlForWeb;
}
