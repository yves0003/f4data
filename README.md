![f4data](https://img.shields.io/badge/f4data-0.1.4-blue)

> View and understand your data directly in VS Code.

This extension allow to view and understand your data in VS Code. the support includes :
- Listing and navigate between all the dictionaries
- View the list of tables (data) by dictionary
- List of variables by tables
- List all documents in markdown format for a selected dictionary
- View definition of a table
- View definition of a variables
- Defined and update the working directory of each dictionary

![detail app](https://res.cloudinary.com/lokalistic/image/upload/v1725221577/vscode_ext/enregistrementapp2_sgx4hx.gif)

The extension only allow two types of file :

- csv : to read all information for the dictionaries, tables and the mapping
- markdown : to display other relevant informations (more the come like pdf, etc...)

# Getting start

To start using this extension, you need to:

1. Install the extension from the [market place](https://marketplace.visualstudio.com/items?itemName=yves0003.f4data)
2. Create a folder for each dictionary you want to display and visualize.

The created folder for each dictionary should contains the following file to work :

- folder `Documents` : where you can add any markdown (.md) file you want that help you understand your data.
- folder `Mappings` : where you can add csv file of the corresponding name (in **Capital letter**) of the corresponding variable in the file (list_vars_by_tables.csv).
- folder `Tables` : where you can add markdown (.md) file of the corresponding tables (in **Capital letter**) of on of the corresponding tables in the file (list_tables.csv).
- file `list_tabs.csv` : where you have relevant information of the list of tables you want to display. The mandatory column are: 
  - name : name of the tables
  - description : some explanation on the table
- file `list_vars_by_tabs.csv` : where you have relevant information on the differents columns of the tables. The mandatory column are:
  - table : the corresponding table in the file `list_tabs.csv`
  - vars : name of the columns in the corresponding table
  - description : some explanations of the variable (can be empty)
  - key : (not relevant) allow the know if the variable is part of the key in the tables
  - type : (not relevant) allow to knos the type of the variable (for example : num, date, char ....)

## Directory structure

```
├── Your first Dictionary
│   ├── Documents
│   │   ├── Change logs.md
│   ├── Mappings
│   │   ├── CATEGORIES.csv
│   ├── Tables
│   │   ├── USERS.md
│   ├── list_tabs.csv
│   ├── list_vars_by_tabs.csv
```

## To do

- [ ] Add a fonctionality for multiple languages
- [ ] Handle the cases for file not in capitalized letter
- [ ] Add the hability to add sub variables when the varibles can be split