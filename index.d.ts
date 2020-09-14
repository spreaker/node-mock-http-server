declare module 'mock-http-server' {
  import { KeyObject } from 'crypto';
  import { ClientRequest } from 'http';
  import { Socket } from 'net';

  export interface Request extends ClientRequest {
    body?: any;
  }

  export interface HttpConfig {
    host: string;
    port: number;
  }

  export interface HttpsConfig extends HttpConfig {
    key: string | Buffer | Array<Buffer | KeyObject>;
    cert: string | Buffer | Array<Buffer | KeyObject>;
  }

  type Callback = (error?: Error) => any;

  type SyncReplyFn<T> = (request: Request) => T;
  type AsyncReplyFn<T> = (request: Request, cb: (value: T) => void) => void;

  export interface ReplyOptions {
    /**
     * HTTP response status.
     */
    status?: number | SyncReplyFn<number>;
    /**
     * HTTP response headers. content-length is managed by the server implementation.
     */
    headers?: {
      [key: string]: string;
    };
    /**
     * HTTP response headers to override to default headers (ie. content-length).
     * If a value is set to undefined, the header gets removed from the response.
     */
    headersOverrides?: {
      [key: string]: string;
    };
    /**
     * HTTP response body.
     */
    body?: string | SyncReplyFn<string> | AsyncReplyFn<string>;
    /**
     * End the response once the body has been sent (default behaviour). If false,
     * it will keep the response connection open indefinitely (useful to test special
     * cases on the client side - ie. read timeout after partial body response sent).
     */
    end?: boolean;
  }

  export interface OnRequestOptions {
    /**
     * HTTP method to match. Can be * to match any method.
     */
    method?: string;
    /**
     * HTTP request path to match. Can be * to match any path
     * (to be used in conjunction with filter to allow custom matching)
     */
    path: string;
    /**
     * If it returns true the handler gets executed.
     */
    filter?: (request: Request) => boolean;
    reply?: ReplyOptions;
  }

  export default class ServerMock {
    /**
     * Create a new ServerMock
     * @param httpConfig Optional, if you want to start a HTTP server
     * @param httpsConfig Optional, if you want to start a HTTPS server
     */
    constructor(httpConfig: HttpConfig, httpsConfig?: HttpsConfig);
    /**
     * Starts the server and invokes the callback once ready to accept connections.
     */
    start: (callback: Callback) => void;
    /**
     * Stops the server and invokes the callback once all resources have been released.
     */
    stop: (callback: Callback) => void;
    /**
     * Defines a request handler. Multiple calls to on() can be chained together.
     */
    on: (handler: OnRequestOptions) => void;
    /**
     * Returns an array containing all requests received. If filter is defined, it
     * allows to filter requests by method, path, or both.
     */
    requests: (filter?: { method?: string; path?: string }) => [Request];
    /**
     * Returns an array containing all active connections.
     */
    connections: () => [Socket];
    /**
     * Returns the port at which the HTTP server is listening to or null otherwise. This
     * may be useful if you configure the HTTP server port to 0 which means the operating
     * system will assign an arbitrary unused port.
     */
    getHttpPort: () => number;
    /**
     * Returns the port at which the HTTPS server is listening to or null otherwise. This
     * may be useful if you configure the HTTPS server port to 0 which means the operating
     * system will assign an arbitrary unused port.
     */
    getHttpsPort: () => number;
    /**
     * Clears request handlers and requests received by the HTTP server.
     */
    reset: () => void;
    /**
     * Clears all request handlers that were previously set using on() method.
     */
    resetHandlers: () => void;
    /**
     * Clears all requests received by the HTTP server.
     */
    resetRequests: () => void;
  }
}
