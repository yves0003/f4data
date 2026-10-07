import { theme } from "../components/Table";
import { Rect } from "./rect";

type RectProps = typeof Rect.prototype.infos;
type EndSymbol = "bar" | "crow";

export class Line {
  rect1: Rect;
  rect2: Rect;
  #color = "#525252"; //"#3f3f3f";
  #width = 0.5;
  #curve = 10;
  #shadowOffset = 0;
  #relationship = "-";
  isMoving = false;

  constructor(line: { rect1: Rect; rect2: Rect; relationship?: string }) {
    this.rect1 = line.rect1;
    this.rect2 = line.rect2;
    this.#relationship = line.relationship ?? "-";
    this.isMoving = line.rect1.isMoving || line.rect2.isMoving;
    if (this.isMoving) {
      this.rect1.backgroundColor = theme.surface[2];
      this.rect2.backgroundColor = theme.surface[2];
      this.#width = this.#width + 0.5;
      //this.#shadowOffset = 0.25;
      this.#color = "gray";
    }
  }
  set color(value: string) {
    this.#color = value;
  }
  set width(value: number) {
    this.#width = value;
  }

  draw = (ctx: CanvasRenderingContext2D) => {
    ctx.save();
    ctx.lineWidth = this.#width;
    ctx.lineJoin = "miter";
    ctx.lineCap = "butt";
    ctx.imageSmoothingQuality = "high";
    ctx.strokeStyle = this.#color;
    ctx.shadowBlur = 0; //3;
    ctx.shadowColor = "gray";
    ctx.shadowOffsetX = this.#shadowOffset;
    ctx.shadowOffsetY = this.#shadowOffset;
    //ctx.globalAlpha = 0.5;
    const curve = { p2x: this.#curve, p2y: this.#curve, p3x: this.#curve };

    const left_rect = {
      h: this.rect1.infos.h,
      w: this.rect1.infos.w,
    } as RectProps;
    const right_rect = {
      h: this.rect2.infos.h,
      w: this.rect2.infos.w,
    } as RectProps;
    const p1 = {} as RectProps;
    const p2 = {} as RectProps;
    const p3 = {} as RectProps;
    const p4 = {} as RectProps;
    const w1w2 = left_rect.w + right_rect.w;

    if (this.rect1.x > this.rect2.x) {
      left_rect.x = this.rect2.infos.x;
      left_rect.y = this.rect2.infos.y;
      left_rect.w = this.rect2.infos.w;
      left_rect.h = this.rect2.infos.h;
      right_rect.x = this.rect1.infos.x;
      right_rect.y = this.rect1.infos.y;
      right_rect.w = this.rect1.infos.w;
      right_rect.h = this.rect1.infos.h;
    } else {
      left_rect.x = this.rect1.infos.x;
      left_rect.y = this.rect1.infos.y;
      left_rect.w = this.rect1.infos.w;
      left_rect.h = this.rect1.infos.h;
      right_rect.x = this.rect2.infos.x;
      right_rect.y = this.rect2.infos.y;
      right_rect.w = this.rect2.infos.w;
      right_rect.h = this.rect2.infos.h;
    }

    p1.w = right_rect.w;
    p4.w = left_rect.w;
    p1.x = right_rect.x + right_rect.w;
    p1.y = right_rect.y + right_rect.h / 2;
    p2.x =
      left_rect.x +
      left_rect.w -
      (left_rect.x + left_rect.w - right_rect.x) / 2;
    p2.y = p1.y;
    p3.x = p2.x;
    p3.y = left_rect.y + left_rect.h / 2;
    p4.x = left_rect.x;
    p4.y = p3.y;

    const ecart_rect = right_rect.x + right_rect.w - left_rect.x;

    if (Math.abs(ecart_rect) - curve.p2x * 2 < w1w2) {
      p2.x = p1.x - ecart_rect - curve.p2x;
      p2.y = p1.y;
      p3.x = p2.x;
      p3.y = p4.y;
      curve.p3x = -this.#curve;
      p4.x = p4.x - p4.w;
    }

    p1.x = (p1.x - p1.w).roundTo(2);
    p4.x = p4.x + p4.w;

    if (right_rect.y < left_rect.y) {
      curve.p2y = -this.#curve;
    }

    if (Math.abs(this.rect1.infos.y - this.rect2.infos.y) < this.#curve * 2) {
      if (p2.y > p3.y) {
        curve.p2y = Math.abs(this.rect2.infos.y - this.rect1.infos.y) / 2;
      } else {
        curve.p2y = -Math.abs(this.rect2.infos.y - this.rect1.infos.y) / 2;
      }
    }

    drawLines(ctx, curve)(p1, p2, p3, p4);
    ctx.restore();
  };

  #endPoints() {
    const rect1IsLeft = !(this.rect1.x > this.rect2.x);
    const lr = rect1IsLeft
      ? { l: this.rect1.infos, r: this.rect2.infos }
      : { l: this.rect2.infos, r: this.rect1.infos };

    const w1w2 = lr.l.w + lr.r.w;
    const ecart = lr.r.x + lr.r.w - lr.l.x;
    const wrapAround = Math.abs(ecart) - this.#curve * 2 < w1w2;

    const p1x = lr.r.x;
    const p4x = wrapAround ? lr.l.x : lr.l.x + lr.l.w;
    // when wrapping around, the line exits from the left side of the left table
    const p4Dir: "left" | "right" = wrapAround ? "left" : "right";

    return {
      p1: { x: p1x, y: lr.r.y + lr.r.h / 2 },
      p4: { x: p4x, y: lr.l.y + lr.l.h / 2 },
      p4Dir,
      rect1IsLeft,
    };
  }

