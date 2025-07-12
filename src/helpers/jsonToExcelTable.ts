interface ExcelTableOptions {
  delimiter?: string;
  nullValue?: string;
  undefinedValue?: string;
}

export function jsonToExcelTable<T extends Record<string, any>>(
  jsonData: T[],
  options: ExcelTableOptions = {}
): string {
  if (!jsonData.length) {
    return "";
  }

  const { delimiter = "\t", nullValue = "", undefinedValue = "" } = options;

  const headers = Object.keys(jsonData[0]) as Array<keyof T>;

  let table = headers.join(delimiter) + "\n";

  jsonData.forEach((item) => {
    const row = headers
      .map((header) => {
        const value = item[header];
        if (value === null) {
          return nullValue;
        }
        if (value === undefined) {
          return undefinedValue;
        }
        return String(value);
      })
      .join(delimiter);

    table += row + "\n";
  });

  return table;
}
