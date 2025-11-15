import { Box, Button, Card, Chip, CircularProgress, LinearProgress, TextField, Typography } from "@mui/material";
import styles from "./index.module.css";
import { useCallback, useState } from "react";
import { useNavigate, type NavigateFunction } from "react-router";
import type APIClient from "../../API/APIClient";
import { useMaquinaId } from "../../Hooks/useMaquinaId";

export default function Home({ client }: { client: APIClient }) {
    const [error, setError] = useState<string | null>(null);
    const [username, setUsername] = useState<string>("");
    const [password, setPassword] = useState<string>("");
    const [loading, setLoading] = useState<boolean>(false);

    const maquinaId = useMaquinaId();

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
                navigate("/dashboard");
            }
        } catch (e) {
            setError("Usuário ou senha incorretos.");
        } finally {
            setLoading(false);
        }
    }, [username, password]);

    return (
        <div className={styles.container}>
            <video src={"/arena_video.mp4"} autoPlay={true} loop muted className={styles.bg} />
            <div className={styles.login}>
                <Typography variant="h3" gutterBottom textAlign={"center"}>
                    Arena Gamer
                </Typography>

                <Box mt={4}>
                    <Typography variant="h6" gutterBottom textAlign={"center"}>
                        Computador
                    </Typography>
                    <Box sx={{ borderRadius: "50%", bgcolor: "primary.main", height: 96, fontSize: 52, aspectRatio: 1, margin: "0 auto", mb: 2, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        {maquinaId ? maquinaId : <CircularProgress color="inherit" />}
                    </Box>
                    <TextField error={!!error} fullWidth label="Usuário" variant="outlined" value={username} onChange={(e) => setUsername(e.target.value)} />
                    <TextField
                        error={!!error}
                        fullWidth
                        label="Senha"
                        type="password"
                        variant="outlined"
                        sx={{ marginTop: 2 }}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                    />
                </Box>

                <Box mt={4}>
                    <Button disabled={loading} onClick={handleLogin} fullWidth variant="contained" color="primary">
                        Entrar
                    </Button>

                    <Button fullWidth variant="text" sx={{ marginTop: 2 }}>
                        Chamar Administrador
                    </Button>

                    {
                        error && (
                            <Chip
                                label={error}
                                color="error"
                                sx={{ marginTop: 2, width: '100%' }}
                            />
                        )
                    }

                    {
                        loading && (
                            <LinearProgress />
                        )
                    }
                </Box>

                <Typography variant="caption" display="block" mt={"auto"} textAlign={"center"}>
                    Sistema desenvolvido por Grupo 06
                </Typography>
            </div>

        </div>
    )
}