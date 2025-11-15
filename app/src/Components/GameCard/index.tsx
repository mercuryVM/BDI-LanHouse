import type { Game } from "../../API/APIClient";
import styles from './index.module.css';
import { Box, Chip } from "@mui/material";
import { TrendingUp, AccessTime } from "@mui/icons-material";

interface GameCardProps {
    game: Game;
    disabled: boolean;
    numeroSessoes?: number;
    picoHora?: number;
}

export function GameCard({ game, disabled, numeroSessoes, picoHora }: GameCardProps) {
    return (
        <div 
            className={`${styles.gameCard} ${disabled ? styles.disabled : ''}`}
            style={{
                minWidth: '180px',
                flexShrink: 0,
                position: 'relative'
            }}
        >
            <img draggable={false} src={"http://localhost:8080/public/" + game.urlImagem} alt={game.nome} className={styles.gameImage} />
            <h4 className={styles.gameTitle}>{game.nome}</h4>
            <div className={styles.gameVignette}></div>
            
            {/* Stats no canto superior direito */}
            {(numeroSessoes !== undefined || picoHora !== undefined) && (
                <Box
                    sx={{
                        position: 'absolute',
                        top: 8,
                        right: 8,
                        display: 'flex',
                        flexDirection: 'column',
                        gap: 0.5,
                        alignItems: 'flex-end'
                    }}
                >
                    {numeroSessoes !== undefined && (
                        <Chip
                            icon={<TrendingUp sx={{ fontSize: 16 }} />}
                            label={numeroSessoes + " sessões"}
                            size="small"
                            sx={{
                                bgcolor: 'rgba(173, 54, 54, 0.9)',
                                color: 'white',
                                fontWeight: 'bold',
                                fontSize: '0.75rem',
                                height: 24,
                                '& .MuiChip-icon': {
                                    color: 'white'
                                }
                            }}
                        />
                    )}
                    {picoHora !== undefined && (
                        <Chip
                            icon={<AccessTime sx={{ fontSize: 16 }} />}
                            label={`${picoHora}h é horário de pico`}
                            size="small"
                            sx={{
                                bgcolor: 'rgba(76, 175, 80, 0.9)',
                                color: 'white',
                                fontWeight: 'bold',
                                fontSize: '0.75rem',
                                height: 24,
                                '& .MuiChip-icon': {
                                    color: 'white'
                                }
                            }}
                        />
                    )}
                </Box>
            )}
        </div>
    )
}