import { TextChannel } from 'discord.js';

async function sendStatusMessage(message: string, client: any): Promise<void> {
  const guild = client.guilds.cache.first();   
  if (!guild) {
    console.warn('No guild found.');
    return;
  }

let channel: TextChannel | undefined = guild.channels.cache.find(
    (c: { name: string; isTextBased: () => any; }): c is TextChannel => c.name === 'minecraft' && c.isTextBased()
);

  if (!channel) {
    try {
      channel = (await guild.channels.create({
        name: 'minecraft',
        reason: 'Used for Minecraft server status updates',
      })) as TextChannel;
    } catch (err) {
      console.error('Error creating channel:', err);
      return;
    }
  }

  if (channel?.isTextBased()) {
    channel.send(message).catch((err) =>
      console.error('Error sending message:', err)
    );
  }
}

export default sendStatusMessage;