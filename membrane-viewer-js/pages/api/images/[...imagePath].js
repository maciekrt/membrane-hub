// We can make some getSession here api is in pages 
import { getSession } from 'next-auth/client'

export default async function handler(req, res) {
    const session = await getSession({ req }) 
    const {
        query: { imagePath },
    } = req;
    const FOLDER = process.env.IMAGES_FOLDER;

    // ADD SECURITY CHECK HERE!!! IMPORTANT!!!

    var name = imagePath.join('/');

    //console.log(`user: ${imagePath} ${name} ${FOLDER}`)
    // || securityList.indexOf(session.user.email) == -1
    var fs = require('fs')
    var buffer = fs.readFileSync(`${FOLDER}${name}`);
    //console.log(`len: ${buffer && buffer.length}`)
    res.status(200).send(buffer)
    res.end(null)
}