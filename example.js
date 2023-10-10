const DatabaseManager = require("./DatabaseManager");

const myDatabase = DatabaseManager.load("coolDatabase");

var users = Database.getTable("users"); // Assuming its already created

users.SELECT({ id: 1 }).UPDATE_TO({ id: 5 }); 

console.log( users.SELECT({ id: 5 }).RESULT() ); // Returns 1 entry 
