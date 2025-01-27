
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

export function getSameDomainEmails(email) {
    const domainMe = email.split("@")[1]
     // Blacklisting gmail, it's not an organization
    if (domainMe == "gmail.com" && securityWhitelist.indexOf(email) == -1) {
        return []
    }
    const baseDir = process.env.IMAGES_FOLDER
    const fs = require('fs');
    var dirs = fs.readdirSync(baseDir);
    dirs = dirs.filter((elem) => {
        const domainDir = elem.split("@")[1]
        return domainDir == domainMe && elem != email
    })
    if(securityWhitelist.indexOf(email) > -1) {
        dirs.push("a.magalska@nencki.edu.pl")
    }
    return dirs
}
