import { useEffect, useState } from "react";
import type { Evento, Maquina, Cliente } from "../../../API/APIClient";
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
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    IconButton,
    Alert,
    FormControl,
    InputLabel,
    Select,
    MenuItem,
    Autocomplete,
    Card,
    CardContent,
    Snackbar,
} from "@mui/material";
import {
    Search,
    Add,
    Edit,
    Delete,
    Event as EventIcon,
    Close,
    Computer,
    Person,
    AccessTime,
    Warning,
} from "@mui/icons-material";
import { motion } from "framer-motion";
import { useUserDataRedux } from "../../../hooks/useUserDataRedux";

export function Eventos({ client, userData }: { client: APIClient, userData: any }) {
    const [eventos, setEventos] = useState<Evento[]>([]);
    const [maquinas, setMaquinas] = useState<Maquina[]>([]);
    const [clientes, setClientes] = useState<Cliente[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState("");
    const [dialogOpen, setDialogOpen] = useState(false);
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [eventoToDelete, setEventoToDelete] = useState<Evento | null>(null);
    const [editingEvento, setEditingEvento] = useState<Evento | null>(null);
    const [saving, setSaving] = useState(false);
    
    // Notification state
    const [snackbar, setSnackbar] = useState<{
        open: boolean;
        message: string;
        severity: "success" | "error" | "warning" | "info";
    }>({
        open: false,
        message: "",
        severity: "success",
    });

    const [formData, setFormData] = useState({
        nome: "",
        datatempoinicio: "",
        datatempofim: "",
        status: "agendado",
        clienteCpf: "",
        maquinaIds: [] as number[],
    });

    useEffect(() => {
        loadEventos();
        loadMaquinas();
        loadClientes();
    }, []);

    const showNotification = (message: string, severity: "success" | "error" | "warning" | "info") => {
        setSnackbar({ open: true, message, severity });
    };

    const handleCloseSnackbar = () => {
        setSnackbar({ ...snackbar, open: false });
    };

    const loadEventos = async () => {
        try {
            setLoading(true);
            const data = await client.getEventos();
            setEventos(data);
        } catch (error: any) {
            console.error("Erro ao carregar eventos:", error);
            const errorMessage = error.response?.data?.errors?.[0] || "Erro ao carregar eventos";
            showNotification(errorMessage, "error");
        } finally {
            setLoading(false);
        }
    };

    const loadMaquinas = async () => {
        try {
            const data = await client.getAllMaquinas();
            setMaquinas(data);
        } catch (error: any) {
            console.error("Erro ao carregar máquinas:", error);
            const errorMessage = error.response?.data?.errors?.[0] || "Erro ao carregar máquinas";
            showNotification(errorMessage, "error");
        }
    };

    const loadClientes = async () => {
        try {
            const data = await client.getAllClientes();
            setClientes(data);
        } catch (error: any) {
            console.error("Erro ao carregar clientes:", error);
            const errorMessage = error.response?.data?.errors?.[0] || "Erro ao carregar clientes";
            showNotification(errorMessage, "error");
        }
    };

    const handleOpenDialog = (evento?: Evento) => {
        if (evento) {
            setEditingEvento(evento);
            setFormData({
                nome: evento.eventonome,
                datatempoinicio: new Date(evento.eventodatatempoinicio).toISOString().slice(0, 16),
                datatempofim: evento.eventodatatempofim
                    ? new Date(evento.eventodatatempofim).toISOString().slice(0, 16)
                    : "",
                status: evento.eventostatus,
                clienteCpf: evento.cliente?.cpf || "",
                maquinaIds: evento.maquinas.map((m) => m.maquinaid),
            });
        } else {
            setEditingEvento(null);
            setFormData({
                nome: "",
                datatempoinicio: "",
                datatempofim: "",
                status: "agendado",
                clienteCpf: "",
                maquinaIds: [],
            });
        }
        setDialogOpen(true);
    };

    const handleCloseDialog = () => {
        setDialogOpen(false);
        setEditingEvento(null);
        setFormData({
            nome: "",
            datatempoinicio: "",
            datatempofim: "",
            status: "agendado",
            clienteCpf: "",
            maquinaIds: [],
        });
    };

    const handleSubmit = async () => {
        if (!formData.nome || !formData.datatempoinicio || !formData.clienteCpf || formData.maquinaIds.length === 0) {
            showNotification("Preencha todos os campos obrigatórios!", "warning");
            return;
        }

        if (!userData?.cpf) {
            showNotification("Usuário não identificado!", "error");
            return;
        }

        try {
            setSaving(true);
            if (editingEvento) {
                await client.updateEvento(editingEvento.eventoid, {
                    nome: formData.nome,
                    datatempoinicio: formData.datatempoinicio,
                    datatempofim: formData.datatempofim || undefined,
                    status: formData.status,
                    clienteCpf: formData.clienteCpf,
                    maquinaIds: formData.maquinaIds,
                });
                showNotification("Evento atualizado com sucesso!", "success");
            } else {
                await client.createEvento({
                    nome: formData.nome,
                    datatempoinicio: formData.datatempoinicio,
                    datatempofim: formData.datatempofim || undefined,
                    status: formData.status,
                    clienteCpf: formData.clienteCpf,
                    maquinaIds: formData.maquinaIds,
                    agendadoPor: userData.cpf,
                });
                showNotification("Evento criado com sucesso!", "success");
            }

            handleCloseDialog();
            loadEventos();
        } catch (error: any) {
            const errorMessage = error.response?.data?.errors?.[0] || "Erro ao salvar evento";
            showNotification(errorMessage, "error");
            console.error("Erro ao salvar evento:", error);
        } finally {
            setSaving(false);
        }
    };

    const handleDeleteClick = (evento: Evento) => {
        setEventoToDelete(evento);
        setDeleteDialogOpen(true);
    };

    const handleDeleteConfirm = async () => {
        if (!eventoToDelete) return;

        try {
            await client.deleteEvento(eventoToDelete.eventoid);
            showNotification("Evento excluído com sucesso!", "success");
            setDeleteDialogOpen(false);
            setEventoToDelete(null);
            loadEventos();
        } catch (error: any) {
            console.error("Erro ao deletar evento:", error);
            const errorMessage = error.response?.data?.errors?.[0] || "Erro ao deletar evento";
            showNotification(errorMessage, "error");
        }
    };

    const filteredEventos = eventos.filter(
        (evento) =>
            evento.eventonome.toLowerCase().includes(searchQuery.toLowerCase()) ||
            evento.cliente?.nome.toLowerCase().includes(searchQuery.toLowerCase()) ||
            evento.eventostatus.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const getStatusColor = (status: string) => {
        switch (status.toLowerCase()) {
            case "agendado":
                return "primary";
            case "em andamento":
                return "warning";
            case "concluido":
                return "success";
            case "cancelado":
                return "error";
            default:
                return "default";
        }
    };

    const formatStatus = (status: string) => {
        switch (status.toLowerCase()) {
            case "agendado":
                return "Agendado";
            case "em andamento":
                return "Em Andamento";
            case "concluido":
                return "Concluído";
            case "cancelado":
                return "Cancelado";
            default:
                return status;
        }
    };

    const isEventoAtivo = (evento: Evento) => !evento.eventodatatempofim;

    if (loading) {
        return (
            <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
                <CircularProgress />
            </Box>
        );
    }

    return (
        <Box sx={{ p: 3 }}>
            {/* Header */}
            <motion.div
                initial={{ opacity: 0, x: -30 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.5 }}
            >
                <Typography variant="h4" component="h1" gutterBottom>
                    <EventIcon sx={{ fontSize: 32, verticalAlign: "middle", mr: 1 }} />
                    Eventos
                </Typography>
            </motion.div>

            {/* Stats Cards */}
            <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1, duration: 0.4 }}
            >
                <Box display="flex" gap={2} flexWrap="wrap" sx={{ mb: 3 }}>
                    <Card sx={{ flex: '1 1 150px' }}>
                        <CardContent sx={{ textAlign: 'center', py: 2 }}>
                            <Typography variant="h4" color="primary">{eventos.length}</Typography>
                            <Typography variant="body2" color="text.secondary">Total</Typography>
                        </CardContent>
                    </Card>
                    <Card sx={{ flex: '1 1 150px' }}>
                        <CardContent sx={{ textAlign: 'center', py: 2 }}>
                            <Typography variant="h4" color="success.main">
                                {eventos.filter((e) => e.eventostatus === "agendado").length}
                            </Typography>
                            <Typography variant="body2" color="text.secondary">Agendados</Typography>
                        </CardContent>
                    </Card>
                    <Card sx={{ flex: '1 1 150px' }}>
                        <CardContent sx={{ textAlign: 'center', py: 2 }}>
                            <Typography variant="h4" color="warning.main">
                                {eventos.filter((e) => e.eventostatus === "em andamento").length}
                            </Typography>
                            <Typography variant="body2" color="text.secondary">Em Andamento</Typography>
                        </CardContent>
                    </Card>
                    <Card sx={{ flex: '1 1 150px' }}>
                        <CardContent sx={{ textAlign: 'center', py: 2 }}>
                            <Typography variant="h4">
                                {eventos.filter((e) => e.eventostatus === "concluido").length}
                            </Typography>
                            <Typography variant="body2" color="text.secondary">Concluídos</Typography>
                        </CardContent>
                    </Card>
                </Box>
            </motion.div>

            {/* Search and Actions */}
            <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2, duration: 0.4 }}
            >
                <Box display="flex" gap={2} mb={3}>
                    <TextField
                        fullWidth
                        size="small"
                        placeholder="Buscar por nome, cliente ou status..."
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
                    <Button
                        variant="contained"
                        startIcon={<Add />}
                        onClick={() => handleOpenDialog()}
                        sx={{ minWidth: 150 }}
                    >
                        Novo Evento
                    </Button>
                </Box>
            </motion.div>

            {/* Table */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3, duration: 0.5 }}
            >
                <TableContainer component={Paper} sx={{ borderRadius: 2, boxShadow: 3 }}>
                    <Table>
                        <TableHead>
                            <TableRow>
                                <TableCell>ID</TableCell>
                                <TableCell>Nome</TableCell>
                                <TableCell>Cliente</TableCell>
                                <TableCell>Data/Hora Início</TableCell>
                                <TableCell>Data/Hora Fim</TableCell>
                                <TableCell>Status</TableCell>
                                <TableCell>Máquinas</TableCell>
                                <TableCell align="center">Ações</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {filteredEventos.map((evento, index) => (
                                <TableRow
                                    key={evento.eventoid}
                                    component={motion.tr}
                                    initial={{ opacity: 0, x: -20 }}
                                    animate={{
                                        opacity: isEventoAtivo(evento) ? 1 : 0.5,
                                        x: 0,
                                    }}
                                    transition={{ delay: index * 0.05, duration: 0.3 }}
                                    hover
                                    sx={{
                                        "&:last-child td, &:last-child th": { border: 0 },
                                        cursor: "pointer",
                                        ...(isEventoAtivo(evento)
                                            ? {
                                                  borderLeft: "4px solid",
                                                  borderLeftColor: "success.main",
                                                  backgroundColor: "rgba(76, 175, 80, 0.08)",
                                              }
                                            : {
                                                  "&:hover": {
                                                      opacity: 0.8,
                                                  },
                                              }),
                                    }}
                                >
                                    <TableCell>
                                        <Typography variant="body2" fontWeight="bold">
                                            #{evento.eventoid}
                                        </Typography>
                                    </TableCell>
                                    <TableCell>
                                        <Typography variant="body2" fontWeight="bold">
                                            {evento.eventonome}
                                        </Typography>
                                        {evento.eventodescricao && (
                                            <Typography variant="caption" color="text.secondary">
                                                {evento.eventodescricao}
                                            </Typography>
                                        )}
                                    </TableCell>
                                    <TableCell>
                                        <Box display="flex" alignItems="center" gap={1}>
                                            <Person fontSize="small" />
                                            <Typography variant="body2">
                                                {evento.cliente?.nome || "N/A"}
                                            </Typography>
                                        </Box>
                                    </TableCell>
                                    <TableCell>
                                        <Box display="flex" alignItems="center" gap={1}>
                                            <AccessTime fontSize="small" color="action" />
                                            <Typography variant="body2">
                                                {new Date(evento.eventodatatempoinicio).toLocaleString("pt-BR")}
                                            </Typography>
                                        </Box>
                                    </TableCell>
                                    <TableCell>
                                        {evento.eventodatatempofim ? (
                                            <Typography variant="body2">
                                                {new Date(evento.eventodatatempofim).toLocaleString("pt-BR")}
                                            </Typography>
                                        ) : (
                                            <Chip label="Em aberto" size="small" color="warning" />
                                        )}
                                    </TableCell>
                                    <TableCell>
                                        <Chip
                                            label={formatStatus(evento.eventostatus)}
                                            size="small"
                                            color={getStatusColor(evento.eventostatus)}
                                        />
                                    </TableCell>
                                    <TableCell>
                                        <Box display="flex" alignItems="center" gap={0.5}>
                                            <Computer fontSize="small" />
                                            <Typography variant="body2">{evento.maquinas.length}</Typography>
                                        </Box>
                                    </TableCell>
                                    <TableCell align="center">
                                        <IconButton
                                            size="small"
                                            onClick={() => handleOpenDialog(evento)}
                                            color="primary"
                                        >
                                            <Edit fontSize="small" />
                                        </IconButton>
                                        <IconButton
                                            size="small"
                                            onClick={() => handleDeleteClick(evento)}
                                            color="error"
                                        >
                                            <Delete fontSize="small" />
                                        </IconButton>
                                    </TableCell>
                                </TableRow>
                            ))}
                            {filteredEventos.length === 0 && (
                                <TableRow>
                                    <TableCell colSpan={8}>
                                        <Box textAlign="center" py={4}>
                                            <Typography variant="h6" color="text.secondary">
                                                Nenhum evento encontrado
                                            </Typography>
                                        </Box>
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </TableContainer>
            </motion.div>

            {/* Create/Edit Dialog */}
            <Dialog open={dialogOpen} onClose={handleCloseDialog} maxWidth="md" fullWidth>
                <DialogTitle>
                    {editingEvento ? "Editar Evento" : "Novo Evento"}
                    <IconButton
                        onClick={handleCloseDialog}
                        sx={{ position: "absolute", right: 8, top: 8 }}
                    >
                        <Close />
                    </IconButton>
                </DialogTitle>
                <DialogContent>
                    <Box display="flex" flexDirection="column" gap={2} mt={2}>
                        <TextField
                            label="Nome do Evento *"
                            value={formData.nome}
                            onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                            fullWidth
                        />
                        <Autocomplete
                            options={clientes}
                            getOptionLabel={(option) => `${option.nome} (${option.cpf})`}
                            value={clientes.find((c) => c.cpf === formData.clienteCpf) || null}
                            onChange={(_, newValue) =>
                                setFormData({ ...formData, clienteCpf: newValue?.cpf || "" })
                            }
                            renderInput={(params) => (
                                <TextField {...params} label="Cliente *" />
                            )}
                        />
                        <TextField
                            label="Data/Hora Início *"
                            type="datetime-local"
                            value={formData.datatempoinicio}
                            onChange={(e) =>
                                setFormData({ ...formData, datatempoinicio: e.target.value })
                            }
                            fullWidth
                            InputLabelProps={{ shrink: true }}
                        />
                        <TextField
                            label="Data/Hora Fim"
                            type="datetime-local"
                            value={formData.datatempofim}
                            onChange={(e) =>
                                setFormData({ ...formData, datatempofim: e.target.value })
                            }
                            fullWidth
                            InputLabelProps={{ shrink: true }}
                        />
                        <FormControl fullWidth>
                            <InputLabel>Status</InputLabel>
                            <Select
                                value={formData.status}
                                label="Status"
                                onChange={(e) =>
                                    setFormData({ ...formData, status: e.target.value })
                                }
                            >
                                <MenuItem value="agendado">Agendado</MenuItem>
                                <MenuItem value="em andamento">Em Andamento</MenuItem>
                                <MenuItem value="concluido">Concluído</MenuItem>
                                <MenuItem value="cancelado">Cancelado</MenuItem>
                            </Select>
                        </FormControl>
                        <Autocomplete
                            multiple
                            options={maquinas}
                            getOptionLabel={(option) => `${option.nomeplat} (ID: ${option.id})`}
                            value={maquinas.filter((m) => formData.maquinaIds.includes(m.id))}
                            onChange={(_, newValue) =>
                                setFormData({ ...formData, maquinaIds: newValue.map((m) => m.id) })
                            }
                            renderInput={(params) => (
                                <TextField {...params} label="Máquinas *" />
                            )}
                        />
                    </Box>
                </DialogContent>
                <DialogActions>
                    <Button onClick={handleCloseDialog} disabled={saving}>
                        Cancelar
                    </Button>
                    <Button 
                        onClick={handleSubmit} 
                        variant="contained"
                        disabled={saving}
                        startIcon={saving ? <CircularProgress size={20} /> : null}
                    >
                        {saving ? "Salvando..." : editingEvento ? "Salvar" : "Criar"}
                    </Button>
                </DialogActions>
            </Dialog>

            {/* Delete Confirmation Dialog */}
            <Dialog open={deleteDialogOpen} onClose={() => setDeleteDialogOpen(false)}>
                <DialogTitle>Confirmar Exclusão</DialogTitle>
                <DialogContent>
                    <Alert severity="warning" icon={<Warning />}>
                        Tem certeza que deseja excluir o evento "{eventoToDelete?.eventonome}"?
                        Esta ação não pode ser desfeita.
                    </Alert>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setDeleteDialogOpen(false)}>Cancelar</Button>
                    <Button onClick={handleDeleteConfirm} variant="contained" color="error">
                        Excluir
                    </Button>
                </DialogActions>
            </Dialog>

            {/* Notification Snackbar */}
            <Snackbar
                open={snackbar.open}
                autoHideDuration={6000}
                onClose={handleCloseSnackbar}
                anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
            >
                <Alert
                    onClose={handleCloseSnackbar}
                    severity={snackbar.severity}
                    variant="filled"
                    sx={{ width: "100%" }}
                >
                    {snackbar.message}
                </Alert>
            </Snackbar>
        </Box>
    );
}
