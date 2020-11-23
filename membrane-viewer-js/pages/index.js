import Head from 'next/head'
import 'react-image-gallery/styles/css/image-gallery.css'
import ImageGallery from 'react-image-gallery';
import Layout, { siteTitle } from '../components/layout'
import utilStyles from '../styles/utils.module.css'

// import { useEffect } from 'react'
import { useRouter } from 'next/router'

const images = [
  {
    original: String(require('../public/images/image1.png')),
    thumbnail: String(require('../public/images/image1.png?resize&size=100'))
  },
  {
    original: String(require('../public/images/image2.png')),
    thumbnail: String(require('../public/images/image2.png?resize&size=100'))
  },
  {
    original: String(require('../public/images/image1.png')),
    thumbnail: String(require('../public/images/image1.png?resize&size=100'))
  }
];

export default function Home() {
  const router = useRouter()
  const imageIdx = router.query.counter ? parseInt(router.query.counter) : 0

  function ourOnSlide(idx) {
    console.log(`Image number ${idx}`)
    // useEffect(() => {
    //   // Always do navigations after the first render
    //   router.push(`/?counter=${idx}`, undefined, { shallow: true })
    // }, [])
    router.push(`/?counter=${idx}`, undefined, { shallow: true })
  }

  // useEffect(() => {
  //   // The counter changed!
  // }, [router.query.counter])

  console.log(`What's the counter: ${router.query.counter}`)
  console.log(`Images: ${images[0].thumbnail} ${typeof (images[0].thumbnail)}`)

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
      <ImageGallery items={images} slideDuration={100} showPlayButton={false}
        startIndex={imageIdx} showIndex={true} onSlide={ourOnSlide} />
    </Layout>
  )
}
