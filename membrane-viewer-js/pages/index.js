import Head from 'next/head'
import 'react-image-gallery/styles/css/image-gallery.css'
import ImageGallery from 'react-image-gallery';
import Layout, { siteTitle } from '../components/layout'
import utilStyles from '../styles/utils.module.css'

// import { useEffect } from 'react'
import { useRouter } from 'next/router'

export async function getStaticProps() {
  // Call an external API endpoint to get posts.
  // You can use any data fetching library
  // const res = await fetch('https://.../posts')
  // const posts = await res.json()

  var fs = require('fs');
  var files = fs.readdirSync('public/images/nencki.lsm/');
  var images = files.map(file => 
    ({
      original: String(require('../public/images/nencki.lsm/' + file)),
      thumbnail: String(require('../public/images/nencki.lsm/' + file + '?resize&size=100'))
    })
  )

  // By returning { props: posts }, the Blog component
  // will receive `posts` as a prop at build time
  return {
    props: {
      images
    },
  }
}

export default function Home({images}) {
  const router = useRouter()
  const imageIdx = router.query.counter ? parseInt(router.query.counter) : 0

  function ourOnSlide(idx) {
    // console.log(`Image number ${idx}`)
    // useEffect(() => {
    //   // Always do navigations after the first render
    //   router.push(`/?counter=${idx}`, undefined, { shallow: true })
    // }, [])
    router.push(`/?counter=${idx}`, undefined, { shallow: true })
  }

  // useEffect(() => {
  //   // The counter changed!
  // }, [router.query.counter])

  // console.log(`What's the counter: ${router.query.counter}`)
  // console.log(`Images: ${images[0].thumbnail} ${typeof (images[0].thumbnail)}`)

  return (
    <Layout>
      <Head>
        <title>{siteTitle}</title>
      </Head>
      <div className={utilStyles.grid}>
        <a href="https://nextjs.org/docs" className={utilStyles.card}>
          <h3>Upload a file</h3>
          <p>Uploading a nuclei image and the corresponding labelling.</p>
        </a>
        <a href="https://nextjs.org/docs" className={utilStyles.card}>
          <h3>Documentation &rarr;</h3>
          <p>Find in-depth information about Next.js features and API.</p>
        </a>
      </div>
      <div>
        <ImageGallery items={images} slideDuration={100} showPlayButton={false}
        startIndex={imageIdx} showIndex={true} onSlide={ourOnSlide} lazyLoad={true} />
      </div>
    </Layout>
  )
}
