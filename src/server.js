const url = require('url');
const http = require('http');
const https = require('https');
const connect = require('connect');
const multiparty = require('multiparty');
const bodyParser = require('body-parser');

/**
 * @param {string} host     Server host
 * @param {number} port     Server port
 * @param {string} [key]      HTTPS key (if missing the server is HTTP)
 * @param {string} [cert]     HTTPS certificate (if missing the server is HTTP)
 */
function Server(host, port, key, cert)
{
    const connections = new Set();
    let handlers = [];
    let requests = [];
    let server = null;
    let address = null;

    function _saveRequest(req, res, next) {
        requests.push(req);

        next();
    }

    function _multipart(req, res, next) {

        if (req.method !== 'POST' && req.method !== 'PUT') {
            return next();
        }

        if ('multipart/form-data' !== (req.headers['content-type'] || '').split(';')[0]) {
            return next();
        }

        const form = new multiparty.Form();

        form.parse(req, function(err, fields, files) {

            // mark the body as parsed so other parsers don't attempt to parse the request
            req._body = true;

            req.body  = {};
            req.files = {};

            if (err) { return next(); }

            Object.entries(fields).forEach(([name, value]) => {
                if (Array.isArray(value) && value.length === 1) {
                    req.body[name] = value[0];
                } else {
                    req.body[name] = value;
                }
            });

            Object.entries(files).forEach(([name, value]) => {
                if (Array.isArray(value) && value.length === 1) {
                    req.files[name] = value[0];
                } else {
                    req.files[name] = value;
                }
            });

            next();
        });
    }

    /**
     * Supports:
     * - { reply: { body: "data" }}
     * - { reply: { body: function(req) { return "data"; }}}
     * - { reply: { body: function(req, send) { setTimeout(function() { send("data"); }, 1000); }}}
     */
    function _getResponseBody(handler, req, callback) {
        // String
        if (!(typeof handler.reply.body === 'function')) {
            return callback(handler.reply.body || "");
        }

        // Sync function
        if (handler.reply.body.length <= 1) {
            return callback(handler.reply.body(req) || "");
        }

        // Async function
        handler.reply.body(req, callback);
    }

    /**
     * Supports:
     * - { reply: { status: 200 }}
     * - { reply: { status: function(req) { return 200; }}}
     */
    function _getResponseStatus(handler, req, callback) {
        // Number
        if (!(typeof handler.reply.status === 'function')) {
            return callback(handler.reply.status || 0);
        }

        // Sync function
        return callback(handler.reply.status(req) || 0);
    }

    function _handleMockedRequest(req, res, next) {

        let handled = false;

        handlers.forEach((handler) => {

            // Parse request URL
            const reqParts = url.parse(req.url, true);
            req.pathname = reqParts.pathname;
            req.query    = reqParts.query;

            // Check if we can handle the request
            if (handled ||
              (handler.method !== "*" && req.method !== handler.method.toUpperCase()) ||
              (handler.path !== "*" && reqParts.pathname !== handler.path) ||
              (handler.filter && handler.filter(req) !== true)) {
                return;
            }

            // Flag as handled
            handled = true;

            // Get response status and body
            _getResponseBody(handler, req, function(content) {
                _getResponseStatus(handler, req, function(status) {

                    // Prepare response data
                    const encoding = Buffer.isBuffer(content) ? undefined : "utf8";
                    const length   = Buffer.isBuffer(content) ? content.length : Buffer.byteLength(content, "utf8");

                    // Prepare headers
                    // Remove undefined values from headers (useful to remove content-length from the response if
                    // overridden with undefined)
                    const headers = Object.entries({
                        ...handler.reply.headers,
                        'content-length': length,
                        ...(handler.reply.headersOverrides || {}),
                    }).reduce((accum, [headerName, headerValue]) => {
                        if (headerValue !== undefined) {
                            accum[headerName] = headerValue;
                        }
                        return accum;
                    }, {});

                    // Remove "null" values from headers
                    const headersToSend = Object.entries(headers).reduce((accum, [name, value]) => {
                        if (value !== null) {
                            accum[name] = value;
                        }
                        return accum;
                    }, {});

                    // Send response (supports delay)
                    setTimeout(function() {

                        // Send headers
                        res.writeHead(status, headersToSend);

                        // Send content
                        if (req.method !== "HEAD") {
                            res.write(content, encoding);
                        }

                        // End response (unless explicitly stated to keep it open)
                        if (handler.reply.end !== false) {
                            res.end();
                        }

                    }, handler.delay || 0);

                });
            });
        });

        if (!handled) {
            next();
        }
    }

    function _handleDefaultRequest(req, res, next)
    {
        res.writeHead(404, {
            "content-type":   "plain/text",
            "content-length": 9
        });

        res.end("Not Found");
    }

    this.start = function(callback)
    {
        // Create app stack
        const connectApp = connect()
            .use(_saveRequest)
            .use(_multipart)
            .use(bodyParser.json())
            .use(bodyParser.text())
            .use(bodyParser.urlencoded({extended: true}))
            .use(bodyParser.text({type: function() { return true; }}))
            .use(_handleMockedRequest)
            .use(_handleDefaultRequest);

        // Create server
        if (key && cert) {
            server = https.createServer({key: key, cert: cert}, connectApp);
        } else {
            server = http.createServer(connectApp);
        }

        server.on("connection", function (connection) {
            connection.on("close", function () {
                connections.delete(connection);
            });

            connections.add(connection);
        });

        server.on("listening", function () {
            address = server.address();
            callback();
        });

        server.listen(port, host);
    };


    this.stop = (callback) => {
        if (!server) {
            return callback();
        }

        // Close connections
        connections.forEach((connection) => {
            connection.end();
        });

        server.on("close", function() {
            server   = null;
            address  = null;
            handlers = [];

            // Wait until all connections are closed
            if (connections.size === 0) {
                requests = [];

                callback();
            } else {
                connections.forEach((connection) => {
                    connection.on("close", function() {
                        connections.delete(connection);
                        if (connections.size === 0) {
                            requests = [];

                            callback();
                        }
                    });
                });
            }
        });

        server.close();
    };

    this.on = (handler) => {
        // Add default reply
        handler.reply = {
            status: 200,
            body: "",
            ...handler.reply,
        };
        handler.reply.headers = {
            "content-type": "application/json",
            ...handler.reply.headers,
        };

        // Add default method
        handler = {
            method: "GET",
            ...handler,
        };

        handlers.unshift(handler);
        return this;
    };

    /**
     * Clears request handlers and requests received by the HTTP server.
     */
    this.reset = () => {
        this.resetHandlers();
        this.resetRequests();
    }

    /**
     * Clears all request handlers that were previously set using `on()` method.
     */
    this.resetHandlers = () => {
        handlers = [];
    };

    /**
     * Clears all requests received by the HTTP server.
     */
    this.resetRequests = () => {
        requests = [];
    }

    /**
     * Returns an array containing all requests received. If `filter` is defined,
     * filters the requests by:
     * - method
     * - path
     *
     * @param  {Object} filter
     * @return {Array}
     */
    this.requests = (filter) => {
        return requests.filter((req) => {
            const reqParts = url.parse(req.url, true);
            const methodMatch = !filter || !filter.method || filter.method === req.method;
            const pathMatch = !filter || !filter.path || filter.path === reqParts.pathname;

            return methodMatch && pathMatch;
        });
    };

    /**
     * Returns an array containing all active connections.
     *
     * @return {Array}
     */
    this.connections = () => {
        return Array.from(connections.values());
    };

    /**
     * Returns the port number if set or null otherwise
     *
     * @return {number|null}
     */
    this.getPort = () => {
        return address ? address.port : null;
    }
}

