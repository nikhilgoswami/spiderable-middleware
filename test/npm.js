const _          = require('underscore');
const http       = require('http');
const urlUtil    = require('url');
const request    = require('request');
const connect    = require('connect');
const express    = require('express');
const Spiderable = require('../lib/index.js');

const { assert }       = require('chai');
const { it, describe } = require('mocha');

const appExpress = express();
const appConnect = connect();

if (!process.env.ROOT_URL) {
  throw new Error('ROOT_URL env.var is not defined! Please run test with ROOT_URL, like `ROOT_URL=http://localhost:3000 npm test`');
}

const url         = urlUtil.parse(process.env.ROOT_URL);
url.port          = parseInt(url.port || 3003);
const staticFileName = 'test.pdf';
const respVanilla = 'Hello from vanilla NodeJS!\n';
const urlConnect  = urlUtil.parse(process.env.ROOT_URL.replace(`:${url.port}`, `:${url.port + 1}`));
const respConnect = 'Hello from Connect!\n';
const urlExpress  = urlUtil.parse(process.env.ROOT_URL.replace(`:${url.port}`, `:${url.port + 2}`));
const respExpress = 'Hello from Express!\n';
const auth        = process.env.AUTH || 'test:test';

const prerenders = {
  vanilla: new Spiderable({
    rootURL: urlUtil.format(url),
    auth: auth
  }),
  express: new Spiderable({
    rootURL: urlUtil.format(urlExpress),
    auth: auth
  }),
  connect: new Spiderable({
    rootURL: urlUtil.format(urlConnect),
    auth: auth
  }),
};

// Vanilla HTTP
http.createServer(function (req, res) {
  prerenders.vanilla.handler(req, res, () => {
    res.writeHead(200, {'Content-Type': 'text/plain; charset=UTF-8'});
    res.end(respVanilla);
  });
}).listen(url.port);

// Connect package
appConnect.use(prerenders.connect.handler.bind(prerenders.connect)).use(function (req, res) {
  res.end(respConnect);
});
http.createServer(appConnect).listen(urlConnect.port);

// Express package
appExpress.use(prerenders.express.handler.bind(prerenders.express)).get('/', function (req, res) {
  res.send(respExpress);
});
appExpress.listen(urlExpress.port);


describe('Has Spiderable Object', () => {
  it('Spiderable is Constructor', () => {
    assert.isFunction(Spiderable, 'Spiderable is Constructor');
  });
});

describe('Has Spiderable Instance', () => {
  it('prerenders.vanilla is instance of Spiderable', () => {
    assert.instanceOf(prerenders.vanilla, Spiderable, 'prerendering is instance of Spiderable');
  });

  it('instance is created properly', () => {
    assert.isTrue(prerenders.vanilla.rootURL === urlUtil.format(url).replace(/\/$/, ''), 'rootURL is set and has right value');
  });
});

describe('Has botsRE property', () => {
  it('botsRE is RegExp', () => {
    assert.typeOf(prerenders.vanilla.botsRE, 'regexp', 'botsRE is RegExp');
  });
});

describe('Check Prerendering & Middleware Setup', function () {
  this.slow(9000);
  this.timeout(15000);

  it('Vanilla node.js HTTP server', function (done) {
    request({
      url: urlUtil.format(url),
      method: 'GET',
      headers: {
        'User-Agent': 'GoogleBot'
      }
    }, (error, resp, body) => {
      assert.isTrue(!error, 'no error');
      if (!error) {
        assert.isTrue(resp.statusCode === 200, 'status code is 200');
        assert.isTrue(_.has(resp.headers, 'x-prerender-id'), 'has "x-prerender-id" header');
        assert.isTrue(!!~resp.headers['x-prerender-id'].indexOf('TEST'), '"x-prerender-id" is TEST');
        assert.isTrue(!!~body.indexOf('[PASSED]'), 'Test response has "[PASSED]" keyword');
        assert.isTrue(!!~body.indexOf(process.env.ROOT_URL), 'Test response has valid source URL keyword');
      }
      done();
    });
  });

  it('Vanilla node.js HTTP server [static file]', function (done) {
    request({
      url: urlUtil.format(url) + staticFileName,
      method: 'GET',
      headers: {
        'User-Agent': 'GoogleBot'
      }
    }, (error, resp, body) => {
      assert.isTrue(!error, 'no error');
      if (!error) {
        assert.isTrue(resp.statusCode === 200, 'status code is 200');
        assert.isFalse(_.has(resp.headers, 'x-prerender-id'), 'Has no "x-prerender-id" header');
        assert.isTrue(body === respVanilla, 'Body returned from Vanilla node.js server');
      }
      done();
    });
  });

  it('Express HTTP server', function (done) {
    request({
      url: urlUtil.format(urlExpress),
      method: 'GET',
      headers: {
        'User-Agent': 'GoogleBot'
      }
    }, (error, resp, body) => {
      assert.isTrue(!error, 'no error');
      if (!error) {
        assert.isTrue(resp.statusCode === 200, 'status code is 200');
        assert.isTrue(_.has(resp.headers, 'x-prerender-id'), 'has "x-prerender-id" header');
        assert.isTrue(!!~resp.headers['x-prerender-id'].indexOf('TEST'), '"x-prerender-id" is TEST');
        assert.isTrue(!!~body.indexOf('[PASSED]'), 'Test response has "[PASSED]" keyword');
        assert.isTrue(!!~body.indexOf(urlUtil.format(urlExpress)), 'Test response has valid source URL keyword');
      }
      done();
    });
  });

  it('Express HTTP server [static file]', function (done) {
    request({
      url: urlUtil.format(urlExpress) + staticFileName,
      method: 'GET',
      headers: {
        'User-Agent': 'GoogleBot'
      }
    }, (error, resp, body) => {
      assert.isTrue(!error, 'no error');
      if (!error) {
        assert.isTrue(resp.statusCode === 404, 'status code is 404');
        assert.isFalse(_.has(resp.headers, 'x-prerender-id'), 'Has no "x-prerender-id" header');
        assert.isTrue(!!~body.indexOf(staticFileName), 'Body returned from Express module, and has file name');
      }
      done();
    });
  });

  it('Connect server', function (done) {
    request({
      url: urlUtil.format(urlConnect),
      method: 'GET',
      headers: {
        'User-Agent': 'GoogleBot'
      }
    }, (error, resp, body) => {
      assert.isTrue(!error, 'no error');
      if (!error) {
        assert.isTrue(resp.statusCode === 200, 'status code is 200');
        assert.isTrue(_.has(resp.headers, 'x-prerender-id'), 'has "x-prerender-id" header');
        assert.isTrue(!!~resp.headers['x-prerender-id'].indexOf('TEST'), '"x-prerender-id" is TEST');
        assert.isTrue(!!~body.indexOf('[PASSED]'), 'Test response has "[PASSED]" keyword');
        assert.isTrue(!!~body.indexOf(urlUtil.format(urlConnect)), 'Test response has valid source URL keyword');
      }
      done();
    });
  });

  it('Connect server [static file]', function (done) {
    request({
      url: urlUtil.format(urlConnect) + staticFileName,
      method: 'GET',
      headers: {
        'User-Agent': 'GoogleBot'
      }
    }, (error, resp, body) => {
      assert.isTrue(!error, 'no error');
      if (!error) {
        assert.isTrue(resp.statusCode === 200, 'status code is 200');
        assert.isFalse(_.has(resp.headers, 'x-prerender-id'), 'Has no "x-prerender-id" header');
        assert.isTrue(body === respConnect, 'Body returned from Connect module');
      }
      done();
    });
  });
});