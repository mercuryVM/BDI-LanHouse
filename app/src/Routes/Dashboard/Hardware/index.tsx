import { useEffect, useState, useMemo, useCallback } from "react";
import type { Hardware } from "../../../API/APIClient";
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
    ToggleButtonGroup,
    ToggleButton,
    InputAdornment,
    Card,
    CardContent,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    IconButton,
    MenuItem,
    Select,
    FormControl,
    InputLabel,
    Alert,
    TablePagination
} from "@mui/material";
import { 
    Memory, 
    Search, 
    Inventory,
    Add,
    Edit,
    Delete,
    Close,
    Computer
} from "@mui/icons-material";
import { motion, AnimatePresence } from "framer-motion";

export function Hardware({ client }: { client: APIClient }) {
    const [hardwares, setHardwares] = useState<Hardware[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState("");
    const [tipoFilter, setTipoFilter] = useState<string | null>(null);
    const [estadoFilter, setEstadoFilter] = useState<string | null>(null);
    const [disponibilidadeFilter, setDisponibilidadeFilter] = useState<string | null>(null);
    const [stats, setStats] = useState<any>(null);
    const [tipos, setTipos] = useState<string[]>([]);
    const [estados, setEstados] = useState<string[]>([]);
    
    // Paginação
    const [page, setPage] = useState(0);
    const [rowsPerPage, setRowsPerPage] = useState(25);
    
    // Dialogs
    const [createDialogOpen, setCreateDialogOpen] = useState(false);
    const [editDialogOpen, setEditDialogOpen] = useState(false);
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [selectedHardware, setSelectedHardware] = useState<Hardware | null>(null);
    
    // Form data
    const [formData, setFormData] = useState({ nome: '', tipo: '', estado: 'ativo' });

    useEffect(() => {
        fetchAll();
    }, [tipoFilter, estadoFilter, disponibilidadeFilter]); // Carrega apenas uma vez na montagem

    // Aplica filtros no frontend ao invés de refazer requests
    useEffect(() => {
        if (hardwares.length === 0) return;
        // Filtros são aplicados via useMemo abaixo
    }, [tipoFilter, estadoFilter, disponibilidadeFilter]);

    const fetchAll = async () => {
        setLoading(true);
        try {
            // Busca tudo sem filtros - filtros aplicados no frontend
            const [hardwaresData, statsData, tiposData, estadosData] = await Promise.all([
                client.getAllHardwares({}),
                client.getEstoqueStats(),
                client.getTiposHardware(),
                client.getEstadosHardware()
            ]);

            setHardwares(hardwaresData);
            setStats(statsData);
            setTipos(tiposData);
            setEstados(estadosData);
        } catch (error) {
            console.error("Erro ao carregar dados:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleCreate = useCallback(async () => {
        if (!formData.nome || !formData.tipo) return;

        try {
            await client.createHardware(formData);
            setCreateDialogOpen(false);
            setFormData({ nome: '', tipo: '', estado: 'ativo' });
            fetchAll();
        } catch (error) {
            console.error('Erro ao criar hardware:', error);
        }
    }, [formData, client]);

    const handleEdit = useCallback(async () => {
        if (!selectedHardware || !formData.nome || !formData.tipo) return;

        try {
            await client.updateHardware(selectedHardware.hardwareid!, formData);
            setEditDialogOpen(false);
            setSelectedHardware(null);
            setFormData({ nome: '', tipo: '', estado: 'ativo' });
            fetchAll();
        } catch (error) {
            console.error('Erro ao atualizar hardware:', error);
        }
    }, [selectedHardware, formData, client]);

    const handleDelete = useCallback(async () => {
        if (!selectedHardware) return;

        try {
            await client.deleteHardware(selectedHardware.hardwareid!);
            setDeleteDialogOpen(false);
            setSelectedHardware(null);
            fetchAll();
        } catch (error) {
            console.error('Erro ao deletar hardware:', error);
        }
    }, [selectedHardware, client]);

    const openEditDialog = useCallback((hardware: Hardware) => {
        setSelectedHardware(hardware);
        setFormData({
            nome: hardware.hardwarenome || '',
            tipo: hardware.hardwaretipo || '',
            estado: hardware.hardwareestado || 'ativo'
        });
        setEditDialogOpen(true);
    }, []);

    const openDeleteDialog = useCallback((hardware: Hardware) => {
        setSelectedHardware(hardware);
        setDeleteDialogOpen(true);
    }, []);

    const handleChangePage = useCallback((_event: unknown, newPage: number) => {
        setPage(newPage);
    }, []);

    const handleChangeRowsPerPage = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
        setRowsPerPage(parseInt(event.target.value, 10));
        setPage(0);
    }, []);

    const filteredHardwares = useMemo(() => {
        let filtered = [...hardwares];

        // Filtro de tipo
        if (tipoFilter) {
            filtered = filtered.filter(hw => hw.hardwaretipo === tipoFilter);
        }

        // Filtro de estado
        if (estadoFilter) {
            filtered = filtered.filter(hw => hw.hardwareestado === estadoFilter);
        }

        // Filtro de disponibilidade
        if (disponibilidadeFilter === 'true') {
            filtered = filtered.filter(hw => !hw.maquinaid);
        } else if (disponibilidadeFilter === 'false') {
            filtered = filtered.filter(hw => !!hw.maquinaid);
        }

        // Filtro de busca
        if (searchQuery) {
            const lowerQuery = searchQuery.toLowerCase();
            filtered = filtered.filter(hw => 
                hw.hardwarenome?.toLowerCase().includes(lowerQuery) ||
                hw.hardwaretipo?.toLowerCase().includes(lowerQuery)
            );
        }

        return filtered;
    }, [hardwares, searchQuery, tipoFilter, estadoFilter, disponibilidadeFilter]);

    // Paginação aplicada aos resultados filtrados
    const paginatedHardwares = useMemo(() => {
        const startIndex = page * rowsPerPage;
        return filteredHardwares.slice(startIndex, startIndex + rowsPerPage);
    }, [filteredHardwares, page, rowsPerPage]);

    if (loading && !stats) {
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
                <Typography variant="h4" component="h1" gutterBottom>
                    <Inventory sx={{ fontSize: 32, verticalAlign: "middle", mr: 1 }} />
                    Estoque de Hardware
                </Typography>

                {/* Cards de Estatísticas */}
                {stats && (
                    <Box display="flex" gap={2} flexWrap="wrap" sx={{ mb: 3 }}>
                            <Card sx={{ flex: '1 1 150px' }}>
                                <CardContent sx={{ textAlign: 'center', py: 2 }}>
                                    <Typography variant="h4" color="primary">{stats.total}</Typography>
                                    <Typography variant="body2" color="text.secondary">Total</Typography>
                                </CardContent>
                            </Card>
                            <Card sx={{ flex: '1 1 150px' }}>
                                <CardContent sx={{ textAlign: 'center', py: 2 }}>
                                    <Typography variant="h4" color="success.main">{stats.disponiveis}</Typography>
                                    <Typography variant="body2" color="text.secondary">Disponíveis</Typography>
                                </CardContent>
                            </Card>
                            <Card sx={{ flex: '1 1 150px' }}>
                                <CardContent sx={{ textAlign: 'center', py: 2 }}>
                                    <Typography variant="h4" color="warning.main">{stats.em_uso}</Typography>
                                    <Typography variant="body2" color="text.secondary">Em Uso</Typography>
                                </CardContent>
                            </Card>
                        </Box>
                )}

                {/* Barra de Busca */}
                <TextField
                    fullWidth
                    size="small"
                    placeholder="Buscar por nome ou tipo..."
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

                {/* Filtros */}
                <Box display="flex" gap={2} flexWrap="wrap" alignItems="center">
                        {/* Filtro de Disponibilidade */}
                        <ToggleButtonGroup
                            value={disponibilidadeFilter}
                            exclusive
                            onChange={(_e, value) => setDisponibilidadeFilter(value)}
                            size="small"
                        >
                            <ToggleButton value="true">
                                <Inventory fontSize="small" sx={{ mr: 0.5 }} /> Estoque
                            </ToggleButton>
                            <ToggleButton value="false">
                                <Computer fontSize="small" sx={{ mr: 0.5 }} /> Em Uso
                            </ToggleButton>
                        </ToggleButtonGroup>

                        {/* Filtro de Tipo */}
                        {tipos.length > 0 && (
                            <FormControl size="small" sx={{ minWidth: 150 }}>
                                <InputLabel>Tipo</InputLabel>
                                <Select
                                    value={tipoFilter || ''}
                                    label="Tipo"
                                    onChange={(e) => setTipoFilter(e.target.value || null)}
                                >
                                    <MenuItem value="">Todos</MenuItem>
                                    {tipos.map(tipo => (
                                        <MenuItem key={tipo} value={tipo}>{tipo}</MenuItem>
                                    ))}
                                </Select>
                            </FormControl>
                        )}

                        {/* Filtro de Estado */}
                        {estados.length > 0 && (
                            <FormControl size="small" sx={{ minWidth: 150 }}>
                                <InputLabel>Estado</InputLabel>
                                <Select
                                    value={estadoFilter || ''}
                                    label="Estado"
                                    onChange={(e) => setEstadoFilter(e.target.value || null)}
                                >
                                    <MenuItem value="">Todos</MenuItem>
                                    {estados.map(estado => (
                                        <MenuItem key={estado} value={estado}>{estado}</MenuItem>
                                    ))}
                                </Select>
                            </FormControl>
                        )}

                        <Box flex={1} />

                        {/* Botão Adicionar */}
                        <Button
                            variant="contained"
                            startIcon={<Add />}
                            onClick={() => setCreateDialogOpen(true)}
                        >
                            Novo Hardware
                        </Button>

                        {/* Contador */}
                        <Typography variant="body2" color="text.secondary">
                            {filteredHardwares.length} hardware{filteredHardwares.length !== 1 ? 's' : ''}
                        </Typography>

                        {/* Botão Limpar */}
                        <AnimatePresence>
                            {(searchQuery || tipoFilter || estadoFilter || disponibilidadeFilter) && (
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
                                            setEstadoFilter(null);
                                            setDisponibilidadeFilter(null);
                                        }}
                                    >
                                        Limpar
                                    </Button>
                                </motion.div>
                            )}
                        </AnimatePresence>
                </Box>
            </Box>

            {/* Tabela */}
            <Box sx={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
                <TableContainer component={Paper} sx={{ borderRadius: 2, boxShadow: 3, flex: 1, overflow: 'auto' }}>
                    <Table sx={{ minWidth: 650 }} stickyHeader>
                        <TableHead>
                            <TableRow>
                                <TableCell>ID</TableCell>
                                <TableCell>Nome</TableCell>
                                <TableCell>Tipo</TableCell>
                                <TableCell>Estado</TableCell>
                                <TableCell>Status</TableCell>
                                <TableCell>Máquina</TableCell>
                                <TableCell align="center">Ações</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {paginatedHardwares.map((hardware) => (
                                <TableRow
                                    key={hardware.hardwareid}
                                    hover
                                    sx={{ '&:last-child td, &:last-child th': { border: 0 } }}
                                >
                                    <TableCell>#{hardware.hardwareid}</TableCell>
                                    <TableCell>
                                        <Box display="flex" alignItems="center" gap={1}>
                                            <Memory color="primary" />
                                            <Typography variant="body2" fontWeight="bold">
                                                {hardware.hardwarenome}
                                            </Typography>
                                        </Box>
                                    </TableCell>
                                    <TableCell>
                                        <Chip label={hardware.hardwaretipo} size="small" variant="outlined" />
                                    </TableCell>
                                    <TableCell>
                                        <Chip 
                                            label={hardware.hardwareestado} 
                                            size="small" 
                                            color={
                                                hardware.hardwareestado === 'ativo' ? 'success' : 
                                                hardware.hardwareestado === 'quebrado' ? 'error' : 
                                                'default'
                                            }
                                        />
                                    </TableCell>
                                    <TableCell>
                                        <Chip 
                                            label={hardware.maquinaid ? 'Em Uso' : 'Estoque'} 
                                            size="small" 
                                            color={hardware.maquinaid ? 'warning' : 'success'}
                                            variant={hardware.maquinaid ? 'filled' : 'outlined'}
                                        />
                                    </TableCell>
                                    <TableCell>
                                        {hardware.maquinaid ? (
                                            <Typography variant="body2">
                                                {hardware.nomeplat || `Máquina #${hardware.maquinaid}`}
                                            </Typography>
                                        ) : (
                                            <Typography variant="body2" color="text.secondary">-</Typography>
                                        )}
                                    </TableCell>
                                    <TableCell align="center">
                                        <IconButton
                                            size="small"
                                            onClick={() => openEditDialog(hardware)}
                                            color="primary"
                                        >
                                            <Edit fontSize="small" />
                                        </IconButton>
                                        <IconButton
                                            size="small"
                                            onClick={() => openDeleteDialog(hardware)}
                                            color="error"
                                            disabled={!!hardware.maquinaid}
                                        >
                                            <Delete fontSize="small" />
                                        </IconButton>
                                    </TableCell>
                                </TableRow>
                            ))}
                            {filteredHardwares.length === 0 && (
                                <TableRow>
                                    <TableCell colSpan={7}>
                                        <Box textAlign="center" py={4}>
                                            <Typography variant="h6" color="text.secondary">
                                                Nenhum hardware encontrado
                                            </Typography>
                                        </Box>
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </TableContainer>

                {/* Paginação */}
                <TablePagination
                    component="div"
                    count={filteredHardwares.length}
                    page={page}
                    onPageChange={handleChangePage}
                    rowsPerPage={rowsPerPage}
                    onRowsPerPageChange={handleChangeRowsPerPage}
                    rowsPerPageOptions={[10, 25, 50, 100]}
                    labelRowsPerPage="Linhas por página:"
                    labelDisplayedRows={({ from, to, count }) => `${from}–${to} de ${count}`}
                />
            </Box>

            {/* Dialog Criar */}
            <Dialog open={createDialogOpen} onClose={() => setCreateDialogOpen(false)} maxWidth="sm" fullWidth>
                <DialogTitle>Novo Hardware</DialogTitle>
                <DialogContent>
                    <Box display="flex" flexDirection="column" gap={2} mt={2}>
                        <TextField
                            label="Nome do Hardware"
                            value={formData.nome}
                            onChange={(e) => setFormData(prev => ({ ...prev, nome: e.target.value }))}
                            fullWidth
                            required
                            autoComplete="off"
                        />
                        <FormControl fullWidth required>
                            <InputLabel>Tipo</InputLabel>
                            <Select
                                value={formData.tipo}
                                label="Tipo"
                                onChange={(e) => setFormData(prev => ({ ...prev, tipo: e.target.value }))}
                            >
                                {tipos.map(tipo => (
                                    <MenuItem key={tipo} value={tipo}>{tipo}</MenuItem>
                                ))}
                            </Select>
                        </FormControl>
                        <FormControl fullWidth>
                            <InputLabel>Estado</InputLabel>
                            <Select
                                value={formData.estado}
                                label="Estado"
                                onChange={(e) => setFormData(prev => ({ ...prev, estado: e.target.value }))}
                            >
                                <MenuItem value="ativo">Ativo</MenuItem>
                                <MenuItem value="quebrado">Quebrado</MenuItem>
                                <MenuItem value="manutencao">Manutenção</MenuItem>
                            </Select>
                        </FormControl>
                    </Box>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => {
                        setCreateDialogOpen(false);
                        setFormData({ nome: '', tipo: '', estado: 'ativo' });
                    }}>
                        Cancelar
                    </Button>
                    <Button 
                        onClick={handleCreate}
                        variant="contained"
                        disabled={!formData.nome || !formData.tipo}
                    >
                        Criar
                    </Button>
                </DialogActions>
            </Dialog>

            {/* Dialog Editar */}
            <Dialog open={editDialogOpen} onClose={() => setEditDialogOpen(false)} maxWidth="sm" fullWidth>
                <DialogTitle>Editar Hardware</DialogTitle>
                <DialogContent>
                    <Box display="flex" flexDirection="column" gap={2} mt={2}>
                        <TextField
                            label="Nome do Hardware"
                            value={formData.nome}
                            onChange={(e) => setFormData(prev => ({ ...prev, nome: e.target.value }))}
                            fullWidth
                            required
                            autoComplete="off"
                        />
                        <FormControl fullWidth required>
                            <InputLabel>Tipo</InputLabel>
                            <Select
                                value={formData.tipo}
                                label="Tipo"
                                onChange={(e) => setFormData(prev => ({ ...prev, tipo: e.target.value }))}
                            >
                                {tipos.map(tipo => (
                                    <MenuItem key={tipo} value={tipo}>{tipo}</MenuItem>
                                ))}
                            </Select>
                        </FormControl>
                        <FormControl fullWidth>
                            <InputLabel>Estado</InputLabel>
                            <Select
                                value={formData.estado}
                                label="Estado"
                                onChange={(e) => setFormData(prev => ({ ...prev, estado: e.target.value }))}
                            >
                                <MenuItem value="ativo">Ativo</MenuItem>
                                <MenuItem value="quebrado">Quebrado</MenuItem>
                                <MenuItem value="manutencao">Manutenção</MenuItem>
                            </Select>
                        </FormControl>
                    </Box>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => {
                        setEditDialogOpen(false);
                        setSelectedHardware(null);
                        setFormData({ nome: '', tipo: '', estado: 'ativo' });
                    }}>
                        Cancelar
                    </Button>
                    <Button 
                        onClick={handleEdit}
                        variant="contained"
                        disabled={!formData.nome || !formData.tipo}
                    >
                        Salvar
                    </Button>
                </DialogActions>
            </Dialog>

            {/* Dialog Deletar */}
            <Dialog open={deleteDialogOpen} onClose={() => setDeleteDialogOpen(false)} maxWidth="sm" fullWidth>
                <DialogTitle>Confirmar Exclusão</DialogTitle>
                <DialogContent>
                    <Alert severity="warning" sx={{ mb: 2 }}>
                        Tem certeza que deseja deletar este hardware?
                    </Alert>
                    {selectedHardware && (
                        <Box>
                            <Typography variant="body1">
                                <strong>Nome:</strong> {selectedHardware.hardwarenome}
                            </Typography>
                            <Typography variant="body2">
                                <strong>Tipo:</strong> {selectedHardware.hardwaretipo}
                            </Typography>
                            <Typography variant="body2">
                                <strong>Estado:</strong> {selectedHardware.hardwareestado}
                            </Typography>
                        </Box>
                    )}
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => {
                        setDeleteDialogOpen(false);
                        setSelectedHardware(null);
                    }}>
                        Cancelar
                    </Button>
                    <Button 
                        onClick={handleDelete}
                        variant="contained"
                        color="error"
                    >
                        Deletar
                    </Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
}
