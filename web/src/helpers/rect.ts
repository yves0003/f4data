export class Rect {
  x: number;
  y: number;
  width: number;
  height: number;
  private _backgroundColor = "lightgrey";
  private _colorText = "black";
  private _marginText = 5;
  private _textSize = 13;
  text: string;
  numVar: number;
  isMoving = false;

  constructor(x: number, y: number, width: number, height: number, text: string, numVar: number) {
    this.width = width.roundTo(2);
    this.height = height.roundTo(2);
    this.text = text;
    this.numVar = numVar;
    this.x = x.roundTo(2);
    this.y = y.roundTo(2) + this.numVar * (this._textSize + this._marginText * 2);
  }
  set rectIsMoving(value: boolean) {
    this.isMoving = value;
  }
  set colorText(value: string) {
    this._colorText = value;
  }
  set marginText(value: number) {
    this._marginText = value;
  }
  set backgroundColor(value: string) {
    this._backgroundColor = value;
  }
  set textSize(value: number) {
    this._textSize = value;
  }
  get infos() {
    return {
      x: this.x,
      y: this.y,
      w: this.width,
      h: this.height,
      name: this.text,
      isMoving: this.isMoving,
    };
  }
  draw = (ctx: CanvasRenderingContext2D) => {
    ctx.save();
    ctx.shadowColor = "black";
    ctx.shadowBlur = 1;
    ctx.shadowOffsetX = 0.05;
    ctx.shadowOffsetY = 0.05;
    ctx.fillStyle = this._backgroundColor;
    ctx.fillRect(this.x, this.y, this.width, this.height);
    ctx.restore();
    ctx.fillStyle = this._colorText;
    ctx.fillText(this.text.replace(/'/g, ""), this.x + this._marginText, this.y + this._marginText);
  };
}
