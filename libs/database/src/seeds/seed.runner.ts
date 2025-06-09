import { DataSource } from 'typeorm';
import AppDataSource from '../data-source';
import { AnimeSeeder } from './anime.seeder';

export class SeedRunner {
  private dataSource: DataSource;

  constructor() {
    this.dataSource = new DataSource(AppDataSource.options);
  }

  async run(): Promise<void> {
    try {
      console.log('Initializing database connection...');
      await this.dataSource.initialize();

      console.log('Starting seeding process...');

      const animeSeeder = new AnimeSeeder();
      await animeSeeder.run(this.dataSource);

      console.log('Seeding completed successfully!');
    } catch (error) {
      console.error('Error during seeding:', error);
      throw error;
    } finally {
      if (this.dataSource.isInitialized) {
        await this.dataSource.destroy();
        console.log('Database connection closed.');
        process.exit(0);
      }
    }
  }
}

// Run seeder if this file is executed directly
if (require.main === module) {
  const seedRunner = new SeedRunner();
  seedRunner.run().catch(error => {
    console.error('Seeding failed:', error);
    process.exit(1);
  });
}
