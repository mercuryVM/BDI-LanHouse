import React from "react";
import APIClient from "../API/APIClient";

let apiClient = new APIClient();

export function useClient() {
    const [client, setClient] = React.useState<APIClient>(apiClient);

    return client;
}