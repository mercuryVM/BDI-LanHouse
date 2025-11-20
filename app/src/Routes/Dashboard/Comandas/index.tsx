import { useEffect, useState, useMemo } from "react";
import type { UserData } from "../../../API/APIClient";
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
    InputAdornment,
    Card,
    CardContent,
    Drawer,
    IconButton,
    Divider,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    FormControl,
    InputLabel,
    Select,
    MenuItem,
    Alert,
    Snackbar,
} from "@mui/material";
import { 
    Search, 
    Receipt,
    Close,
    Person,
    CalendarToday,
    AttachMoney,
    CheckCircle,
    HourglassEmpty,
    ShoppingCart,
    Add,
    Lock
} from "@mui/icons-material";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router";

interface Comanda {
    id: number;
    data: string;
    cpffuncionario: string;
    nomefuncionario: string;
    cpfcliente: string;
    nomecliente: string;
    total: string;
    fechada?: boolean;
}

interface ProdutoComanda {
    id: number;
    nome: string;
    preco: string;
    quantidade: string;
    subtotal: string;
}

export function Comandas({ client, userData }: { client: APIClient, userData: UserData | null }) {
    const navigate = useNavigate();
    const [comandas, setComandas] = useState<Comanda[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState("");
    const [selectedComanda, setSelectedComanda] = useState<Comanda | null>(null);
    const [produtos, setProdutos] = useState<ProdutoComanda[]>([]);
    const [loadingProdutos, setLoadingProdutos] = useState(false);
    
    // Estados para adicionar produto
    const [openAddDialog, setOpenAddDialog] = useState(false);
    const [produtosDisponiveis, setProdutosDisponiveis] = useState<any[]>([]);
    const [selectedProduto, setSelectedProduto] = useState<number>(0);
    const [quantidade, setQuantidade] = useState<number>(1);
    const [loadingAction, setLoadingAction] = useState(false);
    
    // Estados para criar comanda
    const [openCreateDialog, setOpenCreateDialog] = useState(false);
    const [clientes, setClientes] = useState<any[]>([]);
    const [selectedCliente, setSelectedCliente] = useState<string>("");
    const [loadingClientes, setLoadingClientes] = useState(false);
    
    // Snackbar
    const [snackbar, setSnackbar] = useState<{
        open: boolean;
        message: string;
        severity: 'success' | 'error' | 'info' | 'warning';
    }>({
        open: false,
        message: '',
        severity: 'success'
    });

    useEffect(() => {
        const fetchComandas = async () => {
            try {
                const response = await client.getAllComandas();
                setComandas(response);
            } catch (error) {
                console.error("Erro ao carregar comandas:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchComandas();
    }, [client]);

    useEffect(() => {
        const fetchProdutos = async () => {
            if (!selectedComanda) {
                setProdutos([]);
                return;
            }

            setLoadingProdutos(true);
            try {
                const response = await client.getProdutosDaComanda(selectedComanda.id);
                setProdutos(response);
            } catch (error) {
                console.error("Erro ao carregar produtos:", error);
            } finally {
                setLoadingProdutos(false);
            }
        };

        fetchProdutos();
    }, [selectedComanda, client]);

    // Carregar produtos disponíveis quando abrir o dialog
    useEffect(() => {
        const fetchProdutosDisponiveis = async () => {
            if (!openAddDialog) return;
            
            try {
                const response = await client.getProdutos();
                setProdutosDisponiveis(response);
            } catch (error) {
                console.error("Erro ao carregar produtos:", error);
            }
        };

        fetchProdutosDisponiveis();
    }, [openAddDialog, client]);

    // Carregar clientes quando abrir o dialog de criar comanda
    useEffect(() => {
        const fetchClientes = async () => {
            if (!openCreateDialog) return;
            
            setLoadingClientes(true);
            try {
                const response = await client.getAllClientes();
                setClientes(response);
            } catch (error) {
                console.error("Erro ao carregar clientes:", error);
            } finally {
                setLoadingClientes(false);
            }
        };

        fetchClientes();
    }, [openCreateDialog, client]);

    const handleCriarComanda = async () => {
        if (!selectedCliente) {
            setSnackbar({
                open: true,
                message: 'Selecione um cliente',
                severity: 'warning'
            });
            return;
        }

        if (!userData?.cpf) {
            setSnackbar({
                open: true,
                message: 'Dados do usuário não disponíveis',
                severity: 'error'
            });
            return;
        }

        setLoadingAction(true);
        try {
            const result = await client.abrirComandaDoCliente(selectedCliente, userData.cpf);
            
            // Recarregar comandas
            const comandasResponse = await client.getAllComandas();
            setComandas(comandasResponse);
            
            // Abrir a comanda criada no drawer
            const novaComanda = comandasResponse.find(c => c.id === result[0].id);
            if (novaComanda) {
                setSelectedComanda(novaComanda);
            }
            
            setSnackbar({
                open: true,
                message: result.length > 0 && result[0].id ? 'Comanda aberta com sucesso' : 'Cliente já possui comanda aberta',
                severity: 'success'
            });
            
            setOpenCreateDialog(false);
            setSelectedCliente("");
        } catch (error) {
            console.error("Erro ao criar comanda:", error);
            setSnackbar({
                open: true,
                message: 'Erro ao criar comanda',
                severity: 'error'
            });
        } finally {
            setLoadingAction(false);
        }
    };

    const handleAdicionarProduto = async () => {
        if (!selectedComanda || !selectedProduto || quantidade <= 0) {
            setSnackbar({
                open: true,
                message: 'Preencha todos os campos corretamente',
                severity: 'warning'
            });
            return;
        }

        setLoadingAction(true);
        try {
            await client.adicionarProdutoNaComanda(selectedComanda.id, selectedProduto, quantidade);
            
            // Recarregar produtos da comanda
            const response = await client.getProdutosDaComanda(selectedComanda.id);
            setProdutos(response);
            
            // Recarregar comandas para atualizar o total
            const comandasResponse = await client.getAllComandas();
            setComandas(comandasResponse);
            
            // Atualizar a comanda selecionada
            const comandaAtualizada = comandasResponse.find(c => c.id === selectedComanda.id);
            if (comandaAtualizada) {
                setSelectedComanda(comandaAtualizada);
            }
            
            setSnackbar({
                open: true,
                message: 'Produto adicionado com sucesso',
                severity: 'success'
            });
            
            setOpenAddDialog(false);
            setSelectedProduto(0);
            setQuantidade(1);
        } catch (error) {
            console.error("Erro ao adicionar produto:", error);
            setSnackbar({
                open: true,
                message: 'Erro ao adicionar produto',
                severity: 'error'
            });
        } finally {
            setLoadingAction(false);
        }
    };

    const handleFecharComanda = async () => {
        if (!selectedComanda) return;

        setLoadingAction(true);
        try {
            await client.fecharComandaDoCliente(selectedComanda.id);
            
            // Recarregar comandas
            const comandasResponse = await client.getAllComandas();
            setComandas(comandasResponse);
            
            // Atualizar comanda selecionada
            const comandaAtualizada = comandasResponse.find(c => c.id === selectedComanda.id);
            if (comandaAtualizada) {
                setSelectedComanda(comandaAtualizada);
            }
            
            setSnackbar({
                open: true,
                message: 'Comanda fechada com sucesso',
                severity: 'success'
            });
        } catch (error) {
            console.error("Erro ao fechar comanda:", error);
            setSnackbar({
                open: true,
                message: 'Erro ao fechar comanda',
                severity: 'error'
            });
        } finally {
            setLoadingAction(false);
        }
    };

    const filteredComandas = useMemo(() => {
        if (!searchQuery) return comandas;
        
        const query = searchQuery.toLowerCase();
        return comandas.filter(comanda => 
            comanda.id.toString().includes(query) ||
            comanda.nomecliente.toLowerCase().includes(query) ||
            comanda.cpfcliente.includes(query) ||
            comanda.nomefuncionario.toLowerCase().includes(query)
        );
    }, [comandas, searchQuery]);

    const stats = useMemo(() => {
        const total = comandas.length;
        const abertas = comandas.filter(c => !c.fechada).length;
        const fechadas = total - abertas;
        const receitaTotal = comandas.reduce((sum, c) => sum + parseFloat(c.total), 0);
        const ticketMedio = total > 0 ? receitaTotal / total : 0;
        
        return { total, abertas, fechadas, receitaTotal, ticketMedio };
    }, [comandas]);

    const handleClienteClick = (cpf: string) => {
        navigate(`/dashboard?tab=clientes&cpf=${cpf}`);
    };

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
                    <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                        <Typography variant="h4" component="h1">
                            <Receipt sx={{ fontSize: 32, verticalAlign: "middle", mr: 1 }} />
                            Comandas
                        </Typography>
                        <Button
                            variant="contained"
                            startIcon={<Add />}
                            onClick={() => setOpenCreateDialog(true)}
                            sx={{ whiteSpace: 'nowrap' }}
                        >
                            Nova Comanda
                        </Button>
                    </Box>
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
                                <Typography variant="h4" color="warning.main">{stats.abertas}</Typography>
                                <Typography variant="body2" color="text.secondary">Abertas</Typography>
                            </CardContent>
                        </Card>
                        <Card sx={{ flex: '1 1 150px' }}>
                            <CardContent sx={{ textAlign: 'center', py: 2 }}>
                                <Typography variant="h4" color="success.main">{stats.fechadas}</Typography>
                                <Typography variant="body2" color="text.secondary">Fechadas</Typography>
                            </CardContent>
                        </Card>
                        <Card sx={{ flex: '1 1 180px' }}>
                            <CardContent sx={{ textAlign: 'center', py: 2 }}>
                                <Typography variant="h4" color="success.main">
                                    R$ {stats.receitaTotal.toFixed(2)}
                                </Typography>
                                <Typography variant="body2" color="text.secondary">Receita Total</Typography>
                            </CardContent>
                        </Card>
                        <Card sx={{ flex: '1 1 180px' }}>
                            <CardContent sx={{ textAlign: 'center', py: 2 }}>
                                <Typography variant="h4">
                                    R$ {stats.ticketMedio.toFixed(2)}
                                </Typography>
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
                    <Box display="flex" gap={2} alignItems="center" mb={2}>
                        <TextField
                            fullWidth
                            size="small"
                            placeholder="Buscar por ID, cliente ou funcionário..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            InputProps={{
                                startAdornment: (
                                    <InputAdornment position="start">
                                        <Search />
                                    </InputAdornment>
                                ),
                            }}
                        />
                        <Typography variant="body2" color="text.secondary" whiteSpace="nowrap">
                            {filteredComandas.length} comanda{filteredComandas.length !== 1 ? 's' : ''}
                        </Typography>
                        <AnimatePresence>
                            {searchQuery && (
                                <motion.div
                                    initial={{ opacity: 0, scale: 0.8 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    exit={{ opacity: 0, scale: 0.8 }}
                                    transition={{ duration: 0.2 }}
                                >
                                    <Button
                                        size="small"
                                        onClick={() => setSearchQuery("")}
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
                transition={{ delay: 0.3, duration: 0.5 }}
                style={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}
            >
                <TableContainer component={Paper} sx={{ borderRadius: 2, boxShadow: 3, flex: 1, overflow: 'auto' }}>
                    <Table sx={{ minWidth: 650 }} stickyHeader>
                        <TableHead>
                            <TableRow>
                                <TableCell>ID</TableCell>
                                <TableCell>Cliente</TableCell>
                                <TableCell>Funcionário</TableCell>
                                <TableCell>Data</TableCell>
                                <TableCell align="right">Total</TableCell>
                                <TableCell align="center">Status</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {filteredComandas.map((comanda, index) => {
                                const dataComanda = new Date(comanda.data);
                                const isFechada = comanda.fechada !== false;
                                
                                return (
                                    <TableRow
                                        key={comanda.id}
                                        component={motion.tr}
                                        initial={{ opacity: 0, x: -20 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        transition={{ delay: index * 0.03, duration: 0.3 }}
                                        sx={{ 
                                            '&:last-child td, &:last-child th': { border: 0 },
                                            cursor: 'pointer'
                                        }}
                                        hover
                                        onClick={() => setSelectedComanda(comanda)}
                                    >
                                        <TableCell>
                                            <Box display="flex" alignItems="center" gap={1}>
                                                <Avatar sx={{ 
                                                    width: 32, 
                                                    height: 32, 
                                                    bgcolor: 'primary.main',
                                                    fontSize: '0.875rem'
                                                }}>
                                                    {comanda.id}
                                                </Avatar>
                                            </Box>
                                        </TableCell>
                                        <TableCell>
                                            <Box
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    handleClienteClick(comanda.cpfcliente);
                                                }}
                                                sx={{ 
                                                    cursor: 'pointer',
                                                    '&:hover .client-name': { 
                                                        textDecoration: 'underline',
                                                        color: 'primary.main'
                                                    }
                                                }}
                                            >
                                                <Typography 
                                                    className="client-name"
                                                    variant="body2" 
                                                    fontWeight="bold"
                                                    sx={{ transition: 'all 0.2s' }}
                                                >
                                                    {comanda.nomecliente}
                                                </Typography>
                                                <Typography variant="caption" color="text.secondary">
                                                    {comanda.cpfcliente}
                                                </Typography>
                                            </Box>
                                        </TableCell>
                                        <TableCell>
                                            <Typography variant="body2">
                                                {comanda.nomefuncionario}
                                            </Typography>
                                            <Typography variant="caption" color="text.secondary">
                                                {comanda.cpffuncionario}
                                            </Typography>
                                        </TableCell>
                                        <TableCell>
                                            <Typography variant="body2">
                                                {dataComanda.toLocaleDateString('pt-BR')}
                                            </Typography>
                                        </TableCell>
                                        <TableCell align="right">
                                            <Box display="flex" alignItems="center" justifyContent="flex-end" gap={0.5}>
                                                <AttachMoney fontSize="small" color="success" />
                                                <Typography variant="body2" fontWeight="bold" color="success.main">
                                                    R$ {parseFloat(comanda.total).toFixed(2)}
                                                </Typography>
                                            </Box>
                                        </TableCell>
                                        <TableCell align="center">
                                            <Chip
                                                icon={isFechada ? <CheckCircle /> : <HourglassEmpty />}
                                                label={isFechada ? 'Fechada' : 'Aberta'}
                                                size="small"
                                                color={isFechada ? 'success' : 'warning'}
                                            />
                                        </TableCell>
                                    </TableRow>
                                );
                            })}
                            {filteredComandas.length === 0 && (
                                <TableRow>
                                    <TableCell colSpan={6}>
                                        <Box textAlign="center" py={4}>
                                            <Typography variant="h6" color="text.secondary">
                                                Nenhuma comanda encontrada
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
                open={selectedComanda !== null}
                onClose={() => setSelectedComanda(null)}
                PaperProps={{
                    sx: { 
                        width: { xs: '100%', sm: 500 },
                        bgcolor: 'background.paper'
                    }
                }}
            >
                {selectedComanda && (
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
                                        bgcolor: 'primary.main',
                                        width: 48,
                                        height: 48
                                    }}>
                                        <Receipt />
                                    </Avatar>
                                    <Box>
                                        <Typography variant="h6">
                                            Comanda #{selectedComanda.id}
                                        </Typography>
                                        <Typography variant="caption" color="text.secondary">
                                            {new Date(selectedComanda.data).toLocaleDateString('pt-BR')}
                                        </Typography>
                                    </Box>
                                </Box>
                                <IconButton onClick={() => setSelectedComanda(null)}>
                                    <Close />
                                </IconButton>
                            </Box>
                        </motion.div>

                        {/* Content */}
                        <Box sx={{ flex: 1, overflow: 'auto', p: 3 }}>
                            <motion.div
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ duration: 0.3 }}
                            >
                                <Box display="flex" flexDirection="column" gap={2}>
                                    {/* Status */}
                                    <Paper sx={{ p: 2 }}>
                                        <Typography variant="caption" color="text.secondary" gutterBottom>
                                            Status
                                        </Typography>
                                        <Box mt={1}>
                                            <Chip
                                                icon={selectedComanda.fechada !== false ? <CheckCircle /> : <HourglassEmpty />}
                                                label={selectedComanda.fechada !== false ? 'Fechada' : 'Aberta'}
                                                color={selectedComanda.fechada !== false ? 'success' : 'warning'}
                                                sx={{ fontWeight: 'bold' }}
                                            />
                                        </Box>
                                    </Paper>

                                    {/* Cliente */}
                                    <Paper sx={{ p: 2 }}>
                                        <Box display="flex" alignItems="center" gap={1} mb={1}>
                                            <Person fontSize="small" color="primary" />
                                            <Typography variant="caption" color="text.secondary">
                                                Cliente
                                            </Typography>
                                        </Box>
                                        <Box
                                            onClick={() => handleClienteClick(selectedComanda.cpfcliente)}
                                            sx={{ 
                                                cursor: 'pointer',
                                                '&:hover .client-name': { 
                                                    textDecoration: 'underline',
                                                    color: 'primary.main'
                                                }
                                            }}
                                        >
                                            <Typography 
                                                className="client-name"
                                                variant="h6"
                                                sx={{ transition: 'all 0.2s' }}
                                            >
                                                {selectedComanda.nomecliente}
                                            </Typography>
                                            <Typography variant="body2" color="text.secondary">
                                                CPF: {selectedComanda.cpfcliente}
                                            </Typography>
                                        </Box>
                                    </Paper>

                                    {/* Funcionário */}
                                    <Paper sx={{ p: 2 }}>
                                        <Box display="flex" alignItems="center" gap={1} mb={1}>
                                            <Person fontSize="small" color="action" />
                                            <Typography variant="caption" color="text.secondary">
                                                Funcionário Responsável
                                            </Typography>
                                        </Box>
                                        <Typography variant="h6">
                                            {selectedComanda.nomefuncionario}
                                        </Typography>
                                        <Typography variant="body2" color="text.secondary">
                                            CPF: {selectedComanda.cpffuncionario}
                                        </Typography>
                                    </Paper>

                                    {/* Data */}
                                    <Paper sx={{ p: 2 }}>
                                        <Box display="flex" alignItems="center" gap={1} mb={1}>
                                            <CalendarToday fontSize="small" color="action" />
                                            <Typography variant="caption" color="text.secondary">
                                                Data de Emissão
                                            </Typography>
                                        </Box>
                                        <Typography variant="h6">
                                            {new Date(selectedComanda.data).toLocaleDateString('pt-BR', {
                                                weekday: 'long',
                                                year: 'numeric',
                                                month: 'long',
                                                day: 'numeric'
                                            })}
                                        </Typography>
                                    </Paper>

                                    <Divider />

                                    {/* Produtos */}
                                    <Paper sx={{ p: 2 }}>
                                        <Box display="flex" alignItems="center" gap={1} mb={2}>
                                            <ShoppingCart fontSize="small" color="primary" />
                                            <Typography variant="h6">
                                                Produtos Consumidos
                                            </Typography>
                                        </Box>
                                        
                                        {loadingProdutos ? (
                                            <Box display="flex" justifyContent="center" py={2}>
                                                <CircularProgress size={24} />
                                            </Box>
                                        ) : produtos.length === 0 ? (
                                            <Typography variant="body2" color="text.secondary" textAlign="center" py={2}>
                                                Nenhum produto consumido nesta comanda
                                            </Typography>
                                        ) : (
                                            <Box display="flex" flexDirection="column" gap={1.5}>
                                                {produtos.map((produto) => (
                                                    <Paper 
                                                        key={produto.id} 
                                                        sx={{ 
                                                            p: 1.5,
                                                            bgcolor: 'background.default',
                                                            border: 1,
                                                            borderColor: 'divider'
                                                        }}
                                                    >
                                                        <Box display="flex" justifyContent="space-between" alignItems="center" mb={0.5}>
                                                            <Typography variant="body2" fontWeight="bold">
                                                                {produto.nome}
                                                            </Typography>
                                                            <Typography variant="body2" fontWeight="bold" color="success.main">
                                                                R$ {parseFloat(produto.subtotal).toFixed(2)}
                                                            </Typography>
                                                        </Box>
                                                        <Box display="flex" justifyContent="space-between" alignItems="center">
                                                            <Typography variant="caption" color="text.secondary">
                                                                {produto.quantidade}x R$ {parseFloat(produto.preco).toFixed(2)}
                                                            </Typography>
                                                        </Box>
                                                    </Paper>
                                                ))}
                                            </Box>
                                        )}
                                    </Paper>

                                    {/* Botões de Ação */}
                                    {!selectedComanda.fechada && (
                                        <Box display="flex" gap={2}>
                                            <Button
                                                fullWidth
                                                variant="contained"
                                                startIcon={<Add />}
                                                onClick={() => setOpenAddDialog(true)}
                                                disabled={loadingAction}
                                            >
                                                Adicionar Produto
                                            </Button>
                                            <Button
                                                fullWidth
                                                variant="outlined"
                                                color="error"
                                                startIcon={<Lock />}
                                                onClick={handleFecharComanda}
                                                disabled={loadingAction}
                                            >
                                                Fechar Comanda
                                            </Button>
                                        </Box>
                                    )}

                                    <Divider />

                                    {/* Total */}
                                    <Paper 
                                        sx={{ 
                                            p: 3, 
                                            bgcolor: 'success.lighter',
                                            border: 2,
                                            borderColor: 'success.light'
                                        }}
                                    >
                                        <Box display="flex" alignItems="center" gap={1} mb={1}>
                                            <AttachMoney fontSize="small" color="success" />
                                            <Typography variant="caption" color="text.secondary">
                                                Valor Total
                                            </Typography>
                                        </Box>
                                        <Box display="flex" alignItems="center" gap={0.5}>
                                            <AttachMoney sx={{ fontSize: 32 }} color="success" />
                                            <Typography variant="h3" fontWeight="bold" color="success.main">
                                                {parseFloat(selectedComanda.total).toFixed(2)}
                                            </Typography>
                                        </Box>
                                    </Paper>
                                </Box>
                            </motion.div>
                        </Box>
                    </Box>
                )}
            </Drawer>

            {/* Dialog para Adicionar Produto */}
            <Dialog 
                open={openAddDialog} 
                onClose={() => setOpenAddDialog(false)}
                maxWidth="sm"
                fullWidth
            >
                <DialogTitle>
                    <Box display="flex" alignItems="center" gap={1}>
                        <Add />
                        Adicionar Produto à Comanda
                    </Box>
                </DialogTitle>
                <DialogContent>
                    <Box display="flex" flexDirection="column" gap={2} pt={1}>
                        <FormControl fullWidth>
                            <InputLabel>Produto</InputLabel>
                            <Select
                                value={selectedProduto}
                                onChange={(e) => setSelectedProduto(Number(e.target.value))}
                                label="Produto"
                            >
                                <MenuItem value={0}>Selecione um produto</MenuItem>
                                {produtosDisponiveis.map((produto) => (
                                    <MenuItem key={produto.produtoid} value={produto.produtoid}>
                                        {produto.produtonome} - R$ {parseFloat(produto.precoproduto).toFixed(2)}
                                    </MenuItem>
                                ))}
                            </Select>
                        </FormControl>
                        <TextField
                            fullWidth
                            label="Quantidade"
                            type="number"
                            value={quantidade}
                            onChange={(e) => setQuantidade(Number(e.target.value))}
                            inputProps={{ min: 1 }}
                        />
                    </Box>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setOpenAddDialog(false)} disabled={loadingAction}>
                        Cancelar
                    </Button>
                    <Button 
                        onClick={handleAdicionarProduto} 
                        variant="contained"
                        disabled={loadingAction || selectedProduto === 0}
                    >
                        {loadingAction ? <CircularProgress size={24} /> : 'Adicionar'}
                    </Button>
                </DialogActions>
            </Dialog>

            {/* Dialog para Criar Comanda */}
            <Dialog 
                open={openCreateDialog} 
                onClose={() => setOpenCreateDialog(false)}
                maxWidth="sm"
                fullWidth
            >
                <DialogTitle>
                    <Box display="flex" alignItems="center" gap={1}>
                        <Receipt />
                        Criar Nova Comanda
                    </Box>
                </DialogTitle>
                <DialogContent>
                    <Box display="flex" flexDirection="column" gap={2} pt={1}>
                        {loadingClientes ? (
                            <Box display="flex" justifyContent="center" py={2}>
                                <CircularProgress />
                            </Box>
                        ) : (
                            <FormControl fullWidth>
                                <InputLabel>Cliente</InputLabel>
                                <Select
                                    value={selectedCliente}
                                    onChange={(e) => setSelectedCliente(e.target.value)}
                                    label="Cliente"
                                >
                                    <MenuItem value="">Selecione um cliente</MenuItem>
                                    {clientes.map((cliente) => (
                                        <MenuItem key={cliente.cpf} value={cliente.cpf}>
                                            {cliente.nome} - {cliente.cpf}
                                            {cliente.vip && (
                                                <Chip 
                                                    label="VIP" 
                                                    size="small" 
                                                    color="warning" 
                                                    sx={{ ml: 1 }}
                                                />
                                            )}
                                        </MenuItem>
                                    ))}
                                </Select>
                            </FormControl>
                        )}
                        <Alert severity="info">
                            Uma comanda será aberta para o cliente selecionado. Se o cliente já tiver uma comanda aberta, ela será reutilizada.
                        </Alert>
                    </Box>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setOpenCreateDialog(false)} disabled={loadingAction}>
                        Cancelar
                    </Button>
                    <Button 
                        onClick={handleCriarComanda} 
                        variant="contained"
                        disabled={loadingAction || !selectedCliente || loadingClientes}
                    >
                        {loadingAction ? <CircularProgress size={24} /> : 'Criar Comanda'}
                    </Button>
                </DialogActions>
            </Dialog>

            {/* Snackbar */}
            <Snackbar
                open={snackbar.open}
                autoHideDuration={4000}
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
