// Generated by CoffeeScript 1.8.0
(function() {
  var Spiderable, request, url,
    __bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; };

  url = require('url');

  request = require('request');

  module.exports = Spiderable = (function() {
    function Spiderable(opts) {
      this.middleware = __bind(this.middleware, this);
      var bots, defBots, ignore;
      this.serviceURL = opts.serviceURL, this.auth = opts.auth, bots = opts.bots, ignore = opts.ignore, this.rootURL = opts.rootURL;
      if (this.handler == null) {
        this.handler = this.middleware;
      }
      if (this.handle == null) {
        this.handle = this.middleware;
      }
      defBots = ['googlebot', 'yahoo', 'bingbot', 'facebookexternalhit', 'twitterbot', 'rogerbot', 'linkedinbot', 'embedly', 'quora link preview', 'showyoubot', 'outbrain', 'pinterest', 'developers.google.com/+/web/snippet', 'slackbot', 'vkShare', 'W3C_Validator', 'redditbot', 'Applebot', 'WhatsApp', 'flipboard', 'yandex', 'google-structured-data-testing-tool', 'MJ12Bot', 'tweetmemeBot', 'baiduSpider', 'Mail\.RU_Bot', 'ahrefsBot', 'SiteLockSpider', 'visionutils'];
      if (bots) {
        defBots = defBots.concat(bots);
      }
      this.botsRE = new RegExp(defBots.join('|'), 'i');
      if (this.auth == null) {
        this.auth = '';
      }
      if (ignore == null) {
        ignore = false;
      }
      if (this.rootURL == null) {
        this.rootURL = process.env.ROOT_URL;
      }
      if (this.serviceURL == null) {
        this.serviceURL = process.env.SPIDERABLE_SERVICE_URL || process.env.PRERENDER_SERVICE_URL || 'https://trace.ostr.io';
      }
      if (!this.rootURL) {
        throw '[Spiderable-Middleware] {rootURL} or env variable ROOT_URL is not detected! But must be specified!';
      }
      if (!this.serviceURL) {
        throw '[Spiderable-Middleware] {serviceURL} or env variable SPIDERABLE_SERVICE_URL or PRERENDER_SERVICE_URL is not detected! But must be specified!';
      }
      if (!/^http(s)?:\/\//i.test(this.rootURL)) {
        throw '[Spiderable-Middleware] {rootURL} is malformed! Must start with protocol http or https';
      }
      if (!/^http(s)?:\/\//i.test(this.serviceURL)) {
        throw '[Spiderable-Middleware] {serviceURL} is malformed! Must start with protocol http or https';
      }
      this.rootURL = this.rootURL.replace(/\/$/, '').replace(/^\//, '');
      this.serviceURL = this.serviceURL.replace(/\/$/, '').replace(/^\//, '');
      request.defaults({
        proxy: this.serviceURL
      });
      if (ignore) {
        this.ignoreRE = new RegExp(ignore.join('|'), '');
      } else {
        this.ignoreRE = false;
      }
    }

    Spiderable.prototype.middleware = function(req, res, next) {
      var hasIgnored, opts, phurl, reqUrl, urlObj, _as;
      urlObj = url.parse(req.url, true);
      hasIgnored = false;
      if (req.method.toLowerCase() !== 'get' && req.method.toLowerCase() !== 'head') {
        next();
        return false;
      }
      if (this.ignoreRE && this.ignoreRE.test(req.url)) {
        hasIgnored = true;
      }
      if ((urlObj.query.hasOwnProperty('_escaped_fragment_') || this.botsRE.test(req.headers['user-agent'])) && !hasIgnored) {
        reqUrl = this.rootURL;
        urlObj.path = urlObj.path.replace(/\/$/, '').replace(/^\//, '');
        if (urlObj.query.hasOwnProperty('_escaped_fragment_') && urlObj.query._escaped_fragment_.length) {
          urlObj.path += '/' + urlObj.query._escaped_fragment_.replace(/^\//, '');
        }
        reqUrl += '/' + urlObj.pathname;
        reqUrl = reqUrl.replace(/([^:]\/)\/+/g, "$1");
        phurl = this.serviceURL + '/?url=' + encodeURIComponent(reqUrl);
        opts = {
          url: phurl.replace(/([^:]\/)\/+/g, "$1")
        };
        if (this.auth && this.auth.length && !!~this.auth.indexOf(':')) {
          _as = this.auth.split(':');
          opts.auth = {
            user: _as[0],
            pass: _as[1]
          };
        }
        return request.get(opts).pipe(res);
      } else {
        return next();
      }
    };

    return Spiderable;

  })();

}).call(this);

//# sourceMappingURL=index.js.map