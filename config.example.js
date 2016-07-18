module.exports = {
  applicationId: "PARSE_APPLICATION_ID",
  masterKey: "PARSE_MASTER_KEY",
  mongoURL: "mongodb://<username>:<password>@mongourl.com:27017/database_name",
  serverURL: "https://api.customparseserver.com/parse",
  filesToTransfer: 'parseOnly',
  renameInDatabase: true,

  // For filesystem configuration
  filesystemPath: './downloaded_files',

  // For S3 configuration
  aws_accessKeyId: "ACCESS_KEY_ID",
  aws_secretAccessKey: "SECRET_ACCESS_KEY",
  aws_bucket: "BUCKET_NAME",

  // For GCS configuration
  gcs_projectId: "GCS_PROJECT_ID",
  gcs_keyFilename: "credentials.json",
  gcs_bucket: "BUCKET_NAME"
};