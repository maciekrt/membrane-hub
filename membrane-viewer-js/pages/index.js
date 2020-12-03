import React from 'react'

// import { useEffect } from 'react'
import Head from 'next/head'
import { useRouter } from 'next/router'

import Layout, { siteTitle } from '../components/layout'
import utilStyles from '../styles/utils.module.css'
import 'react-image-gallery/styles/css/image-gallery.css'
import ImageGallery from 'react-image-gallery';

import {
  signIn,
  signOut,
  useSession,
  getSession
} from 'next-auth/client'

export default function Home({ images }) {
  const router = useRouter()
  const imageIdx = router.query.counter ? parseInt(router.query.counter) : 0
  const [session, loading] = useSession()

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
      <div>
          {!session && <>
            Not signed in <br />
            <button onClick={signIn}>Sign in</button>
          </>}
          {session && <>
            Signed in as {session.user.email} <br />
            <button onClick={signOut}>Sign out</button>
          </>}
      </div>
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
        <>
          {!session && <>
            No images visible here..
          </>}
          {session && <>
            <ImageGallery items={images} slideDuration={100} showPlayButton={false} 
            startIndex={imageIdx} showIndex={true} onSlide={ourOnSlide} lazyLoad={true} /> 
          </>} 
        </>
      </div>
    </Layout>
  )
}

export async function getServerSideProps(context) {
    // Call an external API endpoint to get posts.
    // You can use any data fetching library
    // const res = await fetch('https://.../posts')
    // const posts = await res.json()
    const session = await getSession(context);
    if(session) {
      console.log(`Session[user]: ${session.user.email}`)
    } else {
      console.log(`No session..`)
    }
    var images = null
    if (session && session.user.email == 'm.zdanowicz@gmail.com') {
      var fs = require('fs');
      // var files = fs.readdirSync('public/images/nencki.lsm/');
      var files = ['22_00', '23_00'];
      images = files.map(file =>
          ({
              original: 'api/images/nencki.lsm/main_' + file + '.png',
              thumbnail: 'api/images/nencki.lsm/thumb_' + file + '.png'
          })
      )
    }
    // By returning { props: posts }, the Blog component
    // will receive `posts` as a prop at build time
    return {
        props: {
          images
        }
    }
}
