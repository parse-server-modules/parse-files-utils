var appID = process.argv[2];
var masterKey = process.argv[3];
var serverURL = process.argv[4];

if (!appID || !masterKey) {
  process.stderr.write('An appId and a masterKey are required\n');
  process.exit(1);
}

var utils = require('./lib')(appID, masterKey, serverURL);
