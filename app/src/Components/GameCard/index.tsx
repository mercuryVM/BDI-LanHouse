import type { Game } from "../../API/APIClient";
import styles from './index.module.css';
import React from "react";

export function GameCard({ game }: { game: Game }) {
    return (
        <div 
            className={styles.gameCard}
            style={{
                minWidth: '180px',
                flexShrink: 0
            }}
        >
            <img draggable={false} src={game.url_capa} alt={game.nome} className={styles.gameImage} />
            <h4 className={styles.gameTitle}>{game.nome}</h4>
        </div>
    )
}