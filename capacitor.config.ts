import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.taskweathersyncrde.app',
  appName: 'taskweathersync-smart-scheduler',
  webDir: 'out',
  bundledWebRuntime: false,
  server: {
    url: 'http://10.0.0.35:3000', 
    cleartext: true, 
  },
  plugins: {
    CapacitorSQLite: {
      "iosDatabaseLocation": "Library/CapacitorDatabase"
    }
  }
};

export default config;
