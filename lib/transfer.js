var request = require('request');
var crypto = require('crypto');
var async = require('async');
var FilesystemAdapter = require('parse-server-fs-adapter');
var S3Adapter = require('parse-server-s3-adapter');
var GCSAdapter = require('parse-server-gcs-adapter');
var MongoClient = require('mongodb').MongoClient;
var fs = require('fs'); 

// regex that matches old legacy Parse hosted files
var legacyFilesPrefixRegex = new RegExp("^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}-");
var migratedFilePrefix = 'mfp_';

var db, config;

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
  config.adapterName = config.transferTo || config.filesAdapter.constructor.name;
  console.log('Initializing '+config.adapterName+' adapter');
  if (config.filesAdapter && config.filesAdapter.createFile) {
    return Promise.resolve();
  } else if (config.transferTo == 'print') {
    return Promise.resolve();
  } else if (config.transferTo == 'filesystem') {
    config.filesAdapter = new FilesystemAdapter({
      filesSubDirectory: config.filesystemPath
    });
  } else if (config.transferTo == 's3') {
    config.filesAdapter = new S3Adapter({
      accessKey: config.aws_accessKeyId,
      secretKey: config.aws_secretAccessKey,
      bucket: config.aws_bucket,
      bucketPrefix: config.aws_bucketPrefix,
      directAccess: true
    });
  } else if (config.transferTo == 'gcs') {
    config.filesAdapter = new GCSAdapter({
      projectId: config.gcs_projectId,
      keyFilename: config.gcs_keyFilename,
      bucket: config.gcs_bucket,
      directAccess: true
    });
  } else {
    return Promise.reject('Invalid files adapter');
  }
  return Promise.resolve();
}

function run(files) {
  console.log('Processing '+files.length+' files');
  console.log('Saving files with '+config.adapterName);
  return _processFiles(files);
}

/**
 * Handle error from requests
 */
function _requestErrorHandler(error, response) {
  if (error) {
	console.log(error);
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
function _createNewFileName(fileName) {
  if (!config.renameFiles) {
    return fileName;
  }
  if (_isParseHostedFile(fileName)) {
    fileName = fileName.replace('tfss-', '');
    var newPrefix = crypto.randomBytes(32/2).toString('hex');
    fileName = newPrefix + fileName.replace(legacyFilesPrefixRegex, '');
  }
  return migratedFilePrefix + fileName;
}

function _isParseHostedFile(fileName) {
  if (fileName.indexOf('tfss-') === 0 || legacyFilesPrefixRegex.test(fileName)) {
    return true;
  }
  return false;
}

/**
 * Loops through n files at a time and calls handler
 * @param  {Array}    files     Array of files
 * @param  {Function} handler   handler function for file
 * @return {Promise}
 */
function _processFiles(files, handler) {
  var asyncLimit = config.asyncLimit || 1;
  return new Promise(function(resolve, reject) {
    async.eachOfLimit(files, asyncLimit, function(file, index, callback) {
      process.stdout.write('Processing '+(index+1)+'/'+files.length+'\r');
      file.newFileName = _createNewFileName(file.fileName);
      if (_shouldTransferFile(file)) {
        _transferFile(file).then(callback, callback);
      } else {
        callback();
      }
    }, function(error) {
      if (error) {
        return reject(error);
      }
      resolve('\nComplete!');
    });
  })
}

/**
 * Changes the file name that is saved in MongoDB
 * @param  {Object}   file     the file info
 */
function _changeDBFileField(file) {
  return new Promise(function(resolve, reject) {
    if (file.fileName == file.newFileName || !config.renameInDatabase) {
      return resolve();
    }
    var update = {$set:{}};
    update.$set[file.fieldName] = file.newFileName;
    db.collection(file.className).update(
      { _id : file.objectId },
      update,
      function(error, result ) {
        if (error) {
          return reject(error);
        }
        resolve();
      }
    );
  });
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
    _isParseHostedFile(file.fileName)
  ) {
    return true;
  } else if (
    config.filesToTransfer == 'parseServerOnly' &&
    !_isParseHostedFile(file.fileName)
  ) {
    return true;
  }
  return false;
}


/**
 * Request file from URL and upload with filesAdapter
 * @param  {Ibject}   file     the file info object
 */
function _transferFile(file) 
{
  return new Promise(function(resolve, reject) 
  {
    if (config.transferTo == 'print') {
      console.log(file.url);
      // Use process.nextTick to avoid max call stack error
      return process.nextTick(resolve);
    }

	// exists?
	var localFileName = config.filesAdapter._getLocalFilePath(file.newFileName) ;
	if ( !fs.existsSync(localFileName) )
	{	
		request({ url: file.url, encoding: null }, function(error, response, body) 
		{
		  if (_requestErrorHandler(error, response))
		  {
			return reject(null);
		  }
		  config.filesAdapter.createFile(file.newFileName, body, response.headers['content-type']).then(function() 
		  {
				return _changeDBFileField(file);
		  }).then(resolve, reject);
		});
	}
	else
	{
		//console.log('File already exists: ' + localFileName);
		return reject(null) ;
	}
  });
}
