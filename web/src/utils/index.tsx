import { MouseEvent } from "react";
import { flattenArray } from "./flattenArray";
import { OutputTable } from "../helpers/ast_to_data2";

type Point = {
  x: number;
  y: number;
};
type Circle = Point & { radius: number };
type Rect = Point & { width: number; height: number };

export { flattenArray };

export const maxWidthText = function <T extends OutputTable["variables"]>(
  arr: T,
  ctx: CanvasRenderingContext2D,
  textSize: number,
  police: string
) {
  ctx;
  let len = arr.length,
    max = -Infinity;
  ctx.font = `${textSize}px ${police}`;
  while (len--) {
    if (ctx.measureText(arr[len].name).width > max) {
      max = ctx.measureText(arr[len].name).width;
    }
  }
  return max;
};
export const createHiPPICanvas = function (
  canvas: HTMLCanvasElement | null,
  width: number,
  height: number
) {
  if (!canvas) return;
  const ratio = window.devicePixelRatio;
  canvas.width = width * ratio;
  canvas.height = height * ratio;
  canvas.style.width = width.toString() + "px";
  canvas.style.height = height.toString() + "px";
  canvas.getContext("2d")?.scale(ratio, ratio);
  return canvas;
};
export const getCursorPosition = function (
  canvas: HTMLCanvasElement,
  event: MouseEvent<HTMLCanvasElement>
) {
  const rect = canvas.getBoundingClientRect();
  const clientX = event.clientX - rect.left;
  const clientY = event.clientY - rect.top;
  return { clientX, clientY };
};

export const norm = function (value: number, min: number, max: number) {
  return (value - min) / (max - min);
};

export const lerp = function (norm: number, min: number, max: number) {
  return (max - min) * norm + min;
};

export const map = function (
  value: number,
  sourceMin: number,
  sourceMax: number,
  destMin: number,
  destMax: number
) {
  return lerp(norm(value, sourceMin, sourceMax), destMin, destMax);
};

export const clamp = function (value: number, min: number, max: number) {
  return Math.min(Math.max(value, Math.min(min, max)), Math.max(min, max));
};

export const distance = function (p0: Point, p1: Point) {
  const dx = p1.x - p0.x,
    dy = p1.y - p0.y;
  return Math.sqrt(dx * dx + dy * dy);
};

export const distanceXY = function (
  x0: number,
  y0: number,
  x1: number,
  y1: number
) {
  const dx = x1 - x0,
    dy = y1 - y0;
  return Math.sqrt(dx * dx + dy * dy);
};

export const circleCollision = function (c0: Circle, c1: Circle) {
  return distance(c0, c1) <= c0.radius + c1.radius;
};

export const circlePointCollision = function (
  x: number,
  y: number,
  circle: Circle
) {
  return distanceXY(x, y, circle.x, circle.y) < circle.radius;
};

export const pointInRect = function (x: number, y: number, rect: Rect) {
  return (
    inRange(x, rect.x, rect.x + rect.width) &&
    inRange(y, rect.y, rect.y + rect.height)
  );
};

export const inRange = function (value: number, min: number, max: number) {
  return value >= Math.min(min, max) && value <= Math.max(min, max);
};

export const rangeIntersect = function (
  min0: number,
  max0: number,
  min1: number,
  max1: number
) {
  return (
    Math.max(min0, max0) >= Math.min(min1, max1) &&
    Math.min(min0, max0) <= Math.max(min1, max1)
  );
};

export const rectIntersect = function (r0: Rect, r1: Rect) {
  return (
    rangeIntersect(r0.x, r0.x + r0.width, r1.x, r1.x + r1.width) &&
    rangeIntersect(r0.y, r0.y + r0.height, r1.y, r1.y + r1.height)
  );
};

export const degreesToRads = function (degrees: number) {
  return (degrees / 180) * Math.PI;
};

export const radsToDegrees = function (radians: number) {
  return (radians * 180) / Math.PI;
};

export const randomRange = function (min: number, max: number) {
  return min + Math.random() * (max - min);
};

export const randomInt = function (min: number, max: number) {
  return Math.floor(min + Math.random() * (max - min + 1));
};

export const roundToPlaces = function (value: number, places: number) {
  const mult = Math.pow(10, places);
  return Math.round(value * mult) / mult;
};

export const roundNearest = function (value: number, nearest: number) {
  return Math.round(value / nearest) * nearest;
};

export const quadraticBezier = function (
  p0: Point,
  p1: Point,
  p2: Point,
  t: number,
  pFinal: Point
) {
  pFinal = pFinal || {};
  pFinal.x = Math.pow(1 - t, 2) * p0.x + (1 - t) * 2 * t * p1.x + t * t * p2.x;
  pFinal.y = Math.pow(1 - t, 2) * p0.y + (1 - t) * 2 * t * p1.y + t * t * p2.y;
  return pFinal;
};

export const cubicBezier = function (
  p0: Point,
  p1: Point,
  p2: Point,
  p3: Point,
  t: number,
  pFinal: Point
) {
  pFinal = pFinal || {};
  pFinal.x =
    Math.pow(1 - t, 3) * p0.x +
    Math.pow(1 - t, 2) * 3 * t * p1.x +
    (1 - t) * 3 * t * t * p2.x +
    t * t * t * p3.x;
  pFinal.y =
    Math.pow(1 - t, 3) * p0.y +
    Math.pow(1 - t, 2) * 3 * t * p1.y +
    (1 - t) * 3 * t * t * p2.y +
    t * t * t * p3.y;
  return pFinal;
};
//flattenArray,
export const getLongestName = (arr: OutputTable["variables"]) => {
  if (arr.length === 0) return "";
  return arr.reduce(
    (acc, current) => (current.name.length > acc.name.length ? current : acc),
    arr[0]
  ).name;
};
export const worldToScreen = (
  ctx: CanvasRenderingContext2D,
  worldX: number,
  worldY: number
) => {
  const originalPoint = new DOMPoint(worldX, worldY);
  return ctx.getTransform().invertSelf().transformPoint(originalPoint);
};
export const screenToWorld = (screenX: number, screenY: number) => {
  return {
    x: screenX,
    y: screenY,
  };
};

export function getElementAtPosition(
  clientX: number,
  clientY: number,
  elements: OutputTable[],
  ctx: CanvasRenderingContext2D,
  fontSize: number,
  margin: number
) {
  return elements.find((element) =>
    isInElementHeader(clientX, clientY, element, ctx, fontSize, margin)
  );
}

export function isInElementHeader(
  clientX: number,
  clientY: number,
  element: OutputTable,
  ctx: CanvasRenderingContext2D,
  fontSize: number,
  margin: number,
  nbvar = 1
) {
  const longestVarName = getLongestName(element.variables) || "";
  const maxWidth = ctx.measureText(longestVarName).width;
  const tableHeight = (fontSize + margin * 2) * nbvar;
  return (
    clientX >= element.position.pos_x &&
    clientX <= element.position.pos_x + maxWidth + margin * 2 &&
    clientY >= element.position.pos_y &&
    clientY <= element.position.pos_y + tableHeight
  );
}
export function cursorIsInTable(
  clientX: number,
  clientY: number,
  elements: OutputTable[],
  ctx: CanvasRenderingContext2D,
  fontSize: number,
  margin: number
) {
  return elements.find((element) =>
    isInElementHeader(
      clientX,
      clientY,
      element,
      ctx,
      fontSize,
      margin,
      element.variables.length + 1
    )
  );
}
