import { createContext, useState } from 'react';
import { initializeApp } from 'firebase/app';
import { getFunctions, httpsCallable } from 'firebase/functions';
import {
  getFirestore,
  collection,
  getDocs,
  getDoc,
  doc,
  query,
  orderBy,
  limit,
  where,
  onSnapshot,
} from 'firebase/firestore';
import _ from 'lodash';

const app = initializeApp({
  apiKey: 'AIzaSyBK-EdRy8HJWm9LiMeLPr-q_kBTfSfTcVY',
  authDomain: 'composeart-f9a7a.firebaseapp.com',
  projectId: 'composeart-f9a7a',
  databaseURL: 'https://composeart-f9a7a.firebaseio.com',
});

const db = getFirestore(app);
const functions = getFunctions(app);
const simulateFight = httpsCallable(functions, 'simulateFight');
const registerFighter = httpsCallable(functions, 'registerFighter');

interface PayloadTypes {
  collections: [];
  season: any,
  account: string | null | undefined;
  chain: string | null | undefined;
}

interface RemotePayloadTypes {
  blockNumber: any;
  contractAddress: any;
  randomness: string | null | undefined;
}

const defaultPayload: PayloadTypes = {
  collections: [],
  season: {},
  account: '',
  chain: '',
};

const defaultRemoteChainPayload: RemotePayloadTypes = {
  blockNumber: '',
  contractAddress: '',
  randomness: '',
};

export const PayloadContext = createContext(defaultPayload);
export const RemoteChainPayloadContext = createContext(defaultRemoteChainPayload);

function delay(delay: any) {
  return new Promise (function(fulfill) {
    setTimeout(fulfill, delay);
  });
};

export const useLocalStorage = (key: string, initialValue: any) => {
  // State to store our value
  // Pass initial state function to useState so logic is only executed once
  const [storedValue, setStoredValue] = useState(() => {
    try {
      // Get from local storage by key
      const item = window.localStorage.getItem(key);
      // Parse stored json or if none return initialValue
      return item ? JSON.parse(item) : initialValue;
    } catch (error) {
      // If error also return initialValue
      console.log(error);
      return initialValue;
    }
  });
  // Return a wrapped version of useState's setter function that ...
  // ... persists the new value to localStorage.
  const setValue = (value: any) => {
    try {
      // Allow value to be a function so we have same API as useState
      const valueToStore =
        value instanceof Function ? value(storedValue) : value;
      // Save state
      setStoredValue(valueToStore);
      // Save to local storage
      window.localStorage.setItem(key, JSON.stringify(valueToStore));
    } catch (error) {
      // A more advanced implementation would handle the error case
      console.log(error);
    }
  };
  return [storedValue, setValue];
};

const getAssets = async ({
  results,
  address,
  offset,
}: any): Promise<any> => {
  const response = await fetch(`https://api.opensea.io/api/v1/assets?owner=${address}&limit=50&offset=${offset}`);

  const data = await response.json();

  results = [...results, ...data.assets];

  if (data.assets && data.assets.length > 0) {
    await delay(300);

    return getAssets({
      results,
      address,
      offset: offset + 50,
    });
  } else {
    return results;
  }
};

export const fetchAssets = async (address: any) => {
  return await getAssets({
    results: [],
    address,
    offset: 0,
  });
};

export const remoteSimulateFight = async ({
  f1,
  f2,
  randomness,
  blocknumber,
}: any) => {
  const result = await simulateFight({
    isSimulated: randomness && blocknumber ? true : false,
    f1,
    f2,
    random: randomness || '0',
    blockNumber: blocknumber || '1',
  });

  return result.data;
};

export const remoteRegisterFighter = async ({
  owner,
  collection,
  contract,
  token_id,
  player,
}: any) => {
  const result = await registerFighter({
    ownerAddress: owner,
    collection,
    contract,
    token_id,
    playerId: player,
  });

  return result.data;
};

export const getSeason = async () => {
  const docRef = doc(db, `nft-death-games`, 'season_0');
  const docSnap = await getDoc(docRef);

  return docSnap.data();
};

export const getSimulation = async (simulationId: any) => {
  const docRef = doc(db, `nft-death-games/season_0/simulations`, simulationId);
  const docSnap = await getDoc(docRef);

  return docSnap.data();
};

export const getMatch = async (matchId: any) => {
  const docRef = doc(db, `nft-death-games/season_0/matches`, matchId);
  const docSnap = await getDoc(docRef);

  return docSnap.data();
};

export const getCollections = async () => {
  const collections: any = [];

  const querySnapshot = await getDocs(collection(db, "nft-death-games/season_0/collections"));

  querySnapshot.forEach((docSnap) => {
    collections.push({
      id: docSnap.id,
      ...docSnap.data(),
    });
  });

  return collections;
};

export const getAllMatches = async () => {
  const matches: any = [];

  const querySnapshot = await getDocs(collection(db, "nft-death-games/season_0/matches"));

  querySnapshot.forEach((docSnap) => {
    matches.push({
      id: docSnap.id,
      ...docSnap.data(),
    });
  });

  return matches;
};

