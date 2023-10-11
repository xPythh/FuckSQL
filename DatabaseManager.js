const fs = require("fs");
const crypto = require("crypto");
const util = require('util');


var databases = [];

var trueTypeOf = (obj) => Object.prototype.toString.call(obj).slice(8, -1).toLowerCase()

var isObjectMatch = (obj1, obj2) => {
    for (const key in obj2) 
    {
        if (obj1[key] !== obj2[key]) {
            return false;
        }
    }
    return true;
};

class Database 
{
	#folder = null;

	#endThread = false;

	#tables = []
	get tables() { return this.#tables; }

	constructor(dbFolder)
	{
		if (!/^[a-zA-Z_]+$/.test(dbFolder)) throw new Error(`Database name can only be made out of regular alphabetic characters.`);

		this.#folder = `./${dbFolder}/`;

		if (!fs.existsSync(this.#folder))
    		this.#buildDatabase(this.#folder, options)

    	var tableFiles = fs.readdirSync(this.#folder);
    	for (var tableFile of tableFiles)
    	{
    		var table = new Table(`${this.#folder}${tableFile}`);
    		table.load();
    		this.#tables.push(table);
    	}
	}

	close()
	{
		if (this.#endThread) throw new Error(`Cannot communicate with closed database.`);

		for (var table of this.#tables)
			table.close();

		this.#endThread = true;
	}

	DROP()
	{
		if (this.#endThread) throw new Error(`Cannot communicate with closed database.`);

		for (var table of this.#tables)
			table.DROP();

		fs.rmdirSync(this.#folder);
		this.#endThread = true;
	}

	RENAME(newDbName)
	{
		if (this.#endThread) throw new Error(`Cannot communicate with closed database.`);

		if (!/^[a-zA-Z_]+$/.test(newDbName)) throw new Error(`Database name can only be made out of regular alphabetic characters.`);
		
		var tableFiles = this.#tables.map(table => {
			var name = table.name
			table.close();
			return name;
		});

		fs.renameSync(this.#folder, `./${newDbName}`);

		this.#tables = [];
		this.#folder = `./${newDbName}/`;
    	
    	for (var tableFile of tableFiles)
    	{
    		var table = new Table(`${this.#folder}${tableFile}`);
    		table.load();
    		this.#tables.push(table);
    	}
	}

	CREATE_TABLE(tableName = null, structure = {}, config = {})
	{
		if (!/^[a-zA-Z_]+$/.test(tableName)) throw new Error(`Table name can only be made out of regular alphabetic characters.`);

		if (trueTypeOf(structure) !== "object") throw new Error(`Table structure has to be an object.`);
		if (trueTypeOf(config) !== "object") throw new Error(`Table config has to be an object.`);

		if (this.GET_TABLE(tableName)) throw new Error(`Table already exists.`);

		var finalStructure = {};

		for (var keyName of Object.keys(structure))
		{
			var properties = structure[keyName];
			if (trueTypeOf(properties) !== "array") throw new Error(`Structure properties has to be an array.`);

			var type = properties.shift();
			if (trueTypeOf(type) === "null" || trueTypeOf(type) === "undefined") throw new Error(`First argument of Structure property has to be a variable according to the type`)

			finalStructure[keyName] = {
				type: trueTypeOf(type),
				nullable: properties.includes(null),
				autoIncr: properties.includes("AUTOINCR")
			}

			if (finalStructure.autoIncr && type !== "number") throw new Error(`Cannot use autoincrement on ${keyName} wich has type ${type} instead of number`);
		}

		if (config.saveInterval && trueTypeOf(config.saveInterval) !== "number")
			throw new Error(`Config saveInterval has to be a number`);

		config.saveInterval = (config.saveInterval >= 0) ? config.saveInterval : 100;


		var table = new Table(`${this.#folder}${tableName}.json`);
		table.create(finalStructure, config);
		this.#tables.push(table);
	}

	GET_TABLE(tableName) { return this.#tables.find(table => table.name === `${tableName}.json`); }

	#buildDatabase(dbFolder, options)
	{
    	fs.mkdirSync(this.#folder);
    	if (options.createExampleTable); // TODO
	}

}

class Table
{
	#path = null;
	name = null;

	#structure = null;
	#config = null;
	#data = [];

	/* Thread Saving System */
	#dbHash = null;
	#endThread = false;
	#saveThread = null;

	constructor(path)
	{
		this.#path = path;
		this.name = this.#path.split("/")[this.#path.split("/").length-1];
	}

	// SELF DESTROY [By Database Class]
	load()
	{
		var content = JSON.parse(fs.readFileSync(this.#path, 'utf-8'));

		this.#structure = content.structure;
		this.#config = content.config;
		this.#data = content.data;

		this.#autoSave();
		this.#saveThread = setInterval(() => { this.#autoSave(); }, this.#config.saveInterval);

		delete this.load; // Once one of them are executed, we don't want them accessible
		delete this.create;
	}

	// SELF DESTROY [By Database Class]
	create(structure, config)
	{
		this.#structure = structure;
		this.#config = {
			saveInterval: config.saveInterval,
			autoIncr: (Object.keys(this.#structure).find(key => this.#structure[key].autoIncr)) ? 0 : -1
		}
		this.#data = [];
		
		this.#saveThread = setInterval(() => { this.#autoSave(); }, this.#config.saveInterval);

		delete this.create;
		delete this.load;
	}

	close() { this.#endThread = true; }

	#autoSave()
	{	
		var freshHash = crypto.createHash('md5').update(
			JSON.stringify({ 
				structure: this.#structure,
				config: this.#config, 
				data: this.#data 
			})
		).digest('hex');

		if (this.#dbHash === null || this.#dbHash !== freshHash) 
		{
			this.#dbHash = freshHash;
			fs.writeFileSync(this.#path, 
				JSON.stringify({ 
					structure: this.#structure,
					config: this.#config, 
					data: this.#data 
				})
			);
		}

		if (this.#endThread)
			clearInterval(this.#saveThread);
	}

	INSERT(values)
	{
		if (this.#endThread) throw new Error(`Cannot communicate with closed table.`);

		if (trueTypeOf(values) !== "object") throw new Error(`Values has to be an object.`);

		var finalEntry = {};
		for (var keyName of Object.keys(this.#structure))
		{
			var structProperties = this.#structure[keyName];
			var value = values[keyName];

			// Auto Increment
			if (structProperties.autoIncr)
			{
				if (value !== null && value !== undefined) throw new Error(`${keyName} has to be null as an autoincrement`);
			
				finalEntry[keyName] = this.#config.autoIncr++;
				continue;
			}

			// Nullable
			if (value === null || value === undefined)
			{
				if (!structProperties.nullable) throw new Error(`${keyName} cannot be nullable.`);

				finalEntry[keyName] = null;
				continue;
			}

			if (trueTypeOf(value) !== structProperties.type)
				throw new Error(`${keyName} is not of type ${trueTypeOf(value)}.`);

			finalEntry[keyName] = value;
		}
		this.#data.push(finalEntry);
	}

	SELECT(values)
	{
		if (this.#endThread) throw new Error(`Cannot communicate with closed table.`);

		if (trueTypeOf(values) !== "object") throw new Error(`Values has to be an object.`);

		for (var keyName of Object.keys(values))
			if (!this.#structure[keyName]) throw new Error(`Key ${keyName} not present in structure`);

		var matchingIndexes = [];
		this.#data.forEach((obj, index) => 
		{
		    if (isObjectMatch(obj, values)) 
		        matchingIndexes.push(index);   
		});

		return {
  			[util.inspect.custom]: () =>
			{ 
				if (this.#endThread) throw new Error(`Cannot communicate with closed table.`);
				return matchingIndexes.map(index => index = this.#data[index] ); 
			},

			DELETE: () => 
			{
				if (this.#endThread) throw new Error(`Cannot communicate with closed table.`);
				
				for (var matchingIndex of matchingIndexes)
					this.#data.splice(matchingIndex, 1);
			},
			UPDATE_TO: (values) =>
			{
				if (this.#endThread) throw new Error(`Cannot communicate with closed table.`);
				
				for (var matchingIndex of matchingIndexes)
					for (var keyName of Object.keys(values))
					{
						if (!this.#structure[keyName]) throw new Error(`Key ${keyName} not present in structure`);
						this.#data[matchingIndex][keyName] = values[keyName];
					}
			}
		}
	}

	CLEAR()
	{
		if (this.#endThread) throw new Error(`Cannot communicate with closed table.`);

		this.#data = [];
		this.#config.autoIncr = (this.#config.autoIncr === -1) ? -1 : 0;
	}

	DROP()
	{
		if (this.#endThread) throw new Error(`Cannot communicate with closed table.`);

		this.close();
		fs.unlinkSync(this.#path);
	}
}



module.exports = {	
	LOAD: (dbFolder = null) =>
	{
		if (!dbFolder) throw new Error(`Folder name for the database not provided.`);

		var database = new Database(dbFolder);

	    databases.push(database);
	    return database;
	}
};
