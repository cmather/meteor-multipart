Package.describe({
  name: 'multipart',
  summary: 'Parses multipart/form-data content types.',
  version: '1.0.0'
});

Npm.depends({
  busboy: '0.2.11'
});

Package.onUse(function (api) {
  api.use('webapp');
  api.use('ecmascript');
  api.addFiles('multipart.js', 'server');
  api.export('multipart', 'server');
});
