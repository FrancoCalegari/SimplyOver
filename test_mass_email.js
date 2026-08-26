import { query } from './lib/db.js';
import { sendNotificationEmail } from './lib/email.js';

async function run() {
  try {
    const users = await query('SELECT email FROM users WHERE email IS NOT NULL');
    console.log(`[Test] Encontrados ${users.length} usuarios en la base de datos.`);
    
    if (users.length > 0) {
      const emails = users.map(u => u.email);
      console.log(`[Test] Enviando correo de prueba a: ${emails.join(', ')}`);
      await sendNotificationEmail(emails, "Test de Sistema Global", "Este es un mensaje de prueba.", "<p>Este es un <strong>mensaje de prueba</strong> del sistema global.</p>");
      console.log("[Test] Proceso de envío terminado.");
    }
  } catch (e) {
    console.error("[Test] Error:", e);
  } finally {
    process.exit(0);
  }
}
run();
