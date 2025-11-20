import { Box, Button, Card, Chip, CircularProgress, LinearProgress, TextField, Typography, Paper, InputAdornment, IconButton, Divider, Stack, Avatar } from "@mui/material";
import styles from "./index.module.css";
import { useCallback, useState } from "react";
import { useNavigate, type NavigateFunction } from "react-router";
import type APIClient from "../../API/APIClient";
import { useMaquinaId } from "../../Hooks/useMaquinaId";
import { Computer, Lock, Person, Visibility, VisibilityOff, SportsEsports, AdminPanelSettings, Gamepad } from "@mui/icons-material";
import { motion, AnimatePresence } from "framer-motion";
import { useAppDispatch } from "../../Hooks/reduxHooks";
import { clearError } from "../../store/slices/userDataSlice";

export default function Home({ client }: { client: APIClient }) {
    const [error, setError] = useState<string | null>(null);
    const [username, setUsername] = useState<string>("");
    const [password, setPassword] = useState<string>("");
    const [loading, setLoading] = useState<boolean>(false);
    const [showPassword, setShowPassword] = useState<boolean>(false);

    const maquinaId = useMaquinaId();
    const dispatch = useAppDispatch();

    const navigate: NavigateFunction = useNavigate();

    const handleLogin = useCallback(async () => {
        setError(null);

        if (!username || !password) {
            setError("Por favor, preencha todos os campos.");
            return;
        }

        setLoading(true);

        try {
            let response = await client.login(username, password, 1);

            if (response) {
                // Limpa o erro do Redux que foi setado no logout
                dispatch(clearError());
                navigate("/dashboard");
            }
        } catch (e) {
            setError("Usuário ou senha incorretos.");
        } finally {
            setLoading(false);
        }
    }, [username, password, dispatch, navigate, client]);

    return (
        <div className={styles.container}>
            <video src={"/arena_video.mp4"} autoPlay={true} loop muted className={styles.bg} />
            <motion.div 
                className={styles.login}
                initial={{ opacity: 0, y: 50, scale: 0.9 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ duration: 0.6, ease: "easeOut" }}
            >
                {/* Header com ícone */}
                <motion.div
                    initial={{ scale: 0, rotate: -180 }}
                    animate={{ scale: 1, rotate: 0 }}
                    transition={{ delay: 0.2, duration: 0.5, type: "spring", stiffness: 200 }}
                >
                    <Stack direction="row" alignItems="center" justifyContent="center" spacing={2} mb={1}>
                        <Avatar sx={{ bgcolor: 'primary.main', width: 56, height: 56 }}>
                            <SportsEsports fontSize="large" />
                        </Avatar>
                    </Stack>
                </motion.div>
                
                <motion.div
                    initial={{ opacity: 0, x: -50 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.3, duration: 0.5 }}
                >
                    <Typography variant="h3" gutterBottom textAlign={"center"} fontWeight={700}>
                        Arena Gamer
                    </Typography>
                </motion.div>

                <motion.div
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.4, duration: 0.4 }}
                >
                    <Divider sx={{ mb: 3 }}>
                        <Chip icon={<Computer />} label="Terminal de Acesso" size="small" />
                    </Divider>
                </motion.div>

                <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.5, duration: 0.5 }}
                >
                    <Box mt={2}>
                        <Typography variant="subtitle1" gutterBottom textAlign={"center"} fontWeight={600}>
                            Computador
                        </Typography>
                        <motion.div
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            transition={{ delay: 0.6, type: "spring", stiffness: 150 }}
                            whileHover={{ scale: 1.05 }}
                        >
                            <Paper 
                                elevation={3}
                                sx={{ 
                                    borderRadius: "16px", 
                                    bgcolor: "primary.main", 
                                    height: 96, 
                                    fontSize: 52, 
                                    aspectRatio: 1, 
                                    margin: "0 auto", 
                                    mb: 3, 
                                    display: 'flex', 
                                    alignItems: 'center', 
                                    justifyContent: 'center',
                                    border: '3px solid',
                                    borderColor: 'primary.dark'
                                }}
                            >
                                {maquinaId ? maquinaId : <CircularProgress color="inherit" />}
                            </Paper>
                        </motion.div>
                        
                        <motion.div
                            initial={{ opacity: 0, x: -30 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: 0.7, duration: 0.4 }}
                        >
                            <TextField 
                                error={!!error} 
                                fullWidth 
                                label="Usuário" 
                                variant="outlined" 
                                value={username} 
                                onChange={(e) => setUsername(e.target.value)}
                                InputProps={{
                                    startAdornment: (
                                        <InputAdornment position="start">
                                            <Person />
                                        </InputAdornment>
                                    ),
                                }}
                            />
                        </motion.div>
                        
                        <motion.div
                            initial={{ opacity: 0, x: -30 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: 0.8, duration: 0.4 }}
                        >
                            <TextField
                                error={!!error}
                                fullWidth
                                label="Senha"
                                type={showPassword ? "text" : "password"}
                                variant="outlined"
                                sx={{ marginTop: 2 }}
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                InputProps={{
                                    startAdornment: (
                                        <InputAdornment position="start">
                                            <Lock />
                                        </InputAdornment>
                                    ),
                                    endAdornment: (
                                        <InputAdornment position="end">
                                            <IconButton
                                                onClick={() => setShowPassword(!showPassword)}
                                                edge="end"
                                            >
                                                {showPassword ? <VisibilityOff /> : <Visibility />}
                                            </IconButton>
                                        </InputAdornment>
                                    ),
                                }}
                            />
                        </motion.div>
                    </Box>
                </motion.div>

                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.9, duration: 0.4 }}
                >
                    <Box mt={4}>
                        <motion.div
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                        >
                            <Button 
                                disabled={loading} 
                                onClick={handleLogin} 
                                fullWidth 
                                variant="contained" 
                                color="primary"
                                size="large"
                                startIcon={<Gamepad />}
                            >
                                Entrar
                            </Button>
                        </motion.div>

                        <Divider sx={{ my: 2 }}>
                            <Typography variant="caption" color="text.secondary">ou</Typography>
                        </Divider>

                        <motion.div
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                        >
                            <Button 
                                fullWidth 
                                variant="outlined" 
                                startIcon={<AdminPanelSettings />}
                                sx={{ borderStyle: 'dashed' }}
                            >
                                Chamar Administrador
                            </Button>
                        </motion.div>

                        <AnimatePresence>
                            {
                                error && (
                                    <motion.div
                                        initial={{ opacity: 0, y: -10, scale: 0.8 }}
                                        animate={{ opacity: 1, y: 0, scale: 1 }}
                                        exit={{ opacity: 0, scale: 0.8 }}
                                        transition={{ duration: 0.3 }}
                                    >
                                        <Chip
                                            label={error}
                                            color="error"
                                            sx={{ marginTop: 2, width: '100%' }}
                                            onDelete={() => setError(null)}
                                        />
                                    </motion.div>
                                )
                            }
                        </AnimatePresence>

                        <AnimatePresence>
                            {
                                loading && (
                                    <motion.div
                                        initial={{ opacity: 0, height: 0 }}
                                        animate={{ opacity: 1, height: "auto" }}
                                        exit={{ opacity: 0, height: 0 }}
                                        transition={{ duration: 0.3 }}
                                    >
                                        <Box mt={2}>
                                            <LinearProgress />
                                            <Typography variant="caption" textAlign="center" display="block" mt={1}>
                                                Autenticando...
                                            </Typography>
                                        </Box>
                                    </motion.div>
                                )
                            }
                        </AnimatePresence>
                    </Box>
                </motion.div>

                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 1.1, duration: 0.5 }}
                >
                    <Divider sx={{ mt: 'auto', mb: 2 }} />
                    
                    <Stack direction="row" spacing={1} justifyContent="center" mb={1}>
                        <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.95 }}>
                            <Chip label="v1.0" size="small" variant="outlined" />
                        </motion.div>
                        <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.95 }}>
                            <Chip label="Seguro" size="small" variant="outlined" icon={<Lock fontSize="small" />} />
                        </motion.div>
                    </Stack>
                    
                    <Typography variant="caption" display="block" textAlign={"center"} color="text.secondary">
                        Sistema desenvolvido por Grupo 06
                    </Typography>
                </motion.div>
            </motion.div>

        </div>
    )
}