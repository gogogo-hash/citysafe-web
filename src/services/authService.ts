import {
  GoogleAuthProvider,
  signInAnonymously,
  signInWithPopup,
  signInWithRedirect,
} from "firebase/auth";

import { auth } from "@/services/firebase";

const googleProvider = new GoogleAuthProvider();

export function signInWithGoogle() {
  // signInWithRedirect relays its result back through a hidden iframe on the
  // Firebase authDomain, a different origin than localhost in dev. Browsers
  // that block third-party storage (Safari, Firefox, hardened Chrome) break
  // that relay silently. In production the app is served from the same
  // origin as authDomain (Firebase Hosting), so redirect works there and is
  // what we want for mobile web. Locally, fall back to popup instead.
  return import.meta.env.DEV
    ? signInWithPopup(auth, googleProvider)
    : signInWithRedirect(auth, googleProvider);
}

export function continueAsGuest() {
  return signInAnonymously(auth);
}
