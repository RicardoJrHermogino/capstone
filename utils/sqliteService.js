import { SQLiteConnection, CapacitorSQLite } from "@capacitor-community/sqlite";

const sqliteConnection = new SQLiteConnection(CapacitorSQLite);
let dbInstance = null;

export const getDatabaseConnection = async () => {
  try {
    // If connection already exists, return it
    if (dbInstance) {
      return dbInstance;
    }

    // Check if connection already exists
    const existingConnection = await sqliteConnection.isConnection("offline_db");

    if (existingConnection.result) {
      dbInstance = await sqliteConnection.retrieveConnection("offline_db");
    } else {
      dbInstance = await sqliteConnection.createConnection("offline_db", false, "no-encryption", 1, false);
      await dbInstance.open();
    }

    return dbInstance;
  } catch (error) {
    console.error("Error getting SQLite connection:", error);
    throw error;
  }
};

// Close database connection when needed
export const closeDatabaseConnection = async () => {
  if (dbInstance) {
    await sqliteConnection.closeConnection("offline_db");
    dbInstance = null;
  }
};
