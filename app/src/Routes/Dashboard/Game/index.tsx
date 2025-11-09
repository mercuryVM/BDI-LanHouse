import type APIClient, { Game, UserData } from "../../../API/APIClient";
import { useUserDataRedux } from "../../../hooks/useUserDataRedux";
import { GameCard } from "../../../Components/GameCard";
import { useState, useEffect, useMemo } from "react";
import React from "react";
import styles from './index.module.css';
import { CircularProgress, Dialog, DialogContent } from "@mui/material";

export function Game({ client, userData }: { client: APIClient, userData: UserData | null }) {
    const [games, setGames] = useState<Game[] | null>(null);

    useEffect(() => {
        client.getAllJogos().then(setGames).catch(console.error);
    }, [client]);

    const plataforma = useMemo<string>(() => {
        if (userData?.maquina.nomeplat) {
            return userData.maquina.nomeplat;
        }
        return "";
    }, [userData]);

    const sortedGames = useMemo(() => {
        if (!games) return null;
        // ordena por disponibilidade na plataforma, depois por nome
        return [...games].sort((a, b) => {
            const aAvailable = a.plataformas.includes(plataforma) ? 0 : 1;
            const bAvailable = b.plataformas.includes(plataforma) ? 0 : 1;
            if (aAvailable !== bAvailable) {
                return aAvailable - bAvailable;
            }
            return a.nome.localeCompare(b.nome);
        });
    }, [games, plataforma])

    return (
        <div style={{ display: "flex", flex: 1, backgroundColor: "#242424", height: "calc(100vh - 64px)", overflow: "auto" }}>
            <div className={styles.container}>
                <h2 className={styles.header}>Catálogo de Jogos</h2>
                <div className={styles.gamesGrid}>
                    {!games && (
                        <Dialog open={true}>
                            <DialogContent>
                                <CircularProgress />
                            </DialogContent>
                        </Dialog>
                    )}

                    {sortedGames && sortedGames.map((game) => (
                        <GameCard key={game.id} game={game} disabled={!game.plataformas.includes(plataforma)} />
                    ))}
                </div>
            </div>
        </div>
    )
}