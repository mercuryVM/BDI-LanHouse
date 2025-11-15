import { useEffect, useState, useMemo } from "react";
import type { Sessao } from "../../../API/APIClient";
import type APIClient from "../../../API/APIClient";
import type { UserData } from "../../../API/APIClient";
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
    InputAdornment
} from "@mui/material";
import { Person, AccessTime, Schedule, Search, FilterList, CheckCircle, PlayArrow } from "@mui/icons-material";
import { motion, AnimatePresence } from "framer-motion";

export function Sessoes({ client }: { client: APIClient, userData: UserData | null }) {
    const [sessoes, setSessoes] = useState<Sessao[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState("");
    const [statusFilter, setStatusFilter] = useState<string | null>(null);

    useEffect(() => {
        const fetchSessoes = async () => {
            try {
                const data = await client.getSessoes();
                setSessoes(data);
            } catch (error) {
                console.error("Erro ao carregar sessões:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchSessoes();
    }, [client]);

    const formatDateTime = (date: Date) => {
        return new Date(date).toLocaleString('pt-BR', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    const calculateDuration = (inicio: Date, fim: Date | null) => {
        const end = fim ? new Date(fim) : new Date();
        const start = new Date(inicio);
        const diff = Math.floor((end.getTime() - start.getTime()) / 1000 / 60); // minutos
        const horas = Math.floor(diff / 60);
        const mins = diff % 60;
        return `${horas}h ${mins}m`;
    };

    const filteredSessoes = useMemo(() => {
        let filtered = [...sessoes];

        // Filtro de busca
        if (searchQuery) {
            filtered = filtered.filter(sessao => 
                sessao.cliente.nome?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                sessao.cliente.cpf?.includes(searchQuery)
            );
        }

        // Filtro de status
        if (statusFilter === 'ativa') {
            filtered = filtered.filter(sessao => !sessao.datatempofim);
        } else if (statusFilter === 'encerrada') {
            filtered = filtered.filter(sessao => sessao.datatempofim);
        }

        return filtered;
    }, [sessoes, searchQuery, statusFilter]);

    if (loading) {
        return (
            <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
                <CircularProgress />
            </Box>
        );
    }

    return (
        <Box sx={{ p: 3, display: 'flex', flexDirection: 'column', gap: 2, height: '100%', overflow: 'hidden' }}>
            <Box>
                <motion.div
                    initial={{ opacity: 0, x: -30 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.5 }}
                >
                    <Typography variant="h4" component="h1" gutterBottom>
                        <FilterList sx={{ fontSize: 32, verticalAlign: "middle", mr: 1 }} />
                        Sessões
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
                        placeholder="Buscar por nome ou CPF do cliente..."
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
                    <Box display="flex" gap={2} flexWrap="wrap" alignItems="center">
                        {/* Filtro de Status */}
                        <ToggleButtonGroup
                            value={statusFilter}
                            exclusive
                            onChange={(_e, value) => setStatusFilter(value)}
                            size="small"
                        >
                            <ToggleButton value="ativa">
                                <PlayArrow fontSize="small" sx={{ mr: 0.5 }} /> Ativas
                            </ToggleButton>
                            <ToggleButton value="encerrada">
                                <CheckCircle fontSize="small" sx={{ mr: 0.5 }} /> Encerradas
                            </ToggleButton>
                        </ToggleButtonGroup>

                        <Box flex={1} />

                        {/* Contador */}
                        <Typography variant="body2" color="text.secondary">
                            {filteredSessoes.length} sess{filteredSessoes.length !== 1 ? 'ões' : 'ão'}
                        </Typography>

                        {/* Botão Limpar */}
                        <AnimatePresence>
                            {(searchQuery || statusFilter) && (
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
            </Box>

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
                                <TableCell>Cliente</TableCell>
                                <TableCell align="center">Máquina</TableCell>
                                <TableCell align="center">Início</TableCell>
                                <TableCell align="center">Fim</TableCell>
                                <TableCell align="center">Duração</TableCell>
                                <TableCell align="center">Status</TableCell>
                                <TableCell align="center">Motivo Término</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                                {filteredSessoes.map((sessao, index) => (
                                    <TableRow
                                        key={`${sessao.cliente.cpf}_${sessao.datatempoinicio}`}
                                        component={motion.tr}
                                        initial={{ opacity: 0, x: -20 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        transition={{ delay: index * 0.05, duration: 0.3 }}
                                        sx={{ '&:last-child td, &:last-child th': { border: 0 } }}
                                        hover
                                    >
                                <TableCell component="th" scope="row">
                                    <Box display="flex" alignItems="center" gap={1}>
                                        <Avatar sx={{ width: 32, height: 32, bgcolor: 'primary.main' }}>
                                            {sessao.cliente.nome?.charAt(0).toUpperCase()}
                                        </Avatar>
                                        <Box>
                                            <Typography variant="body2" fontWeight="bold">
                                                {sessao.cliente.nome}
                                            </Typography>
                                            <Typography variant="caption" color="text.secondary">
                                                {sessao.cliente.cpf}
                                            </Typography>
                                        </Box>
                                    </Box>
                                </TableCell>
                                <TableCell align="center">
                                    <Chip 
                                        label={`Máquina ${sessao.maquina?.id || '?'}`} 
                                        size="small" 
                                        variant="outlined"
                                        color="primary"
                                    />
                                </TableCell>
                                <TableCell align="center">
                                    <Box display="flex" alignItems="center" justifyContent="center" gap={0.5}>
                                        <Schedule fontSize="small" color="action" />
                                        <Typography variant="body2">
                                            {formatDateTime(sessao.datatempoinicio)}
                                        </Typography>
                                    </Box>
                                </TableCell>
                                <TableCell align="center">
                                    {sessao.datatempofim ? (
                                        <Box display="flex" alignItems="center" justifyContent="center" gap={0.5}>
                                            <Schedule fontSize="small" color="action" />
                                            <Typography variant="body2">
                                                {formatDateTime(sessao.datatempofim)}
                                            </Typography>
                                        </Box>
                                    ) : (
                                        <Typography variant="body2" color="text.secondary">
                                            Em andamento
                                        </Typography>
                                    )}
                                </TableCell>
                                <TableCell align="center">
                                    <Box display="flex" alignItems="center" justifyContent="center" gap={0.5}>
                                        <AccessTime fontSize="small" color="action" />
                                        <Typography variant="body2">
                                            {calculateDuration(sessao.datatempoinicio, sessao.datatempofim)}
                                        </Typography>
                                    </Box>
                                </TableCell>
                                <TableCell align="center">
                                    {sessao.datatempofim ? (
                                        <Chip label="Encerrada" size="small" color="default" variant="outlined" />
                                    ) : (
                                        <Chip label="Ativa" size="small" color="success" />
                                    )}
                                </TableCell>
                                <TableCell align="center">
                                    <Typography variant="body2" color="text.secondary">
                                        {sessao.motivotermino || '-'}
                                    </Typography>
                                </TableCell>
                            </TableRow>
                        ))}
                        {filteredSessoes.length === 0 && (
                            <TableRow>
                                <TableCell colSpan={7}>
                                    <Box textAlign="center" py={4}>
                                        <Typography variant="h6" color="text.secondary">
                                            Nenhuma sessão encontrada
                                        </Typography>
                                    </Box>
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </TableContainer>
            </motion.div>
        </Box>
    );
}