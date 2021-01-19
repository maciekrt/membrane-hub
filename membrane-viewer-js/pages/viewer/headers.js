import Head from 'next/head'

export default function Headers({ name, file, channelIdx, masked }) {
    return (
        <Head>
            <meta property="og:title" content={file} />
            <meta property="og:image" content={`https://hub.membrane.computer/api/imagesOG/${name}/${file}/${channelIdx}/${masked}/`} />
            <meta property="og:type" content="website" />
            <meta property="og:description" content={`${file} preview`} />
            <meta property="fb:app_id" content="180061987205320" />
        </Head>
    )
}
