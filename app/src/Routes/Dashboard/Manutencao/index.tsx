import { useEffect, useState, useMemo } from "react";
import type { UserData, Manutencao, Maquina, Hardware } from "../../../API/APIClient";
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
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    FormControl,
    InputLabel,
    Select,
    MenuItem,
    Checkbox,
    FormControlLabel,
    List,
    ListItem,
    ListItemText,
    Divider,
    Alert,
    Snackbar,
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
    Add,
    Edit,
    Delete,
    Memory,
    Lock,
    LockOpen,
    Circle,
} from "@mui/icons-material";
import { motion, AnimatePresence } from "framer-motion";

export function Manutencao({ client, userData }: { client: APIClient, userData: UserData | null }) {
    const [manutencoes, setManutencoes] = useState<Manutencao[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState("");
    const [prioridadeFilter, setPrioridadeFilter] = useState<string | null>(null);
    const [tipoFilter, setTipoFilter] = useState<string | null>(null);
    const [periodoFilter, setPeriodoFilter] = useState<string | null>(null);
    const [statusFilter, setStatusFilter] = useState<string | null>(null);
    const [selectedManutencao, setSelectedManutencao] = useState<Manutencao | null>(null);
    
    // Estados para criar/editar manutenção
    const [openDialog, setOpenDialog] = useState(false);
    const [editMode, setEditMode] = useState(false);
    const [maquinas, setMaquinas] = useState<Maquina[]>([]);
    const [hardwaresList, setHardwaresList] = useState<Hardware[]>([]);
    
    // Estado para dialog de confirmação de exclusão
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [manutencaoToDelete, setManutencaoToDelete] = useState<number | null>(null);
    
    // Form data
    const [formData, setFormData] = useState({
        tipo: 'Preventiva',
        prioridade: 'Média',
        datatempoinicio: '',
        datatempofim: '',
        maquinaId: 0,
        hardwareIds: [] as number[],
        hardwares: [] as { hardwareId: number; motivo: string }[],
    });
    
    // Snackbar
    const [snackbar, setSnackbar] = useState({
        open: false,
        message: '',
        severity: 'success' as 'success' | 'error',
    });

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

    useEffect(() => {
        const fetchMaquinas = async () => {
            try {
                const data = await client.getAllMaquinas();
                setMaquinas(data);
            } catch (error) {
                console.error("Erro ao carregar máquinas:", error);
            }
        };
        fetchMaquinas();
    }, [client]);

    const loadHardwares = async (maquinaId: number) => {
        try {
            const hardwares = await client.getHardwaresByMaquina(maquinaId);
            setHardwaresList(hardwares);
        } catch (error) {
            console.error("Erro ao carregar hardwares:", error);
            setHardwaresList([]);
        }
    };

    const handleOpenDialog = (manutencao?: Manutencao) => {
        if (manutencao) {
            setEditMode(true);
            const maquinaId = manutencao.maquinas.length > 0 ? manutencao.maquinas[0].maquinaid : 0;
            setFormData({
                tipo: manutencao.manutencaotipo,
                prioridade: manutencao.manutencaoprioridade,
                datatempoinicio: new Date(manutencao.manutencaodatatempoinicio).toISOString().slice(0, 16),
                datatempofim: manutencao.manutencaodatatempofim ? new Date(manutencao.manutencaodatatempofim).toISOString().slice(0, 16) : '',
                maquinaId: maquinaId,
                hardwareIds: manutencao.hardwares.map(h => h.hardwareid),
                hardwares: manutencao.hardwares.map(h => ({
                    hardwareId: h.hardwareid,
                    motivo: h.motivo || ''
                })),
            });
            if (maquinaId > 0) {
                loadHardwares(maquinaId);
            }
            setSelectedManutencao(manutencao);
        } else {
            setEditMode(false);
            setFormData({
                tipo: 'Preventiva',
                prioridade: 'Média',
                datatempoinicio: '',
                datatempofim: '',
                maquinaId: 0,
                hardwareIds: [],
                hardwares: [],
            });
            setHardwaresList([]);
        }
        setOpenDialog(true);
    };

    const handleCloseDialog = () => {
        setOpenDialog(false);
        setEditMode(false);
        setFormData({
            tipo: 'Preventiva',
            prioridade: 'Média',
            datatempoinicio: '',
            datatempofim: '',
            maquinaId: 0,
            hardwareIds: [],
            hardwares: [],
        });
        setHardwaresList([]);
    };

    const handleSubmit = async () => {
        try {
            if (!userData?.cpf) {
                setSnackbar({
                    open: true,
                    message: 'Usuário não autenticado',
                    severity: 'error',
                });
                return;
            }

            if (formData.maquinaId === 0) {
                setSnackbar({
                    open: true,
                    message: 'Selecione uma máquina',
                    severity: 'error',
                });
                return;
            }

            // Validar que todos os hardwares selecionados tenham motivo
            if (!editMode && formData.hardwares.length > 0) {
                const hardwaresSemMotivo = formData.hardwares.filter(h => !h.motivo || h.motivo.trim() === '');
                if (hardwaresSemMotivo.length > 0) {
                    setSnackbar({
                        open: true,
                        message: 'Por favor, informe o motivo para todos os hardwares selecionados',
                        severity: 'error',
                    });
                    return;
                }
            }

            if (editMode && selectedManutencao) {
                await client.updateManutencao(selectedManutencao.manutencaoid, {
                    tipo: formData.tipo,
                    prioridade: formData.prioridade,
                    datatempoinicio: formData.datatempoinicio,
                    datatempofim: formData.datatempofim || undefined,
                });
                setSnackbar({
                    open: true,
                    message: 'Manutenção atualizada com sucesso!',
                    severity: 'success',
                });
            } else {
                await client.createManutencao({
                    tipo: formData.tipo,
                    prioridade: formData.prioridade,
                    datatempoinicio: formData.datatempoinicio,
                    datatempofim: formData.datatempofim || undefined,
                    maquinaId: formData.maquinaId,
                    agendadoPor: userData.cpf,
                    hardwares: formData.hardwares,
                });
                setSnackbar({
                    open: true,
                    message: 'Manutenção criada com sucesso!',
                    severity: 'success',
                });
            }

            handleCloseDialog();
            // Recarregar manutenções
            const query: any = {};
            if (prioridadeFilter) query.prioridade = prioridadeFilter;
            if (tipoFilter) query.tipo = tipoFilter;
            if (periodoFilter) query.periodo = periodoFilter;
            const data = await client.getManutencoes(query);
            setManutencoes(data);
        } catch (error: any) {
            console.error("Erro ao salvar manutenção:", error);
            setSnackbar({
                open: true,
                message: error.message || 'Erro ao salvar manutenção',
                severity: 'error',
            });
        }
    };

    const handleDeleteClick = (manutencaoId: number) => {
        setManutencaoToDelete(manutencaoId);
        setDeleteDialogOpen(true);
    };

    const handleDeleteConfirm = async () => {
        if (!manutencaoToDelete) return;

        try {
            await client.deleteManutencao(manutencaoToDelete);
            setSnackbar({
                open: true,
                message: 'Manutenção deletada com sucesso!',
                severity: 'success',
            });
            
            // Recarregar manutenções
            const query: any = {};
            if (prioridadeFilter) query.prioridade = prioridadeFilter;
            if (tipoFilter) query.tipo = tipoFilter;
            if (periodoFilter) query.periodo = periodoFilter;
            const data = await client.getManutencoes(query);
            setManutencoes(data);
        } catch (error: any) {
            console.error("Erro ao deletar manutenção:", error);
            setSnackbar({
                open: true,
                message: error.message || 'Erro ao deletar manutenção',
                severity: 'error',
            });
        } finally {
            setDeleteDialogOpen(false);
            setManutencaoToDelete(null);
        }
    };

    const handleMaquinaChange = (maquinaId: number) => {
        setFormData({ ...formData, maquinaId, hardwareIds: [], hardwares: [] });
        if (maquinaId > 0) {
            loadHardwares(maquinaId);
        } else {
            setHardwaresList([]);
        }
    };

    const handleHardwareToggle = (hardwareId: number) => {
        const currentHardwares = formData.hardwares;
        const exists = currentHardwares.find(h => h.hardwareId === hardwareId);
        
        if (exists) {
            // Remove hardware
            setFormData({
                ...formData,
                hardwares: currentHardwares.filter(h => h.hardwareId !== hardwareId),
                hardwareIds: formData.hardwareIds.filter(id => id !== hardwareId),
            });
        } else {
            // Adiciona hardware com motivo vazio
            setFormData({
                ...formData,
                hardwares: [...currentHardwares, { hardwareId, motivo: '' }],
                hardwareIds: [...formData.hardwareIds, hardwareId],
            });
        }
    };

    const handleHardwareMotivoChange = (hardwareId: number, motivo: string) => {
        setFormData({
            ...formData,
            hardwares: formData.hardwares.map(h => 
                h.hardwareId === hardwareId ? { ...h, motivo } : h
            ),
        });
    };

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

    const isManutencaoAberta = (manutencao: Manutencao) => {
        return !manutencao.manutencaodatatempofim;
    };

    const filteredManutencoes = useMemo(() => {
        return manutencoes.filter(manutencao => {
            const searchLower = searchQuery.toLowerCase();
            const maquinasStr = manutencao.maquinas.map(m => `${m.nomeplat} #${m.maquinaid}`).join(' ');
            const hardwaresStr = manutencao.hardwares.map(h => h.hardwarenome).join(' ');
            
            const matchesSearch = 
                manutencao.manutencaotipo.toLowerCase().includes(searchLower) ||
                manutencao.nomefuncionario.toLowerCase().includes(searchLower) ||
                maquinasStr.toLowerCase().includes(searchLower) ||
                hardwaresStr.toLowerCase().includes(searchLower) ||
                manutencao.manutencaoid.toString().includes(searchQuery);
            
            // Filtro de status (aberta/fechada)
            if (statusFilter === 'aberta' && !isManutencaoAberta(manutencao)) {
                return false;
            }
            if (statusFilter === 'fechada' && isManutencaoAberta(manutencao)) {
                return false;
            }
            
            return matchesSearch;
        });
    }, [manutencoes, searchQuery, statusFilter]);

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
                <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
                    <Typography variant="h4" sx={{ fontWeight: 'bold' }}>
                        <Build sx={{ mr: 1, verticalAlign: 'middle' }} />
                        Manutenções
                    </Typography>
                    <Button
                        variant="contained"
                        startIcon={<Add />}
                        onClick={() => handleOpenDialog()}
                        sx={{ borderRadius: 2 }}
                    >
                        Nova Manutenção
                    </Button>
                </Box>
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
                        <ToggleButton value="alta">
                            <ErrorIcon fontSize="small" sx={{ mr: 0.5 }} color="error" /> Alta
                        </ToggleButton>
                        <ToggleButton value="media">
                            <Warning fontSize="small" sx={{ mr: 0.5 }} color="warning" /> Média
                        </ToggleButton>
                        <ToggleButton value="baixa">
                            <CheckCircle fontSize="small" sx={{ mr: 0.5 }} color="success" /> Baixa
                        </ToggleButton>
                    </ToggleButtonGroup>

                    <ToggleButtonGroup
                        value={tipoFilter}
                        exclusive
                        onChange={(_e, value) => setTipoFilter(value)}
                        size="small"
                    >
                        <ToggleButton value="preventiva">Preventiva</ToggleButton>
                        <ToggleButton value="corretiva">Corretiva</ToggleButton>
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

                    <ToggleButtonGroup
                        value={statusFilter}
                        exclusive
                        onChange={(_e, value) => setStatusFilter(value)}
                        size="small"
                    >
                        <ToggleButton value="aberta">
                            <LockOpen fontSize="small" sx={{ mr: 0.5 }} color="warning" /> Abertas
                        </ToggleButton>
                        <ToggleButton value="fechada">
                            <Lock fontSize="small" sx={{ mr: 0.5 }} color="success" /> Fechadas
                        </ToggleButton>
                    </ToggleButtonGroup>

                    <Box flex={1} />

                    <Typography variant="body2" color="text.secondary">
                        {filteredManutencoes.length} manutenç{filteredManutencoes.length !== 1 ? 'ões' : 'ão'}
                    </Typography>

                    <AnimatePresence>
                        {(searchQuery || prioridadeFilter || tipoFilter || periodoFilter || statusFilter) && (
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
                                        setStatusFilter(null);
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
                                <TableCell>Máquinas Afetadas</TableCell>
                                <TableCell>Hardwares</TableCell>
                                <TableCell>Prioridade</TableCell>
                                <TableCell>Funcionário</TableCell>
                                <TableCell>Data/Hora</TableCell>
                                <TableCell align="center">Ações</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {filteredManutencoes.map((manutencao, index) => (
                                <TableRow
                                    key={manutencao.manutencaoid}
                                    component={motion.tr}
                                    initial={{ opacity: 0, x: -20 }}
                                    animate={{ 
                                        opacity: isManutencaoAberta(manutencao) ? 1 : 0.5, 
                                        x: 0 
                                    }}
                                    transition={{ delay: index * 0.05, duration: 0.3 }}
                                    hover
                                    onClick={() => setSelectedManutencao(manutencao)}
                                    sx={{ 
                                        '&:last-child td, &:last-child th': { border: 0 },
                                        cursor: 'pointer',
                                        ...(isManutencaoAberta(manutencao) ? {
                                            borderLeft: '4px solid',
                                            borderLeftColor: 'warning.main',
                                            backgroundColor: 'rgba(255, 152, 0, 0.08)',
                                        } : {
                                            '&:hover': {
                                                opacity: 0.8,
                                            }
                                        })
                                    }}
                                >
                                    <TableCell>
                                        <Box display="flex" alignItems="center" gap={1}>
                                            {isManutencaoAberta(manutencao) && (
                                                <Circle sx={{ fontSize: 12, color: 'warning.main' }} />
                                            )}
                                            <Typography variant="body2" fontWeight="bold">
                                                #{manutencao.manutencaoid}
                                            </Typography>
                                        </Box>
                                    </TableCell>
                                    <TableCell>
                                        <Box display="flex" alignItems="center" gap={1}>
                                            <Chip 
                                                label={manutencao.manutencaotipo}
                                                size="small"
                                                color={manutencao.manutencaotipo === 'Preventiva' ? 'primary' : 'secondary'}
                                            />
                                            {isManutencaoAberta(manutencao) ? (
                                                <Chip 
                                                    label="Em andamento"
                                                    size="small"
                                                    color="warning"
                                                    icon={<LockOpen />}
                                                />
                                            ) : (
                                                <Chip 
                                                    label="Concluída"
                                                    size="small"
                                                    color="success"
                                                    icon={<Lock />}
                                                    variant="outlined"
                                                />
                                            )}
                                        </Box>
                                    </TableCell>
                                    <TableCell>
                                        <Box display="flex" flexDirection="column" gap={0.5}>
                                            {manutencao.maquinas.length > 0 ? (
                                                manutencao.maquinas.map((maq, idx) => (
                                                    <Box key={idx} display="flex" alignItems="center" gap={1}>
                                                        {getTipoIcon(maq.tipoplat)}
                                                        <Typography variant="body2">
                                                            {maq.nomeplat} #{maq.maquinaid}
                                                        </Typography>
                                                    </Box>
                                                ))
                                            ) : (
                                                <Typography variant="body2" color="text.secondary">
                                                    Sem máquinas
                                                </Typography>
                                            )}
                                        </Box>
                                    </TableCell>
                                    <TableCell>
                                        <Box display="flex" flexDirection="column" gap={0.5}>
                                            {manutencao.hardwares.length > 0 ? (
                                                manutencao.hardwares.slice(0, 2).map((hw, idx) => (
                                                    <Chip 
                                                        key={idx}
                                                        label={hw.hardwarenome}
                                                        size="small"
                                                        icon={<Memory />}
                                                        variant="outlined"
                                                    />
                                                ))
                                            ) : (
                                                <Typography variant="body2" color="text.secondary">
                                                    Manutenção geral
                                                </Typography>
                                            )}
                                            {manutencao.hardwares.length > 2 && (
                                                <Typography variant="caption" color="text.secondary">
                                                    +{manutencao.hardwares.length - 2} mais
                                                </Typography>
                                            )}
                                        </Box>
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
                                    <TableCell align="center">
                                        <Box display="flex" gap={1} justifyContent="center">
                                            <IconButton
                                                size="small"
                                                color="primary"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    handleOpenDialog(manutencao);
                                                }}
                                                title="Editar"
                                            >
                                                <Edit fontSize="small" />
                                            </IconButton>
                                            <IconButton
                                                size="small"
                                                color="error"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    handleDeleteClick(manutencao.manutencaoid);
                                                }}
                                                title="Deletar"
                                            >
                                                <Delete fontSize="small" />
                                            </IconButton>
                                        </Box>
                                    </TableCell>
                                </TableRow>
                            ))}
                            {filteredManutencoes.length === 0 && (
                                <TableRow>
                                    <TableCell colSpan={8}>
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
                onClose={() => {
                    setSelectedManutencao(null);
                }}
                sx={{
                    '& .MuiDrawer-paper': {
                        width: 450,
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
                                    Máquinas Afetadas
                                </Typography>
                                <Box display="flex" flexDirection="column" gap={1} mt={0.5}>
                                    {selectedManutencao.maquinas.length > 0 ? (
                                        selectedManutencao.maquinas.map((maq, idx) => (
                                            <Box key={idx} display="flex" alignItems="center" gap={1}>
                                                {getTipoIcon(maq.tipoplat)}
                                                <Typography variant="body1" fontWeight="medium">
                                                    {maq.nomeplat} - Máquina #{maq.maquinaid} ({getTipoNome(maq.tipoplat)})
                                                </Typography>
                                            </Box>
                                        ))
                                    ) : (
                                        <Typography variant="body2" color="text.secondary">
                                            Nenhuma máquina registrada
                                        </Typography>
                                    )}
                                </Box>
                            </Box>

                            <Box>
                                <Typography variant="caption" color="text.secondary">
                                    Hardwares em Manutenção
                                </Typography>
                                <Box mt={1}>
                                    {selectedManutencao.hardwares.length > 0 ? (
                                        <List dense>
                                            {selectedManutencao.hardwares.map((hardware) => (
                                                <ListItem key={hardware.hardwareid} sx={{ px: 0 }}>
                                                    <ListItemText
                                                        primary={
                                                            <Box display="flex" alignItems="center" gap={1}>
                                                                <Memory fontSize="small" />
                                                                <Typography variant="body2" fontWeight="medium">
                                                                    {hardware.hardwarenome}
                                                                </Typography>
                                                            </Box>
                                                        }
                                                        secondary={
                                                            <Box display="flex" flexDirection="column" gap={1} mt={0.5}>
                                                                <Box display="flex" gap={1}>
                                                                    <Chip
                                                                        label={hardware.hardwaretipo}
                                                                        size="small"
                                                                        variant="outlined"
                                                                    />
                                                                    <Chip
                                                                        label={hardware.hardwareestado}
                                                                        size="small"
                                                                        color={hardware.hardwareestado === 'Operacional' ? 'success' : 'error'}
                                                                    />
                                                                </Box>
                                                                {hardware.motivo && (
                                                                    <Typography variant="caption" color="text.secondary" sx={{ fontStyle: 'italic' }}>
                                                                        <strong>Motivo:</strong> {hardware.motivo}
                                                                    </Typography>
                                                                )}
                                                            </Box>
                                                        }
                                                    />
                                                </ListItem>
                                            ))}
                                        </List>
                                    ) : (
                                        <Typography variant="body2" color="text.secondary">
                                            Manutenção geral (sem hardwares específicos)
                                        </Typography>
                                    )}
                                </Box>
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
                                    Data/Hora Início
                                </Typography>
                                <Typography variant="body1" fontWeight="medium">
                                    {formatDateTime(selectedManutencao.manutencaodatatempoinicio)}
                                </Typography>
                            </Box>

                            {selectedManutencao.manutencaodatatempofim && (
                                <Box>
                                    <Typography variant="caption" color="text.secondary">
                                        Data/Hora Fim
                                    </Typography>
                                    <Typography variant="body1" fontWeight="medium">
                                        {formatDateTime(selectedManutencao.manutencaodatatempofim)}
                                    </Typography>
                                </Box>
                            )}

                            <Divider sx={{ my: 2 }} />
                        </Box>
                    </Box>
                )}
            </Drawer>

            {/* Dialog para Criar/Editar Manutenção */}
            <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
                <DialogTitle>
                    {editMode ? 'Editar Manutenção' : 'Nova Manutenção'}
                </DialogTitle>
                <DialogContent>
                    <Box display="flex" flexDirection="column" gap={2} mt={1}>
                        <FormControl fullWidth>
                            <InputLabel>Tipo</InputLabel>
                            <Select
                                value={formData.tipo}
                                label="Tipo"
                                onChange={(e) => setFormData({ ...formData, tipo: e.target.value })}
                            >
                                <MenuItem value="preventiva">Preventiva</MenuItem>
                                <MenuItem value="corretiva">Corretiva</MenuItem>
                            </Select>
                        </FormControl>

                        <FormControl fullWidth>
                            <InputLabel>Prioridade</InputLabel>
                            <Select
                                value={formData.prioridade}
                                label="Prioridade"
                                onChange={(e) => setFormData({ ...formData, prioridade: e.target.value })}
                            >
                                <MenuItem value="baixa">Baixa</MenuItem>
                                <MenuItem value="media">Média</MenuItem>
                                <MenuItem value="alta">Alta</MenuItem>
                            </Select>
                        </FormControl>

                        <FormControl fullWidth>
                            <InputLabel>Máquina</InputLabel>
                            <Select
                                value={formData.maquinaId}
                                label="Máquina"
                                onChange={(e) => handleMaquinaChange(Number(e.target.value))}
                                disabled={editMode}
                            >
                                <MenuItem value={0}>Selecione uma máquina</MenuItem>
                                {maquinas.map((maquina) => (
                                    <MenuItem key={maquina.id} value={maquina.id}>
                                        Máquina #{maquina.id} - {maquina.nomeplat}
                                    </MenuItem>
                                ))}
                            </Select>
                        </FormControl>

                        <TextField
                            label="Data/Hora Início"
                            type="datetime-local"
                            fullWidth
                            value={formData.datatempoinicio}
                            onChange={(e) => setFormData({ ...formData, datatempoinicio: e.target.value })}
                            InputLabelProps={{ shrink: true }}
                        />

                        <TextField
                            label="Data/Hora Fim (opcional)"
                            type="datetime-local"
                            fullWidth
                            value={formData.datatempofim}
                            onChange={(e) => setFormData({ ...formData, datatempofim: e.target.value })}
                            InputLabelProps={{ shrink: true }}
                        />

                        {!editMode && hardwaresList.length > 0 && (
                            <Box>
                                <Typography variant="subtitle2" gutterBottom>
                                    Hardwares com problema (opcional):
                                </Typography>
                                <Box display="flex" flexDirection="column" gap={2}>
                                    {hardwaresList.map((hardware) => {
                                        const isSelected = formData.hardwareIds.includes(hardware.hardwareid);
                                        const hardwareData = formData.hardwares.find(h => h.hardwareId === hardware.hardwareid);
                                        
                                        return (
                                            <Box key={hardware.hardwareid}>
                                                <FormControlLabel
                                                    control={
                                                        <Checkbox
                                                            checked={isSelected}
                                                            onChange={() => handleHardwareToggle(hardware.hardwareid)}
                                                        />
                                                    }
                                                    label={`${hardware.hardwarenome} (${hardware.hardwaretipo})`}
                                                />
                                                {isSelected && (
                                                    <TextField
                                                        fullWidth
                                                        size="small"
                                                        label="Motivo do problema"
                                                        placeholder="Ex: Superaquecimento, não liga, ruído estranho..."
                                                        value={hardwareData?.motivo || ''}
                                                        onChange={(e) => handleHardwareMotivoChange(hardware.hardwareid, e.target.value)}
                                                        sx={{ mt: 1, ml: 4 }}
                                                        required
                                                    />
                                                )}
                                            </Box>
                                        );
                                    })}
                                </Box>
                            </Box>
                        )}
                    </Box>
                </DialogContent>
                <DialogActions>
                    <Button onClick={handleCloseDialog}>Cancelar</Button>
                    <Button onClick={handleSubmit} variant="contained">
                        {editMode ? 'Atualizar' : 'Criar'}
                    </Button>
                </DialogActions>
            </Dialog>

            {/* Dialog de confirmação de exclusão */}
            <Dialog
                open={deleteDialogOpen}
                onClose={() => setDeleteDialogOpen(false)}
                maxWidth="sm"
                fullWidth
            >
                <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <ErrorIcon color="error" />
                    <Typography variant="h6">Confirmar Exclusão</Typography>
                </DialogTitle>
                <DialogContent>
                    <Typography variant="body1" gutterBottom>
                        Tem certeza que deseja deletar esta manutenção?
                    </Typography>
                    <Alert severity="warning" sx={{ mt: 2 }}>
                        Esta ação não pode ser desfeita. Todos os registros de hardwares e informações associadas serão permanentemente removidos.
                    </Alert>
                </DialogContent>
                <DialogActions sx={{ p: 2 }}>
                    <Button 
                        onClick={() => setDeleteDialogOpen(false)}
                        variant="outlined"
                    >
                        Cancelar
                    </Button>
                    <Button 
                        onClick={handleDeleteConfirm}
                        variant="contained"
                        color="error"
                        startIcon={<Delete />}
                    >
                        Deletar
                    </Button>
                </DialogActions>
            </Dialog>

            {/* Snackbar para feedback */}
            <Snackbar
                open={snackbar.open}
                autoHideDuration={6000}
                onClose={() => setSnackbar({ ...snackbar, open: false })}
                anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
            >
                <Alert
                    onClose={() => setSnackbar({ ...snackbar, open: false })}
                    severity={snackbar.severity}
                    sx={{ width: '100%' }}
                >
                    {snackbar.message}
                </Alert>
            </Snackbar>
        </Box>
    );
}