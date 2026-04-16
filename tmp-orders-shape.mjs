import { readFileSync } from "node:fs";
import { initializeApp } from "firebase/app";
import { getAuth, signInWithEmailAndPassword } from "firebase/auth";
import { getFirestore, collectionGroup, getDocs, limit, query } from "firebase/firestore";

const envText = readFileSync('.env', 'utf8');
const env = Object.fromEntries(envText.split(/\r?\n/).filter(Boolean).map((line) => {
  const i = line.indexOf('=');
  return [line.slice(0, i), line.slice(i + 1)];
}));

const app = initializeApp({
  apiKey: env.VITE_FIREBASE_API_KEY,
  authDomain: env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: env.VITE_FIREBASE_APP_ID,
});

const auth = getAuth(app);
const db = getFirestore(app);

const cred = await signInWithEmailAndPassword(auth, 'idc@why.com', '123456');
console.log('uid', cred.user.uid, 'email', cred.user.email);

const snap = await getDocs(query(collectionGroup(db, 'orders'), limit(20)));
console.log('orders_found', snap.size);
let idx = 0;
for (const d of snap.docs) {
  idx += 1;
  const data = d.data();
  const keys = Object.keys(data);
  const item0 = Array.isArray(data.items) && data.items.length ? data.items[0] : null;
  console.log('--- order', idx, d.ref.path);
  console.log('top_keys', keys.join(','));
  if (item0) {
    console.log('item0_keys', Object.keys(item0).join(','));
    console.log('item0_sellerId', item0.sellerId ?? null, 'item0_sellerEmail', item0.sellerEmail ?? null);
  } else {
    console.log('no_items_array', typeof data.items);
  }
}