  // Called in a second pass after all tables are drawn, so symbols appear on top.
  drawSymbols = (ctx: CanvasRenderingContext2D) => {
    const { p1, p4, p4Dir, rect1IsLeft } = this.#endPoints();
    const rect1Sym: EndSymbol =
      this.#relationship === ">" || this.#relationship === "<>"
        ? "crow"
        : "bar";
    const rect2Sym: EndSymbol =
      this.#relationship === "<" || this.#relationship === "<>"
        ? "crow"
        : "bar";
    const p4Sym = rect1IsLeft ? rect1Sym : rect2Sym;
    const p1Sym = rect1IsLeft ? rect2Sym : rect1Sym;

    const p4BarSign = p4Dir === "right" ? 1 : -1;
    drawEndSymbol(
      ctx,
      { ...p4, x: p4.x + (p4Sym === "bar" ? p4BarSign * 5 : 0) },
      p4Dir,
      p4Sym,
      this.#color,
    );
    drawEndSymbol(
      ctx,
      { ...p1, x: p1.x - (p1Sym === "bar" ? 5 : 0) },
      "left",
      p1Sym,
      this.#color,
    );
  };

  static fromObject(lineProps: {
    rect1: Rect;
    rect2: Rect;
    relationship?: string;
  }) {
    return new Line(lineProps);
  }
}

function drawEndSymbol(
  ctx: CanvasRenderingContext2D,
  p: { x: number; y: number },
  dir: "left" | "right",
  symbol: EndSymbol,
  color?: string,
) {
  const barSize = 6;
  const crowLen = 7;
  const crowSpread = 5;
  const sign = dir === "right" ? 1 : -1;

  ctx.save();
  ctx.lineWidth = 1;
  ctx.globalAlpha = 0.6;
  if (color) {
    ctx.strokeStyle = color;
  }
  ctx.beginPath();
  if (symbol === "bar") {
    ctx.moveTo(p.x, p.y - barSize);
    ctx.lineTo(p.x, p.y + barSize);
  } else {
    // Three lines fan from a convergence point (fx) to three separate points at the table edge
    const fx = p.x + sign * crowLen;
    ctx.moveTo(fx, p.y);
    ctx.lineTo(p.x, p.y - crowSpread);
    ctx.moveTo(fx, p.y);
    ctx.lineTo(p.x, p.y);
    ctx.moveTo(fx, p.y);
    ctx.lineTo(p.x, p.y + crowSpread);
  }
  ctx.stroke();
  ctx.restore();
}

function drawLines(
  ctx: CanvasRenderingContext2D,
  curve: { p2x: number; p2y: number; p3x: number },
) {
  return function (
    p1: { x: number; y: number },
    p2: { x: number; y: number },
    p3: { x: number; y: number },
    p4: { x: number; y: number },
  ) {
    //Draw dots
    // ctx.save();
    // ctx.beginPath();
    // ctx.arc(p1.x, p1.y, 4, 0, 2 * Math.PI);
    // ctx.fillStyle = "green";
    // ctx.fill();
    // ctx.beginPath();
    // ctx.arc(p2.x, p2.y, 4, 0, 2 * Math.PI);
    // ctx.fillStyle = "blue";
    // ctx.fill();
    // ctx.beginPath();
    // ctx.arc(p3.x, p3.y, 4, 0, 2 * Math.PI);
    // ctx.fillStyle = "black";
    // ctx.fill();
    // ctx.beginPath();
    // ctx.arc(p4.x, p4.y, 4, 0, 2 * Math.PI);
    // ctx.fillStyle = "red";
    // ctx.fill();
    // ctx.restore();
    ctx.beginPath();
    ctx.moveTo(p1.x, p1.y);
    ctx.lineTo(p2.x + curve.p2x, p2.y);
    ctx.bezierCurveTo(p2.x, p2.y, p2.x, p2.y, p2.x, p2.y - curve.p2y);
    ctx.lineTo(p3.x, p3.y + curve.p2y);
    ctx.bezierCurveTo(p3.x, p3.y, p3.x, p3.y, p3.x - curve.p3x, p3.y);
    ctx.lineTo(p4.x, p4.y);
    ctx.stroke();
  };
}
