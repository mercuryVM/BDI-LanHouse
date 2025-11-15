import type { Game, UserData } from "../../../API/APIClient";
import type APIClient from "../../../API/APIClient";
import { useUserDataRedux } from "../../../hooks/useUserDataRedux";
import { GameCard } from "../../../Components/GameCard";
import { useState, useEffect, useMemo } from "react";
import React from "react";
import styles from './index.module.css';
import { motion, AnimatePresence } from "framer-motion";
import { 
    CircularProgress, 
    Dialog, 
    DialogContent, 
    Button, 
    Box, 
    Typography, 
    Chip,
    IconButton,
    TextField,
    ToggleButton,
    ToggleButtonGroup,
    InputAdornment,
    Select,
    MenuItem,
    Checkbox,
    ListItemText,
    FormControl,
    InputLabel
} from "@mui/material";
import { 
    Close, 
    PlayArrow, 
    People, 
    ChildCare, 
    Computer,
    SportsEsports,
    SportsBasketball,
    Search,
    FilterList
} from "@mui/icons-material";

export function Game({ client, userData }: { client: APIClient, userData: UserData | null }) {
    const [games, setGames] = useState<Game[] | null>(null);
    const [selectedGame, setSelectedGame] = useState<Game | null>(null);
    const [searchQuery, setSearchQuery] = useState("");
    const [platformFilter, setPlatformFilter] = useState<string[]>([]);
    const [multiplayerFilter, setMultiplayerFilter] = useState<string | null>(null);
    const [ageFilter, setAgeFilter] = useState<string | null>(null);

    useEffect(() => {
        client.getAllJogos().then(setGames).catch(console.error);
    }, [client]);

    const plataforma = useMemo<string>(() => {
        if (userData?.maquina.nomeplat) {
            return userData.maquina.nomeplat;
        }
        return "";
    }, [userData]);

    const filteredAndSortedGames = useMemo(() => {
        if (!games) return null;
        
        let filtered = [...games];

        // Filtro de busca por nome
        if (searchQuery) {
            filtered = filtered.filter(game => 
                game.nome.toLowerCase().includes(searchQuery.toLowerCase())
            );
        }

        // Filtro de plataforma
        if (platformFilter.length > 0) {
            filtered = filtered.filter(game =>
                platformFilter.some(plat => game.plataformas.includes(plat))
            );
        }

        // Filtro de multiplayer
        if (multiplayerFilter === 'multi') {
            filtered = filtered.filter(game => game.multiplayer);
        } else if (multiplayerFilter === 'single') {
            filtered = filtered.filter(game => !game.multiplayer);
        }

        // Filtro de idade
        if (ageFilter) {
            const maxAge = parseInt(ageFilter);
            filtered = filtered.filter(game => game.idadeRecomendada <= maxAge);
        }

        // Ordena por disponibilidade na plataforma, depois por nome
        return filtered.sort((a, b) => {
            const aAvailable = a.plataformas.includes(plataforma) ? 0 : 1;
            const bAvailable = b.plataformas.includes(plataforma) ? 0 : 1;
            if (aAvailable !== bAvailable) {
                return aAvailable - bAvailable;
            }
            return a.nome.localeCompare(b.nome);
        });
    }, [games, plataforma, searchQuery, platformFilter, multiplayerFilter, ageFilter])

    const handleGameClick = (game: Game) => {
        setSelectedGame(game);
    };

    const handleCloseModal = () => {
        setSelectedGame(null);
    };

    const handlePlayGame = async () => {
        if (!selectedGame) return;
        
        try {
            // Usar IPC para executar o jogo no processo principal
            if ((window as any).api?.launchGame) {
                await (window as any).api.launchGame(selectedGame.inicializacao);
                handleCloseModal();
            } else {
                console.error('API de lançamento de jogo não disponível');
                alert('Erro: API de lançamento não disponível');
            }
        } catch (error) {
            console.error('Erro ao iniciar o jogo:', error);
            alert('Erro ao iniciar o jogo');
        }
    };

    const getPlatformIcon = (platform: string) => {
        if (platform.toLowerCase().includes('pc')) return <Computer />;
        if (platform.toLowerCase().includes('console')) return <SportsEsports />;
        if (platform.toLowerCase().includes('simulador')) return <SportsBasketball />;
        return <Computer />;
    };

    const allPlatforms = useMemo(() => {
        if (!games) return [];
        const platforms = new Set<string>();
        games.forEach(game => game.plataformas.forEach(plat => platforms.add(plat)));
        return Array.from(platforms);
    }, [games]);

    return (
        <div style={{ display: "flex", flex: 1, backgroundColor: "#242424", height: "calc(100vh - 64px)", overflow: "auto" }}>
            <div className={styles.container}>
                <Box className={styles.header}>
                    <motion.div
                        initial={{ opacity: 0, x: -30 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.5 }}
                    >
                        <Typography variant="h4" component="h2" gutterBottom>
                            <FilterList sx={{ fontSize: 32, verticalAlign: "middle", mr: 1 }} />
                            Catálogo de Jogos
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
                            placeholder="Buscar jogos..."
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
                            {/* Filtro de Plataforma com Checkbox */}
                            <FormControl size="small" sx={{ minWidth: 150 }}>
                                <InputLabel>Plataformas</InputLabel>
                                <Select
                                    multiple
                                    value={platformFilter}
                                    onChange={(e) => setPlatformFilter(e.target.value as string[])}
                                    label="Plataformas"
                                    renderValue={(selected) => `${selected.length} selecionada${selected.length !== 1 ? 's' : ''}`}
                                >
                                    {allPlatforms.map((plat) => (
                                        <MenuItem key={plat} value={plat}>
                                            <Checkbox checked={platformFilter.includes(plat)} />
                                            <ListItemText primary={plat} />
                                            {getPlatformIcon(plat)}
                                        </MenuItem>
                                    ))}
                                </Select>
                            </FormControl>

                            <Box sx={{ borderLeft: 1, borderColor: 'divider', height: 30, mx: 1 }} />

                            {/* Filtro de Multiplayer */}
                            <ToggleButtonGroup
                                value={multiplayerFilter}
                                exclusive
                                onChange={(_e, value) => setMultiplayerFilter(value)}
                                size="small"
                            >
                                <ToggleButton value="multi">
                                    <People fontSize="small" />
                                </ToggleButton>
                                <ToggleButton value="single">
                                    <Computer fontSize="small" />
                                </ToggleButton>
                            </ToggleButtonGroup>

                            <Box sx={{ borderLeft: 1, borderColor: 'divider', height: 30, mx: 1 }} />

                            {/* Filtro de Idade */}
                            <ToggleButtonGroup
                                value={ageFilter}
                                exclusive
                                onChange={(_e, value) => setAgeFilter(value)}
                                size="small"
                            >
                                <ToggleButton value="0">L</ToggleButton>
                                <ToggleButton value="10">10+</ToggleButton>
                                <ToggleButton value="12">12+</ToggleButton>
                                <ToggleButton value="16">16+</ToggleButton>
                                <ToggleButton value="18">18+</ToggleButton>
                            </ToggleButtonGroup>

                            <Box flex={1} />

                            {/* Contador e Limpar */}
                            <Typography variant="body2" color="text.secondary">
                                {filteredAndSortedGames?.length || 0} jogos
                            </Typography>
                            
                            <AnimatePresence>
                                {(searchQuery || platformFilter.length > 0 || multiplayerFilter || ageFilter) && (
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
                                                setPlatformFilter([]);
                                                setMultiplayerFilter(null);
                                                setAgeFilter(null);
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

                <div className={styles.gamesGrid}>
                    {!games && (
                        <Dialog open={true}>
                            <DialogContent>
                                <CircularProgress />
                            </DialogContent>
                        </Dialog>
                    )}

                    <AnimatePresence mode="popLayout">
                        {filteredAndSortedGames && filteredAndSortedGames.map((game, index) => (
                            <motion.div
                                key={game.id}
                                initial={{ opacity: 0, scale: 0.8, y: 20 }}
                                animate={{ opacity: 1, scale: 1, y: 0 }}
                                exit={{ opacity: 0, scale: 0.8 }}
                                transition={{ 
                                    duration: 0.3,
                                    delay: index * 0.05,
                                    ease: "easeOut"
                                }}
                                layout
                                onClick={() => handleGameClick(game)}
                            >
                                <motion.div
                                    whileHover={{ scale: 1.05, y: -5 }}
                                    whileTap={{ scale: 0.95 }}
                                    transition={{ type: "spring", stiffness: 300 }}
                                >
                                    <GameCard game={game} disabled={!game.plataformas.includes(plataforma)} />
                                </motion.div>
                            </motion.div>
                        ))}
                    </AnimatePresence>

                    <AnimatePresence>
                        {filteredAndSortedGames && filteredAndSortedGames.length === 0 && (
                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0 }}
                                transition={{ duration: 0.4 }}
                            >
                                <Box textAlign="center" py={8}>
                                    <Typography variant="h6" color="text.secondary">
                                        Nenhum jogo encontrado com os filtros selecionados
                                    </Typography>
                                </Box>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </div>

            {/* Modal de Detalhes do Jogo */}
            <AnimatePresence>
                {selectedGame && (
                    <Dialog 
                        open={selectedGame !== null} 
                        onClose={handleCloseModal}
                        maxWidth="lg"
                        fullWidth
                        PaperProps={{
                            sx: {
                                maxHeight: '90vh',
                                height: '600px'
                            }
                        }}
                    >
                        <motion.div
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.9 }}
                            transition={{ duration: 0.3 }}
                            style={{ height: '100%', display: 'flex', flexDirection: 'column' }}
                        >
                            <DialogContent sx={{ p: 0, flex: 1, overflow: 'hidden' }}>
                                <Box display="flex" gap={0} sx={{ height: '100%' }}>
                                    {/* Banner à esquerda - formato 9:16 */}
                                    <motion.div
                                        initial={{ opacity: 0, x: -30 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        transition={{ delay: 0.2 }}
                                        style={{ width: '45%', height: '100%', position: 'relative' }}
                                    >
                                        <Box
                                            component="img"
                                            src={"http://localhost:8080/public/" + selectedGame.urlImagem}
                                            alt={selectedGame.nome}
                                            sx={{
                                                width: '100%',
                                                height: '100%',
                                                objectFit: 'cover',
                                            }}
                                        />
                                        {/* Botão fechar sobre a imagem */}
                                        <motion.div 
                                            whileHover={{ rotate: 90 }} 
                                            transition={{ duration: 0.2 }}
                                            style={{ position: 'absolute', top: 8, right: 8 }}
                                        >
                                            <IconButton 
                                                onClick={handleCloseModal}
                                                sx={{ 
                                                    bgcolor: 'rgba(0,0,0,0.6)', 
                                                    '&:hover': { bgcolor: 'rgba(0,0,0,0.8)' } 
                                                }}
                                            >
                                                <Close />
                                            </IconButton>
                                        </motion.div>
                                    </motion.div>

                                    {/* Informações à direita */}
                                    <Box 
                                        sx={{ 
                                            width: '55%', 
                                            p: 4, 
                                            display: 'flex', 
                                            flexDirection: 'column', 
                                            gap: 3,
                                            overflowY: 'auto'
                                        }}
                                    >
                                        {/* Título do jogo */}
                                        <motion.div
                                            initial={{ x: 20, opacity: 0 }}
                                            animate={{ x: 0, opacity: 1 }}
                                            transition={{ delay: 0.1 }}
                                        >
                                            <Typography variant="h4" component="div" fontWeight={700}>
                                                {selectedGame.nome}
                                            </Typography>
                                        </motion.div>
                                        {/* Chips de Informações */}
                                        <motion.div
                                            initial={{ opacity: 0, x: 20 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            transition={{ delay: 0.3 }}
                                        >
                                            <Box display="flex" gap={1} flexWrap="wrap">
                                                <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.95 }}>
                                                    <Chip 
                                                        icon={<ChildCare />} 
                                                        label={`${selectedGame.idadeRecomendada}+ anos`}
                                                        color="primary"
                                                        variant="outlined"
                                                    />
                                                </motion.div>
                                                <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.95 }}>
                                                    <Chip 
                                                        icon={<People />} 
                                                        label={selectedGame.multiplayer ? 'Multiplayer' : 'Single Player'}
                                                        color="secondary"
                                                        variant="outlined"
                                                    />
                                                </motion.div>
                                                {selectedGame.plataformas.map((plat, idx) => (
                                                    <motion.div 
                                                        key={plat}
                                                        initial={{ opacity: 0, scale: 0.8 }}
                                                        animate={{ opacity: 1, scale: 1 }}
                                                        transition={{ delay: 0.4 + idx * 0.1 }}
                                                        whileHover={{ scale: 1.1 }} 
                                                        whileTap={{ scale: 0.95 }}
                                                    >
                                                        <Chip 
                                                            icon={getPlatformIcon(plat)}
                                                            label={plat}
                                                            variant="outlined"
                                                        />
                                                    </motion.div>
                                                ))}
                                            </Box>
                                        </motion.div>

                                        {/* Descrição */}
                                        <motion.div
                                            initial={{ opacity: 0, y: 20 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            transition={{ delay: 0.4 }}
                                        >
                                            <Box>
                                                <Typography variant="h6" gutterBottom>
                                                    Descrição
                                                </Typography>
                                                <Typography variant="body1" color="text.secondary">
                                                    {selectedGame.descricao}
                                                </Typography>
                                            </Box>
                                        </motion.div>

                                        {/* Aviso de Disponibilidade */}
                                        {!selectedGame.plataformas.includes(plataforma) && (
                                            <motion.div
                                                initial={{ opacity: 0, scale: 0.9 }}
                                                animate={{ opacity: 1, scale: 1 }}
                                                transition={{ delay: 0.5, type: "spring" }}
                                            >
                                                <Box 
                                                    sx={{ 
                                                        p: 2, 
                                                        bgcolor: 'warning.main', 
                                                        borderRadius: 1,
                                                        color: 'warning.contrastText'
                                                    }}
                                                >
                                                    <Typography variant="body2">
                                                        ⚠️ Este jogo não está disponível na plataforma atual ({plataforma})
                                                    </Typography>
                                                </Box>
                                            </motion.div>
                                        )}

                                        {/* Botões de Ação */}
                                        <Box sx={{ mt: 'auto', display: 'flex', gap: 2, pt: 2 }}>
                                            <motion.div
                                                initial={{ opacity: 0, x: -20 }}
                                                animate={{ opacity: 1, x: 0 }}
                                                transition={{ delay: 0.5 }}
                                                style={{ flex: 1 }}
                                            >
                                                <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                                                    <Button onClick={handleCloseModal} size="large" fullWidth>
                                                        Fechar
                                                    </Button>
                                                </motion.div>
                                            </motion.div>
                                            <motion.div
                                                initial={{ opacity: 0, scale: 0.8 }}
                                                animate={{ opacity: 1, scale: 1 }}
                                                transition={{ delay: 0.6, type: "spring" }}
                                                style={{ flex: 1 }}
                                            >
                                                <motion.div 
                                                    whileHover={{ scale: 1.05 }} 
                                                    whileTap={{ scale: 0.95 }}
                                                >
                                                    <Button 
                                                        variant="contained" 
                                                        size="large"
                                                        fullWidth
                                                        startIcon={<PlayArrow />}
                                                        onClick={handlePlayGame}
                                                        disabled={!selectedGame.plataformas.includes(plataforma)}
                                                    >
                                                        Jogar
                                                    </Button>
                                                </motion.div>
                                            </motion.div>
                                        </Box>
                                    </Box>
                                </Box>
                            </DialogContent>
                        </motion.div>
                    </Dialog>
                )}
            </AnimatePresence>
        </div>
    )
}