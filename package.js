Package.describe({
  name: 'brewhk:s3-browser',
  version: '0.0.1',
  summary: 'Easily upload images to S3 buckets from the browser',
  git: 'https://github.com/brewhk/s3-browser.git',
  documentation: 'README.md'
});

Npm.depends({
  "crypto-js": "3.1.8"
});

Package.onUse(function(api) {
  api.versionsFrom('1.4.1.2');
  api.use('ecmascript');
  api.mainModule('client/main.js', 'client');
  api.mainModule('server/main.js', 'server');
});
