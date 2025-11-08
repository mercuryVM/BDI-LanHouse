import type APIClient from "../../../API/APIClient";
import { useUserData } from "../../../Hooks/useUserData";
import styles from './index.module.css';

export function Game({ client }: { client: APIClient }) {
    const userData = useUserData(client);

    return (
        <div style={{ display: "flex", flex: 1 }}>
            <div className={styles.container}>
                <h2 className={styles.header}>Catálogo de Jogos</h2>
            </div>
        </div>
    )
}