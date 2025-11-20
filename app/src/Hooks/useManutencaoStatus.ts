import { useEffect, useState } from "react";
import type APIClient from "../API/APIClient";

export function useManutencaoStatus(client: APIClient, maquinaId: number | null) {
    const [emManutencao, setEmManutencao] = useState<boolean>(false);
    const [verificando, setVerificando] = useState<boolean>(true);

    useEffect(() => {
        if (!maquinaId) return;

        async function checkManutencao() {
            try {
                const response = await client.post<{ emManutencao: boolean }>('/pingMaquina', { id: maquinaId });
                setEmManutencao(response.emManutencao);
            } catch (error) {
                console.error('Erro ao verificar manutenção:', error);
            } finally {
                setVerificando(false);
            }
        }

        // Verificação inicial
        checkManutencao();

        // Verificação a cada 10 segundos
        const intervalId = setInterval(checkManutencao, 10 * 1000);

        return () => clearInterval(intervalId);
    }, [client, maquinaId]);

    return { emManutencao, verificando };
}
