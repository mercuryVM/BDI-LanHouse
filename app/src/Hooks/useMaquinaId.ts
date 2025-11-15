import { useEffect, useState } from "react";

export function useMaquinaId() {
    const [maquinaId, setMaquinaId] = useState<number | null>(null);

    useEffect(() => {
        async function fetchMaquinaId() {
            try {
                const id = await window.api.getMaquinaId();
                setMaquinaId(id);
            }
            catch (error) {
                console.error("Failed to get Maquina ID:", error);
            }
        }

        fetchMaquinaId();
    }, []);

    return maquinaId;
}