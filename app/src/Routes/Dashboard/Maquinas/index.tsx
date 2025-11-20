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
    Tab,
    Grid,
    Tooltip
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
    History,
    ViewList,
    ViewModule
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
    const [viewMode, setViewMode] = useState<'table' | 'grid'>('table');

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
            console.log('Carregando sessões para máquina:', selectedMaquina.id);
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
        <Box sx={{ p: 3, display: 'flex', flexDirection: 'column', gap: 3, height: '100%', overflow: 'hidden' }}>
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

                        {/* Alternar Visualização */}
                        <ToggleButtonGroup
                            value={viewMode}
                            exclusive
                            onChange={(_e, value) => value && setViewMode(value)}
                            size="small"
                        >
                            <ToggleButton value="table">
                                <Tooltip title="Visualização em Lista">
                                    <ViewList fontSize="small" />
                                </Tooltip>
                            </ToggleButton>
                            <ToggleButton value="grid">
                                <Tooltip title="Visualização em Mapa">
                                    <ViewModule fontSize="small" />
                                </Tooltip>
                            </ToggleButton>
                        </ToggleButtonGroup>

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

            {/* Visualizações */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4, duration: 0.5 }}
                style={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}
            >
                {viewMode === 'table' ? (
                    /* Visualização em Tabela */
                    <TableContainer component={Paper} sx={{ borderRadius: 2, boxShadow: 3, flex: 1, overflow: 'auto' }}>
                        <Table sx={{ minWidth: 650 }} stickyHeader>
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
                ) : (
                    /* Visualização em Grid/Mapa */
                    <Box sx={{ flex: 1, overflow: 'auto', p: 2 }}>
                        {filteredMaquinas.length === 0 ? (
                            <Box textAlign="center" py={8}>
                                <Typography variant="h6" color="text.secondary">
                                    Nenhuma máquina encontrada
                                </Typography>
                            </Box>
                        ) : (
                            <Grid container spacing={2}>
                                {filteredMaquinas.map((maquina, index) => {
                                    const active = isActive(new Date(maquina.lastseen));
                                    const lastSeen = formatLastSeen(new Date(maquina.lastseen));
                                    
                                    return (
                                        <Grid item xs={12} sm={6} md={4} lg={3} key={maquina.id}>
                                            <motion.div
                                                initial={{ opacity: 0, scale: 0.9 }}
                                                animate={{ opacity: 1, scale: 1 }}
                                                transition={{ delay: index * 0.05, duration: 0.3 }}
                                                whileHover={{ scale: 1.03 }}
                                                whileTap={{ scale: 0.98 }}
                                            >
                                                <Card 
                                                    sx={{ 
                                                        cursor: 'pointer',
                                                        height: '100%',
                                                        position: 'relative',
                                                        overflow: 'visible',
                                                        border: active ? 2 : 1,
                                                        borderColor: active ? 'success.main' : 'divider',
                                                        transition: 'all 0.3s ease',
                                                        '&:hover': {
                                                            boxShadow: 6,
                                                            borderColor: 'primary.main'
                                                        }
                                                    }}
                                                    onClick={() => setSelectedMaquina(maquina)}
                                                >
                                                    {/* Badge de Status */}
                                                    <Box
                                                        sx={{
                                                            position: 'absolute',
                                                            top: -8,
                                                            right: -8,
                                                            zIndex: 1
                                                        }}
                                                    >
                                                        <Avatar
                                                            sx={{
                                                                width: 24,
                                                                height: 24,
                                                                bgcolor: active ? 'success.main' : 'grey.500',
                                                                border: 2,
                                                                borderColor: 'background.paper'
                                                            }}
                                                        >
                                                            <Circle sx={{ fontSize: 12 }} />
                                                        </Avatar>
                                                    </Box>

                                                    <CardContent sx={{ textAlign: 'center', pb: 2 }}>
                                                        {/* Ícone Principal */}
                                                        <Avatar
                                                            sx={{
                                                                width: 64,
                                                                height: 64,
                                                                margin: '0 auto 16px',
                                                                bgcolor: active ? 'success.light' : 'grey.300',
                                                                color: active ? 'success.dark' : 'grey.600'
                                                            }}
                                                        >
                                                            {getTipoIcon(maquina.tipo)}
                                                        </Avatar>

                                                        {/* ID */}
                                                        <Typography variant="h5" fontWeight="bold" gutterBottom>
                                                            #{maquina.id}
                                                        </Typography>

                                                        {/* Nome da Plataforma */}
                                                        <Typography 
                                                            variant="body1" 
                                                            color="text.secondary"
                                                            gutterBottom
                                                            sx={{
                                                                overflow: 'hidden',
                                                                textOverflow: 'ellipsis',
                                                                whiteSpace: 'nowrap'
                                                            }}
                                                        >
                                                            {maquina.nomeplat}
                                                        </Typography>

                                                        {/* Tipo */}
                                                        <Box mt={2} mb={2}>
                                                            <Chip
                                                                icon={getTipoIcon(maquina.tipo)}
                                                                label={getTipoLabel(maquina.tipo)}
                                                                size="small"
                                                                variant="outlined"
                                                                color="primary"
                                                            />
                                                        </Box>

                                                        {/* Status e Última Conexão */}
                                                        <Box 
                                                            display="flex" 
                                                            alignItems="center" 
                                                            justifyContent="center" 
                                                            gap={0.5}
                                                            mt={1}
                                                        >
                                                            {lastSeen.isOnline ? (
                                                                <>
                                                                    <Circle sx={{ fontSize: 8, color: 'success.main' }} />
                                                                    <Typography 
                                                                        variant="caption" 
                                                                        fontWeight="bold" 
                                                                        color="success.main"
                                                                    >
                                                                        {lastSeen.text}
                                                                    </Typography>
                                                                </>
                                                            ) : (
                                                                <>
                                                                    <AccessTime sx={{ fontSize: 14 }} color="action" />
                                                                    <Typography variant="caption" color="text.secondary">
                                                                        {lastSeen.text}
                                                                    </Typography>
                                                                </>
                                                            )}
                                                        </Box>
                                                    </CardContent>
                                                </Card>
                                            </motion.div>
                                        </Grid>
                                    );
                                })}
                            </Grid>
                        )}
                    </Box>
                )}
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
                                                        const inicio = new Date(sessao.datatempoinicio);
                                                        const fim = sessao.datatempofim ? new Date(sessao.datatempofim) : null;
                                                        const isActive = !fim;
                                                        
                                                        return (
                                                            <TableRow
                                                                key={sessao.cliente.cpf + "" + sessao.datatempoinicio}
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