import MD5 from "crypto-js/md5";
import { Meteor } from 'meteor/meteor';

const S3Browser = {};

// Retrieve the `Blob` object from an URL generated from `URL.createObjectURL`
const _getBlobFromURI = function (blobURI) {
    return new Promise(function(resolve, reject) {
        // Get the image as a blob from the blob URI
        var xhr = new XMLHttpRequest();
        xhr.open('GET', blobURI, true);
        xhr.responseType = 'blob';
        xhr.onreadystatechange = () => {
            if(xhr.readyState === 4 && xhr.status === 200) {
                resolve(xhr.response)
            }
        };
        xhr.send();
    });
}

// Get the file extension suffix from the MIME type
const _getFileExtensionFromMimeType = function (mime) {
    const rg = /[a-zA-Z-.]*\/(.*)/g;
    return rg.exec(mime)[1];
}

// Converts the `Blob` object to a `File` object
const _getFileFromBlob = function (blob) {
    return new Promise(function(resolve, reject) {
        const reader = new FileReader();

        // Read the content of the blob as a data url
        // Then hashes the data url with MD5, alternatively `SparkMD5.hash(file)`
        // Then add the correct file extension to the end
        reader.addEventListener("load", function () {
            blobAsDataUrl = reader.result;
            const fileName = `${MD5(blobAsDataUrl).toString()}.${_getFileExtensionFromMimeType(blob.type)}`;

            // Return a new File object
            resolve(new File([blob], fileName, {type: blob.type, lastModified: new Date()}));
        }, false);

        reader.readAsDataURL(blob);
    });
}

// Generate a `FormData` object and populate it
const _generateFormData = function (prefix, file, params) {
    const formData = new FormData();

    // Amazon S3 access control list
    formData.append('acl', params.acl);

    // The file name
    formData.append('key', prefix + file.name);

    // Base64 encoded policy
    formData.append('policy', params.policy);

    // To ensure S3 returns with information about the object uplaoded
    formData.append('success_action_status', "201");

    // Required for authentication

    // The signature calculation algorithm 
    formData.append('x-amz-algorithm', params.xAmzAlgorithm);

    // The credential scope that you used to generate the signing key
    formData.append('x-amz-credential', params.xAmzCredential);

    // The date used to calculate signature
    formData.append('x-amz-date', params.xAmzDate);

    formData.append('x-amz-signature', params.xAmzSignature);

    formData.append('file', file);

    return formData;
}

// Submit and upload the file onto S3
S3Browser.submitForm = function (prefix, file, params) {
    return new Promise(function(resolve, reject) {
        const xhr = new XMLHttpRequest();
        xhr.open("POST", `http://${params.bucket}.s3.amazonaws.com/`, true);
        xhr.onload = function () {
            resolve(xhr.response);
        }
        xhr.send(_generateFormData(prefix, file, params));
    });
}

S3Browser.getFileFromURI = function (blobURI) {
    return _getBlobFromURI(blobURI).then(_getFileFromBlob);
}

S3Browser.uploadFileToS3 = function (file, prefix) {
    return new Promise(function (resolve, reject) {
        // Send a request to the server to obtain a signature
        Meteor.call('brewhk:s3browser/generateSignature', prefix, function (err, res) {
            if(!err && res) {
                S3Browser.submitForm(prefix, file, res).then(function (res) {
                    // `res` would be in XML string format, `typeof res === "string"
                    resolve(/<Location>(.*)<\/Location>/ig.exec(res)[1]);
                })
            } else {
                reject(err);
            }
        });
    });
}

S3Browser.uploadBlobURIToS3 = function (blobURI, prefix) {
    return new Promise(function (resolve, reject) {
        S3Browser.getFileFromURI(blobURI).then(function(file) {
            S3Browser.uploadFileToS3(file, prefix)
                .then(function (res) {resolve(res)}, function (err) {reject(err)});
        })
    });
}

export default S3Browser;
