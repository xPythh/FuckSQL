# FuckSQL   
"Because I got tired of using SQL Databases"

This project is really basic and is *PROBABLY* not really safe for actual uses outside of a controlled environment.

This shit was done in literally 6h, and its already better than most of the others ones public such as

node-json-db: https://www.npmjs.com/package/node-json-db

lowdb: https://github.com/typicode/lowdb

# Compatibilities
| OS  | Working 
|------------|----------
| `Windows` | YES 
| `Linux` | YES
| `MacOS` | YES

# Usage
```javascript
const DatabaseManager = require("./DatabaseManager");
// Creates folder "myWebsite" in main directoy
// Also supports subfolder "mySubfolder/myWebsite"
const database = DatabaseManager.load("myWebsite"); 

// Create a table /!\ Will override previous files if kept
// Each table has its own files (users => users.json) that is stored in the Database folder
database.createTable("users", 
{
    id: [0], // First array value is the type [int, bool, str] (objects too but hey not tested)
    username: [""],
    password: [""],
    email: ["", NULL] // Following values are properties, only implemented NULL because no purpose, if someone wants, next one is Auto Increment
});

// QUERIES
var usersTable = Database.getTable("users");
// Clear the table
usersTable.CLEAR();
// Insert into the table
usersTable.INSERT({
    id: 55,
    username: "MyUsername",
    password: "MyPassword"
    // The keys can be put in any order you feel like the best
    // Email is optional, not placing it for the example, will be counted as null
}); 

// Fetch Values (it will select all matching rows)
var querySecult = usersTable.SELECT({ id: 55 }).RESULT();
// Delete Values (it will delete all matching rows)
usersTable.SELECT({ id: 55 }).DELETE();
// Update Values (it will update all matchin rows)
usersTable.SELECT({ id: 55 }).UPDATE_TO({ email : "memberEmail@gmail.com" });
```

# Performances
Don't go over 50k entries on time-sensitive programs or on loops saving alot of the values in a short timespam.
Each update SAVES THE WHOLE JSON **obviously** so it **WILL CONSUME** alot of resources if you do many writing.
If someone want to do some performance with timers just make a pull request with the results it will be fun.

# Bugs / Features
**Open a pull request if you have a fix for a bug or if you feel like you want something to be added.**
