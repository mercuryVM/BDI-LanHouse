import type { UserData, Game } from "../../../API/APIClient";
import type APIClient from "../../../API/APIClient";
import styles from './index.module.css';
import React, { useEffect } from 'react';
import { Box, Button, Card, CircularProgress, Dialog, DialogActions, DialogContent, DialogTitle, Modal, Typography } from "@mui/material";
import { AccessTime, Computer } from "@mui/icons-material";
import { useSpring, animated } from 'react-spring';
import { useDrag } from '@use-gesture/react';
import { GameCard } from "../../../Components/GameCard";
import { useNavigate } from "react-router";
import { useUserDataRedux } from "../../../hooks/useUserDataRedux";

interface UserDataProps {
    userData: UserData | null
}


export function Home({ client, userData }: { client: APIClient, userData: UserData | null }) {
    return (
        <div style={{ display: "flex", flex: 1 }}>
            <div className={styles.container}>
                <h2 className={styles.header}>Bem-vindo, {userData?.nome}</h2>
                <VIPStatus userData={userData} />
                <LastGames userData={userData} />
            </div>

            <Sidebar client={client} userData={userData} />
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
            url_capa: 'http://localhost:8080/public/games/mine_thumb.jpg',
            idade_recomendada: 12,
            multiplayer: true,
        },
        {
            id: '2',
            nome: 'Jogo B',
            descricao: 'Descrição do Jogo B',
            url_capa: 'http://localhost:8080/public/games/mine_thumb.jpg',
            idade_recomendada: 12,
            multiplayer: true,
        },
        {
            id: '3',
            nome: 'Jogo C',
            descricao: 'Descrição do Jogo C',
            url_capa: 'http://localhost:8080/public/games/mine_thumb.jpg',
            idade_recomendada: 12,
            multiplayer: true,
        },
        {
            id: '4',
            nome: 'Jogo D',
            descricao: 'Descrição do Jogo D',
            url_capa: 'http://localhost:8080/public/games/mine_thumb.jpg',
            idade_recomendada: 12,
            multiplayer: true,
        },
        {
            id: '5',
            nome: 'Jogo E',
            descricao: 'Descrição do Jogo E',
            url_capa: 'http://localhost:8080/public/games/mine_thumb.jpg',
            idade_recomendada: 12,
            multiplayer: true,
        },
        {
            id: '6',
            nome: 'Jogo F',
            descricao: 'Descrição do Jogo F',
            url_capa: 'http://localhost:8080/public/games/mine_thumb.jpg',
            idade_recomendada: 12,
            multiplayer: true,
        },
        {
            id: '7',
            nome: 'Jogo G',
            descricao: 'Descrição do Jogo G',
            url_capa: 'http://localhost:8080/public/games/mine_thumb.jpg',
            idade_recomendada: 12,
            multiplayer: true,
        },
        {
            id: '8',
            nome: 'Jogo H',
            descricao: 'Descrição do Jogo H',
            url_capa: 'http://localhost:8080/public/games/mine_thumb.jpg',
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

function Sidebar({ userData, client }: { userData: UserData | null, client: APIClient }) {
    const [modalLogoutOpen, setModalLogoutOpen] = React.useState<boolean>(false);
    const [loading, setLoading] = React.useState<boolean>(false);

    const navigate = useNavigate();

    const handleLogout = () => {
        setLoading(true);
        client.logout().then(() => {
            navigate('/');
        }).finally(() => {
            setLoading(false);
        })
    }

    console.log(userData)

    return (
        <div className={styles.sidebar}>
            <h2>Seu saldo</h2>

            <div className={styles.plataforms}>
                <PlataformaHoras plataforma={{
                    nome: 'Computador',
                    tipo: 0,
                    minutos: userData?.tempoComputador || 0
                }} />
                <PlataformaHoras plataforma={{
                    nome: 'Console',
                    tipo: 1,
                    minutos: userData?.tempoConsole || 0
                }} />
                <PlataformaHoras plataforma={{
                    nome: 'Simulador',
                    tipo: 2,
                    minutos: userData?.tempoSimulador || 0
                }} />
            </div>

            <div className={styles.sidebarBottom}>
                <Button onClick={() => setModalLogoutOpen(true)} variant="contained" color="secondary" fullWidth>
                    Encerrar sessão
                </Button>
            </div>

            <Dialog open={modalLogoutOpen} onClose={() => setModalLogoutOpen(false)}>
                <DialogTitle>
                    Encerrar sessão
                </DialogTitle>
                <DialogContent>
                    <Typography>Tem certeza que deseja encerrar sua sessão?</Typography>
                    {
                        loading && (
                            <CircularProgress size={24} style={{ marginLeft: 16 }} />
                        )
                    }
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setModalLogoutOpen(false)} color="primary">
                        Cancelar
                    </Button>
                    <Button disabled={loading} onClick={handleLogout} color="secondary">
                        Encerrar
                    </Button>
                </DialogActions>
            </Dialog>
        </div>
    )
}

function PlataformaHoras({ plataforma }: { plataforma: { nome: string; tipo: number; minutos: number } }) {
    const [minutos, setMinutes] = React.useState<number>(plataforma.minutos);

    React.useEffect(() => {
        setMinutes(plataforma.minutos);
    }, [plataforma.minutos]);

    const durationHours = Math.floor(minutos / 60);
    const durationMinutes = Math.floor((minutos - durationHours * 60));
    const isCurrent = plataforma.tipo === 0;

    return (
        <Card className={styles.platformCard}>
            <AccessTime />
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