function ServerVoid() {

    this.on            = function() {};
    this.start         = function(callback) { callback(); };
    this.stop          = function(callback) { callback(); };
    this.requests      = function() { return []; };
    this.connections   = function() { return []; };
    this.getPort       = function() { return null; };
    this.reset         = function() {};
    this.resetHandlers = function() {};
    this.resetRequests = function() {};
}

/**
 * @param {{host: string; port: number;}} [httpConfig]
 * @param {{host: string; port: number; key: string; cert: string}} [httpsConfig]
 */
function ServerMock(httpConfig, httpsConfig)
{
    const httpServerMock  = httpConfig ? new Server(httpConfig.host, httpConfig.port) : new ServerVoid();
    const httpsServerMock = httpsConfig ? new Server(httpsConfig.host, httpsConfig.port, httpsConfig.key, httpsConfig.cert) : new ServerVoid();

    this.start = (callback) => {
        httpServerMock.start(function() {
            httpsServerMock.start(function() {
                callback();
            });
        });
    };

    this.stop = (callback) => {
        httpServerMock.stop(function() {
            httpsServerMock.stop(callback);
        });
    };

    this.on = (handler) => {
        httpServerMock.on(handler);
        httpsServerMock.on(handler);

        return this;
    };

    this.requests = (filter) => {
        return httpServerMock.requests(filter).concat(httpsServerMock.requests(filter));
    }

    this.connections = () => {
        return httpServerMock.connections().concat(httpsServerMock.connections());
    }

    this.getHttpPort = () => {
        return httpServerMock.getPort();
    }

    this.getHttpsPort = () => {
        return httpsServerMock.getPort();
    }

    this.reset = () => {
        httpServerMock.reset();
        httpsServerMock.reset();
    }

    this.resetHandlers = () => {
        httpServerMock.resetHandlers();
        httpsServerMock.resetHandlers();
    }

    this.resetRequests = () => {
        httpServerMock.resetRequests();
        httpsServerMock.resetRequests();
    }
}


module.exports = ServerMock;
