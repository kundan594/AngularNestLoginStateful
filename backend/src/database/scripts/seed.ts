import dataSource from '../data-source';
import { runSeeds } from '../seeds';

async function seed() {
  try {
    // Initialize data source
    await dataSource.initialize();
    console.log('Data Source has been initialized');

    // Run seeds
    await runSeeds(dataSource);

    // Close connection
    await dataSource.destroy();
    console.log('Data Source has been closed');
    process.exit(0);
  } catch (error) {
    console.error('Error during seeding:', error);
    process.exit(1);
  }
}

seed();

// Made with Bob