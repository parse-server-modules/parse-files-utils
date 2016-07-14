var inquirer = require('inquirer');
var Parse = require('parse/node');
var schemas = require('./schemas');

module.exports = initialize;

function initialize(config) {
  var questions = [
    {
      type: 'input',
      name: 'applicationId',
      message: 'The applicationId',
      when: !config.applicationId
    }, {
      type: 'input',
      name: 'masterKey',
      message: 'The masterKey',
      when: !config.masterKey
    },
    {
      type: 'input',
      name: 'serverURL',
      message: 'The serverURL',
      when: !config.serverURL,
      default: 'https://api.parse.com/1'
    }
  ];

  inquirer.prompt(questions).then(function (answers) {
    config = Object.assign(config, answers);
    Parse.initialize(config.applicationId, null, config.masterKey);
    Parse.serverURL = config.serverURL;
    printAllFiles();
  });
}

function printAllFiles() {
  schemas.get().then(function(res){
     var schemasWithFiles = onlyFiles(res);
     return Promise.all(schemasWithFiles.map(getFilesFromSchema));
  }).then(function(results) {
      var files = results.reduce(function(c, r) {
        return c.concat(r);
      }, []);
      files.forEach(function(file) {
        process.stdout.write(file);
        process.stdout.write("\n");
      });
      process.exit(0);
  }).catch(function(err){
    process.stderr.write(err);
    process.stderr.write("\n");
    process.exit(1);
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
  var next = function(startIndex) {
    baseQuery.skip(startIndex);
    return baseQuery.find({useMasterKey: true}).then(function(r){
      allObjects = allObjects.concat(r);
      if (r.length == 0) {
        return Promise.resolve(allObjects);
      } else {
        return next(startIndex+r.length);
      }
    });
  }
  return next(0);
}

function getFilesFromSchema(schema) {
  var query = new Parse.Query(schema.className);
  query.select(schema.fields);
  schema.fields.forEach(function(field) {
    query.exists(field);
  })
  return getAllObjects(query).then(function(results) {
    return results.reduce(function(current, result){
      return current.concat(schema.fields.map(function(field){
        return result.get(field).url();
      }))
    }, []);
  });
}