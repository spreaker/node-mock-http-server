# Changelog

#### 0.2.0 (2017-10-18)
 * Added wildcard support to `path` (thanks to [danedmunds](https://github.com/danedmunds))
 * Parse JSON in incoming request body when request content-type is "application/json" (thanks to [danedmunds](https://github.com/danedmunds))

#### 0.1.0 (2017-02-03)
 * Handlers are now appended to the begin of the list, when registering. This allows to override handlers in subsequent `on()` calls (see [Issue #2](https://github.com/spreaker/node-mock-http-server/issues/2)).

#### 0.0.4 (2016-02-04)
 * FIX: clear requests array on `server.stop()`
