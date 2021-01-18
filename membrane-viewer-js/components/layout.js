import Head from 'next/head'
import styles from './layout.module.css'
import Link from 'next/link'

export const siteTitle = 'Membrane Hub'
export const siteDescription = 'Membrane Hub'

export default function Layout({children}) {
  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <h1 className={styles.title}>
          Membrane Hub
        </h1>
        <p className={styles.description}>
          To infinity and beyond! - Buzz Lightyear 🚀🚀
        </p>
      </header>

      <main> {children} </main>

      {/* <footer className={styles.footer}> */}
        {/* <div className={styles.backToHome}>
          <Link href="/">
            <a>← Back to home</a>
          </Link>
        </div> */}
      {/* </footer> */}

    </div>
  )
}
