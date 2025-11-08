import React from "react";
import type { UserData } from "../API/APIClient";
import type APIClient from "../API/APIClient";

export function useUserData(client: APIClient) {
    const [userData, setUserData] = React.useState<UserData | null>(null);

    React.useEffect(() => {
        const fetchUserData = async () => {
            const data = await client.getUserData();
            setUserData(data);
        };

        fetchUserData();
    }, [client]);

    return userData;
}