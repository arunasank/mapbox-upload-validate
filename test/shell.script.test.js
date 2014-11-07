var exec = require('child_process').exec;
var test = require('tape').test;
var fixtures = require('./fixtures');
var expected = require('./expected');
var path = require('path');
var queue = require('queue-async');
var _ = require('underscore');

var run = path.resolve(__dirname, '../bin/mapbox-upload-validate.js');

test('bin.mapbox-upload-validate: invalid', function(t) {
  function validate(type, filepath, reason, callback) {
    if (!callback) {
      callback = reason;
      reason = undefined;
    }

    exec([run, filepath].join(' '), function(err, stdout, stderr) {
      if (err) throw err;
      t.equal(stdout, '', [type, reason].join('.') + ': nothing logged to stdout');
      var expect = expected[type + 'Errors'];
      if (reason) expect = expect[reason];
      t.equal(stderr, expect + '\n', [type, reason].join('.') + ': expected error message');
      callback();
    });
  }

  var q = queue();
  _(fixtures.invalid).forEach(function(val, type) {
    if (typeof val === 'string') return q.defer(validate, type, val);
    _(val).forEach(function(filepath, reason) {
      q.defer(validate, type, filepath, reason);
    });
  });
  q.await(function() {
    t.end();
  });
});

test('bin.mapbox-upload-validate: valid', function(t) {
  var q = queue();
  Object.keys(fixtures.valid).forEach(function(k) {
    if (k === 'gpx') return; // @TODO: https://github.com/mapnik/node-mapnik/issues/300
    q.defer(function(callback) {
      exec([run, fixtures.valid[k]].join(' '), function(err, stdout, stderr) {
        if (err) throw err;
        t.equal(stdout, fixtures.valid[k] + '\n', k + ': stdout contains filepath');
        t.notOk(stderr, k + ': no error message');
        callback();
      });
    });
  });
  q.await(function() {
    t.end();
  });
});