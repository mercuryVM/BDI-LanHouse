import { AppBar, Tab, Tabs } from "@mui/material";
import HomeIcon from "@mui/icons-material/HomeFilled";
import GameIcon from "@mui/icons-material/SportsEsports";
import UserIcon from "@mui/icons-material/Group";
import React, { useMemo } from "react";
import { Home } from "./Home";
import type APIClient from "../../API/APIClient";
import { useUserData } from "../../Hooks/useUserData";


const tabs = [
    {
        label: "Início",
        icon: <HomeIcon />,
        renderer: Home
    },
    {
        label: "Jogos",
        icon: <GameIcon />,
    },
    {
        label: "Usuários",
        icon: <UserIcon />,
        permission: 'clt'
    }
]

export default function Dashboard({ client }: { client: APIClient }) {
    const [value, setValue] = React.useState(0);
    const userData = useUserData(client);

    const userRole = useMemo(() => {
        return userData?.role;
    }, [userData])

    const handleChange = (event: React.SyntheticEvent, newValue: number) => {
        setValue(newValue);
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
                    Renderer && <Renderer client={client} />
                }
        </>
    )
}