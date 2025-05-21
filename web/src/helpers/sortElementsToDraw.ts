import { Table } from "../components/Table";
import { Line } from "./Lines";

const getPriority = (elt: Table | Line) => {
  if ("isMoving" in elt) {
    // Check if it's a link
    return elt.isMoving ? 2 : 0;
  } else {
    // It's a table
    return elt.cursorIsIn ? 3 : 1;
  }
};

export const sortElementsToDraw = (a: Table | Line, b: Table | Line) => {
  return getPriority(a) - getPriority(b);
};
