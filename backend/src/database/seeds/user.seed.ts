import { DataSource } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { User } from '../../users/entities/user.entity';

export async function seedUsers(dataSource: DataSource): Promise<void> {
  const userRepository = dataSource.getRepository(User);

  // Check if users already exist
  const existingUsers = await userRepository.count();
  if (existingUsers > 0) {
    console.log('Users already seeded, skipping...');
    return;
  }

  const saltRounds = 10;

  // Create test users
  const users = [
    {
      email: 'admin@example.com',
      password: await bcrypt.hash('Admin123!', saltRounds),
      firstName: 'Admin',
      lastName: 'User',
      isActive: true,
    },
    {
      email: 'john.doe@example.com',
      password: await bcrypt.hash('Password123!', saltRounds),
      firstName: 'John',
      lastName: 'Doe',
      isActive: true,
    },
    {
      email: 'jane.smith@example.com',
      password: await bcrypt.hash('Password123!', saltRounds),
      firstName: 'Jane',
      lastName: 'Smith',
      isActive: true,
    },
    {
      email: 'inactive@example.com',
      password: await bcrypt.hash('Password123!', saltRounds),
      firstName: 'Inactive',
      lastName: 'User',
      isActive: false,
    },
  ];

  await userRepository.save(users);

  console.log(`Seeded ${users.length} users successfully`);
  console.log('Test credentials:');
  console.log('  - admin@example.com / Admin123!');
  console.log('  - john.doe@example.com / Password123!');
  console.log('  - jane.smith@example.com / Password123!');
}

// Made with Bob