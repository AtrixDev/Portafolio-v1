// api/db.js — conexión a MongoDB con connection pooling para serverless
import { MongoClient } from 'mongodb';

const uri = process.env.MONGODB_URI;
if (!uri) throw new Error('MONGODB_URI no está definida en las variables de entorno');

let clientPromise;

if (process.env.NODE_ENV === 'development') {
  if (!global._mongoClientPromise) {
    global._mongoClientPromise = new MongoClient(uri).connect();
  }
  clientPromise = global._mongoClientPromise;
} else {
  clientPromise = new MongoClient(uri).connect();
}

export async function getDB() {
  const c = await clientPromise;
  return c.db('portafolio'); // ← nombre de tu base de datos local
}
