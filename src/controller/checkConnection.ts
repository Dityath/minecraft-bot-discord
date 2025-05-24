export interface MinecraftServerStatus {
    online: boolean;
    host?: string;
    port?: number;
    ipAddress?: string;
    eulaBlocked?: boolean;
    retrievedAt?: number;
    expiresAt?: number;
    srvRecord?: string | null;
    version?: {
        nameRaw: string;
        nameClean: string;
        nameHtml: string;
        protocol: number;
    };
    players?: {
        online: number;
        max: number;
        list: Array<{
            uuid: string;
            nameRaw: string;
            nameClean: string;
            nameHtml: string;
        }>;
    };
    motd?: {
        raw: string;
        clean: string;
        html: string;
    };
    icon?: string | null;
    mods?: Array<any>;
    software?: string | null;
    plugins?: Array<any>;
}

export async function checkConnection(ip: string, port: number): Promise<MinecraftServerStatus> {
    try {
        const response = await fetch(`https://api.mcstatus.io/v2/status/java/${ip}:${port}`, {
            method: 'GET',
            headers: { 'Accept': 'application/json' },
        });

        if (!response.ok) {
            return { online: false };
        }

        const data = await response.json();

        return {
            online: data.online ?? false,
            host: data.host,
            port: data.port,
            ipAddress: data.ip_address,
            eulaBlocked: data.eula_blocked,
            retrievedAt: data.retrieved_at,
            expiresAt: data.expires_at,
            srvRecord: data.srv_record,
            version: data.version
                ? {
                        nameRaw: data.version.name_raw,
                        nameClean: data.version.name_clean,
                        nameHtml: data.version.name_html,
                        protocol: data.version.protocol,
                    }
                : undefined,
            players: data.players
                ? {
                        online: data.players.online,
                        max: data.players.max,
                        list: data.players.list.map((player: any) => ({
                            uuid: player.uuid,
                            nameRaw: player.name_raw,
                            nameClean: player.name_clean,
                            nameHtml: player.name_html,
                        })),
                    }
                : undefined,
            motd: data.motd
                ? {
                        raw: data.motd.raw,
                        clean: data.motd.clean,
                        html: data.motd.html,
                    }
                : undefined,
            icon: data.icon,
            mods: data.mods,
            software: data.software,
            plugins: data.plugins,
        };
    } catch (error) {
        return { online: false };
    }
}

export default checkConnection;
