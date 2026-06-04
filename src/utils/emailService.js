import nodemailer from 'nodemailer';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));

// Carrega variáveis do .env
const envPath = join(__dirname, '../../.env');
import fs from 'fs';
const envContent = fs.readFileSync(envPath, 'utf-8');
const envVars = {};
envContent.split('\n').forEach(line => {
    const [key, ...valueParts] = line.split('=');
    if (key && valueParts.length) {
        envVars[key.trim()] = valueParts.join('=').trim();
    }
});

const transporter = nodemailer.createTransport({
    host: process.env.EMAIL_HOST || envVars.EMAIL_HOST,
    port: process.env.EMAIL_PORT || envVars.EMAIL_PORT || 587,
    secure: process.env.EMAIL_SECURE === 'true',
    auth: {
        user: process.env.EMAIL_USER || envVars.EMAIL_USER,
        pass: process.env.EMAIL_PASS || envVars.EMAIL_PASS
    }
});

async function sendConfirmationEmail(to, nome, token) {
    const baseUrl = process.env.BASE_URL || envVars.BASE_URL || 'http://localhost:3000';
    const confirmUrl = `${baseUrl}/confirmar?token=${token}`;

    const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #0c0c0c;">Bem-vindo ao Resolucity!</h2>
        <p>Olá, ${nome}.</p>
        <p>Clique no botão abaixo para confirmar seu cadastro:</p>
        <div style="text-align: center; margin: 30px 0;">
            <a href="${confirmUrl}" style="background-color: #ffcc00; color: #0c0c0c; padding: 12px 24px; text-decoration: none; border-radius: 4px; font-weight: bold;">Confirmar Email</a>
        </div>
        <p>Ou copie este link: <a href="${confirmUrl}">${confirmUrl}</a></p>
        <p style="color: #666; font-size: 12px;">Este link expira em 24 horas.</p>
    </div>
    `;

    return transporter.sendMail({
        from: process.env.EMAIL_FROM || envVars.EMAIL_FROM || '"Resolucity" <noreply@resolucity.com.br>',
        to,
        subject: 'Confirme seu cadastro no Resolucity',
        html
    });
}

export { sendConfirmationEmail };