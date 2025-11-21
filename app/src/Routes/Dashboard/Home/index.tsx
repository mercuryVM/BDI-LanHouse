import type { UserData, Game } from "../../../API/APIClient";
import type APIClient from "../../../API/APIClient";
import styles from './index.module.css';
import React, { useEffect } from 'react';
import { Box, Button, Card, CardContent, CircularProgress, Dialog, DialogActions, DialogContent, DialogTitle, Typography, Chip, Paper, Divider } from "@mui/material";
import { AccessTime, TrendingUp, People, Schedule, EventBusy, EmojiEvents, Computer, SportsEsports, DirectionsCar, Lightbulb } from "@mui/icons-material";
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
                {isCLT && <DisponibilidadeMaquinas client={client} />}
                
                {isCLT && <MaquinasProblematicas client={client} />}
                {isCLT && <ClienteStats client={client} />}
            </div>

            {isClient && (<Sidebar client={client} userData={userData} />)}
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

function DisponibilidadeMaquinas({ client }: { client: APIClient }) {
    const navigate = useNavigate();
    const [disponibilidadePorTipo, setDisponibilidadePorTipo] = React.useState<{
        tipo: number;
        disponiveis: string;
    }[]>([]);
    const [disponibilidadePorPlataforma, setDisponibilidadePorPlataforma] = React.useState<{
        nome: string;
        tipo: number;
        disponiveis: string;
    }[]>([]);
    const [loading, setLoading] = React.useState(true);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [porTipo, porPlataforma] = await Promise.all([
                    client.contarMaquinasDisponiveisPorTipo(),
                    client.contarMaquinasDisponiveisPorPlataforma()
                ]);
                setDisponibilidadePorTipo(porTipo);
                setDisponibilidadePorPlataforma(porPlataforma);
            } catch (error) {
                console.error('Erro ao carregar disponibilidade:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [client]);

    const getTipoIcon = (tipo: number) => {
        switch (tipo) {
            case 0: return <Computer sx={{ fontSize: 32 }} />;
            case 1: return <SportsEsports sx={{ fontSize: 32 }} />;
            case 2: return <DirectionsCar sx={{ fontSize: 32 }} />;
            default: return <Computer sx={{ fontSize: 32 }} />;
        }
    };

    const getTipoNome = (tipo: number) => {
        switch (tipo) {
            case 0: return 'Computadores';
            case 1: return 'Consoles';
            case 2: return 'Simuladores';
            default: return 'Desconhecido';
        }
    };

    const getTipoColor = (tipo: number) => {
        switch (tipo) {
            case 0: return 'primary.main';
            case 1: return 'success.main';
            case 2: return 'warning.main';
            default: return 'text.primary';
        }
    };

    if (loading) {
        return (
            <Box sx={{ mt: 4, display: 'flex', justifyContent: 'center' }}>
                <CircularProgress />
            </Box>
        );
    }

    const totalDisponiveis = disponibilidadePorTipo.reduce((sum, item) => sum + parseInt(item.disponiveis), 0);

    return (
        <Box sx={{ mb: 4 }}>
            {/* Header Section */}
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
                <Box>
                    <Typography variant="h5" fontWeight={700} color="text.primary">
                        Disponibilidade de Máquinas
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                        Visualize rapidamente as máquinas disponíveis por tipo e plataforma
                    </Typography>
                </Box>
                <Button 
                    variant="contained" 
                    size="medium"
                    onClick={() => navigate('/dashboard?tab=máquinas')}
                    sx={{ minWidth: 140 }}
                >
                    Gerenciar
                </Button>
            </Box>

            {/* Cards Resumo */}
            <Box display="flex" gap={2} flexWrap="wrap" sx={{ mb: 4 }}>
                {/* Card Total */}
                <Card 
                    elevation={0} 
                    sx={{ 
                        flex: '1 1 240px', 
                        minWidth: 240,
                        border: '1px solid',
                                borderColor: 'divider',
                        position: 'relative',
                        overflow: 'visible'
                    }}
                >
                    <CardContent sx={{ p: 3 }}>
                        <Box display="flex" alignItems="center" gap={2}>
                            <Box 
                                sx={{ 
                                    p: 1.5, 
                                    borderRadius: 2, 
                                    bgcolor: 'primary.main',
                                    color: 'white',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center'
                                }}
                            >
                                <Computer sx={{ fontSize: 32 }} />
                            </Box>
                            <Box flex={1}>
                                <Typography variant="body2" fontWeight={500}>
                                    Total Disponíveis
                                </Typography>
                                <Typography variant="h3" fontWeight={800} color="primary.main">
                                    {totalDisponiveis}
                                </Typography>
                            </Box>
                        </Box>
                    </CardContent>
                </Card>

                {/* Cards por Tipo */}
                {disponibilidadePorTipo.map((item) => {
                    const color = getTipoColor(item.tipo);
                    const icon = getTipoIcon(item.tipo);
                    return (
                        <Card 
                            key={item.tipo}
                            elevation={0}
                            sx={{ 
                                flex: '1 1 240px', 
                                minWidth: 240,
                                border: '1px solid',
                                borderColor: 'divider',
                                transition: 'all 0.3s ease',
                                '&:hover': {
                                    transform: 'translateY(-6px)',
                                    boxShadow: 3,
                                    borderColor: color
                                }
                            }}
                        >
                            <CardContent sx={{ p: 3 }}>
                                <Box display="flex" alignItems="center" gap={2}>
                                    <Box 
                                        sx={{ 
                                            p: 1.5, 
                                            borderRadius: 2, 
                                            bgcolor: 'action.hover',
                                            color: color,
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center'
                                        }}
                                    >
                                        {icon}
                                    </Box>
                                    <Box flex={1}>
                                        <Typography variant="body2" color="text.secondary" fontWeight={500}>
                                            {getTipoNome(item.tipo)}
                                        </Typography>
                                        <Typography variant="h3" fontWeight={800} color={color}>
                                            {item.disponiveis}
                                        </Typography>
                                    </Box>
                                </Box>
                            </CardContent>
                        </Card>
                    );
                })}
            </Box>

            {/* Detalhamento por Plataforma */}
            <Card elevation={0} sx={{ border: '1px solid', borderColor: 'divider' }}>
                <CardContent sx={{ p: 3 }}>
                    <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
                        <Typography variant="h6" fontWeight={700}>
                            Por Plataforma
                        </Typography>
                        <Chip 
                            label={`${disponibilidadePorPlataforma.length} plataformas`} 
                            size="small" 
                            sx={{ fontWeight: 600 }}
                        />
                    </Box>

                    <Box display="flex" gap={2} flexWrap="wrap">
                        {disponibilidadePorPlataforma.map((plat, index) => (
                            <Box key={index} sx={{ flex: '1 1 calc(33.333% - 14px)', minWidth: 280 }}>
                                <Paper
                                    elevation={0}
                                    sx={{
                                        p: 2,
                                        border: '1px solid',
                                        borderColor: 'divider',
                                        borderRadius: 2,
                                        transition: 'all 0.2s',
                                        '&:hover': {
                                            borderColor: getTipoColor(plat.tipo),
                                            bgcolor: 'action.hover',
                                            transform: 'translateX(4px)'
                                        }
                                    }}
                                >
                                    <Box display="flex" alignItems="center" gap={2}>
                                        <Box 
                                            sx={{ 
                                                p: 1,
                                                borderRadius: 1.5,
                                                bgcolor: 'action.hover',
                                                color: getTipoColor(plat.tipo),
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center'
                                            }}
                                        >
                                            {getTipoIcon(plat.tipo)}
                                        </Box>
                                        <Box flex={1}>
                                            <Typography variant="body1" fontWeight={600}>
                                                {plat.nome}
                                            </Typography>
                                            <Typography variant="caption" color="text.secondary">
                                                {getTipoNome(plat.tipo)}
                                            </Typography>
                                        </Box>
                                        <Box 
                                            sx={{
                                                minWidth: 50,
                                                textAlign: 'center',
                                                py: 0.5,
                                                px: 1.5,
                                                borderRadius: 2,
                                                bgcolor: parseInt(plat.disponiveis) > 0 ? 'success.light' : 'action.hover',
                                                border: '1px solid',
                                                borderColor: parseInt(plat.disponiveis) > 0 ? 'success.main' : 'divider'
                                            }}
                                        >
                                            <Typography 
                                                variant="h6" 
                                                fontWeight={700}
                                                color={parseInt(plat.disponiveis) > 0 ? 'success.dark' : 'text.secondary'}
                                            >
                                                {plat.disponiveis}
                                            </Typography>
                                        </Box>
                                    </Box>
                                </Paper>
                            </Box>
                        ))}
                    </Box>
                </CardContent>
            </Card>
        </Box>
    );
}

function MaquinasProblematicas({ client }: { client: APIClient }) {
    const navigate = useNavigate();
    const [maquinas, setMaquinas] = React.useState<{
        vezesConsertada: number;
        id: number;
        nomePlataforma: string;
        tipoPlataforma: number;
        diasMenorIntervalo?: number;
    }[]>([]);
    const [loading, setLoading] = React.useState(true);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const data = await client.getMostFixedMaquinas();
                setMaquinas(data.slice(0, 5)); // Mostra apenas as 5 piores
            } catch (error) {
                console.error('Erro ao carregar máquinas problemáticas:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [client]);

    const getTipoIcon = (tipo: number) => {
        switch (tipo) {
            case 0: return <Computer sx={{ fontSize: 20 }} />;
            case 1: return <SportsEsports sx={{ fontSize: 20 }} />;
            case 2: return <DirectionsCar sx={{ fontSize: 20 }} />;
            default: return <Computer sx={{ fontSize: 20 }} />;
        }
    };

    if (loading) {
        return (
            <Box sx={{ mt: 4, display: 'flex', justifyContent: 'center' }}>
                <CircularProgress />
            </Box>
        );
    }

    if (maquinas.length === 0) {
        return null;
    }

    return (
        <Box sx={{ mt: 4 }}>
            <Typography variant="h5" gutterBottom sx={{ mb: 2, fontWeight: 600, color: 'error.main' }}>
                Máquinas com Falhas Recorrentes
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                Equipamentos com mais de 1 falha em menos de 30 dias - requerem atenção urgente
            </Typography>

            <Card 
                elevation={3}
                sx={{ 
                    bgcolor: 'error.lighter',
                    border: '2px solid',
                    borderColor: 'error.light'
                }}
            >
                <CardContent>
                    <Box display="flex" flexDirection="column" gap={2}>
                        {maquinas.map((maq, index) => (
                            <Paper
                                key={maq.id}
                                elevation={2}
                                sx={{
                                    p: 2,
                                    bgcolor: 'background.paper',
                                    transition: 'all 0.2s',
                                    '&:hover': {
                                        transform: 'translateX(8px)',
                                        boxShadow: 4
                                    }
                                }}
                            >
                                <Box display="flex" alignItems="center" gap={2}>
                                    {/* Ícone de Alerta */}
                                    <Box
                                        sx={{
                                            width: 48,
                                            height: 48,
                                            borderRadius: '50%',
                                            bgcolor: 'error.main',
                                            color: 'white',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            fontSize: '24px',
                                            fontWeight: 'bold'
                                        }}
                                    >
                                        {index + 1}
                                    </Box>

                                    {/* Info da Máquina */}
                                    <Box flex={1}>
                                        <Box display="flex" alignItems="center" gap={1} mb={0.5}>
                                            <Typography variant="h6" fontWeight="bold">
                                                {getTipoIcon(maq.tipoPlataforma)} {maq.nomePlataforma}
                                            </Typography>
                                            <Chip 
                                                label={`ID: ${maq.id}`} 
                                                size="small" 
                                                variant="outlined"
                                            />
                                        </Box>
                                    </Box>

                                    {/* Contador de Manutenções */}
                                    <Box textAlign="center">
                                        <Typography 
                                            variant="h4" 
                                            fontWeight="bold" 
                                            color="error.main"
                                        >
                                            {maq.vezesConsertada}
                                        </Typography>
                                        <Typography variant="caption" color="text.secondary">
                                            {maq.vezesConsertada === 1 ? 'falha' : 'falhas'} em 30 dias
                                        </Typography>
                                    </Box>
                                </Box>
                            </Paper>
                        ))}
                    </Box>

                    <Divider sx={{ my: 2 }} />

                    <Box display="flex" alignItems="center" gap={1}>
                        <Box display="flex" alignItems="center" gap={1} flex={1}>
                            <Lightbulb color="warning" />
                            <Typography variant="body2" color="text.secondary">
                                <strong>Ação recomendada:</strong> Falhas frequentes em curto período indicam defeito grave - considere substituição
                            </Typography>
                        </Box>
                        <Button 
                            variant="outlined" 
                            color="error" 
                            size="small"
                            onClick={() => navigate('/dashboard?tab=máquinas')}
                        >
                            Ver Todas
                        </Button>
                    </Box>
                </CardContent>
            </Card>
        </Box>
    );
}

function ClienteStats({ client }: { client: APIClient }) {
    const [stats, setStats] = React.useState<any[]>([]);
    const [loading, setLoading] = React.useState(false);
    const [filtroAtivo, setFiltroAtivo] = React.useState<string>('totalHoras');
    const navigate = useNavigate();

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

    const handleClienteClick = (cpf: string) => {
        navigate(`/dashboard?tab=clientes&cpf=${cpf}`);
    };

    return (
        <Box sx={{ mt: 4, }}>
            <Typography variant="h5" gutterBottom sx={{ mb: 2, fontWeight: 600 }}>
                Estatísticas de Clientes
            </Typography>

            {/* Tabs de Filtros */}
            <Box display="flex" gap={1.5} flexWrap="wrap" sx={{ mb: 3 }}>
                {filtros.map((filtro) => {
                    const Icon = filtro.icon;
                    const isActive = filtroAtivo === filtro.key;
                    return (
                        <Paper
                            key={filtro.key}
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
                    );
                })}
            </Box>

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
                                            <Box 
                                                flex={1}
                                                onClick={() => handleClienteClick(item.cpf)}
                                                sx={{ 
                                                    cursor: 'pointer',
                                                    '&:hover .client-name': { 
                                                        textDecoration: 'underline',
                                                        color: 'primary.main'
                                                    }
                                                }}
                                            >
                                                <Box display="flex" alignItems="center" gap={1}>
                                                    <Typography 
                                                        className="client-name"
                                                        variant="body1" 
                                                        fontWeight={isTop3 ? 600 : 500}
                                                        sx={{ transition: 'all 0.2s' }}
                                                    >
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