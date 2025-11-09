import type { Game } from "../../API/APIClient";
import styles from './index.module.css';
import React from "react";

export function GameCard({ game, disabled }: { game: Game, disabled: boolean }) {
    return (
        <div 
            className={`${styles.gameCard} ${disabled ? styles.disabled : ''}`}
            style={{
                minWidth: '180px',
                flexShrink: 0
            }}
        >
            <img draggable={false} src={"http://localhost:8080/public/" + game.urlImagem} alt={game.nome} className={styles.gameImage} />
            <h4 className={styles.gameTitle}>{game.nome}</h4>
            <div className={styles.gameVignette}></div>
        </div>
    )
}