import { DataSource } from 'typeorm';
import { seedUsers } from './user.seed';

export async function runSeeds(dataSource: DataSource): Promise<void> {
  console.log('Starting database seeding...');

  try {
    await seedUsers(dataSource);
    console.log('Database seeding completed successfully');
  } catch (error) {
    console.error('Error seeding database:', error);
    throw error;
  }
}

// Made with Bob