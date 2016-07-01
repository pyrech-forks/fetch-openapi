#!/usr/bin/env node

var chalk = require('chalk');
var cli = require('commander');
var errHandler = require('err-handler');
var fetchOpenApi = require('../');
var fs = require('fs');
var LOG_PREFIX = 'fetch-openapi: ';
var path = require('path');
var request = require('request');

cli
  .version(require('../package.json').version)
  .description('This script requests an OpenAPI document and processes it with fetch-openapi.')
  .option('--api-doc-url [url]', 'The URL to your OpenAPI document E.G. http://petstore.swagger.io/v2/swagger.json')
  .option('--output-file-path [file path]', 'The path to the file generated by fetch-openapi.  If it currently exists it will be overwritten.')
  .option('--preset [preset]', 'May be one of the following values: es6, node (default)')
  .option('--verbose', 'Outputs more information than is normally needed.')
  .parse(process.argv);

var apiDocUrl = cli.apiDocUrl;
var outputFilePath = path.resolve(process.cwd(), cli.outputFilePath);
var preset = cli.preset || 'node';

debug('apiDocUrl is ' + apiDocUrl);
debug('outputFilePath is ' + outputFilePath);
debug('preset is ' + preset);

requireArg('apiDocUrl', '--api-doc-url');
requireArg('outputFilePath', '--output-file-path');

if (cli.preset && 'es6,node'.split(',').indexOf(cli.preset) === -1) {
  error('preset must be one of: es6, node');
}

request({ url: apiDocUrl, json: true }, errHandler(error, function(err, res, body) {
  if (res.statusCode !== 200) {
    debug('statusCode is ' + res.statusCode);
    error('Bad satus code for "' + apiDocUrl + '".  Does it exist?');
  }

  var options = {
    preset: preset
  };

  var sdk;
  try {
    sdk = fetchOpenApi(body, options);
    debug('sdk is\n' + sdk);
  } catch (e) {
    error('Received the following error when generating the client: ' + e.message);
  }

  fs.writeFile(outputFilePath, sdk, errHandler(error, function() {
    msg('SDK written to ' + outputFilePath);
    exit(0);
  }));
}));

function error(msg) {
  console.error(chalk.red(LOG_PREFIX) + msg);
  exit(1);
}

function exit(code) {
  process.exit(code || 0);
}

function debug(msg) {
  if (cli.verbose) {
    console.error(chalk.gray(LOG_PREFIX) + msg);
  }
}

function msg(msg) {
  console.log(chalk.green(LOG_PREFIX) + msg);
}

function requireArg(name, alias) {
  if (!(name in cli)) {
    error('You must use ' + alias + ' with a value.');
  }
}