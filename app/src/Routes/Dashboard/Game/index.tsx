import type APIClient, { Game } from "../../../API/APIClient";
import { useUserDataRedux } from "../../../hooks/useUserDataRedux";
import { GameCard } from "../../../Components/GameCard";
import { useState, useEffect } from "react";
import React from "react";
import styles from './index.module.css';

export function Game({ client }: { client: APIClient }) {
    const [games, setGames] = useState<Game[]>([
        {
            id: '1',
            nome: 'Minecraft',
            descricao: 'Jogo de construção e sobrevivência',
            url_capa: 'http://localhost:8080/public/games/mine_thumb.jpg',
            idade_recomendada: 10,
            multiplayer: true,
        },
        {
            id: '2',
            nome: 'Fortnite',
            descricao: 'Battle Royale multiplayer',
            url_capa: 'http://localhost:8080/public/games/mine_thumb.jpg',
            idade_recomendada: 12,
            multiplayer: true,
        },
        {
            id: '3',
            nome: 'Grand Theft Auto V',
            descricao: 'Jogo de ação e aventura',
            url_capa: 'http://localhost:8080/public/games/mine_thumb.jpg',
            idade_recomendada: 18,
            multiplayer: true,
        },
        {
            id: '4',
            nome: 'Counter-Strike 2',
            descricao: 'FPS tático competitivo',
            url_capa: 'http://localhost:8080/public/games/mine_thumb.jpg',
            idade_recomendada: 16,
            multiplayer: true,
        },
        {
            id: '5',
            nome: 'League of Legends',
            descricao: 'MOBA estratégico',
            url_capa: 'http://localhost:8080/public/games/mine_thumb.jpg',
            idade_recomendada: 12,
            multiplayer: true,
        },
        {
            id: '6',
            nome: 'Valorant',
            descricao: 'FPS tático com habilidades',
            url_capa: 'http://localhost:8080/public/games/mine_thumb.jpg',
            idade_recomendada: 16,
            multiplayer: true,
        },
        {
            id: '7',
            nome: 'FIFA 24',
            descricao: 'Simulador de futebol',
            url_capa: 'http://localhost:8080/public/games/mine_thumb.jpg',
            idade_recomendada: 3,
            multiplayer: true,
        },
        {
            id: '8',
            nome: 'Call of Duty: Warzone',
            descricao: 'Battle Royale FPS',
            url_capa: 'http://localhost:8080/public/games/mine_thumb.jpg',
            idade_recomendada: 18,
            multiplayer: true,
        },
        {
            id: '9',
            nome: 'Rocket League',
            descricao: 'Futebol com carros',
            url_capa: 'http://localhost:8080/public/games/mine_thumb.jpg',
            idade_recomendada: 3,
            multiplayer: true,
        },
        {
            id: '10',
            nome: 'Overwatch 2',
            descricao: 'Hero shooter em equipes',
            url_capa: 'http://localhost:8080/public/games/mine_thumb.jpg',
            idade_recomendada: 12,
            multiplayer: true,
        },
        {
            id: '11',
            nome: 'Apex Legends',
            descricao: 'Battle Royale com heróis',
            url_capa: 'http://localhost:8080/public/games/mine_thumb.jpg',
            idade_recomendada: 16,
            multiplayer: true,
        },
        {
            id: '12',
            nome: 'The Sims 4',
            descricao: 'Simulador de vida',
            url_capa: 'http://localhost:8080/public/games/mine_thumb.jpg',
            idade_recomendada: 12,
            multiplayer: false,
        },
    ]);

    return (
        <div style={{ display: "flex", flex: 1, backgroundColor: "#242424", height: "calc(100vh - 64px)", overflow: "auto" }}>
            <div className={styles.container}>
                <h2 className={styles.header}>Catálogo de Jogos</h2>
                <div className={styles.gamesGrid}>
                    {games.map((game) => (
                        <GameCard key={game.id} game={game} />
                    ))}
                </div>
            </div>
        </div>
    )
}