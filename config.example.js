var FileAdapter = require('parse-server-fs-adapter');
var S3Adapter = require('parse-server-s3-adapter');
var GCSAdapter = require('parse-server-gcs-adapter');

module.exports = {
  applicationId: "PARSE_APPLICATION_ID",
  masterKey: "PARSE_MASTER_KEY",
  mongoURL: "mongodb://<username>:<password>@mongourl.com:27017/database_name",
  serverURL: "https://api.customparseserver.com/parse",
  filesToTransfer: 'parseOnly',
  renameFiles: false, 
  renameInDatabase: false,
  transferTo: 'filesystem',

  // If false, will migrate files array as well
  // Note: The parameters renameFiles and renameInDatabase must be true
  onlyFiles: false, 
  
  // Extra collection and fields that use files array, use to migrate them as well
  // Note: Use if onlyFiles equals false
  extraFields: {
    collectionName: ['fieldNameOne', 'fieldNameTwo']
  },

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

  // For Azure configuration
  azure_account: "STORAGE_ACCOUNT_NAME",
  azure_container: "BLOB_CONTAINER",
  azure_accessKey: "ACCESS_KEY",

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
