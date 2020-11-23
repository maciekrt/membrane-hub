import Head from 'next/head'
import styles from './layout.module.css'
import Link from 'next/link'

export const siteTitle = 'Membrane Viewer'
export const siteDescription = 'Membrane Viewer description'

export default function Layout({children}) {
  return (
    <div className={styles.container}>
      <Head>
        <link rel="icon" href="/favicon.ico" />
        <meta name="description" content={siteDescription}/>
        <meta
          property="og:image"
          content={`https://og-image.now.sh/${encodeURI(
            siteTitle
          )}.png?theme=light&md=0&fontSize=75px&images=https%3A%2F%2Fassets.vercel.com%2Fimage%2Fupload%2Ffront%2Fassets%2Fdesign%2Fnextjs-black-logo.svg`}
        />
        <meta name="og:title" content={siteTitle} />
        <meta name="twitter:card" content="summary_large_image" />
      </Head>

      <header className={styles.header}>
        <h1 className={styles.title}>
          Welcome to Membrane Viewer
        </h1>
        <p className={styles.description}>
          To infinity and beyond! - Buzz Lightyear
        </p>
      </header>

      <main> {children} </main>

      <footer className={styles.footer}>
        {/* <div className={styles.backToHome}>
          <Link href="/">
            <a>← Back to home</a>
          </Link>
        </div> */}
        <div>
          <a href="https://vercel.com?utm_source=create-next-app&utm_medium=default-template&utm_campaign=create-next-app"
          target="_blank"
          rel="noopener noreferrer" >     
            Powered by{' '}
            <img src="/vercel.svg" alt="Vercel Logo" className="logo" />
          </a>
        </div>
      </footer>

    </div>
  )
}