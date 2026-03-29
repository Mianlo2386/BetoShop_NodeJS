import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'smtp.gmail.com',
  port: parseInt(process.env.SMTP_PORT) || 587,
  secure: process.env.SMTP_SECURE === 'true',
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

transporter.verify((error, success) => {
  if (error) {
    console.error('❌ Error verificando transporter de email:', error);
  } else {
    console.log('✅ Servidor de email configurado y listo');
  }
});

class EmailService {
  async sendContactEmail({ name, email, subject, message }) {
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
    const mailOptions = {
      from: `"${process.env.EMAIL_FROM_NAME || 'BetoStore'}" <${process.env.EMAIL_FROM}>`,
      to: to,
      subject: 'BetoStore - Confirmación de contacto',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #28a745;">¡Gracias por contactarnos!</h2>
          <p>Hola ${name},</p>
          <p>Hemos recibido tu mensaje. Nuestro equipo te responderá a la brevedad.</p>
          <hr>
          <p style="color: #666; font-size: 12px;">BetoStore - Tu tienda de confianza</p>
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
