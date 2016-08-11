var Parse = require('parse/node');
var inquirer = require('inquirer');

var schemas = require('./schemas');
var transfer = require('./transfer');
var questions = require('./questions.js');

module.exports = initialize;

function initialize(config) {
  questions(config).then(function (answers) {
    config = Object.assign(config, answers);
    console.log(JSON.stringify(config, null, 2));
    return inquirer.prompt({
      type: 'confirm',
      name: 'next',
      message: 'About to start the file transfer. Does the above look correct?',
      default: true,
    });
  }).then(function(answers) {
    if (!answers.next) {
      console.log('Aborted!');
      process.exit();
    }
    Parse.initialize(config.applicationId, null, config.masterKey);
    Parse.serverURL = config.serverURL;
    return transfer.init(config);
  }).then(function() {
    return getAllFileObjects();
  }).then(function(objects) {
    return transfer.run(objects);
  }).then(function() {
    console.log('Complete!');
    process.exit();
  }).catch(function(error) {
    console.log(error);
    process.exit(1);
  });
}

function getAllFileObjects() {
  console.log("Fetching schema...");
  return schemas.get().then(function(res){
    console.log("Fetching all objects with files...");
    var schemasWithFiles = onlyFiles(res);
    return Promise.all(schemasWithFiles.map(getObjectsWithFilesFromSchema));
  }).then(function(results) {
    var files = results.reduce(function(c, r) {
      return c.concat(r);
    }, []);
    return Promise.resolve(files);
  });
}

function onlyFiles(schemas) {
  return schemas.map(function(schema) {
     var fileFields = Object.keys(schema.fields).filter(function(key){
       var value = schema.fields[key];
       return value.type == "File";
     });
     if (fileFields.length > 0) {
       return {
         className: schema.className,
         fields: fileFields
       }
     }
  }).filter(function(s){ return s != undefined })
}

function getAllObjects(baseQuery)  {
  var allObjects = [];
  var next = function(loop)
  {
	// Inc the start point of the query to make sure we get as much as possible (every row)
    if (allObjects.length) 
	{
		baseQuery.greaterThan('createdAt', allObjects[allObjects.length-1].createdAt);
    }
	// call query, returning ALL the objects possible
    return baseQuery.find({useMasterKey: true}).then(function(r)
	{
		allObjects = allObjects.concat(r);
		console.log("Working from " + (loop * 1000) + " to " + ((loop+1) * 1000)) ;  
		if (r.length == 0) 
		{
			return Promise.resolve(allObjects);
		} 
		else
		{
			return next(loop + 1);
		}
	});
  }
  return next(0);
}



function getObjectsWithFilesFromSchema(schema) {
  var query = new Parse.Query(schema.className);
  query.select(schema.fields.concat('createdAt'));
  query.ascending('createdAt');
  query.limit(1000);
  var entryNum = 0 ;
  return getAllObjects(query).then(function(results)
  {
    // flatten an array of arrays	
    return Promise.resolve(results.reduce(function(current, result)
	{
		process.stdout.write('Adding Entry ' + entryNum + '\r');
		entryNum ++ ;
		return current.concat(
        schema.fields.map(function(field){
		if ( result.get(field) )
		{
          return {
            className: schema.className,
            objectId: result.id,
            fieldName: field,
            fileName: result.get(field).name(),
            url: result.get(field).url()
          }
		}  
        })
      );
    }, [])).then(function(results)
	{
      return results.filter(function(n){ return n != undefined });  
	})
  });
}
