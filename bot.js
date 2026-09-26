import makeWASocket, { useMultiFileAuthState } from "@whiskeysockets/baileys";
import Groq from "groq-sdk";
import qrcode from "qrcode-terminal";

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

async function startBot() {
    const { state, saveCreds } = await useMultiFileAuthState("auth_info");
    const sock = makeWASocket({ auth: state, printQRInTerminal: true });
    sock.ev.on("creds.update", saveCreds);
    sock.ev.on("connection.update", (u) => {
        if(u.qr) qrcode.generate(u.qr, {small: true});
    });
    sock.ev.on("messages.upsert", async (m) => {
        const msg = m.messages[0];
        if(!msg.message || msg.key.fromMe) return;
        const text = msg.message.conversation || msg.message.extendedTextMessage?.text;
        if(!text) return;
        try {
            const res = await groq.chat.completions.create({
                model: "llama-3.1-8b-instant",
                messages: [{role:"system", content:"You are helpful WhatsApp AI. Reply in Sinhala."},{role:"user", content:text}]
            });
            await sock.sendMessage(msg.key.remoteJid, {text: res.choices[0].message.content});
        } catch(e){ console.log(e) }
    });
}
startBot();
