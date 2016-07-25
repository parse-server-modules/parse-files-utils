# parse-files-utils
Utilities to list and migrate Parse files.

This utility will do the following:

1. Get all files across all classess in a Parse database.
2. Print file URLs to console OR transfer to S3, GCS, or filesystem.
3. Rename files so that [Parse Server](https://github.com/ParsePlatform/parse-server) no longer detects that they are hosted by Parse.
4. Update MongoDB with new file names.

![Use at your own risk](https://github.com/mongodb/support-tools/raw/master/use-at-your-own-risk.jpg)

[(image from flickr user alykat)](http://www.flickr.com/photos/80081757@N00/4271250480/)

DISCLAIMER
----------
Please note: all tools/ scripts in this repo are released for use "AS IS" **without any warranties of any kind**,
including, but not limited to their installation, use, or performance.  We disclaim any and all warranties, either 
express or implied, including but not limited to any warranty of noninfringement, merchantability, and/ or fitness 
for a particular purpose.  We do not warrant that the technology will meet your requirements, that the operation 
thereof will be uninterrupted or error-free, or that any errors will be corrected.

Any use of these scripts and tools is **at your own risk**.  There is no guarantee that they have been through 
thorough testing in a comparable environment and we are not responsible for any damage or data loss incurred with 
their use.

You are responsible for reviewing and testing any scripts you run *thoroughly* before use in any non-testing 
environment.

Thanks,  
The *UNOFFICIAL* parse-server-modules team

[(this disclaimer was originally published here)](https://github.com/mongodb/support-tools/blob/master/README.md)

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
* `serverURL`: The URL for the Parse server (default: http://api.parse.com/1). 
This is used to with `applicationId` and `masterKey` to get the schema and fetch all files/objects.
* `renameFiles` (boolean): Whether or not to rename Parse hosted files. 
This removes the "tfss-" or legacy Parse filename prefix before saving with the new file adapter.
* `renameInDatabase` (boolean): Whether or not to rename files in MongoDB.
* `mongoURL`: MongoDB connection url. 
Direct access to the database is needed because Parse SDK doesn't allow direct writing to file fields.
* `filesToTransfer`: Which files to transfer. 
Accepted options:
  * `"parseOnly"`: only process files with a filename that starts with "tfss-" or matches Parse's legacy file name format.
  * `"parseServerOnly"`: only process files with a filename that **does not** start with "tfss-" nor match Parse's legacy file name format.
  * `"all"`: process all files.
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
