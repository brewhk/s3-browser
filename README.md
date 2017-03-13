Easily upload images to S3 buckets from the browser

## Features

* Minimal configurations required
* Automatically generate signature
* Ensures the same image is stored only once per bucket

## How to use

* Add settings for AWS in a `settings.json` as `aws`, **all** fields below are required:

      "aws": {
          "accessKeyId": "GKIFJVRLZBSNXIC6WNIP",
          "policyValidityPeriod": 15,
          "s3": {
              "bucket": "bucketname",
              "region": "eu-west-1"
          }
      },

  > Make sure not to put these details under `public`, as these settings only need to be accessed from the server

* Store the image temporarily in your browser as a *object URL* (or blob URL), using [`URL.createObjectURL`](https://developer.mozilla.org/en-US/docs/Web/API/URL/createObjectURL)

* Pass the object URL and a prefix to `uploadBlobURIToS3`, which will return with a promise which resolves to the URL of the uploaded file on S3.

      S3Browser.uploadBlobURIToS3(objectURL, "users/avatars/")
        .then(function (url) {
          // Do something with the URL. E.g. https://mybucket.s3.amazonaws.com/myfolder/afile.jpg
        });

### API Reference

You must first import the `S3Browser` object from the package.

    import S3Browser from 'meteor/brewhk:s3-browser';

#### Client

`uploadBlobURIToS3`

Upload an image, specified by its blob URL, to the Amazon S3 bucket specified in your Meteor settings.

**Argument(s)**

* `blobURI` *String* - The blob URL of the file you wish to upload
* `prefix` *String* - The directory for which the image uploaded using this signature will be placed under in the S3 bucket. E.g. `'users/avatars/'`

**Return Value(s)**

Returns a promise which resolves to the URL of the uploaded file on S3.

#### Server

`generateSignature`

Generates a signature from AWS settings and prefix.

**Argument(s)**

* `prefix` *String* - The directory for which the image uploaded using this signature will be placed under in the S3 bucket. E.g. `'users/avatars/'`

**Return Value(s)**

* `signature` *Object* - The signature generated. It will have the following properties:
 * `acl`
 * `bucket`
 * `policy`
 * `xAmzAlgorithm`
 * `xAmzCredential`
 * `xAmzDate`
 * `xAmzSignature`
