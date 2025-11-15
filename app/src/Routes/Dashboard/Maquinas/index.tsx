import { useEffect, useState, useMemo } from "react";
import type { Maquina, UserData, Sessao } from "../../../API/APIClient";
import type APIClient from "../../../API/APIClient";
import {
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Paper,
    Chip,
    Typography,
    CircularProgress,
    Box,
    Avatar,
    TextField,
    Button,
    ToggleButtonGroup,
    ToggleButton,
    InputAdornment,
    Card,
    CardContent,
    Drawer,
    IconButton,
    Tabs,
    Tab
} from "@mui/material";
import { 
    Computer, 
    SportsEsports, 
    SportsBasketball, 
    Search, 
    FilterList,
    Circle,
    AccessTime,
    Close,
    Info,
    History
} from "@mui/icons-material";
import { motion, AnimatePresence } from "framer-motion";

export function Maquinas({ client }: { client: APIClient, userData: UserData | null }) {
    const [maquinas, setMaquinas] = useState<Maquina[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState("");
    const [tipoFilter, setTipoFilter] = useState<number | null>(null);
    const [selectedMaquina, setSelectedMaquina] = useState<Maquina | null>(null);
    const [tabValue, setTabValue] = useState(0);
    const [sessoes, setSessoes] = useState<Sessao[]>([]);
    const [loadingSessoes, setLoadingSessoes] = useState(false);

    useEffect(() => {
        const fetchMaquinas = async () => {
            try {
                const data = await client.getAllMaquinas();
                setMaquinas(data);
            } catch (error) {
                console.error("Erro ao carregar máquinas:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchMaquinas();
        
        // Atualizar a cada 30 segundos para atualizar o status
        const interval = setInterval(fetchMaquinas, 30000);
        return () => clearInterval(interval);
    }, [client]);

    useEffect(() => {
        if (selectedMaquina && tabValue === 1) {
            setLoadingSessoes(true);
            client.getSessoes({ maquina: selectedMaquina.id })
                .then(data => setSessoes(data))
                .catch(error => console.error('Erro ao carregar sessões:', error))
                .finally(() => setLoadingSessoes(false));
        }
    }, [selectedMaquina, tabValue, client]);

    const isActive = (lastseen?: Date) => {
        if (!lastseen) return false;
        const now = new Date();
        const lastSeenDate = new Date(lastseen);
        const diffMinutes = (now.getTime() - lastSeenDate.getTime()) / 1000 / 60;
        return diffMinutes < 1;
    };

    const getTipoLabel = (tipo: number) => {
        switch (tipo) {
            case 0: return 'PC Gamer';
            case 1: return 'Console';
            case 2: return 'Simulador';
            default: return 'Desconhecido';
        }
    };

    const getTipoIcon = (tipo: number) => {
        switch (tipo) {
            case 0: return <Computer />;
            case 1: return <SportsEsports />;
            case 2: return <SportsBasketball />;
            default: return <Computer />;
        }
    };

    const formatLastSeen = (lastseen?: Date) => {
        if (!lastseen) return { text: 'Nunca', isOnline: false };
        const now = new Date();
        const lastSeenDate = new Date(lastseen);
        const diffMs = now.getTime() - lastSeenDate.getTime();
        const diffMinutes = Math.floor(diffMs / 1000 / 60);
        const diffHours = Math.floor(diffMinutes / 60);
        const diffDays = Math.floor(diffHours / 24);

        console.log({ now, lastSeenDate, diffMs, diffMinutes, diffHours, diffDays });

        if (diffMinutes < 1) return { text: 'Online', isOnline: true };
        if (diffMinutes < 60) return { text: `${diffMinutes}m atrás`, isOnline: false };
        if (diffHours < 24) return { text: `${diffHours}h atrás`, isOnline: false };
        return { text: `${diffDays}d atrás`, isOnline: false };
    };

    const filteredMaquinas = useMemo(() => {
        let filtered = [...maquinas];

        // Filtro de busca
        if (searchQuery) {
            filtered = filtered.filter(maquina => 
                maquina.nomeplat?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                maquina.id.toString().includes(searchQuery)
            );
        }

        // Filtro de tipo
        if (tipoFilter !== null) {
            filtered = filtered.filter(maquina => maquina.tipo === tipoFilter);
        }

        return filtered;
    }, [maquinas, searchQuery, tipoFilter]);

    const stats = useMemo(() => {
        const total = maquinas.length;
        const ativas = maquinas.filter(m => isActive(new Date(m.lastseen))).length;
        const pcs = maquinas.filter(m => m.tipo === 0).length;
        const consoles = maquinas.filter(m => m.tipo === 1).length;
        const simuladores = maquinas.filter(m => m.tipo === 2).length;
        
        return { total, ativas, inativas: total - ativas, pcs, consoles, simuladores };
    }, [maquinas]);

    if (loading) {
        return (
            <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
                <CircularProgress />
            </Box>
        );
    }

    return (
        <Box sx={{ p: 3, display: 'flex', flexDirection: 'column', gap: 3, height: '100%', overflow: 'auto' }}>
            {/* Header */}
            <Box>
                <motion.div
                    initial={{ opacity: 0, x: -30 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.5 }}
                >
                    <Typography variant="h4" component="h1" gutterBottom>
                        <FilterList sx={{ fontSize: 32, verticalAlign: "middle", mr: 1 }} />
                        Máquinas
                    </Typography>
                </motion.div>

                {/* Cards de Estatísticas */}
                <motion.div
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1, duration: 0.4 }}
                >
                    <Box display="flex" gap={2} flexWrap="wrap" sx={{ mb: 3 }}>
                        <Card sx={{ flex: '1 1 150px' }}>
                            <CardContent sx={{ textAlign: 'center', py: 2 }}>
                                <Typography variant="h4" color="primary">{stats.total}</Typography>
                                <Typography variant="body2" color="text.secondary">Total</Typography>
                            </CardContent>
                        </Card>
                        <Card sx={{ flex: '1 1 150px' }}>
                            <CardContent sx={{ textAlign: 'center', py: 2 }}>
                                <Typography variant="h4" color="success.main">{stats.ativas}</Typography>
                                <Typography variant="body2" color="text.secondary">Ativas</Typography>
                            </CardContent>
                        </Card>
                        <Card sx={{ flex: '1 1 150px' }}>
                            <CardContent sx={{ textAlign: 'center', py: 2 }}>
                                <Typography variant="h4" color="error.main">{stats.inativas}</Typography>
                                <Typography variant="body2" color="text.secondary">Inativas</Typography>
                            </CardContent>
                        </Card>
                        <Card sx={{ flex: '1 1 150px' }}>
                            <CardContent sx={{ textAlign: 'center', py: 2 }}>
                                <Typography variant="h4">{stats.pcs}</Typography>
                                <Typography variant="body2" color="text.secondary">PCs</Typography>
                            </CardContent>
                        </Card>
                        <Card sx={{ flex: '1 1 150px' }}>
                            <CardContent sx={{ textAlign: 'center', py: 2 }}>
                                <Typography variant="h4">{stats.consoles}</Typography>
                                <Typography variant="body2" color="text.secondary">Consoles</Typography>
                            </CardContent>
                        </Card>
                        <Card sx={{ flex: '1 1 150px' }}>
                            <CardContent sx={{ textAlign: 'center', py: 2 }}>
                                <Typography variant="h4">{stats.simuladores}</Typography>
                                <Typography variant="body2" color="text.secondary">Simuladores</Typography>
                            </CardContent>
                        </Card>
                    </Box>
                </motion.div>
                
                {/* Barra de Busca */}
                <motion.div
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2, duration: 0.4 }}
                >
                    <TextField
                        fullWidth
                        size="small"
                        placeholder="Buscar por ID ou plataforma..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        InputProps={{
                            startAdornment: (
                                <InputAdornment position="start">
                                    <Search />
                                </InputAdornment>
                            ),
                        }}
                        sx={{ mb: 2 }}
                    />
                </motion.div>

                {/* Filtros */}
                <motion.div
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3, duration: 0.4 }}
                >
                    <Box display="flex" gap={2} flexWrap="wrap" alignItems="center">
                        {/* Filtro de Tipo */}
                        <ToggleButtonGroup
                            value={tipoFilter}
                            exclusive
                            onChange={(_e, value) => setTipoFilter(value)}
                            size="small"
                        >
                            <ToggleButton value={0}>
                                <Computer fontSize="small" sx={{ mr: 0.5 }} /> PC
                            </ToggleButton>
                            <ToggleButton value={1}>
                                <SportsEsports fontSize="small" sx={{ mr: 0.5 }} /> Console
                            </ToggleButton>
                            <ToggleButton value={2}>
                                <SportsBasketball fontSize="small" sx={{ mr: 0.5 }} /> Simulador
                            </ToggleButton>
                        </ToggleButtonGroup>

                        <Box flex={1} />

                        {/* Contador */}
                        <Typography variant="body2" color="text.secondary">
                            {filteredMaquinas.length} máquina{filteredMaquinas.length !== 1 ? 's' : ''}
                        </Typography>

                        {/* Botão Limpar */}
                        <AnimatePresence>
                            {(searchQuery || tipoFilter !== null) && (
                                <motion.div
                                    initial={{ opacity: 0, scale: 0.8 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    exit={{ opacity: 0, scale: 0.8 }}
                                    transition={{ duration: 0.2 }}
                                >
                                    <Button
                                        size="small"
                                        onClick={() => {
                                            setSearchQuery("");
                                            setTipoFilter(null);
                                        }}
                                    >
                                        Limpar
                                    </Button>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </Box>
                </motion.div>
            </Box>

            {/* Tabela */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4, duration: 0.5 }}
            >
                <TableContainer component={Paper} sx={{ borderRadius: 2, boxShadow: 3 }}>
                    <Table sx={{ minWidth: 650 }}>
                        <TableHead>
                            <TableRow>
                                <TableCell>ID</TableCell>
                                <TableCell>Plataforma</TableCell>
                                <TableCell align="center">Tipo</TableCell>
                                <TableCell align="center">Status</TableCell>
                                <TableCell align="center">Última Conexão</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {filteredMaquinas.map((maquina, index) => {
                                const active = isActive(new Date(maquina.lastseen));
                                return (
                                    <TableRow
                                        key={maquina.id}
                                        component={motion.tr}
                                        initial={{ opacity: 0, x: -20 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        transition={{ delay: index * 0.05, duration: 0.3 }}
                                        sx={{ 
                                            '&:last-child td, &:last-child th': { border: 0 },
                                            cursor: 'pointer'
                                        }}
                                        hover
                                        onClick={() => setSelectedMaquina(maquina)}
                                    >
                                        <TableCell component="th" scope="row">
                                            <Box display="flex" alignItems="center" gap={1}>
                                                <Avatar sx={{ 
                                                    width: 32, 
                                                    height: 32, 
                                                    bgcolor: active ? 'success.main' : 'grey.500' 
                                                }}>
                                                    {maquina.id}
                                                </Avatar>
                                            </Box>
                                        </TableCell>
                                        <TableCell>
                                            <Typography variant="body2" fontWeight="bold">
                                                {maquina.nomeplat}
                                            </Typography>
                                        </TableCell>
                                        <TableCell align="center">
                                            <Chip 
                                                icon={getTipoIcon(maquina.tipo)}
                                                label={getTipoLabel(maquina.tipo)} 
                                                size="small" 
                                                variant="outlined"
                                                color="primary"
                                            />
                                        </TableCell>
                                        <TableCell align="center">
                                            <Chip 
                                                icon={<Circle sx={{ fontSize: 12, color: 'success' }} />}
                                                label={active ? 'Ativa' : 'Inativa'} 
                                                size="small" 
                                                color={active ? 'success' : 'default'}
                                            />
                                        </TableCell>
                                        <TableCell align="center">
                                            {(() => {
                                                const lastSeen = formatLastSeen(new Date(maquina.lastseen));
                                                return (
                                                    <Box display="flex" alignItems="center" justifyContent="center" gap={0.5}>
                                                        {lastSeen.isOnline ? (
                                                            <>
                                                                <Circle sx={{ fontSize: 10, color: 'success.main' }} />
                                                                <Typography variant="body2" fontWeight="bold" color="success.main">
                                                                    {lastSeen.text}
                                                                </Typography>
                                                            </>
                                                        ) : (
                                                            <>
                                                                <AccessTime fontSize="small" color="action" />
                                                                <Typography variant="body2">
                                                                    {lastSeen.text}
                                                                </Typography>
                                                            </>
                                                        )}
                                                    </Box>
                                                );
                                            })()}
                                        </TableCell>
                                    </TableRow>
                                );
                            })}
                            {filteredMaquinas.length === 0 && (
                                <TableRow>
                                    <TableCell colSpan={5}>
                                        <Box textAlign="center" py={4}>
                                            <Typography variant="h6" color="text.secondary">
                                                Nenhuma máquina encontrada
                                            </Typography>
                                        </Box>
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </TableContainer>
            </motion.div>

            {/* Drawer de Detalhes */}
            <Drawer
                anchor="right"
                open={selectedMaquina !== null}
                onClose={() => {
                    setSelectedMaquina(null);
                    setTabValue(0);
                    setSessoes([]);
                }}
                PaperProps={{
                    sx: { 
                        width: { xs: '100%', sm: 600 },
                        bgcolor: 'background.paper'
                    }
                }}
            >
                {selectedMaquina && (
                    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                        {/* Header */}
                        <motion.div
                            initial={{ opacity: 0, y: -20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.3 }}
                        >
                            <Box sx={{ 
                                p: 2, 
                                borderBottom: 1, 
                                borderColor: 'divider',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'space-between'
                            }}>
                                <Box display="flex" alignItems="center" gap={2}>
                                    <Avatar sx={{ 
                                        bgcolor: isActive(new Date(selectedMaquina.lastseen)) ? 'success.main' : 'grey.500',
                                        width: 48,
                                        height: 48
                                    }}>
                                        {getTipoIcon(selectedMaquina.tipo)}
                                    </Avatar>
                                    <Box>
                                        <Typography variant="h6">
                                            {selectedMaquina.nomeplat}
                                        </Typography>
                                        <Typography variant="caption" color="text.secondary">
                                            ID: {selectedMaquina.id}
                                        </Typography>
                                    </Box>
                                </Box>
                                <IconButton onClick={() => {
                                    setSelectedMaquina(null);
                                    setTabValue(0);
                                    setSessoes([]);
                                }}>
                                    <Close />
                                </IconButton>
                            </Box>
                        </motion.div>

                        {/* Tabs */}
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: 0.1, duration: 0.3 }}
                        >
                            <Tabs 
                                value={tabValue} 
                                onChange={(_e, newValue) => setTabValue(newValue)}
                                sx={{ borderBottom: 1, borderColor: 'divider', px: 2 }}
                            >
                                <Tab icon={<Info />} iconPosition="start" label="Detalhes" />
                                <Tab icon={<History />} iconPosition="start" label="Sessões" />
                            </Tabs>
                        </motion.div>

                        {/* Tab Content */}
                        <Box sx={{ flex: 1, overflow: 'auto', p: 3 }}>
                            {tabValue === 0 && (
                                <motion.div
                                    initial={{ opacity: 0, x: -20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ duration: 0.3 }}
                                >
                                    <Box display="flex" flexDirection="column" gap={2}>
                                        <Paper sx={{ p: 2 }}>
                                            <Typography variant="caption" color="text.secondary">
                                                ID da Máquina
                                            </Typography>
                                            <Typography variant="h6">
                                                {selectedMaquina.id}
                                            </Typography>
                                        </Paper>

                                        <Paper sx={{ p: 2 }}>
                                            <Typography variant="caption" color="text.secondary">
                                                Plataforma
                                            </Typography>
                                            <Typography variant="h6">
                                                {selectedMaquina.nomeplat}
                                            </Typography>
                                        </Paper>

                                        <Paper sx={{ p: 2 }}>
                                            <Typography variant="caption" color="text.secondary">
                                                Tipo
                                            </Typography>
                                            <Box mt={1}>
                                                <Chip 
                                                    icon={getTipoIcon(selectedMaquina.tipo)}
                                                    label={getTipoLabel(selectedMaquina.tipo)}
                                                    color="primary"
                                                />
                                            </Box>
                                        </Paper>

                                        <Paper sx={{ p: 2 }}>
                                            <Typography variant="caption" color="text.secondary">
                                                Status Atual
                                            </Typography>
                                            <Box mt={1}>
                                                <Chip 
                                                    icon={<Circle sx={{ fontSize: 12 }} />}
                                                    label={isActive(new Date(selectedMaquina.lastseen)) ? 'Ativa' : 'Inativa'}
                                                    color={isActive(new Date(selectedMaquina.lastseen)) ? 'success' : 'default'}
                                                />
                                            </Box>
                                        </Paper>

                                        <Paper sx={{ p: 2 }}>
                                            <Typography variant="caption" color="text.secondary">
                                                Última Conexão
                                            </Typography>
                                            {(() => {
                                                const lastSeen = formatLastSeen(new Date(selectedMaquina.lastseen));
                                                return (
                                                    <Box display="flex" alignItems="center" gap={1} mt={1}>
                                                        {lastSeen.isOnline ? (
                                                            <>
                                                                <Circle sx={{ fontSize: 12, color: 'success.main' }} />
                                                                <Typography variant="h6" color="success.main">
                                                                    {lastSeen.text}
                                                                </Typography>
                                                            </>
                                                        ) : (
                                                            <>
                                                                <AccessTime color="action" />
                                                                <Typography variant="h6">
                                                                    {lastSeen.text}
                                                                </Typography>
                                                            </>
                                                        )}
                                                    </Box>
                                                );
                                            })()}
                                        </Paper>
                                    </Box>
                                </motion.div>
                            )}

                            {tabValue === 1 && (
                                <motion.div
                                    initial={{ opacity: 0, x: -20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ duration: 0.3 }}
                                >
                                    {loadingSessoes ? (
                                        <Box display="flex" justifyContent="center" alignItems="center" py={8}>
                                            <CircularProgress />
                                        </Box>
                                    ) : sessoes.length === 0 ? (
                                        <Box textAlign="center" py={8}>
                                            <Typography variant="h6" color="text.secondary">
                                                Nenhuma sessão encontrada
                                            </Typography>
                                        </Box>
                                    ) : (
                                        <TableContainer component={Paper}>
                                            <Table size="small">
                                                <TableHead>
                                                    <TableRow>
                                                        <TableCell>Cliente</TableCell>
                                                        <TableCell>Início</TableCell>
                                                        <TableCell>Fim</TableCell>
                                                        <TableCell>Status</TableCell>
                                                    </TableRow>
                                                </TableHead>
                                                <TableBody>
                                                    {sessoes.map((sessao, index) => {
                                                        const inicio = new Date(sessao.dateTimeInicio);
                                                        const fim = sessao.dateTimeFim ? new Date(sessao.dateTimeFim) : null;
                                                        const isActive = !fim;
                                                        
                                                        return (
                                                            <TableRow
                                                                key={sessao.id}
                                                                component={motion.tr}
                                                                initial={{ opacity: 0, x: -10 }}
                                                                animate={{ opacity: 1, x: 0 }}
                                                                transition={{ delay: index * 0.05, duration: 0.2 }}
                                                            >
                                                                <TableCell>
                                                                    <Typography variant="body2">
                                                                        {sessao.cliente?.nome || 'N/A'}
                                                                    </Typography>
                                                                </TableCell>
                                                                <TableCell>
                                                                    <Typography variant="body2">
                                                                        {inicio.toLocaleString('pt-BR', {
                                                                            day: '2-digit',
                                                                            month: '2-digit',
                                                                            hour: '2-digit',
                                                                            minute: '2-digit'
                                                                        })}
                                                                    </Typography>
                                                                </TableCell>
                                                                <TableCell>
                                                                    <Typography variant="body2">
                                                                        {fim ? fim.toLocaleString('pt-BR', {
                                                                            day: '2-digit',
                                                                            month: '2-digit',
                                                                            hour: '2-digit',
                                                                            minute: '2-digit'
                                                                        }) : '-'}
                                                                    </Typography>
                                                                </TableCell>
                                                                <TableCell>
                                                                    <Chip
                                                                        label={isActive ? 'Ativa' : 'Finalizada'}
                                                                        color={isActive ? 'success' : 'default'}
                                                                        size="small"
                                                                    />
                                                                </TableCell>
                                                            </TableRow>
                                                        );
                                                    })}
                                                </TableBody>
                                            </Table>
                                        </TableContainer>
                                    )}
                                </motion.div>
                            )}
                        </Box>
                    </Box>
                )}
            </Drawer>
        </Box>
    );
}