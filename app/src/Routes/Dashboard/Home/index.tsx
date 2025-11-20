import type { UserData, Game } from "../../../API/APIClient";
import type APIClient from "../../../API/APIClient";
import styles from './index.module.css';
import React, { useEffect } from 'react';
import { Box, Button, Card, CardContent, CircularProgress, Dialog, DialogActions, DialogContent, DialogTitle, Typography, Chip, Paper, Grid, Divider } from "@mui/material";
import { AccessTime, TrendingUp, People, Schedule, EventBusy, EmojiEvents } from "@mui/icons-material";
import { useSpring, animated } from 'react-spring';
import { useDrag } from '@use-gesture/react';
import { GameCard } from "../../../Components/GameCard";
import { useNavigate } from "react-router";
import { clearUserData } from "../../../store/slices/userDataSlice";
import { useAppDispatch } from "../../../Hooks/reduxHooks";

interface UserDataProps {
    userData: UserData | null
}


export function Home({ client, userData }: { client: APIClient, userData: UserData | null }) {
    const isClient = userData?.role === 'cliente';
    const isCLT = userData?.role === 'clt';

    return (
        <div style={{ display: "flex", flex: 1,  minHeight: 0, overflowY: "auto" }}>
            <div className={styles.container}>
                <h2 className={styles.header}>Bem-vindo, {userData?.nome}</h2>
                {isClient && <VIPStatus userData={userData} />}
                {isClient && <LastGames userData={userData} client={client} />}
                {isCLT && <MostPlayedGames client={client} />}
                {isCLT && <ClienteStats client={client} />}
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

function LastGames({ client }: { userData: UserData | null, client: APIClient }) {
    const [lastGames, setLastGames] = React.useState<Game[] | null>(null);

    const [{ x }, api] = useSpring(() => ({ x: 0 }));
    const initialX = React.useRef(0);
    const containerRef = React.useRef<HTMLDivElement>(null);

    const bind = useDrag(({ down, movement: [mx], velocity: [vx], first }) => {
        if (!lastGames) return;

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

    useEffect(() => {
        if (client) {
            client.getRecentJogos().then(games => {
                setLastGames(games);
            });
        }
    }, [client])

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
                        !lastGames && (
                            <CircularProgress />
                        )
                    }
                    {
                        lastGames && lastGames.map(game => (
                            <GameCard key={game.id} game={game} disabled={false} />
                        ))
                    }
                </animated.div>
            </div>
        </div>
    )
}

function ClienteStats({ client }: { client: APIClient }) {
    const [stats, setStats] = React.useState<any[]>([]);
    const [loading, setLoading] = React.useState(false);
    const [filtroAtivo, setFiltroAtivo] = React.useState<string>('totalHoras');

    const filtros = [
        { key: 'totalHoras', label: 'Top Horas', icon: TrendingUp, color: '#1976d2' },
        { key: 'numSessoes', label: 'Top Sessões', icon: People, color: '#388e3c' },
        { key: 'frequenciaVisitas', label: 'Frequência', icon: Schedule, color: '#f57c00' },
        { key: 'ultimaVisita', label: 'Última Visita', icon: AccessTime, color: '#7b1fa2' },
        { key: 'clientesInativos', label: 'Inativos', icon: EventBusy, color: '#d32f2f' }
    ];

    useEffect(() => {
        carregarDados();
    }, [filtroAtivo]);

    const carregarDados = async () => {
        setLoading(true);
        try {
            const filtro: any = {};
            
            if (filtroAtivo === 'clientesInativos') {
                filtro[filtroAtivo] = true;
                filtro.deltaMeses = 3;
            } else {
                filtro[filtroAtivo] = true;
            }

            const resultado = await client.listarClientesFiltro(filtro);
            setStats(resultado);
        } catch (error) {
            console.error('Erro ao carregar estatísticas:', error);
            setStats([]);
        } finally {
            setLoading(false);
        }
    };

    const renderValor = (item: any) => {
        switch (filtroAtivo) {
            case 'totalHoras':
                return `${item.horastotal || 0}h`;
            case 'numSessoes':
                return `${item.quantidadesessoes || 0}`;
            case 'frequenciaVisitas':
                return `${item.media_sessoes_por_mes || 0}/mês`;
            case 'ultimaVisita':
                return new Date(item.datatempoinicio).toLocaleDateString('pt-BR');
            case 'clientesInativos':
                return item.ultima_sessao 
                    ? new Date(item.ultima_sessao).toLocaleDateString('pt-BR')
                    : 'Nunca';
            default:
                return '-';
        }
    };

    const filtroSelecionado = filtros.find(f => f.key === filtroAtivo);

    return (
        <Box sx={{ mt: 4, }}>
            <Typography variant="h5" gutterBottom sx={{ mb: 2, fontWeight: 600 }}>
                Estatísticas de Clientes
            </Typography>

            {/* Tabs de Filtros */}
            <Grid container spacing={1.5} sx={{ mb: 3 }}>
                {filtros.map((filtro) => {
                    const Icon = filtro.icon;
                    const isActive = filtroAtivo === filtro.key;
                    return (
                        <Grid item key={filtro.key}>
                            <Paper
                                elevation={isActive ? 8 : 1}
                                onClick={() => setFiltroAtivo(filtro.key)}
                                sx={{
                                    p: 2,
                                    cursor: 'pointer',
                                    transition: 'all 0.3s',
                                    bgcolor: isActive ? filtro.color : 'background.paper',
                                    color: isActive ? '#fff' : 'text.primary',
                                    border: isActive ? 'none' : '1px solid',
                                    borderColor: 'divider',
                                    '&:hover': {
                                        transform: 'translateY(-4px)',
                                        boxShadow: 4
                                    }
                                }}
                            >
                                <Box display="flex" alignItems="center" gap={1}>
                                    <Icon sx={{ fontSize: 20 }} />
                                    <Typography variant="body2" fontWeight={isActive ? 600 : 500}>
                                        {filtro.label}
                                    </Typography>
                                </Box>
                            </Paper>
                        </Grid>
                    );
                })}
            </Grid>

            {/* Card Principal */}
            <Paper elevation={2} sx={{ borderRadius: 2, overflow: 'hidden' }}>
                {/* Header do Card */}
                <Box 
                    sx={{ 
                        py: 1.25,
                        px: 2,
                        bgcolor: filtroSelecionado?.color || 'primary.main',
                        color: '#fff',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 1.5
                    }}
                >
                    {filtroSelecionado && <filtroSelecionado.icon sx={{ fontSize: 24 }} />}
                    <Box>
                        <Typography variant="subtitle1" fontWeight={600} sx={{ lineHeight: 1.3 }}>
                            {filtroSelecionado?.label}
                        </Typography>
                        <Typography variant="caption" sx={{ opacity: 0.9, fontSize: '0.75rem', lineHeight: 1.2 }}>
                            {stats.length} cliente{stats.length !== 1 ? 's' : ''} encontrado{stats.length !== 1 ? 's' : ''}
                        </Typography>
                    </Box>
                </Box>

                <Divider />

                {/* Conteúdo */}
                <Box sx={{ maxHeight: 500, overflow: 'auto' }}>
                    {loading ? (
                        <Box display="flex" justifyContent="center" alignItems="center" py={8}>
                            <CircularProgress size={40} />
                        </Box>
                    ) : stats.length === 0 ? (
                        <Box textAlign="center" py={8}>
                            <Typography variant="h6" color="text.secondary" gutterBottom>
                                Nenhum dado disponível
                            </Typography>
                            <Typography variant="body2" color="text.disabled">
                                Não há clientes nesta categoria
                            </Typography>
                        </Box>
                    ) : (
                        <Box>
                            {stats.map((item, index) => {
                                const isTop3 = index < 3;
                                const medalColor = index === 0 ? '#ffd700' : index === 1 ? '#c0c0c0' : index === 2 ? '#cd7f32' : 'transparent';
                                
                                return (
                                    <Box
                                        key={index}
                                        sx={{
                                            display: 'flex',
                                            justifyContent: 'space-between',
                                            alignItems: 'center',
                                            p: 2,
                                            borderBottom: index < stats.length - 1 ? '1px solid' : 'none',
                                            borderColor: 'divider',
                                            bgcolor: isTop3 ? 'action.hover' : 'transparent',
                                            transition: 'all 0.2s',
                                            '&:hover': {
                                                bgcolor: 'action.selected',
                                                transform: 'translateX(4px)'
                                            }
                                        }}
                                    >
                                        <Box display="flex" alignItems="center" gap={2} flex={1}>
                                            {/* Posição/Medal */}
                                            <Box
                                                sx={{
                                                    width: 36,
                                                    height: 36,
                                                    borderRadius: isTop3 ? '50%' : '8px',
                                                    bgcolor: isTop3 ? medalColor : 'action.hover',
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    justifyContent: 'center',
                                                    fontWeight: 'bold',
                                                    fontSize: isTop3 ? '1rem' : '0.875rem',
                                                    color: isTop3 ? '#000' : 'text.primary',
                                                    boxShadow: isTop3 ? 2 : 0
                                                }}
                                            >
                                                {isTop3 && index === 0 ? <EmojiEvents /> : `#${index + 1}`}
                                            </Box>

                                            {/* Info do Cliente */}
                                            <Box flex={1}>
                                                <Box display="flex" alignItems="center" gap={1}>
                                                    <Typography variant="body1" fontWeight={isTop3 ? 600 : 500}>
                                                        {item.nome}
                                                    </Typography>
                                                    {item.vip && (
                                                        <Chip 
                                                            label="VIP" 
                                                            size="small" 
                                                            sx={{ 
                                                                height: 20,
                                                                bgcolor: '#ffa726',
                                                                color: '#fff',
                                                                fontWeight: 'bold',
                                                                fontSize: '0.65rem'
                                                            }}
                                                        />
                                                    )}
                                                </Box>
                                                <Typography variant="caption" color="text.secondary">
                                                    {item.cpf}
                                                </Typography>
                                            </Box>

                                            {/* Valor */}
                                            <Box textAlign="right">
                                                <Typography 
                                                    variant="h6" 
                                                    fontWeight="bold"
                                                    sx={{ 
                                                        color: filtroSelecionado?.color,
                                                        fontSize: isTop3 ? '1.25rem' : '1rem'
                                                    }}
                                                >
                                                    {renderValor(item)}
                                                </Typography>
                                            </Box>
                                        </Box>
                                    </Box>
                                );
                            })}
                        </Box>
                    )}
                </Box>
            </Paper>
        </Box>
    );
}

function MostPlayedGames({ client }: { client: APIClient }) {
    const [mostPlayedGames, setMostPlayedGames] = React.useState<Game[] | null>(null);

    const [{ x }, api] = useSpring(() => ({ x: 0 }));
    const initialX = React.useRef(0);
    const containerRef = React.useRef<HTMLDivElement>(null);

    const bind = useDrag(({ down, movement: [mx], velocity: [vx], first }) => {
        if (!mostPlayedGames) return;

        // Calcula o scroll máximo dinamicamente
        const containerWidth = containerRef.current?.offsetWidth || 800;
        const cardWidth = 180 + 16; // minWidth + gap
        const totalWidth = mostPlayedGames.length * cardWidth;
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

    useEffect(() => {
        if (client) {
            client.getMostPlayedJogos().then(games => {
                setMostPlayedGames(games);
            });
        }
    }, [client])

    return (
        <div>
            <h3>Jogos Mais Jogados</h3>
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
                        !mostPlayedGames && (
                            <CircularProgress />
                        )
                    }
                    {
                        mostPlayedGames && mostPlayedGames.map(game => (
                            <GameCard 
                                key={game.id} 
                                game={game} 
                                disabled={false}
                                numeroSessoes={game.numeroSessoes}
                                picoHora={game.picoHora}
                            />
                        ))
                    }
                </animated.div>
            </div>
        </div>
    )
}

function Sidebar({ userData, client }: { userData: UserData | null, client: APIClient }) {
    const [modalLogoutOpen, setModalLogoutOpen] = React.useState<boolean>(false);
    const [loading, setLoading] = React.useState<boolean>(false);
    const isClient = userData?.role === 'cliente';

    const navigate = useNavigate();
    const dispatch = useAppDispatch();

    const handleLogout = () => {
        setLoading(true);
        client.logout().then(() => {
            dispatch(clearUserData());
            navigate('/');
        }).finally(() => {
            setLoading(false);
        })
    }

    return (
        <div className={styles.sidebar}>
            {isClient && (
                <>
                    <h2>Seu saldo</h2>

                    <div className={styles.plataforms}>
                        <PlataformaHoras userData={userData} plataforma={{
                            nome: 'Computador',
                            tipo: 0,
                            minutos: userData?.tempoComputador || 0
                        }} />
                        <PlataformaHoras userData={userData} plataforma={{
                            nome: 'Console',
                            tipo: 1,
                            minutos: userData?.tempoConsole || 0
                        }} />
                        <PlataformaHoras userData={userData} plataforma={{
                            nome: 'Simulador',
                            tipo: 2,
                            minutos: userData?.tempoSimulador || 0
                        }} />
                    </div>
                </>
            )}

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

function PlataformaHoras({ plataforma, userData }: { userData: UserData | null, plataforma: { nome: string; tipo: number; minutos: number } }) {
    const [minutos, setMinutes] = React.useState<number>(plataforma.minutos);

    React.useEffect(() => {
        setMinutes(plataforma.minutos);
    }, [plataforma.minutos]);

    const durationHours = Math.floor(minutos / 60);
    const durationMinutes = Math.floor((minutos - durationHours * 60));
    const isCurrent = plataforma.tipo === userData?.maquina.tipo;

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