export const getFighterMatches = async (id: any) => {
  const matches: any = [];

  const ref = collection(db, "nft-death-games/season_0/matches");
  const query1 = query(ref, where("fighter1", "==", id))
  const query2 = query(ref, where("fighter2", "==", id))

  const snapshot1 = await getDocs(query1);
  const snapshot2 = await getDocs(query2);

  snapshot1.forEach((docSnap) => {
    matches.push({
      id: docSnap.id,
      ...docSnap.data(),
    });
  });

  snapshot2.forEach((docSnap) => {
    matches.push({
      id: docSnap.id,
      ...docSnap.data(),
    });
  });

  return matches;
};

export const getOwnerMatches = async (id: any) => {
  const matches: any = [];

  const ref = collection(db, "nft-death-games/season_0/matches");
  const query1 = query(ref, where("owner1", "==", id))
  const query2 = query(ref, where("owner2", "==", id))

  const snapshot1 = await getDocs(query1);
  const snapshot2 = await getDocs(query2);

  snapshot1.forEach((docSnap) => {
    matches.push({
      id: docSnap.id,
      ...docSnap.data(),
    });
  });

  snapshot2.forEach((docSnap) => {
    if (!_.find(matches, (f) => f.id === docSnap.id)) {
      matches.push({
        id: docSnap.id,
        ...docSnap.data(),
      });
    }
  });

  return matches;
};

export const getCollectionMatches = async (id: any) => {
  const matches: any = [];

  const ref = collection(db, "nft-death-games/season_0/matches");
  const query1 = query(ref, where("collection1", "==", id))
  const query2 = query(ref, where("collection2", "==", id))

  const snapshot1 = await getDocs(query1);
  const snapshot2 = await getDocs(query2);

  snapshot1.forEach((docSnap) => {
    matches.push({
      id: docSnap.id,
      ...docSnap.data(),
    });
  });

  snapshot2.forEach((docSnap) => {
    if (!_.find(matches, (f) => f.id === docSnap.id)) {
      matches.push({
        id: docSnap.id,
        ...docSnap.data(),
      });
    }
  });

  return matches;
};


export const getLatestFighters = async () => {
  const fighters: any = [];

  const ref1 = collection(db, `nft-death-games/season_0/fighters`);
  const query1 = query(ref1, orderBy("timestamp", "desc"), limit(9));

  const snapshot1 = await getDocs(query1);

  snapshot1.forEach((docSnap) => {
    fighters.push(docSnap.data());
  });

  return fighters;
};

export const getFighter = async (id: string) => {
  const docRef = doc(db, `nft-death-games/season_0/fighters`, id);
  const docSnap = await getDoc(docRef);

  const fighter = docSnap.data();

  return fighter;
};

export const getAllFighters = async () => {
  const fighters: any = [];

  const ref1 = collection(db, `nft-death-games/season_0/fighters`);
  const query1 = query(ref1, orderBy("timestamp", "desc"));

  const snapshot1 = await getDocs(query1);

  snapshot1.forEach((docSnap) => {
    fighters.push(docSnap.data());
  });

  return fighters;
};

export const getCollectionFighters = async (collectionId: any) => {
  const fighters: any = [];

  const ref1 = collection(db, `nft-death-games/season_0/fighters`);
  const query1 = query(ref1, where("collection", "==", collectionId), orderBy("timestamp", "desc"));

  const snapshot1 = await getDocs(query1);

  snapshot1.forEach((docSnap) => {
    fighters.push(docSnap.data());
  });

  return fighters;
};


export const getCollectionPlayers = async (collectionId: any) => {
  const ref1 = collection(db, `nft-death-games/season_0/collections/${collectionId}/players`);

  const players: any = [];

  const snapshot1 = await getDocs(ref1);
  snapshot1.forEach((d) => {
    players.push(d.data());
  });

  return players;
};

export const getRandomPlayer = async (collections: any) => {
  let player: any = {};

  if (collections.length) {
    const collection1 = _.sample(collections);
    const random = _.random(10, 75);

    const ref1 = collection(db, `nft-death-games/season_0/collections/${collection1.id}/players`);
    const query1 = query(ref1, where("power", "==", random), limit(1));

    const snapshot1 = await getDocs(query1);
    snapshot1.forEach((d) => {
      player = d.data();
    });

    if (_.isEmpty(player)) {
      const ref2 = collection(db, `nft-death-games/season_0/collections/${collection1.id}/players`);
      const query2 = query(ref2, orderBy("power", "desc"), limit(1));

      const snapshot2 = await getDocs(query2);
      snapshot2.forEach((d) => {
        player = d.data();
      });
    }
  }

  return player;
};

export const getOwnerFighters = async (address: any) => {
  const fighters: any = [];

  const ref1 = collection(db, `nft-death-games/season_0/fighters`);
  const query1 = query(ref1, where("owner", "==", address));

  const snapshot1 = await getDocs(query1);

  snapshot1.forEach((docSnap) => {
    fighters.push({
      id: docSnap.id,
      ...docSnap.data(),
    });
  });

  return fighters;
};

export const streamOwnerFighters = ({
  address
}: any, callback: any) => {
  const q = query(collection(db, `nft-death-games/season_0/fighters`), where("owner", "==", address));
  return onSnapshot(q, (snapshot) => {
    snapshot.docChanges().forEach((change) => {
      if (change.type === "added" || change.type === "modified") {
        callback({
          id: change.doc.id,
          ...change.doc.data(),
        });
      }
    });
  });
};

export const streamChain = (callback: any) => {
  return onSnapshot(doc(db, "chains", "goerli"), (d) => {
    callback({
      id: d.id,
      ...d.data(),
    });
  });
};



