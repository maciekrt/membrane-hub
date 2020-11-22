# Development notes for Membrane viewer

## Let's keep track of what's actually happening here.

1. This is based on the starter template from [Learn Next.js](https://nextjs.org/learn).
2. Next.JS component Image unfortunately does not work -- npm export does not work in Netlify (Image requires some node component which could not be deployed using static export). We use [next-optimized-image](https://github.com/cyrilwanner/next-optimized-image) instead.
3. We had a little problem with responsive-loader [responsive-loader with sharp error #50](https://github.com/cyrilwanner/next-optimized-images/issues/50). The solution is out [there](https://github.com/cyrilwanner/next-optimized-images/issues/50#issuecomment-687892036).
