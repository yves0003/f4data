export function transformRefs(refs: Ref[]): Transformed[] {
  const seen = new Set<string>();
  const result: Transformed[] = [];
  if (refs && refs.length > 0) {
    for (const ref of refs) {
      const [leftTablePart, leftVariable] = ref.left.split(".");
      const rect1: TableVariable = {
        table: leftTablePart,
        variable: leftVariable,
      };

      const [rightTablePart, rightVariable] = ref.right.split(".");
      const rect2: TableVariable = {
        table: rightTablePart,
        variable: rightVariable,
      };

      const key = getKey(rect1, rect2);
      if (!seen.has(key)) {
        seen.add(key);
        result.push({ rect1, rect2 });
      }
    }
  }

  return result;
}

function getKey(a: TableVariable, b: TableVariable): string {
  const pair = [a, b].sort((x, y) => {
    const tableCompare = x.table.localeCompare(y.table);
    return tableCompare !== 0
      ? tableCompare
      : x.variable.localeCompare(y.variable);
  });
  return JSON.stringify(pair);
}
