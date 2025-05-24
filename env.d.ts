// env.d.ts
declare namespace NodeJS {
  interface ProcessEnv {
    DISCORD_BOT_TOKEN: string;
    MINECRAFT_SERVER_IP: string;
    MINECRAFT_SERVER_PORT: number;
  }
}
