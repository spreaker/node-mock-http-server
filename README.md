# Node.js HTTP Server Mock

Mockable HTTP Server your functional tests.

`npm install mock-http-server`


### Full working example

```js
var ServerMock = require("mock-http-server");

describe('Test', function() {

    // Run an HTTP server on localhost:9000
    var server = new ServerMock({ host: "localhost", port: 9000 });

    beforeEach(function(done) {
        server.start(done);
    });

    afterEach(function(done) {
        server.stop(done);
    });

    it('should do something', function(done) {
        server.on({
            method: 'GET',
            path: '/resource',
            reply: {
                status:  200,
                headers: { "content-type": "application/json" },
                body:    JSON.stringify({ hello: "world" })
            }
        });

        // Now the server mock will handle a GET http://localhost:9000/resource
        // and will reply with 200 `{"hello": "world"}`
        done();
    });
});
```


### Methods

#### Constructor

`new ServerMock(httpConfig, httpsConfig)` instance a new mockable HTTP/HTTPS Server. If `httpConfig` is defined, creates an HTTP server, while if `httpsConfig` is defined, creates an HTTPS server. They can be both defined.

Example:
```js
var server = new ServerMock({
    host: "localhost",
    port: 80
}, {
    host: "localhost",
    port: 443,
    key: fs.readFileSync("private-key.pem"),
    cert: fs.readFileSync("certificate.pem")
});
```


#### `start(callback)`

Starts the server and invokes the callback once ready to accept connections.

Example:
```js
beforeEach(function(done) {
    server.start(done);
});
```


#### `stop(callback)`

Stops the server and invokes the callback all resources have been released.

Example:
```js
afterEach(function(done) {
    server.stop(done);
});
```

#### `on(options)`

Defines a request handler. Multiple calls to `on()` can be chained together.

| Option          | Default                                  | Description |
| --------------- | ---------------------------------------- | ----------- |
| `method`        | `GET`                                    | HTTP method to match. Can be `*` to match any method. |
| `path`          |                                          | HTTP request path to match. |
| `params`        |                                          | Query Parameters |
| `filter`        |                                          | The value is a filter function `fn(request)`: if it returns `true` the handler gets executed. |
| `reply.status`  | `200`                                    | HTTP response status code. Can be a `number` or a synchronous function `fn(request)` that returns the response status code. |
| `reply.headers` | `{ "content-type": "application/json" }` | HTTP response headers. `content-length` is managed by the server implementation. |
| `reply.body`    | empty string                             | HTTP response body. Can be a `string`, a synchronous function `fn(request)` that returns the body, or an asynchronous function `fn(request, reply)` that send the response body invoking `reply(body)`. |
| `delay`         | 0                                        | Delays the response by X milliseconds. |


Example:
```js
server.on({
    method: 'GET',
    path: '/resource',
    reply: {
        status:  200,
        headers: { "content-type": "application/json" },
        body:    JSON.stringify({ hello: "world" })
    }
});
```

or:
```js
server.on({
    method: 'GET',
    path: '/resource',
    params: { id: '1', class: '2' },
    reply: {
        status:  200,
        headers: { "content-type": "application/json" },
        body:    JSON.stringify({ page: "resource", id: "1", class: "2" })
    }
});
```

or:
```js
server.on({
    method: '*',
    path: '/resource',
    reply: {
        status:  200,
        headers: { "content-type": "application/json" },
        body:    function(req) {
            return req.method === "GET" ? JSON.stringify({ action: "read" }) : JSON.stringify({ action: "edit" });
        }
    }
});
```

or:
```js
server.on({
    method: '*',
    path: '/resource',
    reply: {
        status:  200,
        headers: { "content-type": "application/json" },
        body:    function(req, reply) {
            setTimeout(function() {
                reply(req.method === "GET" ? JSON.stringify({ action: "read" }) : JSON.stringify({ action: "edit" }));
            }, 100);
        }
    }
});
```


#### `requests(filter)`

Returns an array containing all requests received. If `filter` is defined, it allows to filter requests by `method` and/or `path`.

| Filter          | Description |
| --------------- | ----------- |
| `method`        | Filter requests by method. |
| `path`          | Filter requests by path. |

Example:
```js
// Returns all requests
server.requests();

// Returns all GET requests
server.requests({ method: "GET" });

// Returns all GET requests to /resource
server.requests({ method: "GET", path: "/resource" });
```


### License

MIT
