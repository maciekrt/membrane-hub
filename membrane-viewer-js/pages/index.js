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
      <div className={utilStyles.grid}>
        <a href="https://nextjs.org/docs" className={utilStyles.card}>
          <h3>Upload a file</h3>
          <p>Uploading a nuclei image and the corresponding labelling.</p>
        </a>
        <>
        {!session &&
          <a href="https://nextjs.org/docs" className={utilStyles.card} onClick={signIn} >
            <h3>Log in</h3>
            <p>We are currently supporting log in using Google.</p>
          </a>
        }
        {session &&
          <a href="/" className={utilStyles.card} onClick={signOut}>
          <h3>Log out</h3>
          <p>You are logged in as {session.user.email}</p>
          </a>
        }  
        </>
      </div>
      <div>
        <>
          {!session && <>
            No images visible here..
          </>}
          {session && <>
            <ImageGallery items={images} slideDuration={50} showPlayButton={false}
              showIndex={true} startIndex={imageIdx} lazyLoad={true} /> 
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
    var images = []
    if (session && session.user.email == 'm.zdanowicz@gmail.com') {
      var fs = require('fs');
      const parse = require('csv-parse/lib/sync')
      var files = []
      var rawFile = fs.readFileSync('/Users/maciek/JS/data-membrane-viewer/public/images/nencki.lsm/images.csv')
      const records = parse(rawFile, {
        columns: true,
        skip_empty_lines: true
      })
      images = records.map(file =>
            ({
              original: `images/nencki.lsm/${file['name']}_x1.png`,
              thumbnail: `images/nencki.lsm/${file['name']}_100x100.png`
            })
        )
      // var files = fs.readdirSync('public/images/nencki.lsm/');
      // var files = ['20_00.png', '21_00.png', '22_00.png', '23_00.png', '24_00.png', '25_00.png', '26_00.png', '27_00.png'];
    } 
    return {
        props: {
          images
        }
    }
}
