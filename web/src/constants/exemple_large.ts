export const exemple_large = {
  tables: [
    // 50 tables generated with variable lists
    // Each table contains an _id (string), name, description, variables[], date, __v
    // Variables include common fields used elsewhere in the project
    // We'll generate table_0 .. table_49
  ] as any,
  mappings: [] as any,
  links: [] as any,
};

// Programmatically fill tables, mappings and links for easier reading in code editors
(() => {
  const types = [
    "integer",
    "varchar",
    "timestamp",
    "float",
    "boolean",
    "text",
    "date",
  ];
  const settingsPools = [[], ["pk"], ["pk", '"unique"'], ['"not null"']];
  const color = "lightgrey";

  const tables: any[] = [];
  for (let t = 0; t < 50; t++) {
    const varCount = 3 + (t % 10); // between 3 and 12
    const vars: any[] = [];
    for (let v = 0; v < varCount; v++) {
      const type = types[(t + v) % types.length];
      const isPk = v === 0; // first var as id primary key
      const name = isPk ? "id" : `col_${t}_${v}`;
      const settings = isPk
        ? ["pk", '"unique"']
        : settingsPools[(t + v) % settingsPools.length];
      vars.push({
        _id: `${t}-${v}`,
        name,
        desc: "",
        type,
        cle: isPk,
        color,
        typeVar: type,
        settings,
        hasMapping: false,
      });
    }

    tables.push({
      cursorIsIn: false,
      position: { pos_x: 0, pos_y: 0 },
      _id: `${t}`,
      name: `table_${t}`,
      description: `Generated table ${t}`,
      variables: vars,
      date: "2025-01-01",
      __v: 0,
    });
  }

  // Some realistic names replacements for variety
  const niceNames: Record<number, string> = {
    0: "users",
    1: "products",
    2: "orders",
    3: "order_items",
    4: "customers",
    5: "suppliers",
    6: "invoices",
    7: "payments",
    8: "categories",
    9: "addresses",
    10: "sessions",
    11: "logs",
    12: "events",
    13: "tags",
    14: "roles",
    15: "permissions",
  };
  Object.keys(niceNames).forEach((k) => {
    const idx = Number(k);
    if (tables[idx]) tables[idx].name = niceNames[idx as any];
  });

  // Create some mappings (enums, lookup tables)
  const mappings: any[] = [];
  mappings.push({
    type: "Enum",
    table: "Global",
    name: "order_status",
    members: [
      { key: "created", description: "order created", note: "" },
      { key: "paid", description: "order paid", note: "" },
      { key: "shipped", description: "order shipped", note: "" },
      { key: "cancelled", description: "order cancelled", note: "" },
    ],
  });
  mappings.push({
    type: "Enum",
    table: "Global",
    name: "user_role",
    members: [
      { key: "admin", description: "administrator", note: "" },
      { key: "editor", description: "can edit", note: "" },
      { key: "viewer", description: "read only", note: "" },
    ],
  });
  mappings.push({
    type: "Map",
    table: "countries",
    name: "country_codes",
    members: [
      { key: "FR", description: "France", note: "" },
      { key: "US", description: "United States", note: "" },
      { key: "DE", description: "Germany", note: "" },
    ],
  });

  // Attach some mappings to random variables
  for (let i = 0; i < 10; i++) {
    const ti = i % tables.length;
    const vi = 1 + (i % (tables[ti].variables.length - 1));
    tables[ti].variables[vi].hasMapping = true;
  }

  // Create links (relations) between tables: many to one, one to many, diverse relationships
  const links: any[] = [];
  function addLink(
    leftTable: number,
    leftColIndex: number,
    rightTable: number,
    rightColIndex: number,
    rel = ">"
  ) {
    const left = `${tables[leftTable].name}.${tables[leftTable].variables[leftColIndex].name}`;
    const right = `${tables[rightTable].name}.${tables[rightTable].variables[rightColIndex].name}`;
    links.push({ type: "Ref", left, relationship: rel, right });
  }

  // Common foreign keys: orders -> customers, order_items -> orders, products -> categories
  const nameToIndex: Record<string, number> = {};
  tables.forEach((t, idx) => (nameToIndex[t.name] = idx));

  // orders -> customers
  if (
    nameToIndex["orders"] !== undefined &&
    nameToIndex["customers"] !== undefined
  ) {
    addLink(nameToIndex["orders"], 1, nameToIndex["customers"], 0, ">");
  }
  // order_items -> orders
  if (
    nameToIndex["order_items"] !== undefined &&
    nameToIndex["orders"] !== undefined
  ) {
    addLink(nameToIndex["order_items"], 1, nameToIndex["orders"], 0, ">");
  }
  // order_items -> products
  if (
    nameToIndex["order_items"] !== undefined &&
    nameToIndex["products"] !== undefined
  ) {
    addLink(nameToIndex["order_items"], 2, nameToIndex["products"], 0, ">");
  }

  // Generate additional random relations across tables
  for (let r = 0; r < 60; r++) {
    const a = Math.floor(Math.random() * tables.length);
    let b = Math.floor(Math.random() * tables.length);
    if (b === a) b = (b + 1) % tables.length;
    const aCol = Math.floor(
      Math.random() * Math.max(1, tables[a].variables.length)
    );
    const bCol = Math.floor(
      Math.random() * Math.max(1, tables[b].variables.length)
    );
    const rels = [">", "<>", "=", "1..*", "*..*"];
    const rel = rels[r % rels.length];
    addLink(a, aCol, b, bCol, rel);
  }

  // Assign generated arrays to export
  (exemple_large as any).tables = tables;
  (exemple_large as any).mappings = mappings;
  (exemple_large as any).links = links;
})();

export default exemple_large;
