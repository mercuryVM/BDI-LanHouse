import type { UserData, Pacote, Cliente, PacoteInfo } from "../../../API/APIClient";
import type APIClient from "../../../API/APIClient";
import { useEffect, useState, useMemo } from "react";
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
    Fab,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Autocomplete,
    MenuItem,
    Select,
    FormControl,
    InputLabel,
    Alert,
    Snackbar,
} from "@mui/material";
import { 
    Search,
    AttachMoney,
    CardGiftcard,
    AccessTime,
    Computer,
    SportsEsports,
    SportsBasketball,
    Add,
    Close,
} from "@mui/icons-material";
import { motion, AnimatePresence } from "framer-motion";

export function Pacotes({ client }: { client: APIClient, userData: UserData | null }) {
    const [pacotes, setPacotes] = useState<Pacote[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState("");
    const [tipoFilter, setTipoFilter] = useState<'vip' | 'ordinario' | null>(null);
    
    // Modal states
    const [openModal, setOpenModal] = useState(false);
    const [clientes, setClientes] = useState<Cliente[]>([]);
    const [pacotesDisponiveis, setPacotesDisponiveis] = useState<PacoteInfo[]>([]);
    const [selectedCliente, setSelectedCliente] = useState<Cliente | null>(null);
    const [selectedPacote, setSelectedPacote] = useState<number | null>(null);
    const [submitting, setSubmitting] = useState(false);
    const [isClienteNovo, setIsClienteNovo] = useState(false);
    
    // Snackbar states
    const [snackbar, setSnackbar] = useState<{
        open: boolean;
        message: string;
        severity: 'success' | 'error';
    }>({ open: false, message: '', severity: 'success' });

    useEffect(() => {
        const fetchPacotes = async () => {
            try {
                const data = await client.getAllClientePacotes();
                setPacotes(data);
            } catch (error) {
                console.error("Erro ao carregar pacotes:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchPacotes();
    }, [client]);

    useEffect(() => {
        const fetchData = async () => {
            if (openModal) {
                try {
                    const [clientesData, pacotesData] = await Promise.all([
                        client.getAllClientes(),
                        client.getAllPacotes()
                    ]);
                    setClientes(clientesData);
                    setPacotesDisponiveis(pacotesData as any);
                } catch (error) {
                    console.error("Erro ao carregar dados:", error);
                }
            }
        };

        fetchData();
    }, [openModal, client]);

    // Verificar se o cliente é novo quando selecionado
    useEffect(() => {
        const verificarCliente = async () => {
            if (selectedCliente) {
                try {
                    const result = await client.verificarClienteNovo(selectedCliente.cpf);
                    setIsClienteNovo(result.novo);
                } catch (error) {
                    console.error("Erro ao verificar cliente:", error);
                    setIsClienteNovo(false);
                }
            } else {
                setIsClienteNovo(false);
            }
        };

        verificarCliente();
    }, [selectedCliente, client]);

    const handleAddPacote = async () => {
        if (!selectedCliente || selectedPacote === null) {
            setSnackbar({
                open: true,
                message: 'Selecione um cliente e um pacote',
                severity: 'error'
            });
            return;
        }

        setSubmitting(true);
        try {
            const response = await client.createClientePacote(
                selectedCliente.cpf,
                selectedPacote
            );

            if (response.success) {
                setSnackbar({
                    open: true,
                    message: 'Pacote adicionado com sucesso!',
                    severity: 'success'
                });
                
                // Recarregar pacotes
                const data = await client.getAllClientePacotes();
                setPacotes(data);
                
                // Fechar modal e limpar seleções
                setOpenModal(false);
                setSelectedCliente(null);
                setSelectedPacote(null);
            } else {
                setSnackbar({
                    open: true,
                    message: response.message || 'Erro ao adicionar pacote',
                    severity: 'error'
                });
            }
        } catch (error: any) {
            setSnackbar({
                open: true,
                message: error.message || 'Erro ao adicionar pacote',
                severity: 'error'
            });
        } finally {
            setSubmitting(false);
        }
    };

    // Determina o tipo do pacote
    const getPacoteTipo = (pacote: Pacote): 'vip' | 'ordinario' => {
        return pacote.tempoadicionar !== null ? 'vip' : 'ordinario';
    };

    // Calcula o preço com desconto se cliente novo
    const calcularPrecoFinal = (preco: number): number => {
        if (isClienteNovo) {
            return preco * 0.9; // 10% de desconto
        }
        return preco;
    };

    // Estatísticas
    const stats = useMemo(() => {
        const total = pacotes.length;
        const vip = pacotes.filter(p => getPacoteTipo(p) === 'vip').length;
        const ordinarios = pacotes.filter(p => getPacoteTipo(p) === 'ordinario').length;
        const receitaTotal = pacotes.reduce((sum, p) => sum + Number(p.preco), 0);
        const precoMedio = total > 0 ? receitaTotal / total : 0;

        // Clientes únicos
        const clientesUnicos = new Set(pacotes.map(p => p.cpf)).size;

        return { total, vip, ordinarios, precoMedio, receitaTotal, clientesUnicos };
    }, [pacotes]);

    // Filtra pacotes
    const filteredPacotes = useMemo(() => {
        return pacotes.filter(pacote => {
            const searchLower = searchQuery.toLowerCase();
            const matchesSearch = 
                pacote.pacnome.toLowerCase().includes(searchLower) ||
                pacote.clinome.toLowerCase().includes(searchLower) ||
                pacote.cpf.includes(searchQuery);
            const tipo = getPacoteTipo(pacote);
            const matchesTipo = tipoFilter === null || tipo === tipoFilter;
            
            return matchesSearch && matchesTipo;
        });
    }, [pacotes, searchQuery, tipoFilter]);

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
                    Pacotes
                </Typography>
            </motion.div>

            {/* Stats Cards */}
            <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1, duration: 0.4 }}
            >
                <Box display="flex" gap={2} mb={3} flexWrap="wrap">
                    <Card sx={{ flex: '1 1 150px' }}>
                        <CardContent sx={{ textAlign: 'center', py: 2 }}>
                            <Typography variant="h4">{stats.total}</Typography>
                            <Typography variant="body2" color="text.secondary">Vendas</Typography>
                        </CardContent>
                    </Card>
                    <Card sx={{ flex: '1 1 150px' }}>
                        <CardContent sx={{ textAlign: 'center', py: 2 }}>
                            <Typography variant="h4" color="secondary">{stats.vip}</Typography>
                            <Typography variant="body2" color="text.secondary">VIP</Typography>
                        </CardContent>
                    </Card>
                    <Card sx={{ flex: '1 1 150px' }}>
                        <CardContent sx={{ textAlign: 'center', py: 2 }}>
                            <Typography variant="h4" color="primary">{stats.ordinarios}</Typography>
                            <Typography variant="body2" color="text.secondary">Ordinários</Typography>
                        </CardContent>
                    </Card>
                    <Card sx={{ flex: '1 1 150px' }}>
                        <CardContent sx={{ textAlign: 'center', py: 2 }}>
                            <Typography variant="h4">{stats.clientesUnicos}</Typography>
                            <Typography variant="body2" color="text.secondary">Clientes</Typography>
                        </CardContent>
                    </Card>
                    <Card sx={{ flex: '1 1 180px' }}>
                        <CardContent sx={{ textAlign: 'center', py: 2 }}>
                            <Typography variant="h4" color="success.main">
                                R$ {Number(stats.receitaTotal).toFixed(2)}
                            </Typography>
                            <Typography variant="body2" color="text.secondary">Receita Total</Typography>
                        </CardContent>
                    </Card>
                    <Card sx={{ flex: '1 1 180px' }}>
                        <CardContent sx={{ textAlign: 'center', py: 2 }}>
                            <Typography variant="h4">R$ {Number(stats.precoMedio).toFixed(2)}</Typography>
                            <Typography variant="body2" color="text.secondary">Ticket Médio</Typography>
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
                    placeholder="Buscar por cliente, pacote ou CPF..."
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
                    <ToggleButtonGroup
                        value={tipoFilter}
                        exclusive
                        onChange={(_e, value) => setTipoFilter(value)}
                        size="small"
                    >
                        <ToggleButton value="vip">
                            <CardGiftcard fontSize="small" sx={{ mr: 0.5 }} /> VIP
                        </ToggleButton>
                        <ToggleButton value="ordinario">
                            <AccessTime fontSize="small" sx={{ mr: 0.5 }} /> Ordinário
                        </ToggleButton>
                    </ToggleButtonGroup>

                    <Box flex={1} />

                    <Typography variant="body2" color="text.secondary">
                        {filteredPacotes.length} pacote{filteredPacotes.length !== 1 ? 's' : ''}
                    </Typography>

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

            {/* Tabela */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4, duration: 0.5 }}
                style={{ marginTop: 16, flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}
            >
                <TableContainer component={Paper} sx={{ borderRadius: 2, boxShadow: 3, flex: 1, overflow: 'auto' }}>
                    <Table sx={{ minWidth: 650 }} stickyHeader>
                        <TableHead>
                            <TableRow>
                                <TableCell>Cliente</TableCell>
                                <TableCell>Pacote</TableCell>
                                <TableCell align="center">Tipo</TableCell>
                                <TableCell align="center">Data</TableCell>
                                <TableCell align="right">Preço</TableCell>
                                <TableCell>Detalhes</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {filteredPacotes.map((pacote, index) => {
                                const isVip = getPacoteTipo(pacote) === 'vip';
                                const dataCompra = new Date(pacote.datatempo);
                                return (
                                    <TableRow
                                        key={pacote.pacid + "" + pacote.cpf + pacote.datatempo}
                                        component={motion.tr}
                                        initial={{ opacity: 0, x: -20 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        transition={{ delay: index * 0.05, duration: 0.3 }}
                                        sx={{ 
                                            '&:last-child td, &:last-child th': { border: 0 },
                                            cursor: 'pointer'
                                        }}
                                        hover
                                    >
                                        <TableCell>
                                            <Box>
                                                <Typography variant="body2" fontWeight="bold">
                                                    {pacote.clinome}
                                                </Typography>
                                                <Typography variant="caption" color="text.secondary">
                                                    {pacote.cpf}
                                                </Typography>
                                            </Box>
                                        </TableCell>
                                        <TableCell>
                                            <Typography variant="body2" fontWeight="bold">
                                                {pacote.pacnome}
                                            </Typography>
                                        </TableCell>
                                        <TableCell align="center">
                                            <Chip 
                                                icon={isVip ? <CardGiftcard /> : <AccessTime />}
                                                label={isVip ? 'VIP' : 'Ordinário'} 
                                                size="small" 
                                                color={isVip ? 'secondary' : 'primary'}
                                                variant="outlined"
                                            />
                                        </TableCell>
                                        <TableCell align="center">
                                            <Typography variant="body2">
                                                {dataCompra.toLocaleDateString('pt-BR')}
                                            </Typography>
                                            <Typography variant="caption" color="text.secondary">
                                                {dataCompra.toLocaleTimeString('pt-BR', { 
                                                    hour: '2-digit', 
                                                    minute: '2-digit' 
                                                })}
                                            </Typography>
                                        </TableCell>
                                        <TableCell align="right">
                                            <Box display="flex" alignItems="center" justifyContent="flex-end" gap={0.5}>
                                                <AttachMoney fontSize="small" color="success" />
                                                <Typography variant="body2" fontWeight="bold" color="success.main">
                                                    R$ {Number(pacote.preco).toFixed(2)}
                                                </Typography>
                                            </Box>
                                        </TableCell>
                                        <TableCell>
                                            {isVip ? (
                                                <Chip
                                                    label={`+${pacote.tempoadicionar} dias VIP`}
                                                    size="small"
                                                    color="secondary"
                                                />
                                            ) : (
                                                <Box display="flex" gap={0.5} flexWrap="wrap">
                                                    {pacote.tempocomputador !== undefined && pacote.tempocomputador !== null && (
                                                        <Chip
                                                            icon={<Computer sx={{ fontSize: 14 }} />}
                                                            label={`${pacote.tempocomputador}`}
                                                            size="small"
                                                        />
                                                    )}
                                                    {pacote.tempoconsole !== undefined && pacote.tempoconsole !== null && (
                                                        <Chip
                                                            icon={<SportsEsports sx={{ fontSize: 14 }} />}
                                                            label={`${pacote.tempoconsole}`}
                                                            size="small"
                                                        />
                                                    )}
                                                    {pacote.temposimulador !== undefined && pacote.temposimulador !== null && (
                                                        <Chip
                                                            icon={<SportsBasketball sx={{ fontSize: 14 }} />}
                                                            label={`${pacote.temposimulador}`}
                                                            size="small"
                                                        />
                                                    )}
                                                </Box>
                                            )}
                                        </TableCell>
                                    </TableRow>
                                );
                            })}
                            {filteredPacotes.length === 0 && (
                                <TableRow>
                                    <TableCell colSpan={5}>
                                        <Box textAlign="center" py={4}>
                                            <Typography variant="h6" color="text.secondary">
                                                Nenhum pacote encontrado
                                            </Typography>
                                        </Box>
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </TableContainer>
            </motion.div>

            {/* Botão Flutuante */}
            <Fab
                color="primary"
                aria-label="add"
                sx={{
                    position: 'fixed',
                    bottom: 16,
                    right: 16,
                }}
                onClick={() => setOpenModal(true)}
            >
                <Add />
            </Fab>

            {/* Modal de Adicionar Pacote */}
            <Dialog 
                open={openModal} 
                onClose={() => setOpenModal(false)}
                maxWidth="sm"
                fullWidth
            >
                <DialogTitle>
                    <Box display="flex" justifyContent="space-between" alignItems="center">
                        Adicionar Pacote
                        <Button onClick={() => setOpenModal(false)} sx={{ minWidth: 'auto' }}>
                            <Close />
                        </Button>
                    </Box>
                </DialogTitle>
                <DialogContent>
                    <Box display="flex" flexDirection="column" gap={3} pt={1}>
                        {/* Autocomplete para Cliente */}
                        <Autocomplete
                            options={clientes}
                            getOptionLabel={(option) => `${option.loginacesso} (${option.cpf})`}
                            value={selectedCliente}
                            onChange={(_e, newValue) => setSelectedCliente(newValue)}
                            renderInput={(params) => (
                                <TextField
                                    {...params}
                                    label="Cliente"
                                    placeholder="Buscar por nome ou CPF..."
                                    required
                                />
                            )}
                            filterOptions={(options, state) => {
                                const inputValue = state.inputValue.toLowerCase();
                                return options.filter(
                                    (option) =>
                                        option.nome.toLowerCase().includes(inputValue) ||
                                        option.cpf.includes(inputValue)
                                );
                            }}
                        />

                        {/* Select para Pacote */}
                        <FormControl fullWidth required>
                            <InputLabel>Pacote</InputLabel>
                            <Select
                                value={selectedPacote ?? ''}
                                onChange={(e) => setSelectedPacote(e.target.value as number)}
                                label="Pacote"
                            >
                                {pacotesDisponiveis.map((pacote) => (
                                    <MenuItem key={pacote.id} value={pacote.id}>
                                        <Box display="flex" justifyContent="space-between" width="100%">
                                            <Box>
                                                <Typography variant="body2" fontWeight="bold">
                                                    {pacote.nome}
                                                </Typography>
                                                <Typography variant="caption" color="text.secondary">
                                                    {pacote.tempoadicionar
                                                        ? `+${pacote.tempoadicionar} dias VIP`
                                                        : [
                                                            pacote.tempocomputador && `PC: ${pacote.tempocomputador}h`,
                                                            pacote.tempoconsole && `Console: ${pacote.tempoconsole}h`,
                                                            pacote.temposimulador && `Simulador: ${pacote.temposimulador}h`,
                                                        ]
                                                            .filter(Boolean)
                                                            .join(' | ')}
                                                </Typography>
                                            </Box>
                                            <Typography variant="body2" fontWeight="bold" color="success.main">
                                                R$ {Number(pacote.preco).toFixed(2)}
                                            </Typography>
                                        </Box>
                                    </MenuItem>
                                ))}
                            </Select>
                        </FormControl>

                        {/* Preço Estimado */}
                        {selectedPacote !== null && (
                            <Card variant="outlined">
                                <CardContent>
                                    <Box display="flex" flexDirection="column" gap={1.5}>
                                        {/* Preço Original */}
                                        <Box display="flex" justifyContent="space-between" alignItems="center">
                                            <Typography variant="body2" color="text.secondary">
                                                Preço Base
                                            </Typography>
                                            <Typography 
                                                variant="body2" 
                                                fontWeight="medium"
                                                sx={{ 
                                                    textDecoration: isClienteNovo ? 'line-through' : 'none',
                                                    color: isClienteNovo ? 'text.secondary' : 'text.primary'
                                                }}
                                            >
                                                R${' '}
                                                {Number(
                                                    pacotesDisponiveis.find((p) => p.id === selectedPacote)
                                                        ?.preco ?? 0
                                                ).toFixed(2)}
                                            </Typography>
                                        </Box>

                                        {/* Badge de Cliente Novo */}
                                        {isClienteNovo && (
                                            <Box>
                                                <Chip
                                                    label="Cliente Novo - 10% OFF"
                                                    size="small"
                                                    color="secondary"
                                                    sx={{ fontWeight: 'bold' }}
                                                />
                                            </Box>
                                        )}

                                        {/* Preço Final */}
                                        <Box 
                                            display="flex" 
                                            justifyContent="space-between" 
                                            alignItems="center"
                                            sx={{ 
                                                pt: 1.5, 
                                                borderTop: '1px solid',
                                                borderColor: 'divider'
                                            }}
                                        >
                                            <Typography variant="body1" fontWeight="bold">
                                                Preço Total
                                            </Typography>
                                            <Box display="flex" alignItems="center" gap={0.5}>
                                                <AttachMoney fontSize="small" color="success" />
                                                <Typography variant="h6" fontWeight="bold" color="success.main">
                                                    R${' '}
                                                    {calcularPrecoFinal(
                                                        Number(
                                                            pacotesDisponiveis.find((p) => p.id === selectedPacote)
                                                                ?.preco ?? 0
                                                        )
                                                    ).toFixed(2)}
                                                </Typography>
                                            </Box>
                                        </Box>
                                    </Box>
                                </CardContent>
                            </Card>
                        )}
                    </Box>
                </DialogContent>
                <DialogActions sx={{ p: 2.5, pt: 0 }}>
                    <Button onClick={() => setOpenModal(false)} disabled={submitting}>
                        Cancelar
                    </Button>
                    <Button
                        variant="contained"
                        onClick={handleAddPacote}
                        disabled={!selectedCliente || selectedPacote === null || submitting}
                        startIcon={submitting ? <CircularProgress size={20} /> : <Add />}
                    >
                        {submitting ? 'Adicionando...' : 'Adicionar'}
                    </Button>
                </DialogActions>
            </Dialog>

            {/* Snackbar */}
            <Snackbar
                open={snackbar.open}
                autoHideDuration={4000}
                onClose={() => setSnackbar({ ...snackbar, open: false })}
                anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
            >
                <Alert
                    onClose={() => setSnackbar({ ...snackbar, open: false })}
                    severity={snackbar.severity}
                    variant="filled"
                >
                    {snackbar.message}
                </Alert>
            </Snackbar>
        </Box>
    );
}