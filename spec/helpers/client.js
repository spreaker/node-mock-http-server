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
module.exports.request = (host, port, method, path, headers, body) => {
    return new Promise((resolve, reject) => {
        const req = http.request({ host: host, port: port, method: method, headers: headers, path: path }, (res) => {
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

        if (body) {
            req.write(body);
        }

        req.end();
    });
};
