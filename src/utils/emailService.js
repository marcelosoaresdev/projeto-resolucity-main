import SibApiV3Sdk from 'sib-api-v3-sdk';

// Usa process.env diretamente (Vercel injeta automaticamente)
const BREVO_API_KEY = process.env.BREVO_API_KEY;
const BREVO_SENDER_EMAIL = process.env.BREVO_SENDER_EMAIL || 'noreply@resolucity.com';
const BASE_URL = process.env.BASE_URL || 'http://localhost:3000';

const defaultClient = SibApiV3Sdk.ApiClient.instance;
defaultClient.authentications['api-key'].apiKey = BREVO_API_KEY;

class BrevoEmailService {
    static instance = null;

    constructor() {
        this.apiInstance = new SibApiV3Sdk.TransactionalEmailsApi();
        this.sender = { email: BREVO_SENDER_EMAIL, name: 'Resolucity' };
    }

    static getInstance() {
        if (!BrevoEmailService.instance) {
            BrevoEmailService.instance = new BrevoEmailService();
        }

        return BrevoEmailService.instance;
    }

    async sendConfirmationEmail(to, nome, token) {
        const confirmUrl = `${BASE_URL}/api/auth/confirm/${token}`;

        const html = `
<!DOCTYPE html>
<html lang="pt-BR">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin: 0; padding: 0; font-family: 'Inter', Arial, sans-serif; background-color: #f0fdf4;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color: #f0fdf4;">
        <tr>
            <td align="center" style="padding: 40px 20px;">
                <!-- Card Principal -->
                <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width: 480px; background-color: #ffffff; border-radius: 16px; box-shadow: 0 4px 20px rgba(0,0,0,0.08); overflow: hidden;">

                    <!-- Header Verde -->
                    <tr>
                        <td style="background: linear-gradient(135deg, #198754 0%, #146C43 100%); padding: 20px 40px; text-align: center;">
                            <h1 style="margin: 0; color: #ffffff; font-size: 22px; font-weight: 700;">RESOLUCITY</h1>
                            <p style="margin: 4px 0 0; color: rgba(255,255,255,0.8); font-size: 13px;">Cidadania em Ação</p>
                        </td>
                    </tr>

                    <!-- Conteúdo -->
                    <tr>
                        <td style="padding: 32px 40px 32px;">
                            <!-- Título -->
                            <h2 style="margin: 0 0 16px; color: #013C31; font-size: 20px; font-weight: 700; text-align: center;">
                                Confirme seu e-mail
                            </h2>

                            <!-- Saudação -->
                            <p style="margin: 0 0 16px; color: #333333; font-size: 15px; line-height: 1.5;">
                                Olá, <strong>${nome}</strong>!
                            </p>

                            <!-- Mensagem -->
                            <p style="margin: 0 0 28px; color: #555555; font-size: 14px; line-height: 1.6; text-align: center;">
                                Você criou sua conta no Resolucity. Clique no botão abaixo para confirmar seu e-mail e ativar sua conta.
                            </p>

                            <!-- Botão -->
                            <div style="text-align: center; margin-bottom: 20px;">
                                <a href="${confirmUrl}" style="display: inline-block; background: linear-gradient(135deg, #198754 0%, #146C43 100%); color: #ffffff; text-decoration: none; padding: 14px 36px; border-radius: 10px; font-size: 15px; font-weight: 600; box-shadow: 0 4px 15px rgba(20, 108, 67, 0.3);">
                                    Confirmar E-mail
                                </a>
                            </div>

                            <!-- Aviso -->
                            <p style="margin: 0; color: #888888; font-size: 12px; text-align: center;">
                                Este link expira em <strong>24 horas</strong>.
                            </p>
                        </td>
                    </tr>

                    <!-- Footer -->
                    <tr>
                        <td style="background-color: #f8f9fa; padding: 16px 40px; text-align: center; border-top: 1px solid #eeeeee;">
                            <p style="margin: 0 0 4px; color: #888888; font-size: 12px;">
                                Resolucity — Plataforma de Relato de Problemas Urbanos
                            </p>
                            <p style="margin: 0; color: #aaaaaa; font-size: 11px;">
                                Este é um e-mail automático. Não responda.
                            </p>
                        </td>
                    </tr>

                </table>
            </td>
        </tr>
    </table>
</body>
</html>
        `;

        const sendSmtpEmail = new SibApiV3Sdk.SendSmtpEmail();
        sendSmtpEmail.to = [{ email: to, name: nome }];
        sendSmtpEmail.sender = this.sender;
        sendSmtpEmail.subject = 'Confirme seu cadastro no Resolucity';
        sendSmtpEmail.htmlContent = html;

        const data = await this.apiInstance.sendTransacEmail(sendSmtpEmail);
        return data;
    }
}

const emailService = BrevoEmailService.getInstance();

async function sendConfirmationEmail(to, nome, token) {
    return emailService.sendConfirmationEmail(to, nome, token);
}

export { sendConfirmationEmail };
export default emailService;