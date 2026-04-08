import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config({ path: './.env' });

const MONGO_URI = process.env.MONGO_URI || 'mongodb+srv://miguellopez32_db_user:i0or6hK6UUnETkP2@cluster0.n63ddrn.mongodb.net/betostore';

async function resetLoginAttempts() {
  try {
    await mongoose.connect(MONGO_URI);
    console.log('✅ Conectado a MongoDB');

    await mongoose.connection.collection('usuarios').updateOne(
      { username: 'admin' },
      { 
        $set: { 
          failedLoginAttempts: 0,
          isLocked: false,
          lockUntil: null
        }
      }
    );
    console.log('✅ Intentos de login reseteados para admin');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await mongoose.disconnect();
    process.exit(0);
  }
}

resetLoginAttempts();