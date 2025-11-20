import { useEffect, useState, useMemo } from "react";
import type { UserData, Manutencao } from "../../../API/APIClient";
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
    TextField,
    Button,
    InputAdornment,
    ToggleButtonGroup,
    ToggleButton,
    Drawer,
    IconButton,
} from "@mui/material";
import {
    Search,
    Build,
    Computer,
    SportsEsports,
    SportsBasketball,
    Close,
    Warning,
    Error as ErrorIcon,
    CheckCircle,
} from "@mui/icons-material";
import { motion, AnimatePresence } from "framer-motion";

export function Manutencao({ client }: { client: APIClient, userData: UserData | null }) {
    const [manutencoes, setManutencoes] = useState<Manutencao[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState("");
    const [prioridadeFilter, setPrioridadeFilter] = useState<string | null>(null);
    const [tipoFilter, setTipoFilter] = useState<string | null>(null);
    const [periodoFilter, setPeriodoFilter] = useState<string | null>(null);
    const [selectedManutencao, setSelectedManutencao] = useState<Manutencao | null>(null);

    useEffect(() => {
        const fetchManutencoes = async () => {
            try {
                const query: any = {};
                if (prioridadeFilter) query.prioridade = prioridadeFilter;
                if (tipoFilter) query.tipo = tipoFilter;
                if (periodoFilter) query.periodo = periodoFilter;

                const data = await client.getManutencoes(query);
                setManutencoes(data);
            } catch (error) {
                console.error("Erro ao carregar manutenções:", error);
                setManutencoes([]);
            } finally {
                setLoading(false);
            }
        };

        fetchManutencoes();
    }, [client, prioridadeFilter, tipoFilter, periodoFilter]);

    const formatDateTime = (date: Date | string) => {
        const d = new Date(date);
        return `${d.toLocaleDateString('pt-BR')} ${d.toLocaleTimeString('pt-BR', { 
            hour: '2-digit', 
            minute: '2-digit' 
        })}`;
    };

    const getPrioridadeColor = (prioridade: string) => {
        switch (prioridade.toLowerCase()) {
            case 'alta':
                return 'error';
            case 'média':
            case 'media':
                return 'warning';
            case 'baixa':
                return 'success';
            default:
                return 'default';
        }
    };

    const getPrioridadeIcon = (prioridade: string) => {
        switch (prioridade.toLowerCase()) {
            case 'alta':
                return <ErrorIcon />;
            case 'média':
            case 'media':
                return <Warning />;
            case 'baixa':
                return <CheckCircle />;
            default:
                return <Build />;
        }
    };

    const getTipoIcon = (tipo: number) => {
        switch (tipo) {
            case 0:
                return <Computer />;
            case 1:
                return <SportsEsports />;
            case 2:
                return <SportsBasketball />;
            default:
                return <Computer />;
        }
    };

    const getTipoNome = (tipo: number) => {
        switch (tipo) {
            case 0:
                return 'PC';
            case 1:
                return 'Console';
            case 2:
                return 'Simulador';
            default:
                return 'Desconhecido';
        }
    };

    const filteredManutencoes = useMemo(() => {
        return manutencoes.filter(manutencao => {
            const searchLower = searchQuery.toLowerCase();
            const matchesSearch = 
                manutencao.manutencaotipo.toLowerCase().includes(searchLower) ||
                manutencao.nomefuncionario.toLowerCase().includes(searchLower) ||
                manutencao.nomeplat.toLowerCase().includes(searchLower) ||
                manutencao.maquinaid.toString().includes(searchQuery);
            
            return matchesSearch;
        });
    }, [manutencoes, searchQuery]);

    if (loading) {
        return (
            <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
                <CircularProgress />
            </Box>
        );
    }

    return (
        <Box sx={{ p: 3, height: '100%', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
            {/* Header */}
            <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4 }}
            >
                <Typography variant="h4" gutterBottom sx={{ fontWeight: 'bold', mb: 3 }}>
                    <Build sx={{ mr: 1, verticalAlign: 'middle' }} />
                    Manutenções
                </Typography>
            </motion.div>

            {/* Barra de Busca */}
            <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1, duration: 0.4 }}
            >
                <TextField
                    fullWidth
                    size="small"
                    placeholder="Buscar por tipo, funcionário, máquina..."
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
                transition={{ delay: 0.2, duration: 0.4 }}
            >
                <Box display="flex" gap={2} flexWrap="wrap" alignItems="center" mb={2}>
                    <ToggleButtonGroup
                        value={prioridadeFilter}
                        exclusive
                        onChange={(_e, value) => setPrioridadeFilter(value)}
                        size="small"
                    >
                        <ToggleButton value="Alta">
                            <ErrorIcon fontSize="small" sx={{ mr: 0.5 }} color="error" /> Alta
                        </ToggleButton>
                        <ToggleButton value="Média">
                            <Warning fontSize="small" sx={{ mr: 0.5 }} color="warning" /> Média
                        </ToggleButton>
                        <ToggleButton value="Baixa">
                            <CheckCircle fontSize="small" sx={{ mr: 0.5 }} color="success" /> Baixa
                        </ToggleButton>
                    </ToggleButtonGroup>

                    <ToggleButtonGroup
                        value={tipoFilter}
                        exclusive
                        onChange={(_e, value) => setTipoFilter(value)}
                        size="small"
                    >
                        <ToggleButton value="Preventiva">Preventiva</ToggleButton>
                        <ToggleButton value="Corretiva">Corretiva</ToggleButton>
                    </ToggleButtonGroup>

                    <ToggleButtonGroup
                        value={periodoFilter}
                        exclusive
                        onChange={(_e, value) => setPeriodoFilter(value)}
                        size="small"
                    >
                        <ToggleButton value="7">7 dias</ToggleButton>
                        <ToggleButton value="30">30 dias</ToggleButton>
                        <ToggleButton value="90">90 dias</ToggleButton>
                    </ToggleButtonGroup>

                    <Box flex={1} />

                    <Typography variant="body2" color="text.secondary">
                        {filteredManutencoes.length} manutenç{filteredManutencoes.length !== 1 ? 'ões' : 'ão'}
                    </Typography>

                    <AnimatePresence>
                        {(searchQuery || prioridadeFilter || tipoFilter || periodoFilter) && (
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
                                        setPrioridadeFilter(null);
                                        setTipoFilter(null);
                                        setPeriodoFilter(null);
                                    }}
                                >
                                    Limpar
                                </Button>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </Box>
            </motion.div>

            {/* Tabela */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3, duration: 0.5 }}
                style={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}
            >
                <TableContainer component={Paper} sx={{ borderRadius: 2, boxShadow: 3, flex: 1, overflow: 'auto' }}>
                    <Table sx={{ minWidth: 650 }} stickyHeader>
                        <TableHead>
                            <TableRow>
                                <TableCell>ID</TableCell>
                                <TableCell>Tipo</TableCell>
                                <TableCell>Máquina</TableCell>
                                <TableCell>Plataforma</TableCell>
                                <TableCell>Prioridade</TableCell>
                                <TableCell>Funcionário</TableCell>
                                <TableCell>Data/Hora</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {filteredManutencoes.map((manutencao, index) => (
                                <TableRow
                                    key={manutencao.manutencaoid}
                                    component={motion.tr}
                                    initial={{ opacity: 0, x: -20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: index * 0.05, duration: 0.3 }}
                                    sx={{ 
                                        '&:last-child td, &:last-child th': { border: 0 },
                                        cursor: 'pointer'
                                    }}
                                    hover
                                    onClick={() => setSelectedManutencao(manutencao)}
                                >
                                    <TableCell>
                                        <Typography variant="body2" fontWeight="bold">
                                            #{manutencao.manutencaoid}
                                        </Typography>
                                    </TableCell>
                                    <TableCell>
                                        <Chip 
                                            label={manutencao.manutencaotipo}
                                            size="small"
                                            color={manutencao.manutencaotipo === 'Preventiva' ? 'primary' : 'secondary'}
                                        />
                                    </TableCell>
                                    <TableCell>
                                        <Box display="flex" alignItems="center" gap={1}>
                                            {getTipoIcon(manutencao.tipoplat)}
                                            <Typography variant="body2">
                                                Máquina #{manutencao.maquinaid}
                                            </Typography>
                                        </Box>
                                    </TableCell>
                                    <TableCell>
                                        <Typography variant="body2">
                                            {manutencao.nomeplat} ({getTipoNome(manutencao.tipoplat)})
                                        </Typography>
                                    </TableCell>
                                    <TableCell>
                                        <Chip
                                            icon={getPrioridadeIcon(manutencao.manutencaoprioridade)}
                                            label={manutencao.manutencaoprioridade}
                                            size="small"
                                            color={getPrioridadeColor(manutencao.manutencaoprioridade)}
                                            variant="outlined"
                                        />
                                    </TableCell>
                                    <TableCell>
                                        <Typography variant="body2">
                                            {manutencao.nomefuncionario}
                                        </Typography>
                                    </TableCell>
                                    <TableCell>
                                        <Typography variant="body2">
                                            {formatDateTime(manutencao.manutencaodatatempoinicio)}
                                        </Typography>
                                    </TableCell>
                                </TableRow>
                            ))}
                            {filteredManutencoes.length === 0 && (
                                <TableRow>
                                    <TableCell colSpan={7}>
                                        <Box textAlign="center" py={4}>
                                            <Typography variant="h6" color="text.secondary">
                                                Nenhuma manutenção encontrada
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
                open={selectedManutencao !== null}
                onClose={() => setSelectedManutencao(null)}
                sx={{
                    '& .MuiDrawer-paper': {
                        width: 400,
                        p: 3
                    }
                }}
            >
                {selectedManutencao && (
                    <Box>
                        <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
                            <Typography variant="h5" fontWeight="bold">
                                Detalhes da Manutenção
                            </Typography>
                            <IconButton onClick={() => setSelectedManutencao(null)}>
                                <Close />
                            </IconButton>
                        </Box>

                        <Box display="flex" flexDirection="column" gap={2}>
                            <Box>
                                <Typography variant="caption" color="text.secondary">
                                    ID
                                </Typography>
                                <Typography variant="body1" fontWeight="bold">
                                    #{selectedManutencao.manutencaoid}
                                </Typography>
                            </Box>

                            <Box>
                                <Typography variant="caption" color="text.secondary">
                                    Tipo
                                </Typography>
                                <Box mt={0.5}>
                                    <Chip 
                                        label={selectedManutencao.manutencaotipo}
                                        color={selectedManutencao.manutencaotipo === 'Preventiva' ? 'primary' : 'secondary'}
                                    />
                                </Box>
                            </Box>

                            <Box>
                                <Typography variant="caption" color="text.secondary">
                                    Prioridade
                                </Typography>
                                <Box mt={0.5}>
                                    <Chip
                                        icon={getPrioridadeIcon(selectedManutencao.manutencaoprioridade)}
                                        label={selectedManutencao.manutencaoprioridade}
                                        color={getPrioridadeColor(selectedManutencao.manutencaoprioridade)}
                                    />
                                </Box>
                            </Box>

                            <Box>
                                <Typography variant="caption" color="text.secondary">
                                    Máquina
                                </Typography>
                                <Box display="flex" alignItems="center" gap={1} mt={0.5}>
                                    {getTipoIcon(selectedManutencao.tipoplat)}
                                    <Typography variant="body1" fontWeight="medium">
                                        Máquina #{selectedManutencao.maquinaid}
                                    </Typography>
                                </Box>
                            </Box>

                            <Box>
                                <Typography variant="caption" color="text.secondary">
                                    Plataforma
                                </Typography>
                                <Typography variant="body1" fontWeight="medium">
                                    {selectedManutencao.nomeplat} ({getTipoNome(selectedManutencao.tipoplat)})
                                </Typography>
                            </Box>

                            <Box>
                                <Typography variant="caption" color="text.secondary">
                                    Responsável
                                </Typography>
                                <Typography variant="body1" fontWeight="medium">
                                    {selectedManutencao.nomefuncionario}
                                </Typography>
                            </Box>

                            <Box>
                                <Typography variant="caption" color="text.secondary">
                                    Data e Hora
                                </Typography>
                                <Typography variant="body1" fontWeight="medium">
                                    {formatDateTime(selectedManutencao.manutencaodatatempoinicio)}
                                </Typography>
                            </Box>
                        </Box>
                    </Box>
                )}
            </Drawer>
        </Box>
    );
}