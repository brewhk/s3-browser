import { Meteor } from 'meteor/meteor';

import S3Browser from './functions.js';

Meteor.methods({
	'brewhk:s3browser/generateSignature': function (prefix) {
		return S3Browser.generateSignature(prefix);
	}
});
