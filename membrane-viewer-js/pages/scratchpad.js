import React, { useMemo } from 'react'

import Head from 'next/head'
import Link from 'next/link'
import { useSession } from 'next-auth/client'
import useSWR from 'swr'

import { useDropzone } from 'react-dropzone';
import axios, { post } from 'axios';

import styles from './scratchpad.module.css'
import Layout, { siteTitle } from '../components/layout'


const fetcher = (url) => fetch(url)
    .then(res => res.json())

export default function Scratchpad() {
    const [session, loading] = useSession()
    const { data, error } = useSWR(`/api/scratchpadData`, fetcher, {
        refreshInterval: 1000 }, { data: undefined, error: undefined })
    const metadata = data?.metadata
    const images = metadata?.images
    const imagesDisplay = []
    if(!!images) {
        const n = images.length
        for(var i = 0; i<n; i++) {
            imagesDisplay.push(images[n-1-i])
        }
    }
    const outlines = metadata?.outlines
    const loggedIn = !!session?.user

    function StyledDropzone({ onDrop }) {
        const {
            getRootProps,
            getInputProps,
            isDragActive,
            isDragAccept,
            isDragReject
        } = useDropzone({ accept: 'image/*', onDrop: onDrop });

        const style = useMemo(() => ({
            ...baseStyle,
            ...(isDragActive ? activeStyle : {}),
            ...(isDragAccept ? acceptStyle : {}),
            ...(isDragReject ? rejectStyle : {})
        }), [
            isDragActive,
            isDragReject,
            isDragAccept
        ]);

        return (
            <div className="container">
                <div {...getRootProps({ style })}>
                    <input {...getInputProps()} />
                    <p>Drag 'n' drop some files here, or click to select files</p>
                </div>
            </div>
        );
    }

    function fileUpload(file) {
        const formData = new FormData();
        formData.append('file', file)
        formData.append('email', session.user.email)
        const config = {
            headers: {
                'content-type': 'multipart/form-data'
            }
        }
        return post('/api/uploadScratchpad', formData, config)
    }


    function onDrop(acceptedFiles) {
        console.log(acceptedFiles)
        console.assert(acceptedFiles.length == 1, acceptedFiles)
        const uploadRes = fileUpload(acceptedFiles[0])
        console.log(uploadRes)
    }

    const baseStyle = {
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        padding: '20px',
        borderWidth: 2,
        borderRadius: 2,
        borderColor: '#eeeeee',
        borderStyle: 'dashed',
        backgroundColor: '#fafafa',
        color: '#bdbdbd',
        outline: 'none',
        transition: 'border .24s ease-in-out'
    };

    const activeStyle = {
        borderColor: '#2196f3'
    };

    const acceptStyle = {
        borderColor: '#00e676'
    };

    const rejectStyle = {
        borderColor: '#ff1744'
    };

    return (
        <Layout>
            <Head>
                <title>{siteTitle}</title>
            </Head>
            <div>
                <Link href='/'>
                    <a>Go back to Home.</a>
                </Link>
                {/* {session &&
                <div><Link href={`/viewer/${session.user.email}/scratchpad`}>
                    <a>See Scratchpad Gallery</a>
                </Link></div> } */}
            </div>
            <div>
                {(session && !!data) && 
                <>
                    <StyledDropzone onDrop={onDrop} />
                    { (images && loggedIn) &&
                        imagesDisplay.map((image, _) =>
                        <div className={styles.row}>
                            <div className={styles.column}><img src={`/api/images/${session.user.email}/scratchpad/0/${image}`}
                                width={400}
                                height={400} />
                            </div>
                            <div className={styles.column}>
                                {outlines[image] &&<img src={`/api/images/${session.user.email}/scratchpad/0/${outlines[image]}`}
                                    width={400}
                                    height={400} />}
                            {!outlines[image] && <><p>Please wait..</p></>}
                            </div>
                        </div>)
                    }
                </>
                }
                {error && <><p class="error">{error}</p></>}
            </div>
        </Layout>)
}
