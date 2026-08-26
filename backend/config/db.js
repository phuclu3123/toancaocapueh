import mongoose from 'mongoose';
import dns from 'dns';
import dotenv from 'dotenv';

dotenv.config();

// Disable buffering so unestablished DB connections fail immediately to local fallback
mongoose.set('bufferCommands', false);
mongoose.set('bufferTimeoutMS', 1000);

// DNS override for environments where Node cannot resolve mongodb+srv
const mongoDnsServers = (process.env.MONGODB_DNS_SERVERS || process.env.MONGO_DNS_SERVERS || '8.8.8.8,1.1.1.1,8.8.4.4')
  .split(',')
  .map(server => server.trim())
  .filter(Boolean);

if (mongoDnsServers.length > 0) {
  try {
    dns.setServers(mongoDnsServers);
  } catch {}
}

export const connectDB = async (onConnectedCallback) => {
  const srvURI = process.env.MONGODB_URI || process.env.MONGO_URI;
  const directURI = process.env.MONGODB_DIRECT_URI || process.env.MONGO_DIRECT_URI;
  const urisToTry = [srvURI, directURI].filter(Boolean);

  if (urisToTry.length === 0) return;

  for (const uri of urisToTry) {
    try {
      await mongoose.connect(uri, {
        dbName: 'UEH_TCC',
        serverSelectionTimeoutMS: 4000
      });
      console.log('✅ Đã kết nối thành công MongoDB Atlas (Online)');
      if (onConnectedCallback) {
        await onConnectedCallback();
      }
      return;
    } catch {
      // Gracefully silent fallback
    }
  }
};
