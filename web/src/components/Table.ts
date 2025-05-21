import colors from "../constants/colors";
import { OutputTable } from "../helpers/ast_to_data2";
import { Rect } from "../helpers/rect";
Number.prototype.roundTo = function (decimals: number): number {
  const factor = Math.pow(10, decimals);
  return Math.round((this.valueOf() + Number.EPSILON) * factor) / factor;
};
export const theme = colors("light");
const themeD = colors("dark");

export class Table {
  #table: OutputTable;
  //#headerBg = "#306896";
  #headerBg = theme.brand;
  #headerTextColor = themeD.text[1];
  //rect
  #tabBg = theme.surface[2];
  #tabTextColor = theme.text[1];
  #variables: Rect[] = [];
  #tabHeader: Rect | undefined = undefined;
  #fontSize = 13;
  #margin = 5;
  cursorIsIn: boolean;

  constructor(table: OutputTable, ctx: CanvasRenderingContext2D) {
    this.#table = table;
    const variables = this.#table.variables;
    const maxWidth = getMaxWidth(variables, ctx, table.name);
    const width = maxWidth + this.#margin * 2;
    const height = this.#fontSize + this.#margin * 2;
    const x = this.#table.position.pos_x;
    const y = this.#table.position.pos_y;
    this.cursorIsIn = table.cursorIsIn;
    for (let i = 0; i < variables.length; i++) {
      if (i === 0) {
        //header
        const rect = new Rect(x, y, width, height, this.#table.name, i);
        rect.backgroundColor = this.#headerBg;
        rect.colorText = this.#headerTextColor;
        rect.textSize = this.#fontSize;
        this.#tabHeader = rect;
      }
      //variables
      const numVar = i + 1;
      const rect = new Rect(x, y, width, height, variables[i].name, numVar);
      rect.rectIsMoving = this.cursorIsIn;
      rect.marginText = this.#margin;
      rect.backgroundColor = variables[i].color || this.#tabBg;
      rect.colorText = this.#tabTextColor;
      rect.textSize = this.#fontSize;
      this.#variables.push(rect);
    }
  }

  set fontSize(fontSize: number) {
    this.#fontSize = fontSize;
  }
  set margin(margin: number) {
    this.#margin = margin;
  }

  set headerBg(color: string) {
    this.#headerBg = color;
  }
  set tabBg(color: string) {
    this.#tabBg = color;
  }
  set headerTextColor(color: string) {
    this.#headerTextColor = color;
  }

  get variables() {
    return this.#variables;
  }
  get name() {
    return this.#table.name;
  }

  draw(ctx: CanvasRenderingContext2D) {
    this.#tabHeader?.draw(ctx);
    this.#variables.map((variable) => {
      variable.draw(ctx);
    });
  }

  static fromObject(table: OutputTable) {
    return (ctx: CanvasRenderingContext2D) => {
      return new Table(table, ctx);
    };
  }
}

function getMaxWidth(
  variables: OutputTable["variables"],
  ctx: CanvasRenderingContext2D,
  title = ""
) {
  let len = variables.length;
  let max = -Infinity;
  while (len--) {
    if (ctx.measureText(variables[len].name).width > max) {
      max = ctx.measureText(variables[len].name).width;
    }
  }
  const widthTitle = ctx.measureText(title).width;
  return widthTitle > max ? widthTitle : max;
}
