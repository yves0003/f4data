![f4data](https://img.shields.io/badge/f4data-0.6.0-blue)

# f4data — Data Dictionary for VS Code

> 📊 **f4data** brings your data dictionary into VS Code. Instantly explore dictionaries, tables, variable definitions, and documentation — right in your editor. Ideal for credit analysts, quants, and model risk teams focused on model governance and data onboarding.

![f4data demo](https://res.cloudinary.com/lokalistic/image/upload/v1769034556/vscode_ext/f4data-example_t00er3.gif)

## Table of Contents

- [Features](#features)
- [Installation](#installation)
- [Getting Started](#getting-started)
- [File Format (.rd)](#file-format-rd)
- [Supported File Types](#supported-file-types)
- [Troubleshooting](#troubleshooting)
- [Contributing](#contributing)
- [License](#license)

---

## Features

f4data enables seamless data dictionary management within VS Code:

- 📚 **Navigate Dictionaries** — List and explore multiple dictionaries with ease
- 📊 **Visualize Tables** — Interactive canvas view with zoom, pan, and intelligent layout
- 🔍 **Explore Variables** — Browse all columns, types, constraints, and mappings per table
- 📖 **Markdown Documentation** — Attach rich documentation to tables and dictionaries
- 🔗 **Define Relationships** — Create foreign keys and multi-table relationships with visual links
- 📥 **Export to Excel** — Generate formatted data sheets from your schema definitions
- ⚙️ **Manage Workspace** — Set working directories and persist configuration per dictionary
- 🔄 **Real-time Updates** — Reload dictionaries on file changes (with refresh command)

---

## Installation

### Via VS Code Marketplace (Recommended)

1. Open **VS Code**
2. Go to **Extensions** (Ctrl+Shift+X / Cmd+Shift+X)
3. Search for **f4data**
4. Click **Install**
5. Reload VS Code if prompted

### Direct Link
[Install f4data from VS Code Marketplace](https://marketplace.visualstudio.com/items?itemName=yves0003.f4data)

---

## Getting Started

### Step 1: Create a Dictionary Folder

Create a new folder for each data dictionary you want to manage:

```
my_database/
├── Documents/        # General documentation (optional)
├── Tables/           # Table-specific docs (optional)
└── schema.rd         # Table & relationship definitions (required)
```

### Step 2: Define Your Schema

Create a `.rd` file (e.g., `schema.rd`) and define your tables:

```
# Table for all the users
TABLE users {
  id integer [PK]
  username varchar
  email varchar 
  created_at date
  role varchar
}

TABLE orders {
  id integer [PK]
  user_id integer
  total float
  status varchar
  created_at date
}

TABLE order_items {
  id integer [PK]
  order_id integer
  product_id integer
  quantity integer
  price float
}

enum user_role {
  admin: Administrator
  editor: Can modify
  viewer: Read-only
}

enum order.status {
  pending: Awaiting payment [note: "Waiting to be processed's"]
  paid: Payment confirmed
  shipped: In transit
  delivered: Delivered
  cancelled: Cancelled
}

ref: orders.user_id > users.id
ref: order_items.order_id - orders.id

```

### Step 3: Add Documentation (Optional)

Create markdown files to enhance your data dictionary:

- **`Documents/` folder** — Store general documentation (Change logs, modus operandi, etc.)
- **`Tables/` folder** — Store table-specific documentation (naming conventions, business logic, examples)

Example structure:
```
my_database/
├── Documents/
│   ├── Change_Log.md
│   ├── Architecture.md
├── Tables/
│   ├── users.md
│   ├── orders.md
└── schema.rd
```

### Step 4: View in VS Code

1. Open your workspace containing the dictionary folder
2. Look for **f4data** in the **Explorer** sidebar (or use View > Open View)
3. Click on your dictionary to expand it
4. Explore tables, variables, and documentation

---

## File Format (.rd)

The `.rd` (Reference Data) file is a custom format for defining your data schema.

### Syntax Overview

#### Tables
```
TABLE table_name {
  column_name: type [CONSTRAINTS]
  another_column: type
}
```

**Supported Types:**
- `integer`, `float`, `boolean`
- `varchar`, `text`, `string`
- `timestamp`, `date`
- (Custom types supported)

**Constraints:**
- `PK` — Primary Key


#### Mappings (Enums)
```
enum mapping_name {
  key1: "Description 1"
  key2: "Description 2"
  key3: "Description 3"
}
```

#### Relationships
```
ref: table1.column - table2.column
```

### Special Rules

- **Hidden Tables:** add an underscore to the end of a table name to exclude it from diagrams
  ```
  TABLE internal_cache_ { ... }
  ```
- **Comments:** Use `//` for single-line comments
  ```
  TABLE users {
    id: integer [PK]  // Unique identifier
  }
  ```

---

## Supported File Types

| Format | Purpose | Status |
|--------|---------|--------|
| `.rd` | Schema definitions (tables, variables, mappings, relationships) | ✅ Fully supported |
| `.md` | Documentation (markdown) for tables and dictionaries | ✅ Fully supported |
| `.pdf` | PDF documentation | 🔄 Planned |

---

## Configuration

### Settings

Access settings via **Preferences > Settings > f4data**:

- `f4data.excel.tableHeaderExcelColor.default` — Header color for default tables
- `f4data.excel.tableHeaderExcelColor.tables` — Header color for table sheets
- (More settings available in `package.json`)

### Working Directory

For each dictionary, you can set a **working directory** via:
1. Right-click dictionary in explorer
2. Select **Update Working Directory**
3. Enter the path to your data files

---

## Commands

| Command | Description |
|---------|-------------|
| `f4data.refreshDictsDir` | Reload all dictionaries |
| `f4data.addDictionaries` | Add a new dictionary |
| `f4data.exportToExcel` | Export schema to Excel |
| `f4data.clickOnDicItem` | Navigate to dictionary item |

---

## Troubleshooting

### Dictionary Not Appearing

**Problem:** Your dictionary folder doesn't appear in the f4data sidebar.

**Solutions:**
- Ensure your folder contains a `.rd` file
- Check that the folder structure matches the expected format
- Run **f4data: Refresh Dictionaries** command (Cmd+Shift+P / Ctrl+Shift+P)
- Reload VS Code (Cmd+R / Ctrl+R)

### Syntax Highlighting Not Working

**Problem:** `.rd` files don't have syntax highlighting.

**Solution:**
- Ensure the extension is installed correctly
- Manually set file language: Click language indicator (bottom-right) → Select "f4data"

### Mappings Not Linking

**Problem:** Variables with `[ref: ...]` don't show the mapping.

**Solution:**
- Ensure the mapping name matches exactly (case-sensitive)
- Verify the mapping is defined in the same `.rd` file

### Performance Issues with Large Dictionaries

**Problem:** Canvas is slow or unresponsive with 50+ tables.

**Solutions:**
- Hide large tables using underscore suffix (`table_name_`)
- Use the table search feature to filter visible tables
- Ensure your system has adequate memory

---

### Report Issues

Found a bug or have a feature request? [Open an issue on GitHub](https://github.com/yves0003/f4data/issues)

---

## Roadmap

- [x] View dictionaries and tables
- [x] Visualize table relationships
- [x] Export to Excel
- [ ] Multi-language support
- [ ] Advanced search filters

---

## License

This project is licensed under the **Non-Commercial Use License** — see the [LICENSE](LICENSE) file for details.

---

## About

**f4data** is built by [Yves](https://yveszendja.com) for teams that need clarity in their data landscape. Perfect for credit risk analysts, quants, and model governance teams.

**Keywords:** Data Dictionary, VS Code Extension, Data Governance, BCBS 239, SR 11-7, Credit Risk, Quant Finance, SAS

---

## Support

- 🐛 [Issue Tracker](https://github.com/yves0003/f4data/issues)
- 💬 Discussions (coming soon)

---

**Happy data exploring!** 🚀
