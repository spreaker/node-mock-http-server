const ServerMock = require("../src/server.js");
const client     = require("./helpers/client.js");


describe("ServerMock", () => {
    let server;

    afterEach((done) => {
        if (!server) {
            return done();
        }

        server.stop(() => {
            server = null;
            done();
        });
    });


    describe("getHttpPort()", () => {
        it("should return the HTTP server port specified in the config at which the server is listening to", (done) => {
            server = new ServerMock({ host: "localhost", port: 21256 });
            expect(server.getHttpPort()).toBeNull();

            server.start(() => {
                expect(server.getHttpPort()).toBe(21256);
                done();
            });
        });

        it("should return the HTTP server port autoassigned by the operating system if set to zero in the config", (done) => {
            server = new ServerMock({ host: "localhost", port: 0 });
            expect(server.getHttpPort()).toBeNull();

            server.start(() => {
                expect(server.getHttpPort()).not.toBeNull();
                expect(server.getHttpPort()).not.toBe(0);
                done();
            });
        });
    });


    describe("on()", () => {
        beforeEach((done) => {
            server = new ServerMock({ host: "localhost", port: 0 });
            server.start(done);
        });

        it("should mock the server behaviour for the configure method and path", async () => {
            server.on({
                method: "GET",
                path:   "/resource",
                reply:  {
                    status:  200,
                    headers: { "content-type": "application/json" },
                    body:    JSON.stringify({ hello: "world" })
                }
            });

            const res = await client.request("localhost", server.getHttpPort(), "GET", "/resource");

            expect(res.statusCode).toBe(200);
            expect(res.headers["content-type"]).toBe("application/json");
            expect(res.body).toBe('{"hello":"world"}');
        });

        it("should return 404 is the requested method and path has not been mocked", async () => {
            const res = await client.request("localhost", server.getHttpPort(), "GET", "/resource");

            expect(res.statusCode).toBe(404);
            expect(res.headers["content-type"]).toBe("plain/text");
            expect(res.body).toBe("Not Found");
        });

        it("should get a text plain body when content-type is text/plain", async () => {
            server.on({
                method: "POST",
                path: "/resource",
                reply: {
                    status: function(req) {
                        if (req.body !== "Hello world\nThis is a text") {
                            return 403;
                        }
                        return 200;
                    }
                }
            });

            const res = await client.request("localhost", server.getHttpPort(), "POST", "/resource", { "Content-Type": "text/plain" }, "Hello world\nThis is a text");

            expect(res.statusCode).toBe(200);
        });
    });

    
    describe("requests()", () => {
        beforeEach(done => {
            server = new ServerMock({ host: "localhost", port: 0 });
            server.start(async () => {
                server.on({
                    method: "PUT",
                    path:   "/dog",
                    reply:  {
                        status:  200,
                        headers: { "content-type": "application/json" },
                        body:    JSON.stringify({ breed: "German Shepherd" })
                    }
                });
                server.on({
                    method: "POST",
                    path:   "/cat",
                    reply:  {
                        status:  200,
                        headers: { "content-type": "application/json" },
                        body:    JSON.stringify({ breed: "Maine coon" })
                    }
                });
                server.on({
                    method: "DELETE",
                    path:   "/bird",
                    reply:  {
                        status:  204,
                        headers: { "content-type": "application/json" }
                    }
                });

                await client.request("localhost", server.getHttpPort(), "PUT", "/dog", { "Content-Type": "application/json" }, JSON.stringify({ breed: "German Shepherd" })).catch(error => console.error(error));
                await client.request("localhost", server.getHttpPort(), "POST", "/cat", { "Content-Type": "application/json" }, JSON.stringify({ breed: "Maine coon" })).catch(error => console.error(error));
                await client.request("localhost", server.getHttpPort(), "DELETE", "/bird").catch(error => console.error(error));

                done();
            });
        });

        it("should return all requests when given no arguments", async() => {
            const requests = server.requests();

            expect(requests).not.toBeNull();
            expect(requests.length).toBe(3);
        });
        
        it("should return the request emitted on dog API when path equals 'dog'", () => {
            const requests = server.requests({ path: '/dog' });

            expect(requests).not.toBeNull();
            expect(requests.length).toBe(1);
            expect(requests[0].pathname).toBe('/dog');
            expect(requests[0].method).toBe('PUT');
        });
                
        it("should return the request emitted on cat API when method equals 'POST'", () => {
            const requests = server.requests({ method: 'POST' });

            expect(requests).not.toBeNull();
            expect(requests.length).toBe(1);
            expect(requests[0].pathname).toBe('/cat');
            expect(requests[0].method).toBe('POST');
        });
                        
        it("should return the request emitted on bird API when method equals 'DELETE' and path equals 'bird'", () => {
            const requests = server.requests({ path: '/bird', method: 'DELETE' });

            expect(requests).not.toBeNull();
            expect(requests.length).toBe(1);
            expect(requests[0].pathname).toBe('/bird');
            expect(requests[0].method).toBe('DELETE');
        });
    });

    describe("reset()", () => {
        beforeEach(done => {
            server = new ServerMock({ host: "localhost", port: 0 });
            server.start(async () => {
                server.on({
                    method: "GET",
                    path:   "/resource",
                    reply:  {
                        status:  200,
                        headers: { "content-type": "application/json" },
                        body:    JSON.stringify({ hello: "world" })
                    }
                });

                await client.request("localhost", server.getHttpPort(), "GET", "/resource");

                done();
            });
        });

        it("should return only Not Found error after being invoked", async () => {
            const res1 = await client.request("localhost", server.getHttpPort(), "GET", "/resource");
            expect(res1.statusCode).toBe(200);

            server.reset();

            // As there isn't any handler anymore, returns a Not Found error.
            const res2 = await client.request("localhost", server.getHttpPort(), "GET", "/resource");
            expect(res2.statusCode).toBe(404);
        });

        it("should leave an empty requests array", () => {
            server.reset();

            const requests = server.requests();
            expect(requests).not.toBeNull();

            expect(requests.length).toBe(0, "Requests weren't cleaned");
        });
    });

    describe("resetRequests()", () => {
        beforeEach(done => {
            server = new ServerMock({ host: "localhost", port: 0 });
            server.start(async () => {
                server.on({
                    method: "GET",
                    path:   "/resource",
                    reply:  {
                        status:  200,
                        headers: { "content-type": "application/json" },
                        body:    JSON.stringify({ hello: "world" })
                    }
                });

                await client.request("localhost", server.getHttpPort(), "GET", "/resource");

                done();
            });
        });

        it("should leave an empty requests array", () => {
            server.resetRequests();

            const requests = server.requests();
            expect(requests).not.toBeNull();

            expect(requests.length).toBe(0, "Requests weren't cleaned");
        });
    });
    
    describe("resetHandlers()", () => {
        beforeEach(done => {
            server = new ServerMock({ host: "localhost", port: 0 });
            server.start(() => {
                server.on({
                    method: "GET",
                    path:   "/resource",
                    reply:  {
                        status:  200,
                        headers: { "content-type": "application/json" },
                        body:    JSON.stringify({ hello: "world" })
                    }
                });

                done();
            });
        });

        it("should return only Not Found error after being invoked", async () => {
            const res1 = await client.request("localhost", server.getHttpPort(), "GET", "/resource");
            expect(res1.statusCode).toBe(200);

            server.resetHandlers();

            // As there isn't any handler anymore, returns a Not Found error.
            const res2 = await client.request("localhost", server.getHttpPort(), "GET", "/resource");
            expect(res2.statusCode).toBe(404);
        });
    });
});
