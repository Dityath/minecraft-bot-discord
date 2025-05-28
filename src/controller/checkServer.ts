export interface ServerStatusResponse {
    server_status: 'online' | 'offline';
    server_uptime: string;
    server_data: {
        server_name: string;
        server_cpu: string;
        server_os: string;
    };
    data: {
        cpu_percentage: number;
        memory: number;
        total_memory: number;
        memory_percentage: number;
        temps: {
            motherboard_temp: number;
            cpu_temp: number;
            gpu_temp: number;
        };
    };
    network: {
        public_ip: string;
        ping_ms: number;
        speed_download_mbps: number;
        speed_upload_mbps: number;
        interfaces: Array<{
            name: string;
            ip: string;
        }>;
    };
}

export async function checkServer(token: string): Promise<ServerStatusResponse | null> {
    try {
        const response = await fetch('https://sharing-piglet-driven.ngrok-free.app/status', {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Accept': 'application/json',
            },
        });

        if (!response.ok) {
            console.error('Request failed with status', response.status);
            return null;
        }

        const data = await response.json();
        return data as ServerStatusResponse;

    } catch (error) {
        console.error('Error checking custom server status:', error);
        return null;
    }
}

export default checkServer;
