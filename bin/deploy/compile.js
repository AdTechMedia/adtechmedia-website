#!/usr/bin/env node

'use strict';

const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');
const AwsHelper = require('../helpers/aws');
const { runChildCmd } = require('../helpers/utils');

const deepifyRegexp = /\d{2}:\d{2}:\d{2}/;
const env = process.env.DEPLOY_ENV || 'test';
const srcPath = path.join(__dirname, '../../', 'src');
const awsh = new AwsHelper('atm-deploy-caches');
const s3Prefix = `atm-website/lambdas/${env}`;
const compareBranch = process.env.DEPLOY_ENV ? `origin/${env}` : '';

let deployBackend = false;

/**
 * Compile microservise
 * @param microApp
 * @returns {Promise}
 */
function compileMicroservice(microApp) {
  return awsh.listS3Objects(`${s3Prefix}/${microApp}`).then(res => {
    if (res.KeyCount === 0) {
      return Promise.resolve(true);
    } else {
      return checkForBackendChanges(microApp).then(res => {
        return Promise.resolve(res);
      });
    }
  }).then(compileBackend => {
    deployBackend = compileBackend;

    return compileBackend
      ? runChildCmd(`cd ${srcPath} && deepify compile prod ${microApp}`, deepifyRegexp)
      : reuseCompiledLambdas(microApp);
  });
}

exports.compileMicroservice = compileMicroservice;

/**
 * Upload microservice lambdas
 * @param microApp
 * @returns {Promise}
 */
function cacheMicroserviceLambdas(microApp) {
  return Promise.all(
    findLambdasByMicroAppName(microApp).map(lambdaPath => {
      let stream = fs.createReadStream(lambdaPath);
      return awsh.uploadZipToS3(lambdaPath.replace(srcPath, s3Prefix), stream);
    })
  );
}

exports.cacheMicroserviceLambdas = cacheMicroserviceLambdas;

/**
 * Download compiled lambdas
 * @param microApp
 * @returns {Promise}
 */
function reuseCompiledLambdas(microApp) {
  return awsh.listS3Objects(`${s3Prefix}/${microApp}`).then(res => {
    let keys = res.Contents.map(item => item.Key);

    return Promise.all(keys.map(key => {
      return awsh.getAndSaveS3Object(key, key.replace(s3Prefix, srcPath));
    }));
  });
}

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

/**
 * Check microservice for backend changes
 * @param microApp
 * @returns {Promise}
 */
function checkForBackendChanges(microApp) {
  return new Promise((resolve, reject) => {
    exec(`git diff --name-only HEAD ${compareBranch}`, (error, stdout) => {
      if (error) {
        return reject(error);
      }

      let hasChanges = false;
      let files = stdout.split('\n').filter(item => item.trim());
      let regExp = new RegExp(`${microApp}/backend`, 'gi');

      for (let i = 0, len = files.length; i < len; i++) {
        if (regExp.test(files[i])) {
          hasChanges = true;
          break;
        }
      }

      resolve(hasChanges);
    });
  });
}
