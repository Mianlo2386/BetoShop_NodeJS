import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'smtp.gmail.com',
  port: parseInt(process.env.SMTP_PORT) || 587,
  secure: false,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
  connectionTimeout: 10000,
  socketTimeout: 15000,
});

transporter.verify((error, success) => {
  if (error) {
    console.error('❌ Error verificando transporter de email:', error);
  } else {
    console.log('✅ Servidor de email configurado y listo');
  }
});

const WHATSAPP_NUMBER = process.env.WHATSAPP_NUMBER || '';

class EmailService {
  async sendContactEmail({ name, email, subject, message, telefono }) {
    const mailOptions = {
      from: `"${process.env.EMAIL_FROM_NAME || 'BetoStore'}" <${process.env.EMAIL_FROM}>`,
      to: process.env.SMTP_USER,
      replyTo: email,
      subject: `[BetoStore Contacto] ${subject}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #28a745;">Nuevo mensaje de contacto</h2>
          <hr>
          <p><strong>Nombre:</strong> ${name}</p>
          <p><strong>Email:</strong> ${email}</p>
          ${telefono ? `<p><strong>Teléfono:</strong> ${telefono}</p>` : ''}
          <p><strong>Asunto:</strong> ${subject}</p>
          <hr>
          <h3 style="color: #333;">Mensaje:</h3>
          <p style="background: #f8f9fa; padding: 15px; border-radius: 5px; white-space: pre-wrap;">${message}</p>
          <hr>
          <p style="color: #666; font-size: 12px;">Enviado desde BetoStore - ${new Date().toLocaleString('es-AR')}</p>
        </div>
      `,
      text: `
Nuevo mensaje de contacto
Nombre: ${name}
Email: ${email}
${telefono ? `Teléfono: ${telefono}` : ''}
Asunto: ${subject}
Mensaje:
${message}
---
Enviado desde BetoStore - ${new Date().toLocaleString('es-AR')}
      `,
    };
    try {
      const info = await transporter.sendMail(mailOptions);
      console.log(`📧 Email de contacto enviado a ${process.env.SMTP_USER}: ${info.messageId}`);
      return info;
    } catch (error) {
      console.error('❌ Error enviando email de contacto:', error);
      throw error;
    }
  }

  async sendConfirmationEmail(to, name) {
    const whatsappLink = WHATSAPP_NUMBER
      ? `https://wa.me/${WHATSAPP_NUMBER.replace(/\D/g, '')}?text=Hola%2C%20quisiera%20una%20respuesta%20m%C3%A1s%20r%C3%A1pida%20sobre%20mi%20consulta`
      : null;

    const whatsappSection = whatsappLink
      ? `
        <div style="background: #f0fff4; border-left: 4px solid #25D366; padding: 15px; margin: 20px 0; border-radius: 4px;">
          <p style="margin: 0; color: #333;">
            💬 <strong>¿Necesitás una respuesta más rápida?</strong><br>
            Podés contactarnos directamente por WhatsApp y te atendemos al instante.
          </p>
          <a href="${whatsappLink}" 
             style="display: inline-block; margin-top: 10px; background: #25D366; color: white; padding: 10px 20px; border-radius: 5px; text-decoration: none; font-weight: bold;">
            💬 Escribinos por WhatsApp
          </a>
        </div>
      `
      : '';

    const mailOptions = {
      from: `"${process.env.EMAIL_FROM_NAME || 'BetoStore'}" <${process.env.EMAIL_FROM}>`,
      to,
      subject: 'BetoStore - Recibimos tu mensaje',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background: #28a745; padding: 20px; text-align: center; border-radius: 8px 8px 0 0;">
            <h1 style="color: white; margin: 0;">BetoStore</h1>
          </div>
          <div style="padding: 30px; background: #fff; border: 1px solid #e0e0e0;">
            <h2 style="color: #28a745;">¡Gracias por contactarnos, ${name}!</h2>
            <p>Recibimos tu mensaje y nos contactaremos a la brevedad.</p>
            <p>Nuestro equipo revisará tu consulta y te responderá al email que nos indicaste en el menor tiempo posible.</p>
            ${whatsappSection}
            <hr style="border: none; border-top: 1px solid #e0e0e0; margin: 20px 0;">
            <p style="color: #666; font-size: 13px;">
              Este es un mensaje automático, por favor no respondas directamente a este email.<br>
              Para consultas adicionales usá el formulario de contacto en nuestra web.
            </p>
          </div>
          <div style="background: #f8f9fa; padding: 15px; text-align: center; border-radius: 0 0 8px 8px;">
            <p style="color: #999; font-size: 12px; margin: 0;">
              © ${new Date().getFullYear()} BetoStore — Tu tienda de confianza
            </p>
          </div>
        </div>
      `,
    };

    try {
      const info = await transporter.sendMail(mailOptions);
      console.log(`📧 Email de confirmación enviado a ${to}: ${info.messageId}`);
    } catch (error) {
      console.error(`❌ Error enviando email de confirmación a ${to}:`, error);
    }
  }
}

export default new EmailService();
