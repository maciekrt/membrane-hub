import { useSession } from 'next-auth/client'
import Link from 'next/link'
import Image from 'next/image'

import React, { useMemo } from 'react';
import Dropzone from 'react-dropzone'
import { useDropzone } from 'react-dropzone';
import axios, { post } from 'axios';

import styles from './scratchpadComponent.module.css'


export default function ScratchpadComponent({ scratchpadData }) {
    const [session, loading] = useSession()
    const metadata = scratchpadData?.metadata
    const images = metadata?.images
    const outlines = metadata?.outlines
    const loggedIn = !!session?.user

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


    return (
        <div>{session &&
            <>
                <StyledDropzone onDrop={onDrop} />
                <div>
                { (images && loggedIn) &&
                    images.reverse().map((image, _) =>
                    <div className={styles.row}>
                        <div className={styles.column}><img src={`/api/images/${session.user.email}/scratchpad/0/${image}`}
                            width={400}
                            height={400} />
                        </div>
                        <div className={styles.column}>
                            {metadata.outlines[image] &&<img src={`/api/images/${session.user.email}/scratchpad/0/${metadata.outlines[image]}`}
                                width={400}
                                height={400} />}
                        {!metadata.outlines[image] && <><p>Please wait..</p></>}
                        </div>
                    </div>)
                }
                </div>
            </>}
        </div>
    )
}