import { MouseEvent } from "react";

//https://css-tricks.com/direction-aware-hover-effects/
export const getMouseDirection = function (
  ev: MouseEvent<HTMLLIElement>,
  obj: HTMLElement
) {
  const w = obj.offsetWidth,
    h = obj.offsetHeight,
    y = ev.pageY - obj.offsetTop - (h / 2) * (h > w ? w / h : 1);
  return y;
};

export const getMouseDirectionX = function (
  ev: MouseEvent<HTMLLIElement | HTMLButtonElement>,
  obj: HTMLElement
) {
  const w = obj.offsetWidth,
    h = obj.offsetHeight,
    x =
      ev.clientX -
      obj.getBoundingClientRect().left -
      (w / 2) * (w > h ? h / w : 1);
  return x;
};
