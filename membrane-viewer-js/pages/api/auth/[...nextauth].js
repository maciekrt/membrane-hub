import NextAuth from 'next-auth'
import Providers from 'next-auth/providers'

const options = {
    providers: [
        // OAuth authentication providers...
        Providers.Google({
            clientId: process.env.GOOGLE_ID,
            clientSecret: process.env.GOOGLE_SECRET
        })
    ],
    // // Optional SQL or MongoDB database to persist users
    // database: process.env.DATABASE_URL
}

export default (req, res) => NextAuth(req, res, options)