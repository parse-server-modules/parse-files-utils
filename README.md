# parse-files-utils
Utilities to list and migrate Parse files

This utility will print in the terminal all the files URL's from the parse server

This can be really useful when you migrate your files and want to move the files from the Parse S3 host to you own.

This utility won't save the files anywhere else. You can save the results to a file or pipe the results to another program:

## usage

```
$ node index.js
```

you can optionally specify a json configuration file

```
$ node index.js ./config.json
```

Example `config.json`:

```
{
  "applicationId": "PVpAyhBmNuouwPBNksRLPVpAyhBmNuouwPBNksRL",
  "masterKey": "DQzeY9lelKLPeWQH6zhsNUqnrudyOU07hjC6g53a",
  "serverURL": "http://parse-server.yourdomain.com/parse"
}
```