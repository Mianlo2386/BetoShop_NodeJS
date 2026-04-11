import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';

dotenv.config({ path: './.env' });

const MONGO_URI = process.env.MONGO_URI || 'mongodb+srv://miguellopez32_db_user:i0or6hK6UUnETkP2@cluster0.n63ddrn.mongodb.net/betostore';

async function resetAdminPassword() {
  try {
    await mongoose.connect(MONGO_URI);
    console.log('✅ Conectado a MongoDB');

    const tempPassword = 'AdminTemp2026!';
    const hashedPassword = await bcrypt.hash(tempPassword, 10);
    
    await mongoose.connection.collection('usuarios').updateOne(
      { username: 'admin' },
      { 
        $set: { 
          password: hashedPassword,
          failedLoginAttempts: 0,
          isLocked: false
        }
      }
    );
    console.log('✅ Contraseña de admin reseteada');
    console.log('🔑 Nueva password: AdminTemp2026!');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await mongoose.disconnect();
    process.exit(0);
  }
}

resetAdminPassword();