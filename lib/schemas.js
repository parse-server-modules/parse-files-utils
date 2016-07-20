var request = require('request');
var Parse = require('parse/node');

function get() {
  return new Promise(function(resolve, reject) {
     request({
       method: 'GET',
       url: Parse.serverURL+"/schemas",
       json: true,
       headers: {
         'Content-Type': 'application/json',
         'X-Parse-Application-Id': Parse.applicationId,
         'X-Parse-Master-Key': Parse.masterKey
       }
      }, function(err, res, body) {
        if (err) {
          return reject(err);
        }
        if (!body.results) {
          return reject(JSON.stringify(body));
        }
        resolve(body.results);
     })
  });
}

module.exports = Object.freeze({
  get: get
})
