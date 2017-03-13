import CryptoJS from "crypto-js";

const S3Browser = {};

const _generateDateStrings = function (timestamp) {
    // ISO8601 GMT Format, e.g. 2007-12-01T12:00:00.000Z
    // ISO8601 GMT Format, e.g. 2016-11-04T22:14:06.925Z
    const expirationDate = new Date((timestamp + (Meteor.settings.aws.policyValidityPeriod * 60 * 1000))).toISOString();

    const _yyyymmdd = new Date(timestamp).toISOString().replace(/[^\dTZ]|.\d+(?=Z)/gi, "").replace(/T.*/gi, "");
    // e.g. '20130728T000000Z', // This must also be the same value you provide in the policy (x-amz-date),
    
    const xAmzDate = _yyyymmdd + "T000000Z";

    return {
        expirationDate: expirationDate,
        xAmzDate: xAmzDate,
        _yyyymmdd: _yyyymmdd
    }
}

const _generatePolicy = function (params) {
    return new Buffer(JSON.stringify({
        "expiration": params.expirationDate,
        "conditions": [
            // This controls who can access the file you upload
            // See http://docs.aws.amazon.com/AmazonS3/latest/dev/acl-overview.html#canned-acl
            { "acl": params.acl },

            // This specify which bucket the file will be uploaded to
            { "bucket": params.bucket },
            
            // Restrict the prefixes allowed for the file
            ["starts-with", "$key", params.prefix],

            // To ensure S3 returns with information about the object uplaoded
            { "success_action_status": "201" },

            { "x-amz-algorithm": params.xAmzAlgorithm },
            { "x-amz-credential": params.xAmzCredential },
            { "x-amz-date": params.xAmzDate },
        ]
    })).toString('base64');
}

const _generateSigningKey = function (params) {
    var kDate = CryptoJS.HmacSHA256(params._yyyymmdd, "AWS4" + params.secretKey);
    var kRegion = CryptoJS.HmacSHA256(params.region, kDate);
    var kService = CryptoJS.HmacSHA256("s3", kRegion);
    var kSigning = CryptoJS.HmacSHA256("aws4_request", kService);

    return kSigning;
}

S3Browser.generateSignature = function (prefix) {
    // Createa a timestamp variable that will be the basis for the policy and signature
    const timestamp = Date.now();

    const { expirationDate, xAmzDate, _yyyymmdd } = _generateDateStrings(timestamp);

    const acl = "public-read";
    const bucket = Meteor.settings.aws.s3.bucket;
    const region = Meteor.settings.aws.s3.region;
    const xAmzAlgorithm = 'AWS4-HMAC-SHA256';
    const accessKeyId = Meteor.settings.aws.accessKeyId
    const secretKey = process.env.AWS_SECRET_ACCESS_KEY;

    const xAmzCredential = `${accessKeyId}/${_yyyymmdd}/${region}/s3/aws4_request`;

    const policy = _generatePolicy({
        prefix: prefix,
        expirationDate: expirationDate,
        timestamp: timestamp,
        acl: acl,
        bucket: bucket,
        xAmzAlgorithm: xAmzAlgorithm,
        xAmzCredential: xAmzCredential,
        xAmzDate: xAmzDate
    });

    const signingKey = _generateSigningKey({
        secretKey: secretKey,
        _yyyymmdd: _yyyymmdd,
        region: region
    });

    const xAmzSignature = CryptoJS.HmacSHA256(policy, signingKey).toString(CryptoJS.enc.Hex);

    return {
        acl: acl,
        bucket: bucket,
        policy: policy,
        xAmzAlgorithm: xAmzAlgorithm,
        xAmzCredential: xAmzCredential,
        xAmzDate: xAmzDate,
        xAmzSignature: xAmzSignature
    }
}

export default S3Browser;
