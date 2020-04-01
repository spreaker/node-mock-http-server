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

| Option                   | Default                                  | Description |
| ------------------------ | ---------------------------------------- | ----------- |
| `method`                 | `GET`                                    | HTTP method to match. Can be `*` to match any method. |
| `path`                   |                                          | HTTP request path to match. Can be `*` to match any path (to be used in conjunction with filter to allow custom matching)|
| `filter`                 |                                          | The value is a filter function `fn(request)`: if it returns `true` the handler gets executed. |
| `reply.status`           | `200`                                    | HTTP response status code. Can be a `number` or a synchronous function `fn(request)` that returns the response status code. |
| `reply.headers`          | `{ "content-type": "application/json" }` | HTTP response headers. `content-length` is managed by the server implementation. |
| `reply.headersOverrides` | `{ "content-length": 1000 }`             | HTTP response headers to override to default headers (ie. `content-length`). If a value is set to `undefined`, the header gets removed from the response. |
| `reply.body`             | empty string                             | HTTP response body. Can be a `string`, a synchronous function `fn(request)` that returns the body, or an asynchronous function `fn(request, reply)` that send the response body invoking `reply(body)`. |
| `reply.end`              | `true`                                   | End the response once the body has been sent (default behaviour). If `false`, it will keep the response connection open indefinitely (useful to test special cases on the client side - ie. read timeout after partial body response sent). |
| `delay`                  | 0                                        | Delays the response by X milliseconds. |


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

or (JSON is parsed when the Content-Type is 'application/json'):
```js
server.on({
    method: 'POST',
    path: '/resources',
    filter: function (req) {
      return _.isEqual(req.body, {
        name: 'someName',
        someOtherValue: 1234
      })
    },
    reply: {
        status:  201,
        headers: { "content-type": "application/json" },
        body: {
          id: 987654321,
          name: 'someName',
          someOtherValue: 1234
        }
    }
});
```


#### `requests(filter)`

Returns an array containing all requests received. If `filter` is defined, it allows to filter requests by `method`, `path`, or both.

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


#### `connections()`

Returns an array containing all active connections.


#### `getHttpPort()`

Returns the port at which the HTTP server is listening to or `null` otherwise. This may be useful if you configure the HTTP server port to `0` which means the operating system will assign an arbitrary unused port.


#### `getHttpsPort()`

Returns the port at which the HTTPS server is listening to or `null` otherwise. This may be useful if you configure the HTTPS server port to `0` which means the operating system will assign an arbitrary unused port.

#### `reset()`

Clears request handlers and requests received by the HTTP server.

#### `resetHandlers()`

Clears all request handlers that were previously set using `on()` method.


#### `resetRequests()`

Clears all requests received by the HTTP server.



## Contribute

### How to publish a new version

**Release npm package**:

1. Update version in `package.json` and `package-lock.json`
2. Update `CHANGES.md`
3. Release new version on GitHub
4. Run `npm publish`



### License

MIT
