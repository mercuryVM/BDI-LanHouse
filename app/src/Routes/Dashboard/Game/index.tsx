import type APIClient, { Game, UserData } from "../../../API/APIClient";
import { useUserDataRedux } from "../../../hooks/useUserDataRedux";
import { GameCard } from "../../../Components/GameCard";
import { useState, useEffect, useMemo } from "react";
import React from "react";
import styles from './index.module.css';
import { 
    CircularProgress, 
    Dialog, 
    DialogContent, 
    DialogTitle, 
    DialogActions, 
    Button, 
    Box, 
    Typography, 
    Chip,
    IconButton
} from "@mui/material";
import { 
    Close, 
    PlayArrow, 
    People, 
    ChildCare, 
    Computer,
    SportsEsports,
    SportsBasketball
} from "@mui/icons-material";

export function Game({ client, userData }: { client: APIClient, userData: UserData | null }) {
    const [games, setGames] = useState<Game[] | null>(null);
    const [selectedGame, setSelectedGame] = useState<Game | null>(null);

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

    const handleGameClick = (game: Game) => {
        setSelectedGame(game);
    };

    const handleCloseModal = () => {
        setSelectedGame(null);
    };

    const handlePlayGame = async () => {
        if (!selectedGame) return;
        
        try {
            // Usar IPC para executar o jogo no processo principal
            if ((window as any).api?.launchGame) {
                await (window as any).api.launchGame(selectedGame.inicializacao);
                handleCloseModal();
            } else {
                console.error('API de lançamento de jogo não disponível');
                alert('Erro: API de lançamento não disponível');
            }
        } catch (error) {
            console.error('Erro ao iniciar o jogo:', error);
            alert('Erro ao iniciar o jogo');
        }
    };

    const getPlatformIcon = (platform: string) => {
        if (platform.toLowerCase().includes('pc')) return <Computer />;
        if (platform.toLowerCase().includes('console')) return <SportsEsports />;
        if (platform.toLowerCase().includes('simulador')) return <SportsBasketball />;
        return <Computer />;
    };

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
                        <div key={game.id} onClick={() => handleGameClick(game)}>
                            <GameCard game={game} disabled={!game.plataformas.includes(plataforma)} />
                        </div>
                    ))}
                </div>
            </div>

            {/* Modal de Detalhes do Jogo */}
            <Dialog 
                open={selectedGame !== null} 
                onClose={handleCloseModal}
                maxWidth="md"
                fullWidth
            >
                {selectedGame && (
                    <>
                        <DialogTitle>
                            <Box display="flex" justifyContent="space-between" alignItems="center">
                                <Typography variant="h5" component="div">
                                    {selectedGame.nome}
                                </Typography>
                                <IconButton onClick={handleCloseModal}>
                                    <Close />
                                </IconButton>
                            </Box>
                        </DialogTitle>
                        <DialogContent>
                            <Box display="flex" flexDirection="column" gap={3}>
                                {/* Imagem do Jogo */}
                                <Box
                                    component="img"
                                    src={"http://localhost:8080/public/" + selectedGame.urlImagem}
                                    alt={selectedGame.nome}
                                    sx={{
                                        width: '100%',
                                        height: '300px',
                                        objectFit: 'cover',
                                        borderRadius: 2
                                    }}
                                />

                                {/* Chips de Informações */}
                                <Box display="flex" gap={1} flexWrap="wrap">
                                    <Chip 
                                        icon={<ChildCare />} 
                                        label={`${selectedGame.idadeRecomendada}+ anos`}
                                        color="primary"
                                        variant="outlined"
                                    />
                                    <Chip 
                                        icon={<People />} 
                                        label={selectedGame.multiplayer ? 'Multiplayer' : 'Single Player'}
                                        color="secondary"
                                        variant="outlined"
                                    />
                                    {selectedGame.plataformas.map((plat) => (
                                        <Chip 
                                            key={plat}
                                            icon={getPlatformIcon(plat)}
                                            label={plat}
                                            variant="outlined"
                                        />
                                    ))}
                                </Box>

                                {/* Descrição */}
                                <Box>
                                    <Typography variant="h6" gutterBottom>
                                        Descrição
                                    </Typography>
                                    <Typography variant="body1" color="text.secondary">
                                        {selectedGame.descricao}
                                    </Typography>
                                </Box>

                                {/* Aviso de Disponibilidade */}
                                {!selectedGame.plataformas.includes(plataforma) && (
                                    <Box 
                                        sx={{ 
                                            p: 2, 
                                            bgcolor: 'warning.main', 
                                            borderRadius: 1,
                                            color: 'warning.contrastText'
                                        }}
                                    >
                                        <Typography variant="body2">
                                            ⚠️ Este jogo não está disponível na plataforma atual ({plataforma})
                                        </Typography>
                                    </Box>
                                )}
                            </Box>
                        </DialogContent>
                        <DialogActions sx={{ p: 2 }}>
                            <Button onClick={handleCloseModal} size="large">
                                Fechar
                            </Button>
                            <Button 
                                variant="contained" 
                                size="large"
                                startIcon={<PlayArrow />}
                                onClick={handlePlayGame}
                                disabled={!selectedGame.plataformas.includes(plataforma)}
                            >
                                Jogar
                            </Button>
                        </DialogActions>
                    </>
                )}
            </Dialog>
        </div>
    )
}