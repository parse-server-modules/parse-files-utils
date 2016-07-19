/**
 * Uses command line prompts to collect necessary info 
 */

var inquirer = require('inquirer');
module.exports = questions;

function questions(config) {
  return inquirer.prompt([
    // Collect Parse info
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
    }, {
      type: 'input',
      name: 'serverURL',
      message: 'The Parse serverURL',
      when: !config.serverURL,
      default: 'https://api.parse.com/1'
    }, {
      type: 'list',
      name: 'filesToTransfer',
      message: 'What files would you like to transfer?',
      choices: [
        {name: 'Only parse.com hosted files', value: 'parseOnly'},
        {name: 'Only Parse Server (self hosted server) files', value: 'parseServerOnly'},
        {name: 'All files', value: 'all'}
      ],
      when: (['parseOnly','parseServerOnly', 'all'].indexOf(config.filesToTransfer) == -1)
    }, {
      type: 'confirm',
      name: 'renameInDatabase',
      message: 'Rename Parse hosted files in the database after transfer?',
      default: false,
      when: function(answers) {
        return !config.renameInDatabase &&
               (answers.filesToTransfer == 'all' || config.filesToTransfer == 'all' ||
               config.filesToTransfer == 'parseOnly' || answers.filesToTransfer == 'parseOnly');
      }
    }, {
      type: 'input',
      name: 'mongoURL',
      message: 'MongoDB URL',
      default: 'mongodb://localhost:27017/database',
      when: function(answers) {
        return (config.renameInDatabase || answers.renameInDatabase) &&
               !config.mongoURL;
      }
    }, 

    // Where to transfer to
    {
      type: 'list',
      name: 'transferTo',
      message: 'Where would you like to transfer files to?',
      choices: [
        {name: 'Print List of URLs', value: 'print'},
        {name: 'Local File System', value: 'filesystem'},
        {name: 'AWS S3', value: 's3'},
        {name: 'Google Cloud Storage', value: 'gcs'},
      ],
      when: function() {
        return (['print','filesystem','s3','gcs'].indexOf(config.transferTo) == -1) &&
               !config.filesAdapter
      }
    }, 

    // filesystem settings
    {
      type: 'input',
      name: 'filesystemPath',
      message: 'Local filesystem path to save files to',
      when: function(answers) {
        return !config.filesystemPath &&
               (config.transferTo == 'filesystem' ||
               answers.transferTo == 'filesystem');
      },
      default: './downloaded_files'
    }, 

    // S3 settings
    {
      type: 'input',
      name: 'aws_accessKeyId',
      message: 'AWS access key id',
      when: function(answers) {
        return (answers.transferTo == 's3' || config.transferTo == 's3') &&
               !config.aws_accessKeyId &&
               !config.aws_profile;
      }
    }, {
      type: 'input',
      name: 'aws_secretAccessKey',
      message: 'AWS secret access key',
      when: function(answers) {
        return (answers.transferTo == 's3' || config.transferTo == 's3') &&
               !config.aws_secretAccessKey &&
               !config.aws_profile;
      }
    }, {
      type: 'input',
      name: 'aws_bucket',
      message: 'S3 bucket name',
      when: function(answers) {
        return (answers.transferTo == 's3' || config.transferTo == 's3') &&
               !config.aws_bucket;
      }
    }, 

    // GCS settings
    {
      type: 'input',
      name: 'gcs_projectId',
      message: 'GCS project id',
      when: function(answers) {
        return (answers.transferTo == 'gcs' || config.transferTo == 'gcs') &&
               !config.gcs_projectId;
      }
    }, {
      type: 'input',
      name: 'gcs_keyFilename',
      message: 'GCS key filename',
      when: function(answers) {
        return (answers.transferTo == 'gcs' || config.transferTo == 'gcs') &&
               !config.gcs_keyFilename;
      },
      default: 'credentials.json'
    }, {
      type: 'input',
      name: 'gcs_bucket',
      message: 'GCS bucket name',
      when: function(answers) {
        return (answers.transferTo == 'gcs' || config.transferTo == 'gcs') &&
               !config.gcs_bucket;
      }
    }, 
  ]);
}