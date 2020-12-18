import Link from 'next/link'
import styles from './listDatasets.module.css'

export default function ListDatasets({ dirs, levels }) {
    const channelsIntoLabels = {'00': 'Chromosome 1', '01': 'Nucleus'};

    return ( 
        <table className={styles.styleTable}>
            <thead>
                <tr>
                    <th>Dataset name</th>
                    <th>Levels</th>
                </tr>
            </thead>
            <tbody>
            <> { dirs.map((elem, idx) => (
            <tr>
                <td><Link href={`/viewer/${elem}`}>
                    <a>{elem}</a>
                    </Link></td>
                <td><div className={styles.row}>
                    {
                    levels[idx].map((level, idLevel) => <>
                    <Link href={`viewer/${elem}?img_idx=20&ch_idx=${idLevel}`}><a>
                        <div className={styles.column}>
                            <img src={`/api/images/${elem}/${level}/20_100x100.png`} />
                            <figcaption className={styles.caption}>{channelsIntoLabels[level]}</figcaption>
                        </div></a>
                    </Link></>
                     )
                    }
                </div></td>
            </tr>))
            } 
            </>
            </tbody>
        </table>
    )
}