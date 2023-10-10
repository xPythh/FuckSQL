const fs = require("fs");

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
	name = null;

	#tables = []
	get tables() { return this.#tables; }

	getTable(tableName)
	{
		return this.#tables.find(table => table.name === `${tableName}.json`);
	}

	constructor(dbFolder, options = {})
	{
		this.#folder = `./${dbFolder}/`;
		this.name = this.#folder.split("/")[1];

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

	createTable(tableName, structure)
	{
		if (!/^[a-zA-Z]+$/.test(tableName)) throw new Error(`Table name can only be made out of regular alphabetic characters.`);

		if (trueTypeOf(structure) !== "object") throw new Error(`Table structure has to be an object.`);

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
			}
		}

		var table = new Table(`${this.#folder}${tableName}`);
		table.create(finalStructure);
		this.#tables.push(table);
	}

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
	#data = [];

	hello = "world";

	constructor(path)
	{
		this.#path = path;
		this.name = this.#path.split("/")[this.#path.split("/").length-1];
	}

	load()
	{
		var content = JSON.parse(fs.readFileSync(this.#path, 'utf-8'));

		this.#structure = content.structure;
		this.#data = content.data;

		delete this.load; // Once one of them are executed, we don't want them accessible
		delete this.create;
	}

	#save()
	{
		fs.writeFileSync(this.#path, JSON.stringify({ structure: this.#structure, data: this.#data }));
	}

	create(structure)
	{
		this.#structure = structure;
		this.#data = [];
		
		this.#save();

		delete this.create;
		delete this.load;
	}

	INSERT(values)
	{
		if (trueTypeOf(values) !== "object") throw new Error(`Values has to be an object.`);

		var finalEntry = {};
		for (var keyName of Object.keys(this.#structure))
		{
			var structProperties = this.#structure[keyName];
			var value = values[keyName];


			if (value === null || value === undefined)
			{
				if (!structProperties.nullable) throw new Error(`${keyName} of table ${this.name} cannot be nullable.`);

				finalEntry[keyName] = null;
				continue;
			}

			if (trueTypeOf(value) !== structProperties.type)
				throw new Error(`${keyName} is not of type ${trueTypeOf(value)}.`);

			finalEntry[keyName] = value;
		}
		this.#data.push(finalEntry);
		this.#save();
	}

	SELECT(values)
	{
		if (trueTypeOf(values) !== "object") throw new Error(`Values has to be an object.`);

		for (var keyName of Object.keys(values))
			if (!this.#structure[keyName]) throw new Error(`Key ${keyName} not present in structure`);

		var matchingIndexes = [];
		this.#data.forEach((obj, index) => 
		{
		    if (isObjectMatch(obj, values)) {
		        matchingIndexes.push(index);
		    }
		});

		return {
			RESULT: () => { return matchingIndexes.map(index => index = this.#data[index] ); },

			DELETE: () => 
			{
				for (var matchingIndex of matchingIndexes)
					this.#data.splice(matchingIndex, 1);

				this.#save();
			},
			UPDATE_TO: (values) =>
			{
				for (var matchingIndex of matchingIndexes)
				{
					for (var keyName of Object.keys(values))
						this.#data[matchingIndex][keyName] = values[keyName];
				}
				this.#save();
			}
		}
	}

	CLEAR()
	{
		this.#data = [];
		this.#save();
	}
}



module.exports = {
	databases: databases,
	
	load: (dbFolder = null) =>
	{
		if (!dbFolder) throw new Error(`Folder name for the database not provided.`);

		var database = new Database(dbFolder);

	    databases.push(database);
	    return database;
	}
};
