# Changelog

#### 1.2.0 (2018-12-12)
 * Added `getHttpPort()` and `getHttpsPort()` (PR [#18](https://github.com/spreaker/node-mock-http-server/pull/18) - thanks to [Nautigsam](https://github.com/Nautigsam))

#### 1.1.0 (2018-11-14)
 * Added support to parse urlencoded request body (PR [#9](https://github.com/spreaker/node-mock-http-server/pull/9) - thanks to [zhaotian2470](https://github.com/zhaotian2470))
 * Removed obsolete code in the parsing of JSON-encoded request body (PR [#16](https://github.com/spreaker/node-mock-http-server/pull/16) - thanks to [pitpit](https://github.com/pitpit))

#### 1.0.0 (2018-04-26)
 * Added `reply.end` support
 * Added `connections()` support
 * Documented `reply.headersOverrides`
 * Remove headers from response, whose value is `undefined`
 * End all the connections on `server.stop()` before closing the HTTP server

#### 0.2.0 (2017-10-18)
 * Added wildcard support to `path` (thanks to [danedmunds](https://github.com/danedmunds))
 * Parse JSON in incoming request body when request content-type is "application/json" (thanks to [danedmunds](https://github.com/danedmunds))

#### 0.1.0 (2017-02-03)
 * Handlers are now appended to the begin of the list, when registering. This allows to override handlers in subsequent `on()` calls (see [Issue #2](https://github.com/spreaker/node-mock-http-server/issues/2)).

#### 0.0.4 (2016-02-04)
 * FIX: clear requests array on `server.stop()`
