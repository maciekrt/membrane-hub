
export default async function handler(req, res) {
    const {
        query: { imagePathOG },
    } = req;
    const FOLDER = process.env.IMAGES_FOLDER;
    if (imagePathOG.length > 4) {
        res.status(404)
        res.end(null)
    } else {
        const userEmail = imagePathOG[0]
        const dataset = imagePatOG[1]
        const channelIdx = parseInt(imagePathOG[2])
        const maskFlag = imagePathOG[3]
        var fs = require('fs')
        try {
            var add = ""
            switch(maskFlag) {
                case "unmasked":
                    break;
                case "mask2D":
                    add = "_masked"
                    break;
                case "mask3D":
                    add = "_masked3d"
                    break;
                default:
                    throw "Wrong path"
            }
            var buffer = fs.readFileSync(
                `${FOLDER}${userEmail}/${dataset}/${channelIdx}/20${add}_x1.png`);
            res.setHeader('Cache-Control', 'public, must-revalidate, max-age=3155760');
            res.setHeader('Content-Type', 'image/png')
            res.status(200).send(buffer)
        } catch (err) {
            console.log(`Error loading file: ${err.message}`)
            res.status(404)
        }
        res.end(null)
    }
}
