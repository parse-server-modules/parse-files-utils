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
    }, []).filter(function(file) {
      return file.fileName !== 'DELETE';
    });

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
  var next = function() {
    if (allObjects.length) {
      baseQuery.greaterThan('createdAt', allObjects[allObjects.length-1].createdAt);
    }
    return baseQuery.find({useMasterKey: true}).then(function(r){
      allObjects = allObjects.concat(r);
      if (r.length == 0) {
        return Promise.resolve(allObjects);
      } else {
        return next();
      }
    });
  }
  return next();
}

function getObjectsWithFilesFromSchema(schema) {
  var query = new Parse.Query(schema.className);
  query.select(schema.fields.concat('createdAt'));
  query.ascending('createdAt');
  query.limit(1000);

  var checks = schema.fields.map(function(field) {
      return new Parse.Query(schema.className).exists(field);
  });
  query._orQuery(checks);

  return getAllObjects(query).then(function(results) {
    return results.reduce(function(current, result){
      return current.concat(
        schema.fields.map(function(field){
          var fName = result.get(field) ? result.get(field).name() : 'DELETE';
          var fUrl = result.get(field) ? result.get(field).url() : 'DELETE';
          return {
            className: schema.className,
            objectId: result.id,
            fieldName: field,
            fileName: fName,
            url: fUrl
          }
        })
      );
    }, []);
  });
}
