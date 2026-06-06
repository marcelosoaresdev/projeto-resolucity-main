import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import fs from 'fs';
import SibApiV3Sdk from 'sib-api-v3-sdk';

const __dirname = dirname(fileURLToPath(import.meta.url));

// Carrega variáveis do .env manualmente
const envPath = join(__dirname, '../../.env');
const envContent = fs.readFileSync(envPath, 'utf-8');
const envVars = {};
envContent.split('\n').forEach(line => {
    const [key, ...valueParts] = line.split('=');
    if (key && valueParts.length) {
        envVars[key.trim()] = valueParts.join('=').trim();
    }
});

const defaultClient = SibApiV3Sdk.ApiClient.instance;
defaultClient.authentications['api-key'].apiKey = envVars.BREVO_API_KEY;

async function sendConfirmationEmail(to, nome, token) {
    const baseUrl = envVars.BASE_URL || 'http://localhost:3000';
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

    const apiInstance = new SibApiV3Sdk.TransactionalEmailsApi();

    const sendSmtpEmail = new SibApiV3Sdk.SendSmtpEmail();
    sendSmtpEmail.to = [{ email: to, name: nome }];
    sendSmtpEmail.sender = { email: envVars.BREVO_SENDER_EMAIL || 'noreply@resolucity.com', name: 'Resolucity' };
    sendSmtpEmail.subject = 'Confirme seu cadastro no Resolucity';
    sendSmtpEmail.htmlContent = html;

    const data = await apiInstance.sendTransacEmail(sendSmtpEmail);
    return data;
}

export { sendConfirmationEmail };