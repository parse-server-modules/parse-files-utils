var Parse = require('parse/node');
var inquirer = require('inquirer');

var schemas = require('./schemas');
var transfer = require('./transfer');
var questions = require('./questions.js');

var stringFileRegex = new RegExp(/^(?=.*\bhttp\b)(?=.*\bparsetfss\b)(?=.*\btfss-\b).*$/);

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
    return getAllFileObjects(config);
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

function getAllFileObjects(config) {
  console.log("Fetching schema...");
  return schemas.get().then(function(res){
    console.log("Fetching all objects with files...");
    if (config.onlyFiles){
      var schemasWithFiles = onlyFiles(res);
    } else {
      var schemasWithFiles = filesAndFilesArray(res, config.extraFields);
    }
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

function filesAndFilesArray(schemas, extra) {
  return schemas.map(function(schema) {
    var fileFields = Object.keys(schema.fields).filter(function(key){
      var value = schema.fields[key];

      var is_valid = false;

      if (extra[schema.className] != undefined){
        if (extra[schema.className].indexOf(key) != -1){
          is_valid = true;
        }
      }

      return (value.type == "File") || (is_valid);
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
      var fileResults = [];
      schema.fields.map(function(field){
        if (Array.isArray(result.get(field))) {
          for (var i = 0; i < result.get(field).length; i++) {
            if (result.get(field)[i].name !== undefined){
              var fName = result.get(field)[i] ? result.get(field)[i].name() : 'DELETE';
              var fUrl = result.get(field)[i] ? result.get(field)[i].url() : 'DELETE';

              fileResults.push({
                className: schema.className,
                objectId: result.id,
                fieldName: field,
                fileName: fName,
                url: fUrl,
                i: i
              });
            }
          }
        } else if ((typeof result.get(field) === 'string') && (stringFileRegex.test(result.get(field)))){
          var fUrl = result.get(field) ? result.get(field) : 'DELETE';
          if (fUrl != 'DELETE') {
            var splitString = fUrl.split("/");
            var fName = splitString[splitString.length-1];
          } else {
            var fName = 'DELETE';
          }
          fileResults.push({
            className: schema.className,
            objectId: result.id,
            fieldName: field,
            fileName: fName,
            url: fUrl,
            i: 0,
            type: 'string'
          })
        } else if (typeof result.get(field) != 'string') {
          var fName = result.get(field) ? result.get(field).name() : 'DELETE';
          var fUrl = result.get(field) ? result.get(field).url() : 'DELETE';
          fileResults.push({
            className: schema.className,
            objectId: result.id,
            fieldName: field,
            fileName: fName,
            url: fUrl,
            i: 0
          })
        }
      });
      return current.concat(fileResults);
    }, []);
  });
}
