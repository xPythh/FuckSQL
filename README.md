# FuckSQL   
"Because I got tired of using SQL Databases"<br>
This project holds on less than 400 lines, yet is already better than all of the similar projects:<br>
node-json-db: https://www.npmjs.com/package/node-json-db<br>
lowdb: https://github.com/typicode/lowdb<br>

# Compatibilities
| OS  | Working 
|------------|----------
| `Windows` | YES 
| `Linux` | YES
| `MacOS` | YES

# Usage
```javascript
const DatabaseManager = require("./DatabaseManager");
// Creates the databaseFolder "db" in main directoy (IF NOT EXISTING ALREADY)
const DB = DatabaseManager.LOAD("db"); 

// Create a table 
var tableSettings = { // Table Settings (Optionals)
    saveInterval: 500 // How fast will the database be checked for save (Default: 100)
};
/*
   Each table has its own file (users => users.json) that is stored in the Database folder
   Each key has an array, first value of the array represents the type, all the following
       values are other properties (See following example)
*/
DB.CREATE_TABLE("users", 
{
    "id": [0, "AUTOINCR"], // key id of type int with autoincrement
    "username": [""], //  key username of type string
    "password": [""], // key password of type string
    "email": ["", null] // key email of type string that is nullable
}, tableSettings); 

// Get a table exists (helps us to check if it exists, can be coupled with .CREATE_TABLE for example)
if (!DB.GET_TABLE("users")) { /* ... */ }

// Rename a table (will not be applied to the following examples)
DB.RENAME("newDatabaseName");

// Delete the table (will not be applied to the following examples)
DB.DROP();

// Close the database (if you want to end the program cleanly, do that or it will hang forever)
DB.close();

// Using of a table
var usersTable = DB.GET_TABLE("users");

// Inserting values
usersTable.INSERT({
    id: null, // you can either not put the autoincrement key or put it to null, both works
    username: "MyUsername",
    password: "MyPassword",
    email: null
});

// Getting Values
var query = usersTable.SELECT({ username: "MyUsername" });

// Accessing the variable query directly will give you the array of matching values
console.log(query); // [  /*user inserted before*/  ]

// Updating the queries
query.UPDATE_TO({ email: "MyEmail@gmail.com" });

// Delete the queries (All matching rows will be removed)
query.DELETE();

// Clear the table entries
usersTable.CLEAR();

// Delete the table
usersTable.DROP();
```

# Performances
After updating the saving system, it boosted the performances **MASSIVELY** (3000x faster | 99.95%).<br>
The *files will not be saved at every update* query done, instead each table have its own dedicated<br>
&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;thread that will handle the storing the updating of the database file. The interval between each<br>
&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;**check** is 100ms (*every .1s*) and will instantly update the file to apply the results.<br>

Here is a performance comparaison:
<br>
Old Method: <br>
 * Inserting 10.000 value: **~45s**

New Method:
 * Inserting 10.000 values: **~0.015s** (.015s)
 * Inserting 100.000 values: **~0.070s** (.07s)
 * Inserting 1.000.000 values: **~0.500s** (.6s)


#### Bugs / Features
**Open a pull request if you have a fix for a bug or if you feel like you want something to be added.**
