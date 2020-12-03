# Development notes for Membrane viewer

## Let's keep track of what's actually happening here.

1. This is based on the starter template from [Learn Next.js](https://nextjs.org/learn).
2. Next.JS component Image unfortunately does not work -- npm export does not work in Netlify (Image requires some node component which could not be deployed using static export). We use [next-optimized-image](https://github.com/cyrilwanner/next-optimized-image) instead.
3. We had a little problem with responsive-loader [responsive-loader with sharp error #50](https://github.com/cyrilwanner/next-optimized-images/issues/50). The solution is out [there](https://github.com/cyrilwanner/next-optimized-images/issues/50#issuecomment-687892036).
4. We are now using [react-image-gallery](https://github.com/xiaolin/react-image-gallery).
5. There's an issue with css files.

## Image transformations and Content Delivery Networks (CDN)

[Image transformations service](https://docs.netlify.com/large-media/transform-images/#request-transformations) is available in Netlify. It unfortunately costs (99$) if we want more than 2.5k transformations per month.

Otherwise we might use Netlify Large Media support. However, concerning security, this works only in certain plans.

`Uploading tracked files to the Netlify Large Media storage service requires Git to have access to the /.netlify/large-media path on the connected site. This will not work with site-wide password protection, but will work with other forms of visitor access control, as long as you leave access open to the /.netlify/large-media path.`
