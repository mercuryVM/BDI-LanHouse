import { useEffect, useState } from "react";
import type { UserData, Cliente } from "../../../API/APIClient";
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
    Drawer,
    TextField,
    Button,
    IconButton,
    Switch,
    FormControlLabel,
    Divider,
    Alert,
    Snackbar,
    Select,
    MenuItem,
    FormControl,
    InputLabel,
    Fab,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions
} from "@mui/material";
import { Person, Star, SportsEsports, Computer, SportsBasketball, Close, Save, Edit, Add, Delete, Search, FilterList } from "@mui/icons-material";
import styles from "./index.module.css";
import { useMemo } from "react";
import { InputAdornment, ToggleButtonGroup, ToggleButton } from "@mui/material";
import { motion, AnimatePresence } from "framer-motion";

export function Clientes({ client }: { client: APIClient, userData: UserData | null }) {
    const [clientes, setClientes] = useState<Cliente[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedCliente, setSelectedCliente] = useState<Cliente | null>(null);
    const [editedCliente, setEditedCliente] = useState<Partial<Cliente>>({});
    const [hasChanges, setHasChanges] = useState(false);
    const [saving, setSaving] = useState(false);
    const [snackbar, setSnackbar] = useState({ open: false, message: "", severity: "success" as "success" | "error" });
    const [createDialogOpen, setCreateDialogOpen] = useState(false);
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState("");
    const [vipFilter, setVipFilter] = useState<string | null>(null);
    const [genderFilter, setGenderFilter] = useState<string | null>(null);
    const [newCliente, setNewCliente] = useState({
        cpf: '',
        nome: '',
        loginacesso: '',
        senhaacesso: '',
        genero: 'M',
        datanasc: '',
        endereco: '',
        vip: false,
        datafimvip: null as string | null
    });

    useEffect(() => {
        const fetchClientes = async () => {
            try {
                const data = await client.getAllClientes();
                setClientes(data);
            } catch (error) {
                console.error("Erro ao carregar clientes:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchClientes();
    }, [client]);

    const formatDate = (date: Date) => {
        return new Date(date).toLocaleDateString('pt-BR');
    };

    const formatDateForInput = (date: Date) => {
        const d = new Date(date);
        return d.toISOString().split('T')[0];
    };

    const formatMinutos = (minutos: number) => {
        const horas = Math.floor(minutos / 60);
        const mins = minutos % 60;
        return `${horas}h ${mins}m`;
    };

    const filteredClientes = useMemo(() => {
        let filtered = [...clientes];

        // Filtro de busca
        if (searchQuery) {
            filtered = filtered.filter(cliente => 
                cliente.nome.toLowerCase().includes(searchQuery.toLowerCase()) ||
                cliente.cpf.includes(searchQuery) ||
                cliente.loginacesso.toLowerCase().includes(searchQuery.toLowerCase())
            );
        }

        // Filtro VIP
        if (vipFilter === 'vip') {
            filtered = filtered.filter(cliente => cliente.vip);
        } else if (vipFilter === 'regular') {
            filtered = filtered.filter(cliente => !cliente.vip);
        }

        // Filtro de Gênero
        if (genderFilter) {
            filtered = filtered.filter(cliente => cliente.genero === genderFilter);
        }

        return filtered;
    }, [clientes, searchQuery, vipFilter, genderFilter]);

    const handleClienteClick = (cliente: Cliente) => {
        setSelectedCliente(cliente);
        setEditedCliente({});
        setHasChanges(false);
    };

    const handleCloseDrawer = () => {
        setSelectedCliente(null);
        setEditedCliente({});
        setHasChanges(false);
    };

    const handleFieldChange = (field: keyof Cliente, value: any) => {
        setEditedCliente(prev => ({
            ...prev,
            [field]: value
        }));
        setHasChanges(true);
    };

    const handleSave = async () => {
        if (!selectedCliente || !hasChanges) return;

        setSaving(true);
        try {
            await client.updateCliente(selectedCliente.cpf, editedCliente);
            
            // Atualizar a lista de clientes
            setClientes(prev => prev.map(c => 
                c.cpf === selectedCliente.cpf ? { ...selectedCliente, ...editedCliente } : c
            ));

            // Atualizar o cliente selecionado
            setSelectedCliente({ ...selectedCliente, ...editedCliente });
            setEditedCliente({});
            setHasChanges(false);

            setSnackbar({
                open: true,
                message: "Cliente atualizado com sucesso!",
                severity: "success"
            });
        } catch (error) {
            console.error("Erro ao atualizar cliente:", error);
            setSnackbar({
                open: true,
                message: "Erro ao atualizar cliente",
                severity: "error"
            });
        } finally {
            setSaving(false);
        }
    };

    const getFieldValue = (field: keyof Cliente) => {
        if (editedCliente.hasOwnProperty(field)) {
            return editedCliente[field];
        }
        return selectedCliente?.[field];
    };

    const handleCreateCliente = async () => {
        setSaving(true);
        try {
            await client.createCliente(newCliente as any);
            
            // Recarregar lista de clientes
            const data = await client.getAllClientes();
            setClientes(data);

            // Resetar formulário
            setNewCliente({
                cpf: '',
                nome: '',
                loginacesso: '',
                senhaacesso: '',
                genero: 'M',
                datanasc: '',
                endereco: '',
                vip: false,
                datafimvip: null
            });
            setCreateDialogOpen(false);

            setSnackbar({
                open: true,
                message: "Cliente criado com sucesso!",
                severity: "success"
            });
        } catch (error) {
            console.error("Erro ao criar cliente:", error);
            setSnackbar({
                open: true,
                message: "Erro ao criar cliente",
                severity: "error"
            });
        } finally {
            setSaving(false);
        }
    };

    const handleDeleteCliente = async () => {
        if (!selectedCliente) return;

        setSaving(true);
        try {
            await client.deleteCliente(selectedCliente.cpf);
            
            // Remover da lista
            setClientes(prev => prev.filter(c => c.cpf !== selectedCliente.cpf));

            setDeleteDialogOpen(false);
            handleCloseDrawer();

            setSnackbar({
                open: true,
                message: "Cliente deletado com sucesso!",
                severity: "success"
            });
        } catch (error) {
            console.error("Erro ao deletar cliente:", error);
            setSnackbar({
                open: true,
                message: "Erro ao deletar cliente",
                severity: "error"
            });
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <Box className={styles.container} display="flex" justifyContent="center" alignItems="center">
                <CircularProgress />
            </Box>
        );
    }

    return (
        <div className={styles.container} style={{ height: '100%', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
            <Box className={styles.header}>
                <motion.div
                    initial={{ opacity: 0, x: -30 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.5 }}
                >
                    <Typography variant="h4" component="h1" gutterBottom>
                        <FilterList sx={{ fontSize: 32, verticalAlign: "middle", mr: 1 }} />
                        Clientes
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
                        placeholder="Buscar por nome, CPF ou login..."
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

                {/* Filtros Compactos */}
                <motion.div
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2, duration: 0.4 }}
                >
                    <Box display="flex" gap={2} flexWrap="wrap" alignItems="center" mb={2}>
                    {/* Filtro VIP */}
                    <ToggleButtonGroup
                        value={vipFilter}
                        exclusive
                        onChange={(_e, value) => setVipFilter(value)}
                        size="small"
                    >
                        <ToggleButton value="vip">
                            <Star fontSize="small" sx={{ mr: 0.5 }} /> VIP
                        </ToggleButton>
                        <ToggleButton value="regular">
                            Regular
                        </ToggleButton>
                    </ToggleButtonGroup>

                    <Box sx={{ borderLeft: 1, borderColor: 'divider', height: 30, mx: 1 }} />

                    {/* Filtro de Gênero */}
                    <ToggleButtonGroup
                        value={genderFilter}
                        exclusive
                        onChange={(_e, value) => setGenderFilter(value)}
                        size="small"
                    >
                        <ToggleButton value="M">
                            Masculino
                        </ToggleButton>
                        <ToggleButton value="F">
                            Feminino
                        </ToggleButton>
                    </ToggleButtonGroup>

                    <Box flex={1} />

                    {/* Contador */}
                    <Typography variant="body2" color="text.secondary">
                        {filteredClientes.length} cliente{filteredClientes.length !== 1 ? 's' : ''}
                    </Typography>

                    {/* Botão Limpar */}
                    <AnimatePresence>
                        {(searchQuery || vipFilter || genderFilter) && (
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
                                        setVipFilter(null);
                                        setGenderFilter(null);
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

            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3, duration: 0.5 }}
                style={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}
            >
                <TableContainer component={Paper} className={styles.tableContainer} sx={{ flex: 1, overflow: 'auto' }}>
                <Table sx={{ minWidth: 650 }} stickyHeader>
                    <TableHead>
                        <TableRow>
                            <TableCell>Cliente</TableCell>
                            <TableCell>CPF</TableCell>
                            <TableCell align="center">Gênero</TableCell>
                            <TableCell align="center">Data Nasc.</TableCell>
                            <TableCell align="center">Status VIP</TableCell>
                            <TableCell align="center"><Computer sx={{ fontSize: 20 }} /></TableCell>
                            <TableCell align="center"><SportsEsports sx={{ fontSize: 20 }} /></TableCell>
                            <TableCell align="center"><SportsBasketball sx={{ fontSize: 20 }} /></TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {filteredClientes.map((cliente) => (
                            <TableRow
                                key={cliente.cpf}
                                sx={{ '&:last-child td, &:last-child th': { border: 0 }, cursor: 'pointer' }}
                                hover
                                onClick={() => handleClienteClick(cliente)}
                            >
                                <TableCell component="th" scope="row">
                                    <Box display="flex" alignItems="center" gap={1}>
                                        <Avatar sx={{ width: 32, height: 32, bgcolor: cliente.vip ? 'gold' : 'primary.main' }}>
                                            {cliente.nome.charAt(0).toUpperCase()}
                                        </Avatar>
                                        <Box>
                                            <Typography variant="body2" fontWeight="bold">
                                                {cliente.nome}
                                            </Typography>
                                            <Typography variant="caption" color="text.secondary">
                                                {cliente.loginacesso}
                                            </Typography>
                                        </Box>
                                    </Box>
                                </TableCell>
                                <TableCell>
                                    <Typography variant="body2" fontFamily="monospace">
                                        {cliente.cpf}
                                    </Typography>
                                </TableCell>
                                <TableCell align="center">
                                    <Typography variant="body2">
                                        {cliente.genero}
                                    </Typography>
                                </TableCell>
                                <TableCell align="center">
                                    <Typography variant="body2">
                                        {formatDate(cliente.datanasc)}
                                    </Typography>
                                </TableCell>
                                <TableCell align="center">
                                    {cliente.vip ? (
                                        <Box display="flex" flexDirection="column" alignItems="center" gap={0.5}>
                                            <Chip
                                                icon={<Star />}
                                                label="VIP"
                                                color="warning"
                                                size="small"
                                            />
                                            {cliente.datafimvip && (
                                                <Typography variant="caption" color="text.secondary">
                                                    até {formatDate(cliente.datafimvip)}
                                                </Typography>
                                            )}
                                        </Box>
                                    ) : (
                                        <Chip label="Regular" size="small" variant="outlined" />
                                    )}
                                </TableCell>
                                <TableCell align="center">
                                    <Typography variant="body2" color="primary">
                                        {formatMinutos(cliente.tempocomputador)}
                                    </Typography>
                                </TableCell>
                                <TableCell align="center">
                                    <Typography variant="body2" color="secondary">
                                        {formatMinutos(cliente.tempoconsole)}
                                    </Typography>
                                </TableCell>
                                <TableCell align="center">
                                    <Typography variant="body2" color="success.main">
                                        {formatMinutos(cliente.temposimulador)}
                                    </Typography>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </TableContainer>
            </motion.div>

            <Drawer
                anchor="right"
                open={selectedCliente !== null}
                onClose={handleCloseDrawer}
                PaperProps={{
                    sx: { width: 450, padding: 3 }
                }}
            >
                {selectedCliente && (
                    <motion.div
                        initial={{ x: 100, opacity: 0 }}
                        animate={{ x: 0, opacity: 1 }}
                        exit={{ x: 100, opacity: 0 }}
                        transition={{ duration: 0.3 }}
                    >
                        <Box className={styles.drawerContent}>
                            <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
                                <Typography variant="h5" component="h2">
                                    <Edit sx={{ fontSize: 28, verticalAlign: "middle", mr: 1 }} />
                                    Detalhes do Cliente
                                </Typography>
                                <motion.div whileHover={{ rotate: 90 }} transition={{ duration: 0.2 }}>
                                    <IconButton onClick={handleCloseDrawer}>
                                        <Close />
                                    </IconButton>
                                </motion.div>
                            </Box>

                        <Divider sx={{ mb: 3 }} />

                        <Box display="flex" flexDirection="column" gap={2}>
                            <Box display="flex" alignItems="center" gap={2} mb={2}>
                                <Avatar sx={{ width: 56, height: 56, bgcolor: selectedCliente.vip ? 'gold' : 'primary.main' }}>
                                    {selectedCliente.nome.charAt(0).toUpperCase()}
                                </Avatar>
                                <Box>
                                    <Typography variant="h6">{selectedCliente.nome}</Typography>
                                    <Typography variant="caption" color="text.secondary">
                                        CPF: {selectedCliente.cpf}
                                    </Typography>
                                </Box>
                            </Box>

                            <TextField
                                label="Nome"
                                fullWidth
                                value={getFieldValue('nome')}
                                onChange={(e) => handleFieldChange('nome', e.target.value)}
                            />

                            <TextField
                                label="Login de Acesso"
                                fullWidth
                                value={getFieldValue('loginacesso')}
                                onChange={(e) => handleFieldChange('loginacesso', e.target.value)}
                            />

                            <FormControl fullWidth>
                                <InputLabel>Gênero</InputLabel>
                                <Select
                                    value={getFieldValue('genero')}
                                    label="Gênero"
                                    onChange={(e) => handleFieldChange('genero', e.target.value)}
                                >
                                    <MenuItem value="M">Masculino</MenuItem>
                                    <MenuItem value="F">Feminino</MenuItem>
                                </Select>
                            </FormControl>

                            <TextField
                                label="Data de Nascimento"
                                type="date"
                                fullWidth
                                value={formatDateForInput(getFieldValue('datanasc') as Date)}
                                onChange={(e) => handleFieldChange('datanasc', e.target.value)}
                                InputLabelProps={{ shrink: true }}
                            />

                            <TextField
                                label="Endereço"
                                fullWidth
                                multiline
                                rows={2}
                                value={getFieldValue('endereco')}
                                onChange={(e) => handleFieldChange('endereco', e.target.value)}
                            />

                            <Divider sx={{ my: 2 }} />

                            <FormControlLabel
                                control={
                                    <Switch
                                        checked={getFieldValue('vip') as boolean}
                                        onChange={(e) => handleFieldChange('vip', e.target.checked)}
                                    />
                                }
                                label="Cliente VIP"
                            />

                            {getFieldValue('vip') && (
                                <TextField
                                    label="Data Fim VIP"
                                    type="date"
                                    fullWidth
                                    value={getFieldValue('datafimvip') ? formatDateForInput(getFieldValue('datafimvip') as Date) : ''}
                                    onChange={(e) => handleFieldChange('datafimvip', e.target.value)}
                                    InputLabelProps={{ shrink: true }}
                                />
                            )}

                            <Divider sx={{ my: 2 }} />

                            <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                                Tempo de Uso
                            </Typography>

                            <Box display="flex" gap={2}>
                                <TextField
                                    label={<><Computer sx={{ fontSize: 16 }} /> PC (min)</>}
                                    type="number"
                                    fullWidth
                                    value={getFieldValue('tempocomputador')}
                                    onChange={(e) => handleFieldChange('tempocomputador', parseInt(e.target.value) || 0)}
                                />
                                <TextField
                                    label={<><SportsEsports sx={{ fontSize: 16 }} /> Console (min)</>}
                                    type="number"
                                    fullWidth
                                    value={getFieldValue('tempoconsole')}
                                    onChange={(e) => handleFieldChange('tempoconsole', parseInt(e.target.value) || 0)}
                                />
                            </Box>

                            <TextField
                                label={<><SportsBasketball sx={{ fontSize: 16 }} /> Simulador (min)</>}
                                type="number"
                                fullWidth
                                value={getFieldValue('temposimulador')}
                                onChange={(e) => handleFieldChange('temposimulador', parseInt(e.target.value) || 0)}
                            />

                            <Box mt={3} display="flex" flexDirection="column" gap={2}>
                                <Button
                                    variant="contained"
                                    color="primary"
                                    fullWidth
                                    size="large"
                                    startIcon={<Save />}
                                    onClick={handleSave}
                                    disabled={!hasChanges || saving}
                                >
                                    {saving ? <CircularProgress size={24} /> : 'Salvar Alterações'}
                                </Button>

                                <Button
                                    variant="outlined"
                                    color="error"
                                    fullWidth
                                    size="large"
                                    startIcon={<Delete />}
                                    onClick={() => setDeleteDialogOpen(true)}
                                    disabled={saving}
                                >
                                    Deletar Cliente
                                </Button>
                            </Box>
                        </Box>
                    </Box>
                    </motion.div>
                )}
            </Drawer>

            <Snackbar
                open={snackbar.open}
                autoHideDuration={4000}
                onClose={() => setSnackbar({ ...snackbar, open: false })}
                anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
            >
                <Alert severity={snackbar.severity} onClose={() => setSnackbar({ ...snackbar, open: false })}>
                    {snackbar.message}
                </Alert>
            </Snackbar>

            <Fab
                color="primary"
                aria-label="add"
                className={styles.fab}
                onClick={() => setCreateDialogOpen(true)}
            >
                <Add />
            </Fab>

            <Dialog
                open={createDialogOpen}
                onClose={() => setCreateDialogOpen(false)}
                maxWidth="sm"
                fullWidth
            >
                <DialogTitle>
                    <Box display="flex" alignItems="center" gap={1}>
                        <Person />
                        Novo Cliente
                    </Box>
                </DialogTitle>
                <DialogContent>
                    <Box display="flex" flexDirection="column" gap={2} mt={2}>
                        <TextField
                            label="CPF"
                            fullWidth
                            required
                            value={newCliente.cpf}
                            onChange={(e) => setNewCliente({ ...newCliente, cpf: e.target.value })}
                        />

                        <TextField
                            label="Nome"
                            fullWidth
                            required
                            value={newCliente.nome}
                            onChange={(e) => setNewCliente({ ...newCliente, nome: e.target.value })}
                        />

                        <TextField
                            label="Login de Acesso"
                            fullWidth
                            required
                            value={newCliente.loginacesso}
                            onChange={(e) => setNewCliente({ ...newCliente, loginacesso: e.target.value })}
                        />

                        <TextField
                            label="Senha de Acesso"
                            type="password"
                            fullWidth
                            required
                            value={newCliente.senhaacesso}
                            onChange={(e) => setNewCliente({ ...newCliente, senhaacesso: e.target.value })}
                        />

                        <FormControl fullWidth>
                            <InputLabel>Gênero</InputLabel>
                            <Select
                                value={newCliente.genero}
                                label="Gênero"
                                onChange={(e) => setNewCliente({ ...newCliente, genero: e.target.value })}
                            >
                                <MenuItem value="M">Masculino</MenuItem>
                                <MenuItem value="F">Feminino</MenuItem>
                            </Select>
                        </FormControl>

                        <TextField
                            label="Data de Nascimento"
                            type="date"
                            fullWidth
                            required
                            value={newCliente.datanasc}
                            onChange={(e) => setNewCliente({ ...newCliente, datanasc: e.target.value })}
                            InputLabelProps={{ shrink: true }}
                        />

                        <TextField
                            label="Endereço"
                            fullWidth
                            multiline
                            rows={2}
                            value={newCliente.endereco}
                            onChange={(e) => setNewCliente({ ...newCliente, endereco: e.target.value })}
                        />

                        <FormControlLabel
                            control={
                                <Switch
                                    checked={newCliente.vip}
                                    onChange={(e) => setNewCliente({ ...newCliente, vip: e.target.checked })}
                                />
                            }
                            label="Cliente VIP"
                        />

                        {newCliente.vip && (
                            <TextField
                                label="Data Fim VIP"
                                type="date"
                                fullWidth
                                value={newCliente.datafimvip || ''}
                                onChange={(e) => setNewCliente({ ...newCliente, datafimvip: e.target.value })}
                                InputLabelProps={{ shrink: true }}
                            />
                        )}
                    </Box>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setCreateDialogOpen(false)} disabled={saving}>
                        Cancelar
                    </Button>
                    <Button
                        onClick={handleCreateCliente}
                        variant="contained"
                        disabled={saving || !newCliente.cpf || !newCliente.nome || !newCliente.loginacesso || !newCliente.senhaacesso || !newCliente.datanasc}
                        startIcon={saving ? <CircularProgress size={20} /> : <Save />}
                    >
                        {saving ? 'Salvando...' : 'Criar Cliente'}
                    </Button>
                </DialogActions>
            </Dialog>

            <Dialog
                open={deleteDialogOpen}
                onClose={() => setDeleteDialogOpen(false)}
            >
                <DialogTitle>
                    <Box display="flex" alignItems="center" gap={1} color="error.main">
                        <Delete />
                        Confirmar Exclusão
                    </Box>
                </DialogTitle>
                <DialogContent>
                    <Typography>
                        Tem certeza que deseja deletar o cliente <strong>{selectedCliente?.nome}</strong>?
                    </Typography>
                    <Typography variant="body2" color="text.secondary" mt={1}>
                        Esta ação não pode ser desfeita.
                    </Typography>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setDeleteDialogOpen(false)} disabled={saving}>
                        Cancelar
                    </Button>
                    <Button
                        onClick={handleDeleteCliente}
                        variant="contained"
                        color="error"
                        disabled={saving}
                        startIcon={saving ? <CircularProgress size={20} /> : <Delete />}
                    >
                        {saving ? 'Deletando...' : 'Deletar'}
                    </Button>
                </DialogActions>
            </Dialog>
        </div>
    );
}