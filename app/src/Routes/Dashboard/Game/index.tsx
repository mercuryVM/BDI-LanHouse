import type APIClient, { Game } from "../../../API/APIClient";
import { useUserDataRedux } from "../../../hooks/useUserDataRedux";
import { GameCard } from "../../../Components/GameCard";
import { useState, useEffect } from "react";
import React from "react";
import styles from './index.module.css';

export function Game({ client }: { client: APIClient }) {
    const [games, setGames] = useState<Game[] | null>(null);

    useEffect(() => {
        client.getAllJogos().then(setGames).catch(console.error);
    }, [client])

    return (
        <div style={{ display: "flex", flex: 1, backgroundColor: "#242424", height: "calc(100vh - 64px)", overflow: "auto" }}>
            <div className={styles.container}>
                <h2 className={styles.header}>Catálogo de Jogos</h2>
                <div className={styles.gamesGrid}>

                    {games && games.map((game) => (
                        <GameCard key={game.id} game={game} />
                    ))}
                </div>
            </div>
        </div>
    )
}