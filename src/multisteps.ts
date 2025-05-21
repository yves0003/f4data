import {
  window,
  Disposable,
  QuickInput,
  ExtensionContext,
  QuickInputButtons,
  workspace,
} from "vscode";
import { find as lodashFind, indexOf as lodashIndexOf } from "lodash";
import {
  InputFlowAction,
  shouldResume,
  validateLinkExistOrIsUnique,
  validateNameIsUnique,
} from "./helpers/helpers";
type keytouse = "name" | "link";

const upsert = function (
  arr: listDico,
  keyToUse: keytouse,
  newval: Partial<listDico[0]>
) {
  let key: { [x: string]: string } = {};
  if (newval[keyToUse] !== undefined) {
    key[keyToUse] = newval[keyToUse];
    const match = lodashFind(arr, key);
    if (match) {
      const index = lodashIndexOf(arr, lodashFind(arr, key));
      arr.splice(index, 1, newval);
    } else {
      arr.push(newval);
    }
  }
  return arr.sort((a, b) => {
    if ((a.name || "") < (b.name || "")) {
      return -1;
    } else {
      return 1;
    }
  });
};

interface State {
  title: string;
  step: number;
  totalSteps: number;
  name: string;
  link: string;
}

type InputStep = (input: MultiStepInput) => Thenable<InputStep | void>;

class MultiStepInput {
  static async run<T>(start: InputStep) {
    const input = new MultiStepInput();
    return input.stepThrough(start);
  }
  private current?: QuickInput;
  private steps: InputStep[] = [];

  private async stepThrough<T>(start: InputStep) {
    let step: InputStep | void = start;
    while (step) {
      this.steps.push(step);
      if (this.current) {
        this.current.enabled = false;
        this.current.busy = true;
      }
      try {
        step = await step(this);
      } catch (err) {
        if (err === InputFlowAction.back) {
          this.steps.pop();
          step = this.steps.pop();
        } else if (err === InputFlowAction.resume) {
          step = this.steps.pop();
        } else if (err === InputFlowAction.cancel) {
          step = undefined;
        } else {
          throw err;
        }
      }
    }
    //close step at the end.
    if (this.current) {
      this.current.dispose();
    }
  }

  async showInputBox<P extends InputBoxParameters>({
    title,
    step,
    totalSteps,
    value,
    prompt,
    validate,
    buttons,
    ignoreFocusOut,
    placeholder,
    shouldResume,
  }: P) {
    const disposables: Disposable[] = [];
    try {
      return await new Promise<
        string | (P extends { buttons: (infer I)[] } ? I : never)
      >((resolve, reject) => {
        const input = window.createInputBox();
        input.title = title;
        input.step = step;
        input.totalSteps = totalSteps;
        input.value = value || "";
        input.prompt = prompt;
        input.ignoreFocusOut = ignoreFocusOut ?? false;
        input.placeholder = placeholder;
        input.buttons = [
          ...(this.steps.length > 1 ? [QuickInputButtons.Back] : []),
          ...(buttons || []),
        ];
        let validating = validate("");
        disposables.push(
          input.onDidTriggerButton((item) => {
            if (item === QuickInputButtons.Back) {
              reject(InputFlowAction.back);
            } else {
              resolve(<any>item);
            }
          }),
          input.onDidAccept(async () => {
            const value = input.value;
            input.enabled = false;
            input.busy = true;
            if (!(await validate(value))) {
              resolve(value);
            }
            input.enabled = true;
            input.busy = false;
          }),
          input.onDidChangeValue(async (text) => {
            const current = validate(text);
            validating = current;
            const validationMessage = await current;
            if (current === validating) {
              input.validationMessage = validationMessage;
            }
          }),
          input.onDidHide(() => {
            (async () => {
              reject(
                shouldResume && (await shouldResume())
                  ? InputFlowAction.resume
                  : InputFlowAction.cancel
              );
            })().catch(reject);
          })
        );
        if (this.current) {
          this.current.dispose();
        }
        this.current = input;
        this.current.show();
      });
    } finally {
      disposables.forEach((d) => d.dispose());
    }
  }
}

export async function multistep(context: ExtensionContext) {
  const title = "Create a new dictionary";

  async function collectInputs() {
    const state = {} as Partial<State>;
    await MultiStepInput.run((input) => inputName(input, state));
    return state as State;
  }

  async function inputName(input: MultiStepInput, state: Partial<State>) {
    state.name = await input.showInputBox({
      title,
      step: 1,
      totalSteps: 2,
      value: state.name || "",
      placeholder: "Choose a unique name",
      prompt: "Choose a unique name",
      validate: validateNameIsUnique,
      shouldResume: shouldResume,
    });
    return (input: MultiStepInput) => inputLink(input, state);
  }

  async function inputLink(input: MultiStepInput, state: Partial<State>) {
    state.link = await input.showInputBox({
      title,
      step: 2,
      totalSteps: 2,
      value: "",
      placeholder: "Choose a link to the dictionary",
      prompt: "Choose a link to the dictionary",
      validate: validateLinkExistOrIsUnique,
      shouldResume: shouldResume,
    });
    window.showInformationMessage(`${state.link}`);
    const config = workspace.getConfiguration("f4data");
    const dictionaries = config.get("list") as listDico;
    const dictToAdd = { name: state.name, link: state.link };
    await config.update("list", upsert(dictionaries, "name", dictToAdd), true);
  }

  const state = await collectInputs();
  window.showInformationMessage(`Creating dictionary Service '${state.name}'`);
}
