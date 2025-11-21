import { AppBar, CircularProgress, Dialog, DialogContent, Tab, Tabs } from "@mui/material";
import HomeIcon from "@mui/icons-material/HomeFilled";
import GameIcon from "@mui/icons-material/SportsEsports";
import UserIcon from "@mui/icons-material/Group";
import SessionIcon from "@mui/icons-material/Computer";
import MaquinasIcon from "@mui/icons-material/ComputerTwoTone";
import ComprasIcon from "@mui/icons-material/ShoppingCart";
import ReceiptIcon from "@mui/icons-material/Receipt";
import React, { useMemo, useEffect } from "react";
import { useSearchParams, useNavigate } from "react-router";
import { Home } from "./Home";
import type APIClient from "../../API/APIClient";
import { useUserDataRedux } from "../../hooks/useUserDataRedux";
import { useMaquinaId } from "../../Hooks/useMaquinaId";
import { useManutencaoStatus } from "../../Hooks/useManutencaoStatus";
import { Game } from "./Game";
import { Clientes } from "./Clientes";
import { Sessoes } from "./Sessoes/Sessoes";
import { Maquinas } from "./Maquinas";
import { Pacotes } from "./Pacotes";
import { Manutencao } from "./Manutencao";
import { Hardware } from "./Hardware";
import { Comandas } from "./Comandas";


const tabs = [
    {
        label: "Início",
        icon: <HomeIcon />,
        renderer: Home
    },
    {
        label: "Jogos",
        icon: <GameIcon />,
        renderer: Game
    },
    {
        label: "Clientes",
        icon: <UserIcon />,
        permission: 'clt',
        renderer: Clientes
    },
    {
        label: "Sessões",
        icon: <SessionIcon />,
        permission: 'clt',
        renderer: Sessoes
    },
    {
        label: "Máquinas",
        icon: <MaquinasIcon />,
        permission: 'clt',
        renderer: Maquinas
    },
    {
        label: "Pacotes",
        icon: <ComprasIcon />,
        permission: 'clt',
        renderer: Pacotes
    },
    {
        label: "Comandas",
        icon: <ReceiptIcon />,
        permission: 'clt',
        renderer: Comandas
    }, 
    {
        label: "Manutenções",
        icon: <MaquinasIcon />,
        permission: 'clt',
        renderer: Manutencao
    },
    {
        label: "Hardware",
        icon: <MaquinasIcon />,
        permission: 'clt',
        renderer: Hardware
    }
]

export default function Dashboard({ client }: { client: APIClient }) {
    const [searchParams, setSearchParams] = useSearchParams();
    const [value, setValue] = React.useState(0);
    const { userData } = useUserDataRedux(client, true);
    const navigate = useNavigate();
    const maquinaId = useMaquinaId();
    const { emManutencao } = useManutencaoStatus(client, maquinaId);

    const userRole = useMemo(() => {
        return userData?.role;
    }, [userData])

    // Verifica se há uma tab na URL e muda para ela
    useEffect(() => {
        const tabParam = searchParams.get('tab');
        if (tabParam) {
            const tabIndex = tabs.findIndex(tab => 
                tab.label.toLowerCase() === tabParam.toLowerCase()
            );
            if (tabIndex !== -1) {
                setValue(tabIndex);
            }
        }
    }, [searchParams]);

    // Desconecta o usuário se a máquina entrar em manutenção
    useEffect(() => {
        console.log('Manutenção status changed:', emManutencao);
        if (emManutencao && userData) {
            // Fazer logout
            client.logout().then(() => {
                navigate('/');
            }).catch((error) => {
                console.error('Erro ao fazer logout:', error);
                // Mesmo com erro, redireciona
                navigate('/');
            });
        }
    }, [emManutencao, userData, client, navigate]);

    const handleChange = (_event: React.SyntheticEvent, newValue: number) => {
        setValue(newValue);
        // Remove os parâmetros da URL ao trocar de tab manualmente
        setSearchParams({});
    };

    const Renderer = tabs[value].renderer;

    return (
        <>
            <AppBar position="static">
                <Tabs variant="fullWidth" value={value} onChange={handleChange}>
                    {tabs.map((tab, index) => {
                        if (tab.permission && tab.permission !== userRole) {
                            return null;
                        }

                        return (
                            <Tab
                                value={index}
                                key={index}
                                label={tab.label}
                                icon={tab.icon}
                            />
                        )
                    })}
                </Tabs>
            </AppBar>

            {
                !userData && (
                    <Dialog open={true}>
                        <DialogContent>
                            <CircularProgress />
                        </DialogContent>
                    </Dialog>
                )
            }

            {
                userData && Renderer && <Renderer userData={userData} client={client} />
            }
        </>
    )
}