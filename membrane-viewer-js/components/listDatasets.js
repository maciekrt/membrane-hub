import Link from 'next/link'
import styles from './listDatasets.module.css'

import { pad } from '../logic/auxiliary'


export default function ListDatasets({ datasets }) {

    function ThumbnailsList({ elem }) {
        return ( <>
        {
            [...Array(parseInt(elem.metadata.channels))].map((_, level) => <>
                <Link href={`viewer/${elem.imagename}?img_idx=${Math.floor(elem.metadata.z / 2)}&ch_idx=${level}`}><a>
                    <div className={styles.column}>
                        <img src={`/api/images/${elem.imagename}/${pad(level, 2)}/${Math.floor(elem.metadata.z / 2)}_100x100.png`} />
                        <figcaption className={styles.caption}>{level + 1}</figcaption>
                    </div></a>
                </Link></>
            )
        }
        </>)
    }

    return ( 
        <table className={styles.styleTable}>
            <thead>
                <tr>
                    <th>Dataset name</th>
                    <th>Channels</th>
                </tr>
            </thead>
            <tbody>
            <> { datasets.map((elem, idx) => (
            <tr>
                <td><Link href={`/viewer/${elem.imagename}`}>
                    <a>{elem.imagename}</a>
                    </Link>
                </td>
                <td><div className={styles.row}>
                    <ThumbnailsList elem={elem} />
                </div></td>
            </tr>))
            } 
            </>
            </tbody>
        </table>
    )
}