const { Client } = require('discord.js-selfbot-v13');
const { joinVoiceChannel, VoiceConnectionStatus, entersState } = require('@discordjs/voice');
const http = require('http');

// Render port uyarısını ve kapanmayı önleyen hafif web sunucusu
http.createServer((req, res) => res.end('OK')).listen(process.env.PORT || 3000);

const client = new Client({ checkUpdate: false });

const TOKEN = process.env.TOKEN;
const GUILD_ID = process.env.GUILD_ID;
const VOICE_CHANNEL_ID = process.env.VOICE_CHANNEL_ID;

async function connectToVoice() {
    try {
        const guild = await client.guilds.fetch(GUILD_ID);
        const channel = await guild.channels.fetch(VOICE_CHANNEL_ID);

        const connection = joinVoiceChannel({
            channelId: channel.id,
            guildId: guild.id,
            adapterCreator: guild.voiceAdapterCreator,
            selfDeaf: true,
            selfMute: true,
        });

        // Ses bağlantısı koptuğunda akıllıca tekrar bağlanma mekanizması
        connection.on(VoiceConnectionStatus.Disconnected, async () => {
            try {
                await Promise.race([
                    entersState(connection, VoiceConnectionStatus.Signalling, 5_000),
                    entersState(connection, VoiceConnectionStatus.Connecting, 5_000),
                ]);
            } catch (error) {
                connection.destroy();
                connectToVoice();
            }
        });

        console.log(`[BAŞARILI] ${channel.name} ses kanalına girildi ve sabitlendi.`);
    } catch (error) {
        console.error('[HATA] Sese bağlanırken sorun oluştu:', error);
    }
}

client.on('ready', () => {
    console.log(`${client.user.tag} aktif! Sese bağlanılıyor...`);
    connectToVoice();
});

client.login(TOKEN);
