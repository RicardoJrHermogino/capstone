import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.taskweathersyncrde.app',
  appName: 'taskweathersync-smart-scheduler',
  webDir: 'out',
  bundledWebRuntime: false,
  server: {
    // url: 'http://10.0.0.35:3000', 
    // url: 'http://10.0.0.36:3000', 
    // url: 'http://10.0.0.37:3000',
    // url: 'http://10.0.0.38:3000',
    // url: 'http://192.168.132.235:3000',
    cleartext: true, 
  },
  plugins: {
    CapacitorSQLite: {
      "iosDatabaseLocation": "Library/CapacitorDatabase"
    }
  }
};

export default config;
