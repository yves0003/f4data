![f4data](https://img.shields.io/badge/f4data-0.4.3-blue)

> 📊 f4data brings your data dictionary into VS Code. Instantly explore dictionaries, tables, variable definitions, and documentation — right in your editor. Ideal for credit analysts, quants, and model risk teams focused on model and onboarding.

This extension allow to view and understand your data in VS Code. the support includes :
- Listing and navigate between all the dictionaries
- View the list of tables (data) by dictionary
- List of variables by tables
- List all documents in markdown format for a selected dictionary
- View definition of a table
- View definition of a variables
- Defined and update the working directory of each dictionary

![detail app](https://res.cloudinary.com/lokalistic/image/upload/v1753987940/vscode_ext/f4ext-vscode.gif)

The extension only allow two types of file :

- rd : to write, read and update all informations for the dictionaries, tables and the mapping
- markdown : to display other relevant informations (more the come like pdf, etc...)

# Getting start

To start using this extension, you need to:

1. Install the extension from the [market place](https://marketplace.visualstudio.com/items?itemName=yves0003.f4data)
2. Create a folder for each dictionary you want to display and visualize.

The created folder for each dictionary should contains the following structure to work :

- folder `Documents` : where you can add any markdown (.md) file you want that help you understand your data.
- folder `Tables` : where you can add a markdown file (.md) with the name of a selected tables you want that help you understand your data.
- a `rd` file : where you can define your tables, the variables, the mappings and the links between tables.

## Directory structure

```
├── Your first Dictionary
│   ├── Documents
│   │   ├── Change logs.md
│   ├── Tables
│   ├── test.rd

```

## To do

- [ ] Add a fonctionality for multiple languages
