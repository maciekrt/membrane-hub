import Head from 'next/head'

export default function Headers({ name, file, channelIdx, masked }) {
    return (
        <Head>
            <meta property="og:title" content="Membrane Hub" />
            <meta property="og:url" content={`https://hub.membrane.computer/viewer/${name}/${file}/`} />
            <meta property="og:image" content={`https://hub.membrane.computer/api/imagesOG/${name}/${file}/${channelIdx}/${masked}/`} />
            <meta property="og:image:width" content={600} />
            <meta property="og:image:height" content={600} />
            <meta property="og:type" content="website" />
            <meta property="og:description" content="That's some gorgeous FISH file" />
            <meta property="fb:app_id" content="180061987205320" />
        </Head>
    )
}
