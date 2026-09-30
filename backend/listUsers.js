import prisma from './config/prisma.js';

async function listUsers() {
  try {
    const users = await prisma.user.findMany();
    console.log(users.map(u => u.email));
  } catch (error) {
    console.error(`Error:`, error.message);
  }
}

listUsers();
