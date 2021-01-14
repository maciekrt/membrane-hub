import Head from 'next/head'

export default function Headers({ name, file }) {
    return (
        <Head>
            <meta property="og:title" content="Membrane Hub" />
            <meta property="og:url" content={`https://hub.membrane.computer/viewer/${name}/${file}/`} />
            <meta property="og:image" content={`https://hub.membrane.computer/27348237482735.png`} />
            <meta property="og:type" content="website" />
            <meta property="og:description" content="That's some gorgeous FISH file" />
            <meta property="fb:app_id" content="180061987205320" />
        </Head>
    )
}
