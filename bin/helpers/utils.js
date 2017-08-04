'use strict';

const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');
const appPath = path.join(__dirname, '../../');
const srcPath = path.join(appPath, 'src');

/**
 * Run child shell command
 * @param cmd
 * @param filerRegexp
 * @returns {Promise}
 */
function runChildCmd(cmd, filerRegexp = /.*/) {
  return new Promise((resolve, reject) => {
    const childCmd = spawn(cmd, { shell: true, cwd: appPath });

    childCmd.stdout.on('data', data => {
      filterLog(data.toString(), filerRegexp);
    });

    childCmd.stderr.on('data', error => {
      filterLog(error.toString(), filerRegexp);
    });

    childCmd.on('exit', code => {
      return (code === 1) ? reject(code) : resolve(code);
    });
  });
}

/**
 * Print filtered output
 * @param str
 * @param regexp
 */
function filterLog(str, regexp) {
  if (regexp.test(str)) {
    console.log(str.trim());
  }
}

exports.runChildCmd = runChildCmd;

/**
 * Find provisioning file path
 * @returns {*}
 */
function findProvisioningFile() {
  let files = fs.readdirSync(srcPath).filter(file => {
    return /^.([a-z0-9]+).([a-z]+).provisioning.json$/.test(file);
  });

  if (files.length <= 0) {
    throw 'Provisioning file was not found';
  }

  return path.join(srcPath, files[0]);
}

exports.findProvisioningFile = findProvisioningFile;

/**
 * Find lambdas by micro-application name
 * @param microApp
 * @returns {Array}
 */
function findLambdasByMicroAppName(microApp) {
  let lambdas = [];
  let searchDir = `${srcPath}/${microApp}/backend/src`;

  fs.readdirSync(searchDir).map(item => {
    let lambdaDir = `${searchDir}/${item}`;

    if (fs.lstatSync(lambdaDir).isDirectory()) {
      lambdas = lambdas.concat(
        fs.readdirSync(lambdaDir).filter(item => /.*\.zip$/.test(item)).map(item => `${lambdaDir}/${item}`)
      )
    }
  });

  return lambdas;
}

exports.findLambdasByMicroAppName = findLambdasByMicroAppName;