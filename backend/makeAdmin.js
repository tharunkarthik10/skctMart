import prisma from './config/prisma.js';

async function fixAdmin() {
  const email = '727824tuio046@skct.edu.in';
  try {
    const user = await prisma.user.update({
      where: { email },
      data: {
        is_admin: true,
        role: 'Admin',
        is_profile_verified: true
      }
    });
    console.log(`Successfully updated ${user.email} to Admin!`);
  } catch (error) {
    console.error(`Error:`, error.message);
  } finally {
    process.exit(0);
  }
}

fixAdmin();
