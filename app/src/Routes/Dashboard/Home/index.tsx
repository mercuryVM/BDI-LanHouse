import type { UserData, Game } from "../../../API/APIClient";
import type APIClient from "../../../API/APIClient";
import { useUserData } from "../../../Hooks/useUserData";
import styles from './index.module.css';
import React from 'react';
import MineThumb from './assets/mine_thumb.jpg';
import { Box, Button, Card, Typography } from "@mui/material";
import { Computer } from "@mui/icons-material";
import { useSpring, animated } from 'react-spring';
import { useDrag } from '@use-gesture/react';

interface UserDataProps {
    userData: UserData | null
}


export function Home({ client }: { client: APIClient }) {
    const userData = useUserData(client);

    return (
        <div style={{ display: "flex", flex: 1 }}>
            <div className={styles.container}>
                <h2 className={styles.header}>Bem-vindo, {userData?.nome}</h2>
                <VIPStatus userData={userData} />
                <LastGames userData={userData} />
            </div>

            <Sidebar userData={userData} />
        </div>
    )
}

function VIPStatus({ userData }: UserDataProps) {
    return (
        <div>
            <p>Seu status VIP: {userData?.vip ? 'Ativo' : 'Inativo'}</p>
            {
                userData?.vip && userData.data_hora_fim_vip && (
                    <p className={styles.vipValidUntil}>Válido até: {new Date(userData.data_hora_fim_vip).toLocaleDateString()}</p>
                )
            }
        </div>
    )
}

function LastGames({ userData }: UserDataProps) {
    const [lastGames, setLastGames] = React.useState<Game[]>([
        {
            id: '1',
            nome: 'Jogo A',
            descricao: 'Descrição do Jogo A',
            url_capa: MineThumb,
            idade_recomendada: 12,
            multiplayer: true,
        },
        {
            id: '2',
            nome: 'Jogo B',
            descricao: 'Descrição do Jogo B',
            url_capa: MineThumb,
            idade_recomendada: 12,
            multiplayer: true,
        },
        {
            id: '3',
            nome: 'Jogo C',
            descricao: 'Descrição do Jogo C',
            url_capa: MineThumb,
            idade_recomendada: 12,
            multiplayer: true,
        },
        {
            id: '4',
            nome: 'Jogo D',
            descricao: 'Descrição do Jogo D',
            url_capa: MineThumb,
            idade_recomendada: 12,
            multiplayer: true,
        },
        {
            id: '5',
            nome: 'Jogo E',
            descricao: 'Descrição do Jogo E',
            url_capa: MineThumb,
            idade_recomendada: 12,
            multiplayer: true,
        },
        {
            id: '6',
            nome: 'Jogo F',
            descricao: 'Descrição do Jogo F',
            url_capa: MineThumb,
            idade_recomendada: 12,
            multiplayer: true,
        },
        {
            id: '7',
            nome: 'Jogo G',
            descricao: 'Descrição do Jogo G',
            url_capa: MineThumb,
            idade_recomendada: 12,
            multiplayer: true,
        },
        {
            id: '8',
            nome: 'Jogo H',
            descricao: 'Descrição do Jogo H',
            url_capa: MineThumb,
            idade_recomendada: 12,
            multiplayer: true,
        },
    ]);

    const [{ x }, api] = useSpring(() => ({ x: 0 }));
    const initialX = React.useRef(0);
    const containerRef = React.useRef<HTMLDivElement>(null);

    const bind = useDrag(({ down, movement: [mx], velocity: [vx], first }) => {
        // Calcula o scroll máximo dinamicamente
        const containerWidth = containerRef.current?.offsetWidth || 800;
        const cardWidth = 180 + 16; // minWidth + gap
        const totalWidth = lastGames.length * cardWidth;
        const maxScroll = Math.max(0, totalWidth - containerWidth);
        
        if (first) {
            // Salva a posição inicial quando começa o drag
            initialX.current = x.get();
        }
        
        let newX;
        if (down) {
            // Durante o drag, adiciona o movimento à posição inicial do drag
            newX = initialX.current + mx;
        } else {
            // Quando solta, aplica a inércia
            newX = x.get() + vx * 100;
        }
        
        // Aplica os limites
        newX = Math.min(0, Math.max(-maxScroll, newX));
        
        api.start({ 
            x: newX,
            immediate: down,
            config: { tension: 300, friction: 30 }
        });
    });

    return (
        <div>
            <h3>Seus Jogos Recentes</h3>
            <div 
                {...bind()}
                ref={containerRef}
                className={styles.gamesViewport}
                style={{
                    overflow: 'hidden',
                    cursor: 'grab',
                    touchAction: 'pan-y'
                }}
            >
                <animated.div 
                    className={styles.gamesGrid}
                    style={{
                        transform: x.to(x => `translateX(${x}px)`),
                        display: 'flex',
                        flexDirection: 'row',
                        gap: '16px'
                    }}
                >
                    {
                        lastGames.length === 0 ? (
                            <p>Nenhum jogo recente encontrado.</p>
                        ) : (
                            lastGames.map(game => (
                                <GameCard key={game.id} game={game} />
                            ))
                        )
                    }
                </animated.div>
            </div>
        </div>
    )
}

function GameCard({ game }: { game: Game }) {
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

function Sidebar({ userData }: UserDataProps) {
    return (
        <div className={styles.sidebar}>
            <h2>Seu saldo</h2>

            <div className={styles.plataforms}>
                {userData?.minutos_plataformas?.map((plataforma, index) => (
                    <PlataformaHoras key={index} plataforma={plataforma} />
                ))}
            </div>

            <div className={styles.sidebarBottom}>
                <Button variant="contained" color="secondary" fullWidth>
                    Encerrar sessão
                </Button>
            </div>
        </div>
    )
}

function PlataformaHoras({ plataforma }: { plataforma: { nome: string; tipo: number; minutos: number } }) {
    const durationHours = Math.floor(plataforma.minutos / 60);
    const durationMinutes = Math.floor((plataforma.minutos - durationHours * 60));
    const isCurrent = plataforma.tipo === 0;

    return (
        <Card className={styles.platformCard}>
            <Computer />
            <Typography variant="h6">
                {durationHours}h {durationMinutes}m
            </Typography>
            <Typography variant="body2">
                em {plataforma.nome}
            </Typography>
            {
                isCurrent && (
                    <Box fontSize={10} ml={"auto"} p={0.5} bgcolor="#4caf50" color="#fff" borderRadius="4px" textAlign="center">
                        Em uso
                    </Box>
                )
            }
        </Card>
    )
}