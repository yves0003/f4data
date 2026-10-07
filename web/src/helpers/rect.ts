// [top-left, top-right, bottom-right, bottom-left]
type CornerRadii = [number, number, number, number];

function roundRectPath(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  [tl, tr, br, bl]: CornerRadii,
) {
  ctx.beginPath();
  ctx.moveTo(x + tl, y);
  ctx.lineTo(x + w - tr, y);
  ctx.arcTo(x + w, y, x + w, y + tr, tr);
  ctx.lineTo(x + w, y + h - br);
  ctx.arcTo(x + w, y + h, x + w - br, y + h, br);
  ctx.lineTo(x + bl, y + h);
  ctx.arcTo(x, y + h, x, y + h - bl, bl);
  ctx.lineTo(x, y + tl);
  ctx.arcTo(x, y, x + tl, y, tl);
  ctx.closePath();
}

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
  cornerRadii: CornerRadii = [0, 0, 0, 0];

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
    const hasRadius = this.cornerRadii.some((r) => r > 0);
    if (hasRadius) {
      roundRectPath(ctx, this.x, this.y, this.width, this.height, this.cornerRadii);
      ctx.fill();
    } else {
      ctx.fillRect(this.x, this.y, this.width, this.height);
    }
    ctx.restore();
    ctx.fillStyle = this._colorText;
    ctx.fillText(this.text.replace(/'/g, ""), this.x + this._marginText, this.y + this._marginText);
  };
}
