import 'dotenv/config';

const REQUIRED_VARS = [
  'MONGODB_URI',
  'JWT_SECRET',
  'PORT',
  'NODE_ENV'
];

console.log('🔍 Iniciando auditoría de configuración de entorno...');

let hasErrors = false;

REQUIRED_VARS.forEach((varName) => {
  if (!process.env[varName]) {
    console.error(`❌ ERROR: La variable [${varName}] no está definida en el entorno.`);
    hasErrors = true;
  } else {
    console.log(`✅ Variable [${varName}]: Detectada.`);
  }
});

if (hasErrors) {
  console.error('\n🛑 La validación ha fallado. Revisa tu archivo .env antes de continuar.');
  process.exit(1);
} else {
  console.log('\n✨ Configuración validada con éxito. El backend está listo para operar.');
  process.exit(0);
}
