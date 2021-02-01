import Cookies from 'cookies'

export default (req, res) => {
    // Create a cookies instance
    const cookies = new Cookies(req, res)
    // Get a cookie
    console.log(req.query.as_user)
    const as_user = req.query.as_user
    if (as_user == 'off') {
        console.log('Turning off the god mode')
        cookies.set('godMode')
    } else if (as_user == undefined) {
        res.status(400).send('Provide `as_user` parameter')
        return
    } else {
        console.log(`Setting god mode as ${as_user}`)
        // Set a cookie
        cookies.set('godMode', as_user, {
            httpOnly: true // true by default
        })
    }
    res.status(200).json({godMode: as_user})
  }
