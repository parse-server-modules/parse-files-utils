var fs = require('fs');
var request = require('request');
var crypto = require('crypto');
var async = require('async');
var AWS = require('aws-sdk');
var GCS = require('gcloud').storage;
var MongoClient = require('mongodb').MongoClient;

// regex that matches old legacy Parse hosted files
var legacyFilesPrefixRegex = new RegExp("^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}-");

var db, config, s3Client, gcsClient;
var fileHandlers = {
  print: print,
  filesystem: filesystem,
  s3: s3,
  gcs: gcs,
};

module.exports.init = init;
module.exports.run = run;

function init(options) {
  console.log('Initializing transfer configuration...');
  config = options;
  return new Promise(function(resolve, reject) {
    if (config.renameInDatabase) {
      console.log('Connecting to MongoDB');
      MongoClient.connect(config.mongoURL, function(error, database) {
        if (error) {
          return reject(error);
        }
        console.log('Successfully connected to MongoDB');
        db = database;
        _setup().then(resolve, reject);
      });
    } else {
      _setup().then(resolve, reject);
    }
  });
}

function _setup() {
  return new Promise(function(resolve, reject) {
    if (config.transferTo == 'print') {
      resolve();
    } else if (config.transferTo == 'filesystem') {
      console.log('Creating directory at '+config.filesystemPath);
      process.umask(0);
      fs.mkdir(config.filesystemPath, function() {
        resolve();
      });
    } else if (config.transferTo == 's3') {
      console.log('Initializing S3 connection')
      if (config.aws_accessKeyId && config.aws_secretAccessKey) {
        AWS.config.credentials = new AWS.Credentials(config.aws_accessKeyId, config.aws_secretAccessKey);
      } else if (config.aws_profile) {
        AWS.config.credentials = new AWS.SharedIniFileCredentials({ profile: config.aws_profile });
      } else {
        return reject('Must specify profile or accessKeyId and secretAccessKey');
      }
      s3Client = new AWS.S3();
      resolve();
    } else if (config.transferTo == 'gcs') {
      console.log('Initializing GCS connection')
      gcsClient = new GCS({
        projectId: config.gcs_projectId,
        keyFilename: config.gcs_keyFilename
      });
      resolve();
    }
  });
}

function run(files) {
  console.log('Processing '+files.length+' files');
  console.log('Saving files to '+config.transferTo);
  return _processFiles(files, fileHandlers[config.transferTo]);
}

/**
 * Handler that prints url to command line
 * @param  {Object}   file     the file info
 * @param  {Function} callback
 */
function print(file, callback) {
  console.log(file.url);
  callback();
}

/**
 * Handler that saves file to filesystem
 * @param  {Object}   file     the file info
 * @param  {Function} callback 
 */
function filesystem(file, callback) {
  request(file.url).on('error', function(error) {
    callback(error);
  }).on('response', function(response) {
    if (_requestErrorHandler(false, response)) {
      return callback();
    }
    var ws = fs.createWriteStream(config.filesystemPath+'/'+file.newFileName);
    ws.on('error', function(error) { console.log('1', error); });
    this.pipe(ws).on('error', function(error) {
      console.log('Failed to write file', error);
    }).on('finish', function() {
      _changeDBFileField(file, callback);
    });
  });
}

/**
 * Handler that saves file to S3
 * @param  {Object}   file     the file info
 * @param  {Function} callback 
 */
function s3(file, callback) {
  request({
    url: file.url,
    encoding: null
  }, function(error, response, body) {
    if (_requestErrorHandler(error, response)) {
      return callback(error);
    }

    s3Client.putObject({
      Bucket: config.aws_bucket,
      Key: file.newFileName,
      ACL: 'public-read',
      ContentType: response.headers['content-type'],
      ContentLength: response.headers['content-length'],
      Body: body
    }, function(error) {
      if (error) {
        return callback(error);
      }
      _changeDBFileField(file, callback);
    });
  });
}

/**
 * Handler that saves file to GCS
 * @param  {Object}   file     the file info
 * @param  {Function} callback 
 */
function gcs(file, callback) {
  request({
    url: file.url,
    encoding: null
  }, function(error, response, body) {
    if (_requestErrorHandler(error, response)) {
      return callback(error);
    }
    
    var newFile = gcsClient.bucket(config.gcs_bucket).file(file.fileName);

    var uploadStream = newFile.createWriteStream({
      metadata: {
        contentType: response.headers['content-type'] || 'application/octet-stream'
      }    
    });
    uploadStream.on('error', function(error) {
      callback(error);
    }).on('finish', function() {
      // Second call to set public read ACL after object is uploaded.
      newFile.makePublic(function(error, res) {
        if (error) {
          return callback(error);
        }
        _changeDBFileField(file, callback);
      })
    });
    uploadStream.write(body);
    uploadStream.end();
  });
}

/**
 * Handle error from requests
 */
function _requestErrorHandler(error, response) {
  if (error) {
    return error;
  } else if (response.statusCode >= 300) {
    console.log('Failed request ('+response.statusCode+') skipping: '+response.request.href);
    return true;
  }
  return false;
}

/**
 * Converts a file into a non Parse file name
 * @param  {String} fileName
 * @return {String}          
 */
function _nonParseFileName(fileName) {
  if (fileName.indexOf('tfss-') === 0) {
    return fileName.replace('tfss-', '');
  } else if (legacyFilesPrefixRegex.test(fileName)) {
    var newPrefix = crypto.randomBytes(32/2).toString('hex');
    return newPrefix + fileName.replace(legacyFilesPrefixRegex, '');
  } else {
    return fileName;
  }
}

/**
 * Loops through 5 files at a time and calls handler
 * @param  {Array}    files     Array of files
 * @param  {Function} handler   handler function for file
 * @return {Promise}
 */
function _processFiles(files, handler) {
  return new Promise(function(resolve, reject) {
    async.eachOfLimit(files, 5, function(file, index, callback) {
      process.stdout.write('Processing '+(index+1)+'/'+files.length+'\r');
      file.newFileName = _nonParseFileName(file.fileName);
      if (_shouldTransferFile(file)) {
        handler(file, callback);
      } else {
        callback();
      }
    }, function(error) {
      if (error) {
        return reject('Error!', error);
      }
      resolve('\nComplete!');
    });
  })
}

/**
 * Changes the file name that is saved in MongoDB
 * @param  {Object}   file     the file info
 * @param  {Function} callback
 */
function _changeDBFileField(file, callback) {
  if (file.fileName == file.newFileName || !config.renameInDatabase) {
    return callback();
  }
  var update = {$set:{}};
  update.$set[file.fieldName] = file.newFileName;
  db.collection(file.className).update(
    { _id : file.objectId },
    update,
    function(error, result ) {
      callback(error);
    }
  );
}

/**
 * Determines if a file should be transferred based on configuration
 * @param  {Object} file the file info
 */
function _shouldTransferFile(file) {
  if (config.filesToTransfer == 'all') {
    return true;
  } else if (
    config.filesToTransfer == 'parseOnly' &&
    file.fileName != file.newFileName
  ) {
    return true;
  } else if (
    config.filesToTransfer == 'parseServerOnly' &&
    file.fileName == file.newFileName
  ) {
    return true;
  }
  return false;
}