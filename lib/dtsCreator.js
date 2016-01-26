'use strict';

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.DtsCreator = undefined;

var _process = require('process');

var _process2 = _interopRequireDefault(_process);

var _fs = require('fs');

var _fs2 = _interopRequireDefault(_fs);

var _path = require('path');

var _path2 = _interopRequireDefault(_path);

var _cssModulesLoaderCore = require('css-modules-loader-core');

var _cssModulesLoaderCore2 = _interopRequireDefault(_cssModulesLoaderCore);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var rootDir = _process2.default.cwd();

// TODO
var validateKey = function validateKey(key) {
  return (/^[$_a-zA-Z][0-9a-zA-Z$_]*$/.test(key)
  );
};

var createDef = function createDef(root, rel, cb) {
  if (!cb) cb = function cb() {};
  var sourcePath = _path2.default.join(root, rel);
  _fs2.default.readFile(sourcePath, 'utf8', function (err, contents) {
    if (err) {
      cb(err, null);
    }
    core.load(contents, sourcePath, null).then(function (res) {
      if (res && res.exportTokens) {
        var tokens = res.exportTokens;
        var keys = Object.keys(tokens);
        var result = keys.filter(validateKey).map(function (k) {
          return 'export const ' + k + ': string;';
        });
        cb(null, result.join('\n'));
      }
    });
  });
};

var DtsCreator = exports.DtsCreator = function () {
  function DtsCreator(options) {
    _classCallCheck(this, DtsCreator);

    if (!options) options = {};
    this.rootDir = options.rootDir || _process2.default.cwd();
    this.core = new _cssModulesLoaderCore2.default();
  }

  _createClass(DtsCreator, [{
    key: 'create',
    value: function create(relativePath) {
      var _this = this;

      return new Promise(function (resolve, reject) {
        var sourcePath = _path2.default.join(_this.rootDir, relativePath);
        _fs2.default.readFile(sourcePath, 'utf8', function (err, contents) {
          if (err) {
            reject(err);
          }
          _this.core.load(contents, sourcePath, null).then(function (res) {
            if (res && res.exportTokens) {
              var tokens = res.exportTokens;
              var keys = Object.keys(tokens);
              var result = keys.filter(validateKey).map(function (k) {
                return 'export const ' + k + ': string;';
              });
              resolve(result.join('\n'));
            } else {
              reject(res);
            }
          });
        });
      });
    }
  }]);

  return DtsCreator;
}();