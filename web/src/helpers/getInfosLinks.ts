import { Table } from "../components/Table";
import { Line } from "./Lines";

interface LinkRect {
  rect1: {
    table: string;
    variable: string;
  };
  rect2: {
    table: string;
    variable: string;
  };
}
[];

export const getInfosLinks = (
  list: Line[],
  link: LinkRect,
  allTables: Table[]
) => {
  const table1 = allTables.find(
    (table) => table.name.toLowerCase() === link.rect1.table.toLowerCase()
  );
  const table2 = allTables.find(
    (table) => table.name.toLowerCase() === link.rect2.table.toLowerCase()
  );
  if (table1 && table2) {
    const rect1 = table1.variables.find(
      (variable) =>
        variable.infos.name.toLowerCase() === link.rect1.variable.toLowerCase()
    );
    const rect2 = table2.variables.find(
      (variable) =>
        variable.infos.name.toLowerCase() === link.rect2.variable.toLowerCase()
    );
    if (rect1 && rect2) {
      list.push(Line.fromObject({ rect1, rect2 }));
    }
  }
  return list;
};
