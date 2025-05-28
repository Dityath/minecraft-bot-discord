import { REST, Routes, SlashCommandBuilder } from 'discord.js';
import dotenv from 'dotenv';

dotenv.config();

const commands = [
  new SlashCommandBuilder()
    .setName('nyalakah')
    .setDescription('Cek koneksi ke Minecraft server'),
  new SlashCommandBuilder()
    .setName('siapamain')
    .setDescription('Lihat siapa aja yang online di server Minecraft'),
  new SlashCommandBuilder()
    .setName('infokanserver')
    .setDescription('Detail lengkap server Minecraft'),
  new SlashCommandBuilder()
    .setName('detailserver')
    .setDescription('Cek status detail server custom (CPU, RAM, suhu, IP, dll)'),
].map(cmd => cmd.toJSON());

const rest = new REST({ version: '10' }).setToken(process.env.DISCORD_BOT_TOKEN!);

(async () => {
  try {
    console.log('🔃 Registering slash commands...');

    await rest.put(
      Routes.applicationCommands(process.env.DISCORD_CLIENT_ID!),
      { body: commands }
    );

    console.log('✅ Slash commands registered!');
  } catch (error) {
    console.error('❌ Failed to register slash commands:', error);
  }
})();