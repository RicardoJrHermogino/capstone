import { v4 as uuidv4 } from 'uuid';

const getOrCreateUUID = () => {
  if (typeof window !== 'undefined') {  // Ensure this is running in the browser
    return uuidv4(); // Generate and return a new UUID
  }

  return null; // Return null if it's being run on the server
};

export default getOrCreateUUID;
