import { PrismaClient } from '../../prisma/generated';
import { PrismaPg } from '@prisma/adapter-pg';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL as string });
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log('Seeding database...');

  const adminPassword = await bcrypt.hash('admin123', 12);
  await prisma.user.upsert({
    where: { email: 'admin@ecommerce.com' },
    update: {},
    create: {
      email: 'admin@ecommerce.com',
      password: adminPassword,
      name: 'Admin User',
      role: 'ADMIN',
    },
  });

  const userPassword = await bcrypt.hash('user123', 12);
  await prisma.user.upsert({
    where: { email: 'user@ecommerce.com' },
    update: {},
    create: {
      email: 'user@ecommerce.com',
      password: userPassword,
      name: 'Regular User',
      role: 'USER',
    },
  });

  const products = [
    { name: 'Laptop Pro', description: 'High performance laptop', price: 1299.99, category: 'Electronics', stock: 50, imageUrl: 'https://images.unsplash.com/photo-1496181133206-80ce9b88a853?w=400' },
    { name: 'Wireless Mouse', description: 'Ergonomic wireless mouse', price: 29.99, category: 'Electronics', stock: 200, imageUrl: 'https://images.unsplash.com/photo-1527864550417-7fd91fc51a46?w=400' },
    { name: 'Desk Chair', description: 'Comfortable office chair', price: 349.99, category: 'Furniture', stock: 30, imageUrl: 'https://images.unsplash.com/photo-1580480055273-228ff5388ef8?w=400' },
    { name: 'Coffee Mug', description: 'Large ceramic mug', price: 12.99, category: 'Kitchen', stock: 500, imageUrl: 'https://images.unsplash.com/photo-1514228742587-6b1558fcca3d?w=400' },
    { name: 'Notebook A5', description: 'Lined notebook A5', price: 8.99, category: 'Stationery', stock: 300, imageUrl: 'https://images.unsplash.com/photo-1531346878377-a5be20888e57?w=400' },
  ];

  await prisma.product.deleteMany({});
  for (const product of products) {
    await prisma.product.create({ data: product });
  }

  console.log('Seeding complete!');
  console.log('Admin : admin@ecommerce.com / admin123');
  console.log('User  : user@ecommerce.com / user123');
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
