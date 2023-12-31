import { readable, writable } from "svelte/store";
import { auth, db } from "./firebase";
import { onAuthStateChanged } from "firebase/auth";
import { collection, getDocs, addDoc, setDoc, doc, Timestamp, getDoc } from "firebase/firestore";

//loading state to indicate if $user and $userCol has been correctly populated
function load() {
  const { subscribe, set } = writable(true);
  let resolvePromise;
  //return unresolved promise
  const isLoading = () => {
    return new Promise((resolve) => resolvePromise = resolve);
  }
  //set loading to false and resolve the promise
  const resolve = () => {
    set(false);
    if (resolvePromise) resolvePromise();
  }
  return { subscribe, isLoading, resolve };
}
export const loading = load();

//set up a global uid to get the collection of the current user
let uid;
export const user = readable(null, set => {
  //set store to user every time user logs in or out
  const unsubscribe = onAuthStateChanged(auth, async user => {
    //set user data to user store
    set(user);
    //update uid
    uid = user ? user.uid : null;
    //initialize userCol
    await userCol.init();
    //set currentFolder to the last viewed folder
    await currentFolder.init();
    //set loading store to false
    loading.resolve();
  });
  return unsubscribe;
});

//current path for Breadcrumbs
export const currentPath = writable([]);

//store the current folder
function curFolder() {
  const { subscribe, set } = writable(null);

  //set current folder and save it to db
  async function setCurrent(value) {
    set(value);
    //save value to folders document
    const folderRef = doc(db, uid, "folders");
    await setDoc(folderRef, { current: value }, { merge: true });
  }

  //get the last viewed folder and set it to current
  async function init() {
    if(!uid) return set(null);
    const docRef = doc(db, uid, "folders")
    const snapshot = await getDoc(docRef);
    if (snapshot.exists()) set(snapshot.data().current)
  }

  return { subscribe, init, set: setCurrent };
}
export const currentFolder = curFolder();

function userCollection() {
  //set up writable store
  const { subscribe, set, update } = writable([]);
  async function getData() {
    //Get all documents in the users collection
    const snapshot = await getDocs(collection(db, uid));
    const data = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }))
    return data;
  }
  async function createData(title, content, folder) {
    try {
      //get current time
      let createdAt = Timestamp.now();
      //add new data to the collection
      const docRef = await addDoc(collection(db, uid), { title, content, folder, createdAt });
      //update the store
      update(data => [...data, { id: docRef.id, title, content, folder, createdAt }])
    } catch (err) {
      if (!uid) throw new Error("must be logged in to use this feature")
      throw err;
    }
  }
  async function createFolder(folder) {
    //get a reference to the folders document
    const folderRef = doc(db, uid, "folders");
    //create a new folder as a field key
    await setDoc(folderRef, { [folder]: folder }, { merge: true });
    //update the store
    update(data => {
      //find the index for "folders"
      const index = data?.findIndex(item => item.id == "folders");
      //update the item if the index exists otherwise re initialize the store
      (index !== -1) ? data[index] = { ...data[index], [folder]: folder } : init();
      return data;
    });
  }
  //initially populate the store with the user collection
  const init = () => {
    if (!uid) return set([]);
    return getData().then(data => set(data));
  }
  return { subscribe, createData, init, createFolder };
}
export const userCol = userCollection();

export const darkMode = writable("dark");
