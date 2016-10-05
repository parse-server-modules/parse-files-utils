var FileAdapter = require('parse-server-fs-adapter');
var S3Adapter = require('parse-server-s3-adapter');
var GCSAdapter = require('parse-server-gcs-adapter');

module.exports = {
  applicationId: "PARSE_APPLICATION_ID",
  masterKey: "PARSE_MASTER_KEY",
  mongoURL: "mongodb://<username>:<password>@mongourl.com:27017/database_name",
  serverURL: "https://api.customparseserver.com/parse",
  filesToTransfer: 'parseOnly',
  renameInDatabase: false,
  transferTo: 'filesystem',

  //added by Loungebuddy to log and subsequenly skip reupload for successful upload
  successLogFilePath: './previouslyUploaded.txt',

  // For filesystem configuration
  filesystemPath: './downloaded_files',

  // For S3 configuration
  aws_accessKeyId: "ACCESS_KEY_ID",
  aws_secretAccessKey: "SECRET_ACCESS_KEY",
  aws_bucket: "BUCKET_NAME",
  aws_bucketPrefix: "",

  // For GCS configuration
  gcs_projectId: "GCS_PROJECT_ID",
  gcs_keyFilename: "credentials.json",
  gcs_bucket: "BUCKET_NAME",

  // Or set filesAdapter to a Parse Server file adapter
  // filesAdapter: new FileAdapter({
  //  filesSubDirectory: './downloaded_files'
  // }),
  // filesAdapter: new S3Adapter({
  //   accessKey: 'ACCESS_KEY_ID',
  //   secretKey: 'SECRET_ACCESS_KEY',
  //   bucket: 'BUCKET_NAME'
  // }),
  // filesAdapter: new GCSAdapter({
  //   projectId: "GCS_PROJECT_ID",
  //   keyFilename: "credentials.json",
  //   bucket: "BUCKET_NAME",
  // }),
};
