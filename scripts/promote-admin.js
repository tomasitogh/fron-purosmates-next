const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  // ⚠️ CAMBIAR ESTE EMAIL por el tuyo
  const email = 'tomasgonzalezhu.phreys12@gmail.com';
  
  console.log(`🔍 Buscando usuario: ${email}...`);
  
  const user = await prisma.user.findUnique({
    where: { email }
  });
  
  if (!user) {
    console.error(`❌ Usuario con email ${email} no encontrado.`);
    console.log('💡 Primero debes hacer login en la aplicación.');
    return;
  }
  
  if (user.role === 'ADMIN') {
    console.log(`✅ El usuario ${email} ya es ADMIN`);
    return;
  }
  
  // Promover a ADMIN
  await prisma.user.update({
    where: { email },
    data: { role: 'ADMIN' }
  });
  
  console.log(`✅ Usuario ${email} promovido a ADMIN exitosamente!`);
  console.log(`🔧 Ahora puedes acceder a /admin`);
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error('❌ Error:', e);
    await prisma.$disconnect();
    process.exit(1);
  });
