var path = require('path');
var configFilePath = process.argv[2];
var config = {};

if (configFilePath) {
  configFilePath = path.resolve(configFilePath);

  try {
    config = require(configFilePath);
  } catch(e) {
    console.log('Cannot load '+configFilePath);
    process.exit(1);  
  }
}

var utils = require('./lib')(config);
