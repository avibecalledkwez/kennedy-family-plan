import { initializeApp } from "firebase/app";
import { getFirestore, doc, setDoc, getDoc, onSnapshot } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyAgui-gIn0BYCc2BM69q-Qph6ecBpgexeA",
  authDomain: "kennedy-family-plan.firebaseapp.com",
  projectId: "kennedy-family-plan",
  storageBucket: "kennedy-family-plan.firebasestorage.app",
  messagingSenderId: "190212819528",
  appId: "1:190212819528:web:7f22ea568a1d5fa9cb267d"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// Generic save — creates doc if it doesn't exist
async function save(collection, docId, data) {
  try {
    await setDoc(doc(db, collection, docId), {
      data: JSON.stringify(data),
      updatedAt: Date.now()
    }, { merge: true });
    return true;
  } catch (e) {
    console.error(`Error saving ${collection}/${docId}:`, e);
    return false;
  }
}

// Generic load — returns parsed data or default
async function load(collection, docId, defaultVal) {
  try {
    const snap = await getDoc(doc(db, collection, docId));
    if (snap.exists() && snap.data().data) {
      return JSON.parse(snap.data().data);
    }
  } catch (e) {
    console.error(`Error loading ${collection}/${docId}:`, e);
  }
  return defaultVal;
}

// Generic subscribe — calls callback with parsed data on remote changes
function subscribe(collection, docId, callback) {
  return onSnapshot(doc(db, collection, docId), (snap) => {
    if (snap.exists() && snap.data().data) {
      try {
        const parsed = JSON.parse(snap.data().data);
        callback(parsed);
      } catch {}
    }
  }, (err) => {
    console.error(`Subscribe error ${collection}/${docId}:`, err);
  });
}

// ── Checked tasks ──
export const saveChecked = (data) => save("appState", "checked", data);
export const loadChecked = () => load("appState", "checked", {});
export const subscribeChecked = (cb) => subscribe("appState", "checked", cb);

// ── Suggestions ──
export const saveSuggestions = (data) => save("appState", "suggestions", data);
export const loadSuggestions = () => load("appState", "suggestions", []);
export const subscribeSuggestions = (cb) => subscribe("appState", "suggestions", cb);

// ── Custom tasks ──
export const saveCustomTasks = (data) => save("appState", "customTasks", data);
export const loadCustomTasks = () => load("appState", "customTasks", []);
export const subscribeCustomTasks = (cb) => subscribe("appState", "customTasks", cb);

// ── Deleted tasks ──
export const saveDeleted = (data) => save("appState", "deleted", data);
export const loadDeleted = () => load("appState", "deleted", {});
export const subscribeDeleted = (cb) => subscribe("appState", "deleted", cb);
