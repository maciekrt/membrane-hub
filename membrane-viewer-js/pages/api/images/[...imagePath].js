// We can make some getSession here api is in pages 
import { getSession } from 'next-auth/client'

export default async function handler(req, res) {
    const session = await getSession({ req }) 
    if(session) {
        const {
            query: { imagePath },
        } = req;
        const FOLDER = process.env.IMAGES_FOLDER;

        // ADD SECURITY CHECK HERE!!! IMPORTANT!!!
        var name = imagePath.join('/');

        var fs = require('fs')
        var buffer = fs.readFileSync(`${FOLDER}${session.user.email}/${name}`);
        //console.log(`len: ${buffer && buffer.length}`)
        res.setHeader('Cache-Control', 'max-age=3155760');
        res.setHeader('Content-Type', 'image/png')
        res.status(200).send(buffer)
        res.end(null)
    }

    res.status(401).end(null)
}