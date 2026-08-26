import mongoose from 'mongoose';
import dns from 'dns';
import dotenv from 'dotenv';

dotenv.config();

// Fast buffering failover so offline API responds instantaneously
mongoose.set('bufferTimeoutMS', 2000);

// Optional DNS override for environments where Node cannot resolve mongodb+srv.
const mongoDnsServers = (process.env.MONGODB_DNS_SERVERS || process.env.MONGO_DNS_SERVERS || '')
  .split(',')
  .map(server => server.trim())
  .filter(Boolean);

if (mongoDnsServers.length > 0) {
  try {
    dns.setServers(mongoDnsServers);
    console.log(`Configured MongoDB DNS servers: ${mongoDnsServers.join(', ')}`);
  } catch (dnsErr) {
    console.warn('Could not override DNS servers:', dnsErr.message);
  }
}

export const connectDB = async (onConnectedCallback) => {
  const directURI = process.env.MONGODB_DIRECT_URI || process.env.MONGO_DIRECT_URI;
  const srvURI = process.env.MONGODB_URI || process.env.MONGO_URI;

  const urisToTry = [srvURI, directURI].filter(Boolean);

  if (urisToTry.length === 0) {
    console.warn('⚠️ Cảnh báo: Thiếu MongoDB URI trong file .env');
    return;
  }

  let connected = false;
  for (const uri of urisToTry) {
    const isSrv = uri.startsWith('mongodb+srv://');
    console.log(`Đang thử kết nối MongoDB (${isSrv ? 'SRV Protocol' : 'Direct Protocol'})...`);
    try {
      await mongoose.connect(uri, {
        dbName: 'UEH_TCC',
        serverSelectionTimeoutMS: 8000
      });
      console.log('======================================================');
      console.log('>>> KẾT NỐI THÀNH CÔNG ĐẾN MONGODB ATLAS (ONLINE) <<<');
      console.log('======================================================');
      connected = true;
      if (onConnectedCallback) {
        await onConnectedCallback();
      }
      break;
    } catch (err) {
      console.warn(`⚠️ Không thể kết nối qua ${isSrv ? 'SRV' : 'Direct'}: ${err.message}`);
    }
  }

  if (!connected) {
    console.error('======================================================');
    console.error('⚠️ KHÔNG THỂ KẾT NỐI ĐẾN MONGODB ATLAS');
    console.error('👉 Nguyên nhân phổ biến: IP hiện tại của bạn chưa được Whitelist trên MongoDB Atlas.');
    console.error('👉 Vui lòng vào MongoDB Atlas > Network Access > Add IP Address > "Allow Access from Anywhere (0.0.0.0/0)"');
    console.error('👉 Server backend vẫn đang chạy để phục vụ API và Static fallback.');
    console.error('======================================================');
  }
};
