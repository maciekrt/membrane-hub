
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
        const dataset = imagePathOG[1]
        const channelIdx = parseInt(imagePathOG[2])
        const maskFlag = imagePathOG[3]

        var fs = require('fs')
        try {
            const metadataFile = fs.readFileSync(`${FOLDER}${userEmail}/${dataset}/metadata.json`)
            // This a metadata file for the dataset
            const metadata = JSON.parse(metadataFile)
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
            const imgIdx = Math.floor(metadata.z / 2);
            var ogPath = `${FOLDER}${userEmail}/${dataset}/${channelIdx}/${imdIdx}${add}_x1.png`
            var buffer = fs.readFileSync(ogPath);
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
