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
    });
});
