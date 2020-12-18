// We can make some getSession here api is in pages 
// import { getSession } from 'next-auth/client'

// https://ikartik.com/tutorials/nextjs-email-signup-part2
// https://nodejs.dev/learn/make-an-http-post-request-using-nodejs

export default async function handler(req, res) {
    var data = req.body
    console.log(`What the hell is the url: ${data['url']}`)

    const axios = require('axios')
    // POST to the Flask Service pushing to the queue
    axios.post('http://localhost:5000/send', {
            url: data['url'],
            gdrive: data['gdrive']
        })
        .then(resUploadServer => {
            console.log(`statusCode: ${resUploadServer.statusCode}`)
            console.log(resUploadServer)
        })
        .catch(error => {
            console.error(error)
        })
    res.status(200)
    res.end()
}