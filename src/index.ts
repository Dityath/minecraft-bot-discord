import express, { Request, RequestHandler, Response } from 'express';
import { Client, GatewayIntentBits } from 'discord.js';
import dotenv from 'dotenv';
import checkConnection from './controller/checkConnection';
import checkServer from './controller/checkServer';
import sendStatusMessage from './controller/sendStatusMessage';

dotenv.config();

const app = express();
const STATUS_PORT = Number(process.env.STATUS_PORT || 3000);
const STATUS_SECRET = process.env.STATUS_SECRET || 'mysecret';

app.use(express.json());

const client = new Client({
  intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages, GatewayIntentBits.MessageContent],
});

client.once('ready', () => {
  console.log(`Logged in as ${client.user?.tag}`);
  console.log('✅ Starting server monitor...');

  // Start monitoring
  setInterval(pollServerStatus, 5000);
});

// Flapping protection setup
let lastKnownState: 'up' | 'down' | null = null;
let lastConfirmedState: 'up' | 'down' | null = null;
let stableCounter = 0;
const STABILITY_THRESHOLD = 2;

const ip = process.env.MINECRAFT_SERVER_IP || '';
const port = Number(process.env.MINECRAFT_SERVER_PORT || 0);

// Polling function
async function pollServerStatus() {
  try {
    const result = await checkConnection(ip, port);
    const currentState: 'up' | 'down' = result.online ? 'up' : 'down';

    if (currentState === lastKnownState) {
      stableCounter++;
    } else {
      stableCounter = 1;
      lastKnownState = currentState;
    }

    if (currentState !== lastConfirmedState && stableCounter >= STABILITY_THRESHOLD) {
      lastConfirmedState = currentState;

      const message = currentState === 'up'
        ? '🟢 Minecraft server is now **online**!\n'
        : '🔴 Minecraft server is now **offline**!\n';

      await sendStatusMessage(message, client);
      console.log(`[Monitor] Server confirmed ${currentState}`);
    }
  } catch (err) {
    console.error('Error polling server status:', err);
  }
}

