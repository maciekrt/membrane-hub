
const securityWhitelist = ['m.zdanowicz@gmail.com', 'grzegorz.kossakowski@gmail.com']

export function securityCheck(reqData, sessionData) {
    const domainMe = sessionData.split("@")[1]
    const domainLink = reqData.split("@")[1]
    const idx = securityWhitelist.indexOf(sessionData)
    // console.log(`securityCheck [reqData, sessionData]: ${reqData} ${sessionData}`)
    if ( (domainMe != domainLink) && idx === -1) {
        // console.log(`securityCheck[securityWhitelist, idx]: ${securityWhitelist} ${idx}`)
        throw new Error("wrong domains")
    } 
    // else {
    //     console.log("Image: same domains - OK.")
    // }
}