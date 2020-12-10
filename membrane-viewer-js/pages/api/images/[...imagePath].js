// We can make some getSession here api is in pages 
import { getSession } from 'next-auth/client'

const securityWhitelist = ['m.zdanowicz@gmail.com', 'grzegorz.kossakowski@gmail.com']

export default async function handler(req, res) {
    const session = await getSession({ req }) 
    if(session && securityWhitelist.includes(session.user.email) ) {
        // console.log('Security whitelist contains your email.')
        const {
            query: { imagePath },
        } = req;
        const FOLDER = process.env.IMAGES_FOLDER;
        var name = imagePath.join('/');

        var fs = require('fs')
        var buffer = fs.readFileSync(`${FOLDER}${session.user.email}/${name}`);
        // console.log(`len: ${buffer && buffer.length}`)
        res.setHeader('Cache-Control', 'public, must-revalidate, max-age=3155760');
        res.setHeader('Content-Type', 'image/png')
        res.status(200).send(buffer)
        res.end(null)
    } else {
        // console.log("You might be not on a security whitelist.")
        res.status(401).end(null)
    }
}