import { createProxyMiddleware } from "http-proxy-middleware";


const restream = async function (proxyReq, req, res, options) {
    if (req.user) {
        if (
            req.headers['content-type'] &&
            req.headers['content-type'].match(/^multipart\/form-data/)
        ) {
            // build a string in multipart/form-data format with the data you need
            const formdataUser =
                `--${request.headers['content-type'].replace(/^.*boundary=(.*)$/, '$1')}\r\n` +
                `Content-Disposition: form-data; name="reqUser"\r\n` +
                `\r\n` +
                `${JSON.stringify(request.user)}\r\n`

            // set the new content length
            proxyReq.setHeader(
                'Content-Length',
                parseInt(request.headers['content-length']) + formdataUser.length
            )

            proxyReq.write(formdataUser)
        } else {
            const body = JSON.stringify({ ...req.body, reqUser: req.user })
            proxyReq.setHeader('Content-Type', 'application/json')
            proxyReq.setHeader('Content-Length', body.length)
            proxyReq.write(body)
        }
    }
}

// Create proxy instance outside of request handler function to avoid unnecessary re-creation
const apiProxy = createProxyMiddleware({
    target: `http://localhost:${process.env.PORT}`,
    changeOrigin: true,
    pathRewrite: {
        [`/api/uploadScratchpad`]: "/extend_scratchpad",
    },
    secure: false,
    onProxyReq: restream
});

export default function (req, res) {
    console.log(`Redirecting`)
    apiProxy(req, res, (result) => {
        if (result instanceof Error) {
            throw result;
        }

        throw new Error(
            `Request '${req.url}' is not proxied! We should never reach here!`
        );
    });
}