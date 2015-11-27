# Node.js HTTP Server Mock

Controllable HTTP Server Mock for your functional tests.


### Example

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

        // Now the server mock will handle a GET /resource
        // and will reply with 200 { hello: "world" }
        done();
    });
});
```
