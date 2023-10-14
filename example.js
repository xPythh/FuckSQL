const DatabaseManager = require("./DatabaseManager");

const DB = DatabaseManager.LOAD("DB");

// Create a new Table if not exists
if (!DB.GET_TABLE("users"))
  DB.CREATE_TABLE("users", {
    "id": [0, "AUTOINCR"]
    "username": [""],
    "password": [""],
    "email": ["", null]
  });

// Get the new table
var usersTable = Database.getTable("users");
users.INSERT({
  id: null,
  username: "MyUsername",
  password: "MyPassword",
  email: null
});

var query = usersTable.SELECT({ username: "MyUsername" })[0]; // First result of the SELECT 
if (!query) 
  return console.log(`User not found`); // <- This line will NOT execute because the user is in the database

query.UPDATE_TO({ email: "MyEmail@gmail.com" });
  
query = usersTable.SELECT({ email: "MyEmail@gmail.com" });

query.DELETE();

usersTable.CLEAR();

usersTable.DROP();
