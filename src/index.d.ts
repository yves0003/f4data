declare module "xlsx-style";
type listDico = {
  name?: string;
  link?: string;
  work_dir?: string;
  disable?: boolean;
}[];

interface InputBoxParameters {
  title: string;
  step: number;
  totalSteps: number;
  value: string;
  prompt: string;
  validate: (value: string) => Promise<string | undefined>;
  buttons?: import("vscode").QuickInputButton[];
  ignoreFocusOut?: boolean;
  placeholder?: string;
  shouldResume: () => Thenable<boolean>;
}

type list_tabs = {
  name: string;
  description: string;
};
type list_vars_tabs = {
  //table: string;
  cle: boolean;
  name: string;
  desc: string;
  type: string;
  hasMapping: boolean;
};

interface MarkdownFileInfo {
  directory: string;
  filename: string;
  filePath: string;
}
