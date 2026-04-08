import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';

dotenv.config({ path: './.env' });

const MONGO_URI = process.env.MONGO_URI || 'mongodb+srv://miguellopez32_db_user:i0or6hK6UUnETkP2@cluster0.n63ddrn.mongodb.net/betostore';

async function crearAdmin() {
  try {
    await mongoose.connect(MONGO_URI);
    console.log('✅ Conectado a MongoDB');

    const hashedPassword = await bcrypt.hash('Admin123!', 10);
    
    const existente = await mongoose.connection.collection('usuarios').findOne({ username: 'admin' });
    
    if (existente) {
      await mongoose.connection.collection('usuarios').updateOne(
        { username: 'admin' },
        { 
          $set: { 
            email: 'betostore72@gmail.com',
            roles: ['ROLE_USER', 'ROLE_ADMIN']
          }
        }
      );
      console.log('✅ Administrador actualizado');
      console.log('📧 Email: betostore72@gmail.com');
    } else {
      await mongoose.connection.collection('usuarios').insertOne({
        username: 'admin',
        email: 'betostore72@gmail.com',
        password: hashedPassword,
        roles: ['ROLE_USER', 'ROLE_ADMIN'],
        isLocked: false,
        failedLoginAttempts: 0,
        audit: {
          createdAt: new Date(),
          updatedAt: new Date(),
          createdBy: 'system',
          updatedBy: 'system',
          version: 1,
          isActive: true,
          changeLog: []
        }
      });
      console.log('✅ Administrador creado');
      console.log('📧 Email: betostore72@gmail.com');
      console.log('🔑 Password: Admin123!');
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await mongoose.disconnect();
    process.exit(0);
  }
}

crearAdmin();