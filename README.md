# parse-files-utils
Utilities to list and migrate Parse files.

This utility will do the following:

1. Get all files across all classess in a Parse database.
2. Print file URLs to console OR transfer to S3, GCS, or filesystem.
3. Rename files so that [Parse Server](https://github.com/ParsePlatform/parse-server) no longer detects that they are hosted by Parse.
4. Update MongoDB with new file names.

#### \*WARNING\*
As soon as this script transfers files away from Parse.com hosted files (and renames them in the database) 
any clients that use api.parse.com will no longer be able to access the files. 
See the section titled "5. Files" in the [Parse Migration Guide](https://parse.com/migration) 
and Parse Server [issue #1582](https://github.com/ParsePlatform/parse-server/issues/1582).

## Installation

1. Clone the repo: `git clone git@github.com:parse-server-modules/parse-files-utils.git`
2. cd into repo: `cd parse-file-utils`
3. Install dependencies: `npm install`

## Usage

The quickest way to get started is to run `npm start` and follow the command prompts.

You can optionally specify a js/json configuration file (see [config.example.js](./config.example.js)).
```
$ npm start config.js
```

### Available configuration options

* `applicationId`: Parse application id.
* `masterKey`: Parse master key.
* `mongoURL`: MongoDB connection url.
* `serverURL`: The URL for the Parse server (default: http://api.parse.com/1).
* `filesToTransfer`: Which files to transfer. Accepted options: `parseOnly`, `parseServerOnly`, `all`.
* `renameInDatabase` (boolean): Whether or not to rename files in MongoDB.
* `filesAdapter`: A Parse Server file adapter with a function for `createFile(filename, data)`  
(ie. [parse-server-fs-adapter](https://github.com/parse-server-modules/parse-server-fs-adapter),
[parse-server-s3-adapter](https://github.com/parse-server-modules/parse-server-s3-adapter),
[parse-server-gcs-adapter](https://github.com/parse-server-modules/parse-server-gcs-adapter)).
* `filesystemPath`: The path/directory to save files to when transfering to filesystem.
* `aws_accessKeyId`: AWS access key id.
* `aws_secretAccessKey`: AWS secret access key.
* `aws_bucket`: S3 bucket name.
* `gcs_projectId`: GCS project id.
* `gcs_keyFilename`: GCS key filename (ie. `credentials.json`).
* `gcs_bucket`: GCS bucket name.
* `asyncLimit`: The number of files to process at the same time (default: 5).