// Slash commands
client.on('interactionCreate', async (interaction) => {
  if (!interaction.isChatInputCommand()) return;

  if (interaction.commandName === 'nyalakah') {
    const result = await checkConnection(ip, port);
    const reply = result.online
      ? `🟢 Ingyah nyala!! \n${result.players?.online ?? 0}/${result.players?.max ?? 0} yang online.\n\nMOTD: ${result.motd?.clean ?? 'gaada motd'}`
      : '🔴 Enga 😔😔😔';
    await interaction.reply(reply);
  }

  if (interaction.commandName === 'siapamain') {
    const result = await checkConnection(ip, port);
    if (!result.online) return interaction.reply('🔴 Servernya mati, jadi belum bisa main 😔');

    const players = result.players?.list ?? [];
    const names = players.length
      ? players.map((p) => `• ${p.nameClean}`).join('\n')
      : 'Gak keliatan siapa aja 😅';

    const reply = players.length
      ? `🎮 ${result.players?.online}/${result.players?.max} pemain online!\n\nYang online sekarang:\n${names}`
      : '🟢 Server nyala tapi blm ada yang online 😶';

    await interaction.reply(reply);
  }

  if (interaction.commandName === 'infokanserver') {
    const result = await checkConnection(ip, port);
    if (!result.online) return interaction.reply('🔴 Servernya mati, jadi gak bisa kasih info 😔');

    const motd = result.motd?.clean || 'Tidak ada MOTD';
    const version = result.version?.nameClean || 'Tidak diketahui';
    const software = result.software || 'Tidak disebutkan';
    const plugins = result.plugins?.map(p => `• ${p}`).join('\n') || 'Tidak ada plugin';
    const mods = result.mods?.map(m => `• ${m}`).join('\n') || 'Tidak ada mod';
    const eula = result.eulaBlocked ? '❌ Ya' : '✅ Tidak';
    const srv = result.srvRecord ?? 'Tidak ada';
    const retrieved = result.retrievedAt
      ? new Date(result.retrievedAt).toLocaleString('id-ID')
      : 'Tidak diketahui';

    await interaction.reply(
      `📊 **Info Server Minecraft**\n\n` +
      `🌐 IP: \`${ip}:${port}\`\n` +
      `📝 MOTD: ${motd}\n` +
      `🧩 Versi: ${version}\n` +
      `⚙️ Software: ${software}\n` +
      `🔌 Plugins:\n${plugins}\n` +
      `📦 Mods:\n${mods}\n` +
      `📛 EULA Diblokir: ${eula}\n` +
      `🔀 SRV Record: ${srv}\n` +
      `⏱️ Data diambil pada: ${retrieved}`
    );
  }

  if (interaction.commandName === 'detailserver') {
    const token = process.env.STATUS_SERVER_TOKEN;
    if (!token) {
      return interaction.reply('❌ Token server tidak tersedia di konfigurasi.');
    }

    const result = await checkServer(token);
    if (!result) {
      return interaction.reply('🔴 Gagal mengambil info server 😔');
    }

    const {
      server_status,
      server_uptime,
      server_data,
      data,
      network,
    } = result;

    const temps = data.temps;
    const interfaces = network.interfaces.map((i) => `• ${i.name}: ${i.ip}`).join('\n');

    const reply = `📡 **Detail Server Status**\n\n` +
      `🟢 Status: **${server_status}**\n` +
      `⏱️ Uptime: ${server_uptime}\n\n` +
      `💻 **Server Info**\n` +
      `• Nama: ${server_data.server_name}\n` +
      `• CPU: ${server_data.server_cpu}\n` +
      `• OS: ${server_data.server_os}\n\n` +
      `📈 **Resource Usage**\n` +
      `• CPU: ${data.cpu_percentage.toFixed(1)}%\n` +
      `• Memori: ${data.memory.toFixed(2)} GB / ${data.total_memory.toFixed(2)} GB (${data.memory_percentage.toFixed(1)}%)\n\n` +
      `🌡️ **Temperatur**\n` +
      `• Motherboard: ${temps.motherboard_temp}°C\n` +
      `• CPU: ${temps.cpu_temp}°C\n` +
      `• GPU: ${temps.gpu_temp}°C\n\n` +
      `🌍 **Jaringan**\n` +
      // `• Public IP: ${network.public_ip}\n` +
      `• Ping: ${network.ping_ms} ms\n` +
      `• Download: ${network.speed_download_mbps} Mbps\n` +
      `• Upload: ${network.speed_upload_mbps} Mbps\n` +
      `• Interface:\n${interfaces}`;

    await interaction.reply(reply);
  }
});

// Status HTTP endpoint
app.post('/status/:state', (async (req: Request, res: Response) => {
  const { state } = req.params;
  const authHeader = req.headers.authorization;

  if (authHeader !== `Bearer ${STATUS_SECRET}`) {
    return res.status(403).json({ error: 'Forbidden' });
  }

  try {
    if (state === 'up') {
      await sendStatusMessage('🟢 Minecraft server is now **online**!\n', client);
      return res.json({ message: 'Status up received' });
    } else if (state === 'down') {
      await sendStatusMessage('🔴 Minecraft server is now **offline**!\n', client);
      return res.json({ message: 'Status down received' });
    } else if (state === 'testing') {
      await sendStatusMessage('🔧 Testing Minecraft server status...\n', client);
    } else {
      return res.status(400).json({ error: 'Invalid status type' });
    }
  } catch (err) {
    console.error('Error in status endpoint:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
}) as unknown as RequestHandler);

app.listen(STATUS_PORT, () => {
  console.log(`✅ Status HTTP server listening on port ${STATUS_PORT}`);
});

console.log('Logging in...');

client.login(process.env.DISCORD_BOT_TOKEN).then(() => {
  console.log('Bot is online!');
}).catch((error) => {
  console.error('Error logging in:', error);
});