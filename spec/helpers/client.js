const http = require("http");


/**
 * Sends an HTTP request to the server and returns a Promise which resolve
 * with the HTTP response containing the body too.
 *
 * @param  {String} host
 * @param  {String} port
 * @param  {String} method
 * @param  {String} path
 * @return {Promise}
 */
module.exports.request = (host, port, method, path) => {
    return new Promise((resolve, reject) => {
        const req = http.request({ host: host, port: port, method: method, path: path }, (res) => {
            res.body = "";

            res.on("data", (chunk) => {
                res.body += chunk;
            });

            res.on("end", () => {
                resolve(res);
            });
        });

        req.on("error", (err) => {
            reject(err);
        });

        req.end();
    });
};
