import Layout, { siteTitle } from '../components/layout'
import utilStyles from '../styles/utils.module.css'
import styles from './layout.module.css'
import Link from 'next/link'
import Head from 'next/head'

import 'react-image-gallery/styles/css/image-gallery.css'
import ImageGallery from 'react-image-gallery';

import { useEffect } from 'react'
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
  console.log(`Images: ${images[0].thumbnail} ${typeof(images[0].thumbnail)}`)
  
  return (
    <div className="container">
      <Head>
        <title>Membrane Viewer</title>
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <main>
        <h1 className="title">
          Welcome to Membrane Viewer
        </h1>

        <p className="description">
          To infinity and beyond! - Buzz Lightyear
        </p>

        <div className="grid">
          <a href="https://nextjs.org/docs" className="card">
            <h3>Upload a file</h3>
            <p>Uploading a nuclei image and the corresponding labelling.</p>
          </a>
          <a href="https://nextjs.org/docs" className="card">
            <h3>Documentation &rarr;</h3>
            <p>Find in-depth information about Next.js features and API.</p>
          </a>
        </div>

        {/* Comments 
        onChange={onChange} onClickItem={onClickItem} onClickThumb={onClickThumb}
        */}

        <ImageGallery items={images} slideDuration={100} showPlayButton={false} 
          startIndex={imageIdx} showIndex={true} onSlide={ourOnSlide} />

      </main>

      <footer>
        <a href="https://vercel.com?utm_source=create-next-app&utm_medium=default-template&utm_campaign=create-next-app"
          target="_blank"
          rel="noopener noreferrer">
          Powered by{' '}
          <img src="/vercel.svg" alt="Vercel Logo" className="logo" />
        </a>
      </footer>

      <style jsx>{`
        .container {
          min-height: 100vh;
          padding: 0 0.5rem;
          display: flex;
          flex-direction: column;
          justify-content: center;
          align-items: center;
        }

        main {
          padding: 5rem 0;
          flex: 1;
          display: flex;
          flex-direction: column;
          justify-content: center;
          align-items: center;
        }

        footer {
          width: 100%;
          height: 100px;
          border-top: 1px solid #eaeaea;
          display: flex;
          justify-content: center;
          align-items: center;
        }

        footer img {
          margin-left: 0.5rem;
        }

        footer a {
          display: flex;
          justify-content: center;
          align-items: center;
        }

        a {
          color: inherit;
          text-decoration: none;
        }

        .title a {
          color: #0070f3;
          text-decoration: none;
        }

        .title a:hover,
        .title a:focus,
        .title a:active {
          text-decoration: underline;
        }

        .title {
          margin: 0;
          line-height: 1.15;
          font-size: 4rem;
        }

        .title,
        .description {
          text-align: center;
        }

        .description {
          line-height: 1.5;
          font-size: 1.5rem;
        }

        code {
          background: #fafafa;
          border-radius: 5px;
          padding: 0.75rem;
          font-size: 1.1rem;
          font-family: Menlo, Monaco, Lucida Console, Liberation Mono,
            DejaVu Sans Mono, Bitstream Vera Sans Mono, Courier New, monospace;
        }

        .grid {
          display: flex;
          align-items: center;
          justify-content: center;
          flex-wrap: wrap;

          max-width: 800px;
          margin-top: 3rem;
        }

        .card {
          margin: 1rem;
          flex-basis: 45%;
          padding: 1.5rem;
          text-align: left;
          color: inherit;
          text-decoration: none;
          border: 1px solid #eaeaea;
          border-radius: 10px;
          transition: color 0.15s ease, border-color 0.15s ease;
        }

        .card:hover,
        .card:focus,
        .card:active {
          color: #0070f3;
          border-color: #0070f3;
        }

        .card h3 {
          margin: 0 0 1rem 0;
          font-size: 1.5rem;
        }

        .card p {
          margin: 0;
          font-size: 1.25rem;
          line-height: 1.5;
        }

        .logo {
          height: 1em;
        }

        @media (max-width: 600px) {
          .grid {
            width: 100%;
            flex-direction: column;
          }
        }
      `}</style>

      <style jsx global>{`
        html,
        body {
          padding: 0;
          margin: 0;
          font-family: -apple-system, BlinkMacSystemFont, Segoe UI, Roboto,
            Oxygen, Ubuntu, Cantarell, Fira Sans, Droid Sans, Helvetica Neue,
            sans-serif;
        }

        * {
          box-sizing: border-box;
        }
      `}</style>
    </div>
  )
}
