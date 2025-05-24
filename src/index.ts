import express, { Request, RequestHandler, Response } from 'express';
import { Client, GatewayIntentBits } from 'discord.js';
import dotenv from 'dotenv';
import checkConnection from './controller/checkConnection';
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
});

client.on('interactionCreate', async (interaction) => {
  if (!interaction.isChatInputCommand()) return;

  const ip = process.env.MINECRAFT_SERVER_IP || '';
  const port = Number(process.env.MINECRAFT_SERVER_PORT || 0);

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
});

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
