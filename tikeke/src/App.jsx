import { useState, useEffect, useRef } from "react";

const FIREBASE_DB_URL = "https://tikeke-a91b8-default-rtdb.firebaseio.com";
const FIRESTORE_URL = "https://firestore.googleapis.com/v1/projects/tikeke-a91b8/databases/(default)/documents";
const FIREBASE_API_KEY = "AIzaSyC8sC0fiGwOAZXMTph5EHAwlTF8PANnkwU";
const FIREBASE_AUTH_URL = "https://identitytoolkit.googleapis.com/v1/accounts";

// ── FIREBASE AUTH REST ──────────────────────────────────────
async function firebaseSignUp(email, password) {
  const res = await fetch(`${FIREBASE_AUTH_URL}:signUp?key=${FIREBASE_API_KEY}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password, returnSecureToken: true })
  });
  const data = await res.json();
  if (data.error) throw new Error(data.error.message);
  return data; // { idToken, localId, email, ... }
}

async function firebaseSignIn(email, password) {
  const res = await fetch(`${FIREBASE_AUTH_URL}:signInWithPassword?key=${FIREBASE_API_KEY}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password, returnSecureToken: true })
  });
  const data = await res.json();
  if (data.error) throw new Error(data.error.message);
  return data; // { idToken, localId, email, ... }
}

async function firebaseResetPassword(email) {
  const res = await fetch(`${FIREBASE_AUTH_URL}:sendOobCode?key=${FIREBASE_API_KEY}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ requestType: "PASSWORD_RESET", email })
  });
  const data = await res.json();
  if (data.error) throw new Error(data.error.message);
  return data;
}

// ── FIRESTORE ───────────────────────────────────────────────
async function saveUserProfile(userData, idToken) {
  try {
    const fields = {};
    Object.entries(userData).forEach(([k, v]) => {
      if (v === null || v === undefined) return;
      if (typeof v === "string") fields[k] = { stringValue: v };
      else if (typeof v === "number") fields[k] = { integerValue: String(v) };
      else if (typeof v === "boolean") fields[k] = { booleanValue: v };
      else if (Array.isArray(v)) fields[k] = { arrayValue: { values: v.map(i => ({ stringValue: String(i) })) } };
    });
    const headers = { "Content-Type": "application/json" };
    if (idToken) headers["Authorization"] = `Bearer ${idToken}`;
    await fetch(`${FIRESTORE_URL}/users/${userData.uid}`, {
      method: "PATCH",
      headers,
      body: JSON.stringify({ fields })
    });
  } catch(e) { console.log("Firestore save error:", e); }
}

async function loadUserProfile(uid, idToken) {
  try {
    const headers = {};
    if (idToken) headers["Authorization"] = `Bearer ${idToken}`;
    const res = await fetch(`${FIRESTORE_URL}/users/${uid}`, { headers });
    if (!res.ok) return null;
    const data = await res.json();
    if (!data.fields) return null;
    const user = {};
    Object.entries(data.fields).forEach(([k, v]) => {
      if (v.stringValue !== undefined) user[k] = v.stringValue;
      else if (v.integerValue !== undefined) user[k] = Number(v.integerValue);
      else if (v.booleanValue !== undefined) user[k] = v.booleanValue;
      else if (v.arrayValue) user[k] = (v.arrayValue.values || []).map(i => i.stringValue || "");
    });
    return user;
  } catch(e) { return null; }
}

// ── CLOUDINARY PHOTO UPLOAD ─────────────────────────────────
async function uploadPhoto(file) {
  // Convert to base64 first (works better on mobile/iOS)
  const base64 = await new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
  const fd = new FormData();
  fd.append("file", base64);
  fd.append("upload_preset", "tikeke_profiles");
  const res = await fetch("https://api.cloudinary.com/v1_1/lu0hry6w/image/upload", {
    method: "POST",
    body: fd
  });
  const data = await res.json();
  if (!data.secure_url) throw new Error(data.error?.message || "Upload echwe");
  return data.secure_url;
}

const translations = {
  ht: {
    appName: "Ti Kèkè", tagline: "Jwenn lanmou w, jwenn zanmi w 💕",
    discover: "Dekouvri", matches: "Matche", chat: "Chat", profile: "Pwofil",
    itsMatch: "Se yon Matche! 🎉", matchMsg: "Nou de renmen youn lòt!",
    sendMsg: "Voye yon mesaj...", age: "an", km: "km",
    editProfile: "Modifye Pwofil", noMore: "Pa gen plis moun 😅",
    comeBack: "Tounen pita!", newMatches: "Nouvo Matche", messages: "Mesaj",
    online: "Anliy", lang: "Lang",
    login: "Konekte", register: "Kreye Kont", email: "Imel", password: "Modpas",
    name: "Non ou", logout: "Dekonekte", welcome: "Byenveni",
    haveAccount: "Ou deja gen kont?", noAccount: "Ou pa gen kont?",
    creating: "Ap kreye...", connecting: "Ap konekte...",
    // PAYWALL
    unlock: "Debloke Ti Kèkè Premium",
    unlockSub: "Jwenn aksè konplè — chat, matche, ak plis!",
    chooseplan: "Chwazi Plan Ou",
    choosepay: "Chwazi Metòd Peman",
    pay: "Peye Kounye a",
    free: "Gratis", freeSub: "3 swipe pa jou",
    basic: "Debaz", basicSub: "Swipe ilimite",
    premium: "Premium", premiumSub: "Tout fonksyon + Super Like",
    vip: "VIP", vipSub: "Tout + Badge VIP ⭐",
    mo: "/mwa", perMonth: "pa mwa",
    card: "Kat Kredi / Debi", moncash: "MonCash 🇭🇹",
    natcash: "NatCash", paypal: "PayPal",
    cardNum: "Nimewo Kat", expiry: "MM/YY", cvv: "CVV",
    phone: "Nimewo Telefòn", email: "Imèl PayPal",
    confirm: "Konfime Peman", success: "Peman Reyisi! 🎉",
    successMsg: "Ou gen aksè Premium kounye a!",
    continue: "Kontinye", cancel: "Anile", month: "mwa",
    currentPlan: "Plan Aktyèl", upgrade: "Amelyore Plan",
    active: "Aktif ✓", enterDetails: "Antre enfòmasyon peman",
  },
  fr: {
    appName: "Ti Kèkè", tagline: "Trouve ton amour, trouve tes amis 💕",
    discover: "Découvrir", matches: "Matchs", chat: "Chat", profile: "Profil",
    itsMatch: "C'est un Match! 🎉", matchMsg: "Vous vous aimez tous les deux!",
    sendMsg: "Envoyer un message...", age: "ans", km: "km",
    editProfile: "Modifier Profil", noMore: "Plus de profils 😅",
    comeBack: "Revenez plus tard!", newMatches: "Nouveaux Matchs", messages: "Messages",
    online: "En ligne", lang: "Langue",
    login: "Se connecter", register: "Créer un compte", email: "Email", password: "Mot de passe",
    name: "Votre nom", logout: "Déconnexion", welcome: "Bienvenue",
    haveAccount: "Vous avez déjà un compte?", noAccount: "Pas de compte?",
    creating: "Création...", connecting: "Connexion...",
    unlock: "Débloquer Ti Kèkè Premium",
    unlockSub: "Accès complet — chat, matchs, et plus!",
    chooseplan: "Choisir votre Plan", choosepay: "Mode de Paiement",
    pay: "Payer maintenant",
    free: "Gratuit", freeSub: "3 swipes par jour",
    basic: "Basique", basicSub: "Swipes illimités",
    premium: "Premium", premiumSub: "Tout + Super Like",
    vip: "VIP", vipSub: "Tout + Badge VIP ⭐",
    mo: "/mois", perMonth: "par mois",
    card: "Carte Crédit / Débit", moncash: "MonCash 🇭🇹",
    natcash: "NatCash", paypal: "PayPal",
    cardNum: "Numéro de carte", expiry: "MM/AA", cvv: "CVV",
    phone: "Numéro de téléphone", email: "Email PayPal",
    confirm: "Confirmer le paiement", success: "Paiement Réussi! 🎉",
    successMsg: "Vous avez accès Premium maintenant!",
    continue: "Continuer", cancel: "Annuler", month: "mois",
    currentPlan: "Plan Actuel", upgrade: "Améliorer le Plan",
    active: "Actif ✓", enterDetails: "Entrez vos informations",
  },
  en: {
    appName: "Ti Kèkè", tagline: "Find your love, find your friends 💕",
    discover: "Discover", matches: "Matches", chat: "Chat", profile: "Profile",
    itsMatch: "It's a Match! 🎉", matchMsg: "You both liked each other!",
    sendMsg: "Send a message...", age: "yrs", km: "km",
    editProfile: "Edit Profile", noMore: "No more profiles 😅",
    comeBack: "Come back later!", newMatches: "New Matches", messages: "Messages",
    online: "Online", lang: "Language",
    login: "Sign In", register: "Create Account", email: "Email", password: "Password",
    name: "Your name", logout: "Logout", welcome: "Welcome",
    haveAccount: "Already have an account?", noAccount: "No account yet?",
    creating: "Creating...", connecting: "Signing in...",
    unlock: "Unlock Ti Kèkè Premium",
    unlockSub: "Get full access — chat, matches & more!",
    chooseplan: "Choose Your Plan", choosepay: "Payment Method",
    pay: "Pay Now",
    free: "Free", freeSub: "3 swipes per day",
    basic: "Basic", basicSub: "Unlimited swipes",
    premium: "Premium", premiumSub: "All features + Super Like",
    vip: "VIP", vipSub: "All + VIP Badge ⭐",
    mo: "/mo", perMonth: "per month",
    card: "Credit / Debit Card", moncash: "MonCash 🇭🇹",
    natcash: "NatCash", paypal: "PayPal",
    cardNum: "Card Number", expiry: "MM/YY", cvv: "CVV",
    phone: "Phone Number", email: "PayPal Email",
    confirm: "Confirm Payment", success: "Payment Successful! 🎉",
    successMsg: "You now have Premium access!",
    continue: "Continue", cancel: "Cancel", month: "month",
    currentPlan: "Current Plan", upgrade: "Upgrade Plan",
    active: "Active ✓", enterDetails: "Enter payment details",
  },
  es: {
    appName: "Ti Kèkè", tagline: "Encuentra tu amor, encuentra amigos 💕",
    discover: "Descubrir", matches: "Coincidencias", chat: "Chat", profile: "Perfil",
    itsMatch: "¡Es un Match! 🎉", matchMsg: "¡Los dos se gustaron!",
    sendMsg: "Enviar mensaje...", age: "años", km: "km",
    editProfile: "Editar Perfil", noMore: "No hay más perfiles 😅",
    comeBack: "¡Vuelve más tarde!", newMatches: "Nuevos Matches", messages: "Mensajes",
    online: "En línea", lang: "Idioma",
    login: "Iniciar sesión", register: "Crear cuenta", email: "Email", password: "Contraseña",
    name: "Tu nombre", logout: "Cerrar sesión", welcome: "Bienvenido",
    haveAccount: "¿Ya tienes cuenta?", noAccount: "¿Sin cuenta?",
    creating: "Creando...", connecting: "Conectando...",
    unlock: "Desbloquear Ti Kèkè Premium",
    unlockSub: "¡Acceso completo — chat, matches y más!",
    chooseplan: "Elige tu Plan", choosepay: "Método de Pago",
    pay: "Pagar Ahora",
    free: "Gratis", freeSub: "3 swipes por día",
    basic: "Básico", basicSub: "Swipes ilimitados",
    premium: "Premium", premiumSub: "Todo + Super Like",
    vip: "VIP", vipSub: "Todo + Insignia VIP ⭐",
    mo: "/mes", perMonth: "por mes",
    card: "Tarjeta Crédito / Débito", moncash: "MonCash 🇭🇹",
    natcash: "NatCash", paypal: "PayPal",
    cardNum: "Número de tarjeta", expiry: "MM/AA", cvv: "CVV",
    phone: "Número de teléfono", email: "Email de PayPal",
    confirm: "Confirmar Pago", success: "¡Pago Exitoso! 🎉",
    successMsg: "¡Ya tienes acceso Premium!",
    continue: "Continuar", cancel: "Cancelar", month: "mes",
    currentPlan: "Plan Actual", upgrade: "Mejorar Plan",
    active: "Activo ✓", enterDetails: "Ingresa tus datos de pago",
  },
};

const PLANS = [
  { key: "free",    price: 0,   color: "#6B7280", icon: "🆓" },
  { key: "basic",   price: 4.99, color: "#3B82F6", icon: "💙" },
  { key: "premium", price: 9.99, color: "#FF3B5C", icon: "💎", popular: true },
  { key: "vip",     price: 19.99,color: "#F59E0B", icon: "⭐" },
];

const PAY_METHODS = [
  { key: "card",     icon: "💳" },
  { key: "moncash",  icon: "📱" },
  { key: "natcash",  icon: "📲" },
  { key: "paypal",   icon: "🅿️" },
];

const profiles = [
  { id:1, name:"Naïka",    age:24, city:"Port-au-Prince", km:2,  bio:"Mwen renmen danse, vwayaje ak manje bon manje 🌺", emoji:"👩🏾", color:"#FF6B9D", interests:["Danse 💃","Vwayaj ✈️","Manje 🍽️"], online:true },
  { id:2, name:"Chérubin", age:27, city:"Pétionville",    km:5,  bio:"Mizisyen, pwofesè, k ap chèche yon bèl konesans 🎵", emoji:"👨🏿", color:"#A855F7", interests:["Mizik 🎸","Edikasyon 📚","Spò ⚽"], online:true },
  { id:3, name:"Roseline", age:22, city:"Cap-Haïtien",    km:12, bio:"Etidyante an medisin. Rèv mwen se ede pèp mwen 💙", emoji:"👩🏽", color:"#F97316", interests:["Medisin 🏥","Lekti 📖","Nati 🌿"], online:false },
  { id:4, name:"Joëlson",  age:29, city:"Jacmel",         km:8,  bio:"Atisan, amoureux de la vie ak kilti Ayisyen 🎨", emoji:"👨🏾", color:"#10B981", interests:["Atizana 🎨","Kilti 🥁","Plaj 🏖️"], online:true },
  { id:5, name:"Fabiola",  age:25, city:"Les Cayes",      km:3,  bio:"Fanm antreprenè. Mwen kreye, mwen reve, mwen rive! 🌟", emoji:"👩🏿", color:"#EC4899", interests:["Biznis 💼","Mode 👗","Jaden 🌸"], online:false },
  { id:6, name:"Wilfried", age:31, city:"Gonaïves",       km:15, bio:"Agwonom k ap travay pou rekonstri peyi a 🌱", emoji:"👨🏽", color:"#06B6D4", interests:["Agrikilti 🌾","Anvironman 🌍","Fanmi 👨‍👩‍👧"], online:true },
];

const initChats = {
  1: [{ from:"them", text:"Bonjou! 😊 Ki jan ou rele?" }],
  4: [{ from:"them", text:"Salut! Ou konn Jacmel?" }],
};

export default function TiKeke() {
  const [lang, setLang]           = useState("ht");
  const [tab, setTab]             = useState("discover");
  const [cards, setCards]         = useState(profiles);
  const [matches, setMatches]     = useState([profiles[0], profiles[3]]);
  const [showMatch, setShowMatch] = useState(null);
  const [swipeDir, setSwipeDir]   = useState(null);
  const [activeChat, setActiveChat] = useState(null);
  const [msgs, setMsgs]           = useState(initChats);
  const [inputMsg, setInputMsg]   = useState("");
  const [langOpen, setLangOpen]   = useState(false);

  // AUTH STATE
  const [user, setUser] = useState(null);
  const [authMode, setAuthMode] = useState("login");
  const [authEmail, setAuthEmail] = useState("");
  const [authPass, setAuthPass] = useState("");
  const [authName, setAuthName] = useState("");
  const [authError, setAuthError] = useState("");
  const [authLoading, setAuthLoading] = useState(false);
  const [setupData, setSetupData] = useState({ name:"", age:"", gender:"", country:"", city:"", bio:"", avatar:"🧑🏾", interests:[], photos:[] });
  const [setupError, setSetupError] = useState("");
  const [photoUploading, setPhotoUploading] = useState(false);
  const [showAuthPopup, setShowAuthPopup] = useState(false);
  const [authPopupMsg, setAuthPopupMsg] = useState("");
  const [showSettings, setShowSettings] = useState(false);
  const [visibility, setVisibility] = useState(true);
  const [locationOn, setLocationOn] = useState(false);
  const [blockedUsers, setBlockedUsers] = useState([]);
  const [showBlocked, setShowBlocked] = useState(false);
  const [showFAQ, setShowFAQ] = useState(false);
  const [showRating, setShowRating] = useState(false);
  const [rating, setRating] = useState(0);
  const [ratingMsg, setRatingMsg] = useState("");

  // Restore session from localStorage (idToken + uid saved)
  useEffect(() => {
    async function loadSession() {
      const saved = localStorage.getItem("tikeke_session");
      if (!saved) return;
      try {
        const session = JSON.parse(saved);
        if (!session.uid || !session.idToken) return;
        // Load full profile from Firestore
        const profile = await loadUserProfile(session.uid, session.idToken);
        if (profile) {
          const merged = { ...session, ...profile };
          setUser(merged);
          if (merged.profileComplete === true || merged.profileComplete === "true") {
            setSetupData({
              name: merged.name || "",
              age: merged.age || "",
              gender: merged.gender || "",
              country: merged.country || "",
              city: merged.city || "",
              bio: merged.bio || "",
              avatar: merged.avatar || "🧑🏾",
              photos: Array.isArray(merged.photos) ? merged.photos : [],
              photoUrl: merged.photoUrl || null,
              interests: Array.isArray(merged.interests) ? merged.interests : []
            });
          }
        } else {
          setUser(session);
        }
      } catch(e) {
        localStorage.removeItem("tikeke_session");
      }
    }
    loadSession();
  }, []);

  async function handleAuth() {
    setAuthError(""); setAuthLoading(true);
    if (!authEmail.includes("@")) {
      setAuthError("Imel pa valid"); setAuthLoading(false); return;
    }
    if (authPass.length < 6) {
      setAuthError("Modpas twò kout (min 6 karaktè)"); setAuthLoading(false); return;
    }
    try {
      let authData;
      if (authMode === "register") {
        authData = await firebaseSignUp(authEmail, authPass);
      } else {
        authData = await firebaseSignIn(authEmail, authPass);
      }

      const { idToken, localId: uid, email } = authData;
      const session = { uid, idToken, email };
      localStorage.setItem("tikeke_session", JSON.stringify(session));

      // Load existing profile from Firestore
      const profile = await loadUserProfile(uid, idToken);

      if (profile && (profile.profileComplete === true || profile.profileComplete === "true")) {
        const merged = { ...session, ...profile };
        setUser(merged);
        setSetupData({
          name: merged.name || "",
          age: merged.age || "",
          gender: merged.gender || "",
          country: merged.country || "",
          city: merged.city || "",
          bio: merged.bio || "",
          avatar: merged.avatar || "🧑🏾",
          photos: Array.isArray(merged.photos) ? merged.photos : [],
          photoUrl: merged.photoUrl || null,
          interests: Array.isArray(merged.interests) ? merged.interests : []
        });
      } else {
        // New user or incomplete profile
        const userData = {
          ...session,
          name: authName || email.split("@")[0],
          profileComplete: false,
          createdAt: new Date().toISOString()
        };
        if (profile) Object.assign(userData, profile);
        await saveUserProfile(userData, idToken);
        setUser(userData);
        setSetupData(p => ({ ...p, name: authName || email.split("@")[0] }));
      }
      setShowAuthPopup(false);
    } catch(e) {
      const msg = e.message || "";
      if (msg.includes("EMAIL_EXISTS")) setAuthError("Imel sa deja itilize!");
      else if (msg.includes("INVALID_PASSWORD") || msg.includes("INVALID_LOGIN_CREDENTIALS")) setAuthError("Modpas oswa imel pa kòrèk");
      else if (msg.includes("USER_NOT_FOUND")) setAuthError("Kont sa pa egziste — kreye youn!");
      else if (msg.includes("WEAK_PASSWORD")) setAuthError("Modpas twò fèb (min 6 karaktè)");
      else setAuthError("Erè — eseye ankò");
    }
    setAuthLoading(false);
  }

  function handleLogout() {
    localStorage.removeItem("tikeke_session");
    setUser(null);
    setSetupData({ name:"", age:"", gender:"", country:"", city:"", bio:"", avatar:"🧑🏾", interests:[], photos:[] });
  }

  // PAYWALL STATE
  const [plan, setPlan]           = useState("free");
  const [showPaywall, setShowPaywall] = useState(false);
  const [payStep, setPayStep]     = useState("plans"); // plans | method | form | success
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [payMethod, setPayMethod] = useState(null);
  const [formData, setFormData]   = useState({ cardNum:"", expiry:"", cvv:"", phone:"", email:"" });
  const [paying, setPaying]       = useState(false);

  const t = translations[lang];
  const isPremium = plan !== "free";
  const currentCard = cards[cards.length - 1];

  function handleSwipe(dir, person) {
    if (!user && (dir === "right" || dir === "super")) {
      setAuthPopupMsg("Kreye yon kont pou wè matche w! 💕");
      setAuthMode("choice");
      setShowAuthPopup(true);
      return;
    }
    if (!isPremium && dir === "super") { setShowPaywall(true); return; }
    setSwipeDir(dir);
    setTimeout(() => {
      setSwipeDir(null);
      setCards(prev => prev.slice(0, -1));
      if (dir === "right" || dir === "super") {
        if (!matches.find(m => m.id === person.id)) {
          setMatches(prev => [person, ...prev]);
          setShowMatch(person);
          setTimeout(() => setShowMatch(null), 3000);
        }
      }
    }, 400);
  }

  function openChat(person) {
    if (!user) {
      setAuthPopupMsg("Konekte pou ka chate! 💬");
      setAuthMode("choice");
      setShowAuthPopup(true);
      return;
    }
    // Check if person already sent a message (they can reply for free)
    const hasMessages = msgs[person.id] && msgs[person.id].some(m => m.from === "them");
    if (!isPremium && !hasMessages) { setShowPaywall(true); return; }
    setActiveChat(person); setTab("chat");
  }

  async function sendMessage() {
    if (!inputMsg.trim() || !activeChat || !user) return;
    const chatId = [user.uid, String(activeChat.id)].sort().join("_");
    const msg = { text: inputMsg, from: user.uid, senderName: user.name, timestamp: Date.now() };
    setInputMsg("");
    try {
      await fetch(`${FIREBASE_DB_URL}/chats/${chatId}/messages.json`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(msg)
      });
    } catch(e) {
      // Fallback to local if Firebase fails
      setMsgs(prev => ({ ...prev, [activeChat.id]: [...(prev[activeChat.id]||[]), { from:"me", text:msg.text }] }));
    }
  }

  function startPayment(p) {
    setSelectedPlan(p);
    setPayStep("method");
  }

  function confirmPay() {
    setPaying(true);
    setTimeout(() => {
      setPaying(false);
      setPlan(selectedPlan.key);
      setPayStep("success");
    }, 1800);
  }

  function closePaywall() {
    setShowPaywall(false);
    setPayStep("plans");
    setSelectedPlan(null);
    setPayMethod(null);
    setFormData({ cardNum:"", expiry:"", cvv:"", phone:"", email:"" });
  }


  // ── REALTIME CHAT ──
  useEffect(() => {
    if (!activeChat || !user) return;
    const chatId = [user.uid, String(activeChat.id)].sort().join("_");
    
    async function loadMessages() {
      try {
        const res = await fetch(`${FIREBASE_DB_URL}/chats/${chatId}/messages.json`);
        const data = await res.json();
        if (data) {
          const allMsgs = Object.values(data)
            .sort((a,b) => a.timestamp - b.timestamp)
            .map(m => ({ from: m.from === user.uid ? "me" : "them", text: m.text }));
          setMsgs(prev => ({ ...prev, [activeChat.id]: allMsgs }));
        }
      } catch(e) {}
    }
    loadMessages();
    
    const interval = setInterval(loadMessages, 3000);
    return () => clearInterval(interval);
  }, [activeChat, user]);

  // ── PROFILE SETUP SCREEN ──
  if (user && !user.profileComplete) {
    return (
      <div style={{ minHeight:"100vh", background:"linear-gradient(135deg,#0F0F1A,#1A0A2E)", fontFamily:"'Inter',sans-serif", color:"#fff", overflowY:"auto" }}>
        <style>{`@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700;800;900&display=swap');*{box-sizing:border-box;margin:0;padding:0}input::placeholder{color:rgba(255,255,255,0.3)}textarea::placeholder{color:rgba(255,255,255,0.3)}`}</style>
        <div style={{ maxWidth:430, margin:"0 auto", padding:"32px 24px 60px" }}>
          <div style={{ textAlign:"center", marginBottom:28 }}>
            <div style={{ fontSize:40, marginBottom:8 }}>✨</div>
            <div style={{ fontSize:22, fontWeight:900, background:"linear-gradient(90deg,#FF3B5C,#A855F7)", WebkitBackgroundClip:"text", WebkitTextFillColor:"transparent" }}>Kreye Pwofil Ou</div>
            <div style={{ fontSize:13, color:"rgba(255,255,255,0.4)", marginTop:4 }}>Pou moun ka konnen ou! 💕</div>
          </div>

          {/* PHOTO GALLERY */}
          <div style={{ marginBottom:24 }}>
            <div style={{ fontSize:13, fontWeight:700, color:"rgba(255,255,255,0.5)", marginBottom:12, letterSpacing:1, textTransform:"uppercase" }}>📸 Foto ou (premye foto = foto prensipal)</div>
            <div style={{ display:"grid", gridTemplateColumns:"repeat(3, 1fr)", gap:8 }}>
              {[0,1,2,3,4,5].map(idx => {
                const photo = (setupData.photos || [])[idx];
                return (
                  <div key={idx} style={{ aspectRatio:"1", borderRadius:14, overflow:"hidden", position:"relative", background:"rgba(255,255,255,0.07)", border:"1px solid rgba(255,255,255,0.12)", display:"flex", alignItems:"center", justifyContent:"center", cursor:"pointer" }}
                    onClick={() => { if(!photo) document.getElementById(`photoInput_${idx}`).click(); }}>
                    {photo ? (
                      <>
                        <img src={photo} alt="" style={{ width:"100%", height:"100%", objectFit:"cover" }} />
                        <div onClick={e => { e.stopPropagation(); setSetupData(p => ({...p, photos: p.photos.filter((_,i)=>i!==idx), photoUrl: idx===0 ? (p.photos[1]||null) : p.photoUrl})); }}
                          style={{ position:"absolute", top:4, right:4, width:22, height:22, borderRadius:"50%", background:"rgba(0,0,0,0.7)", display:"flex", alignItems:"center", justifyContent:"center", fontSize:12, color:"#fff" }}>✕</div>
                        {idx === 0 && <div style={{ position:"absolute", bottom:4, left:4, background:"linear-gradient(135deg,#FF3B5C,#A855F7)", borderRadius:8, padding:"2px 8px", fontSize:10, fontWeight:700 }}>Prensipal</div>}
                      </>
                    ) : (
                      <div style={{ textAlign:"center", color:"rgba(255,255,255,0.3)" }}>
                        <div style={{ fontSize:24 }}>➕</div>
                        <div style={{ fontSize:10, marginTop:4 }}>{idx === 0 ? "Prensipal" : `Foto ${idx+1}`}</div>
                      </div>
                    )}
                    <input id={`photoInput_${idx}`} type="file" accept="image/*" style={{ display:"none" }} onChange={async (e) => {
                      const file = e.target.files[0]; if (!file) return;
                      setPhotoUploading(true);
                      try {
                        const url = await uploadPhoto(file);
                        setSetupData(p => {
                          const newPhotos = [...(p.photos||[])];
                          newPhotos[idx] = url;
                          const filtered = newPhotos.filter(Boolean);
                          return {...p, photos: filtered, photoUrl: filtered[0] || p.photoUrl};
                        });
                      } catch(err) { alert("Erè telechajman foto — eseye ankò"); }
                      setPhotoUploading(false);
                    }} />
                  </div>
                );
              })}
            </div>
            {photoUploading && <div style={{ textAlign:"center", marginTop:8, fontSize:13, color:"rgba(255,255,255,0.5)" }}>⏳ Ap telechaje foto...</div>}
          </div>

          {/* FIELDS */}
          <div style={{ display:"flex", flexDirection:"column", gap:12, marginBottom:20 }}>
            <input style={{ width:"100%", padding:"14px 16px", borderRadius:14, background:"rgba(255,255,255,0.07)", border:"1px solid rgba(255,255,255,0.12)", color:"#fff", fontSize:15, outline:"none" }}
              placeholder="👤 Non ou (obligatwa)" value={setupData.name} onChange={e => setSetupData(p => ({...p, name: e.target.value}))} />

            <div style={{ display:"flex", gap:10 }}>
              <input style={{ flex:1, padding:"14px 16px", borderRadius:14, background:"rgba(255,255,255,0.07)", border:"1px solid rgba(255,255,255,0.12)", color:"#fff", fontSize:15, outline:"none" }}
                placeholder="🎂 Laj" type="number" min="18" max="99" value={setupData.age} onChange={e => setSetupData(p => ({...p, age: e.target.value}))} />
              <select style={{ flex:1, padding:"14px 16px", borderRadius:14, background:"#1A1A2E", border:"1px solid rgba(255,255,255,0.12)", color:"#fff", fontSize:14, outline:"none" }}
                value={setupData.gender} onChange={e => setSetupData(p => ({...p, gender: e.target.value}))}>
                <option value="">⚧ Sèks</option>
                <option value="homme">👨 Gason</option>
                <option value="femme">👩 Fanm</option>
                <option value="autre">🌈 Lòt</option>
              </select>
            </div>

            <input style={{ width:"100%", padding:"14px 16px", borderRadius:14, background:"rgba(255,255,255,0.07)", border:"1px solid rgba(255,255,255,0.12)", color:"#fff", fontSize:15, outline:"none" }}
              placeholder="🌍 Peyi ou (ex: Haiti, France, USA...)" value={setupData.country} onChange={e => setSetupData(p => ({...p, country: e.target.value}))} />
            <input style={{ width:"100%", padding:"14px 16px", borderRadius:14, background:"rgba(255,255,255,0.07)", border:"1px solid rgba(255,255,255,0.12)", color:"#fff", fontSize:15, outline:"none" }}
              placeholder="📍 Vil ou (ex: Port-au-Prince, Paris...)" value={setupData.city} onChange={e => setSetupData(p => ({...p, city: e.target.value}))} />

            <textarea style={{ width:"100%", padding:"14px 16px", borderRadius:14, background:"rgba(255,255,255,0.07)", border:"1px solid rgba(255,255,255,0.12)", color:"#fff", fontSize:15, outline:"none", resize:"none", height:100 }}
              placeholder="💬 Di yon bagay sou ou (bio)..." value={setupData.bio} onChange={e => setSetupData(p => ({...p, bio: e.target.value}))} />
          </div>

          {/* INTERESTS */}
          <div style={{ marginBottom:24 }}>
            <div style={{ fontSize:13, fontWeight:700, color:"rgba(255,255,255,0.5)", marginBottom:12, letterSpacing:1, textTransform:"uppercase" }}>Enterè ou (chwazi 3+)</div>
            <div style={{ display:"flex", flexWrap:"wrap", gap:8 }}>
              {["Mizik 🎵","Danse 💃","Vwayaj ✈️","Manje 🍽️","Spò ⚽","Lekti 📚","Fim 🎬","Atizana 🎨","Nati 🌿","Biznis 💼","Mode 👗","Jwèt 🎮","Kwizin 👨‍🍳","Foto 📸","Yoga 🧘"].map(interest => {
                const sel = (setupData.interests || []).includes(interest);
                return (
                  <div key={interest} onClick={() => {
                    const cur = setupData.interests || [];
                    setSetupData(p => ({...p, interests: sel ? cur.filter(i=>i!==interest) : [...cur, interest]}));
                  }} style={{ padding:"8px 14px", borderRadius:20, fontSize:13, cursor:"pointer", background:sel?"linear-gradient(135deg,#FF3B5C,#A855F7)":"rgba(255,255,255,0.07)", border:sel?"none":"1px solid rgba(255,255,255,0.12)", fontWeight:sel?700:400 }}>
                    {interest}
                  </div>
                );
              })}
            </div>
          </div>

          {setupError && <div style={{ color:"#FF3B5C", fontSize:13, marginBottom:12, textAlign:"center", padding:"8px", background:"rgba(255,59,92,0.1)", borderRadius:10 }}>{setupError}</div>}

          <button onClick={() => {
            if (!setupData.name) { setSetupError("Mete non ou!"); return; }
            if (!setupData.age || setupData.age < 18) { setSetupError("Ou dwe gen 18 an oswa plis!"); return; }
            if (!setupData.country) { setSetupError("Mete peyi ou!"); return; }
            if (!setupData.city) { setSetupError("Mete vil ou!"); return; }
            if ((setupData.interests||[]).length < 2) { setSetupError("Chwazi omwen 2 enterè!"); return; }
            const updated = {
              ...user, 
              name: setupData.name,
              age: setupData.age,
              gender: setupData.gender,
              country: setupData.country,
              city: setupData.city,
              bio: setupData.bio,
              photos: setupData.photos || [],
              photoUrl: (setupData.photos && setupData.photos[0]) || setupData.photoUrl || null,
              interests: setupData.interests,
              profileComplete: true
            };
            setUser(updated);
            const session = JSON.parse(localStorage.getItem("tikeke_session") || "{}");
            localStorage.setItem("tikeke_session", JSON.stringify({...session, ...updated}));
            saveUserProfile(updated, user?.idToken);
          }} style={{ width:"100%", padding:"16px", borderRadius:16, border:"none", background:"linear-gradient(135deg,#FF3B5C,#A855F7)", color:"#fff", fontSize:16, fontWeight:800, cursor:"pointer" }}>
            💕 Kòmanse Ti Kèkè!
          </button>
        </div>
      </div>
    );
  }


  const G = {
    app: { minHeight:"100vh", background:"linear-gradient(135deg,#0F0F1A 0%,#1A0A2E 100%)", fontFamily:"'Inter','Segoe UI',sans-serif", color:"#fff", display:"flex", flexDirection:"column", maxWidth:430, margin:"0 auto", position:"relative", overflow:"hidden" },
    header: { display:"flex", justifyContent:"space-between", alignItems:"center", padding:"18px 20px 10px", borderBottom:"1px solid rgba(255,255,255,0.07)" },
    logo: { fontSize:22, fontWeight:800, background:"linear-gradient(90deg,#FF3B5C,#A855F7)", WebkitBackgroundClip:"text", WebkitTextFillColor:"transparent" },
    tagline: { fontSize:10, color:"rgba(255,255,255,0.4)", marginTop:1 },
    content: { flex:1, overflowY:"auto", paddingBottom:80 },
    nav: { position:"fixed", bottom:0, left:"50%", transform:"translateX(-50%)", width:"100%", maxWidth:430, background:"rgba(10,10,20,0.96)", backdropFilter:"blur(20px)", borderTop:"1px solid rgba(255,255,255,0.07)", display:"flex", padding:"8px 0 12px", zIndex:50 },
  };

  const navItems = [
    { key:"discover", icon:"🔥", label:t.discover },
    { key:"matches",  icon:"💞", label:t.matches  },
    { key:"chat",     icon:"💬", label:t.chat     },
    { key:"profile",  icon:"👤", label:t.profile  },
  ];

  const langList = [["ht","🇭🇹 Kreyòl"],["fr","🇫🇷 Français"],["en","🇺🇸 English"],["es","🇪🇸 Español"]];

  // ── PAYWALL MODAL ──────────────────────────────────────────
  function PaywallModal() {
    const planObj = PLANS.find(p => p.key === selectedPlan?.key);
    return (
      <div style={{ position:"fixed", inset:0, background:"rgba(0,0,0,0.88)", zIndex:300, display:"flex", alignItems:"flex-end", justifyContent:"center" }}>
        <div style={{ background:"linear-gradient(160deg,#12102A,#1E0A3A)", borderRadius:"28px 28px 0 0", width:"100%", maxWidth:430, maxHeight:"92vh", overflowY:"auto", padding:"28px 24px 40px" }}>

          {/* CLOSE */}
          <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:20 }}>
            <div style={{ fontSize:20, fontWeight:800, background:"linear-gradient(90deg,#FF3B5C,#A855F7)", WebkitBackgroundClip:"text", WebkitTextFillColor:"transparent" }}>
              {payStep === "plans"   ? t.chooseplan :
               payStep === "method" ? t.choosepay  :
               payStep === "form"   ? t.enterDetails:
               payStep === "success"? t.success     : ""}
            </div>
            {payStep !== "success" && (
              <div onClick={closePaywall} style={{ fontSize:22, cursor:"pointer", color:"rgba(255,255,255,0.4)" }}>✕</div>
            )}
          </div>

          {/* STEP: PLANS */}
          {payStep === "plans" && (
            <div>
              <div style={{ fontSize:13, color:"rgba(255,255,255,0.5)", marginBottom:20 }}>{t.unlockSub}</div>
              {PLANS.map(p => (
                <div key={p.key} onClick={() => p.key !== "free" && startPayment(p)} style={{
                  border: `2px solid ${p.popular ? p.color : "rgba(255,255,255,0.1)"}`,
                  borderRadius:18, padding:"16px 18px", marginBottom:12, cursor: p.key==="free"?"default":"pointer",
                  background: plan===p.key ? `${p.color}22` : "rgba(255,255,255,0.03)",
                  position:"relative", transition:"all 0.2s",
                }}>
                  {p.popular && <div style={{ position:"absolute", top:-10, right:16, background:`linear-gradient(90deg,#FF3B5C,#A855F7)`, borderRadius:20, padding:"2px 12px", fontSize:10, fontWeight:700 }}>⭐ POPULAR</div>}
                  {plan===p.key && <div style={{ position:"absolute", top:12, right:16, fontSize:11, color:"#22C55E", fontWeight:700 }}>{t.active}</div>}
                  <div style={{ display:"flex", alignItems:"center", gap:12 }}>
                    <div style={{ fontSize:28 }}>{p.icon}</div>
                    <div style={{ flex:1 }}>
                      <div style={{ fontWeight:800, fontSize:16, color: p.color }}>{t[p.key]}</div>
                      <div style={{ fontSize:12, color:"rgba(255,255,255,0.5)", marginTop:2 }}>{t[p.key+"Sub"]}</div>
                    </div>
                    <div style={{ textAlign:"right" }}>
                      {p.price === 0
                        ? <div style={{ fontWeight:800, color:"#6B7280" }}>{t.free}</div>
                        : <div>
                            <div style={{ fontWeight:900, fontSize:20, color:p.color }}>${p.price}</div>
                            <div style={{ fontSize:10, color:"rgba(255,255,255,0.4)" }}>{t.perMonth}</div>
                          </div>
                      }
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* STEP: METHOD */}
          {payStep === "method" && selectedPlan && (
            <div>
              <div style={{ background:"rgba(255,255,255,0.04)", borderRadius:14, padding:"14px 18px", marginBottom:20, display:"flex", justifyContent:"space-between", alignItems:"center" }}>
                <div>
                  <div style={{ fontSize:12, color:"rgba(255,255,255,0.4)" }}>{t.chooseplan}</div>
                  <div style={{ fontWeight:800, color: PLANS.find(p=>p.key===selectedPlan.key)?.color }}>
                    {PLANS.find(p=>p.key===selectedPlan.key)?.icon} {t[selectedPlan.key]} — ${selectedPlan.price}{t.mo}
                  </div>
                </div>
                <div onClick={() => setPayStep("plans")} style={{ fontSize:12, color:"#FF3B5C", cursor:"pointer" }}>✎</div>
              </div>
              <div style={{ fontSize:12, color:"rgba(255,255,255,0.4)", marginBottom:12 }}>{t.choosepay}</div>
              {PAY_METHODS.map(m => (
                <div key={m.key} onClick={() => { setPayMethod(m.key); setPayStep("form"); }} style={{
                  display:"flex", alignItems:"center", gap:14, padding:"16px 18px", borderRadius:16, marginBottom:10, cursor:"pointer",
                  border: payMethod===m.key ? "2px solid #FF3B5C" : "2px solid rgba(255,255,255,0.1)",
                  background: payMethod===m.key ? "rgba(255,59,92,0.1)" : "rgba(255,255,255,0.03)",
                  transition:"all 0.2s",
                }}>
                  <div style={{ fontSize:28 }}>{m.icon}</div>
                  <div style={{ flex:1, fontWeight:600, fontSize:15 }}>{t[m.key]}</div>
                  {m.key === "moncash" && (
                    <div style={{ background:"linear-gradient(90deg,#FF6B00,#FF9500)", borderRadius:20, padding:"2px 10px", fontSize:10, fontWeight:700 }}>🇭🇹 LOCAL</div>
                  )}
                  {m.key === "natcash" && (
                    <div style={{ background:"linear-gradient(90deg,#1E3A8A,#3B82F6)", borderRadius:20, padding:"2px 10px", fontSize:10, fontWeight:700 }}>🇭🇹 LOCAL</div>
                  )}
                  <div style={{ fontSize:18, color:"rgba(255,255,255,0.3)" }}>›</div>
                </div>
              ))}
            </div>
          )}

          {/* STEP: FORM */}
          {payStep === "form" && payMethod && (
            <div>
              {/* Summary */}
              <div style={{ background:"rgba(255,255,255,0.04)", borderRadius:14, padding:"14px 18px", marginBottom:20 }}>
                <div style={{ display:"flex", justifyContent:"space-between" }}>
                  <div>
                    <div style={{ fontSize:12, color:"rgba(255,255,255,0.4)" }}>Plan</div>
                    <div style={{ fontWeight:800 }}>{t[selectedPlan.key]} — ${selectedPlan.price}{t.mo}</div>
                  </div>
                  <div>
                    <div style={{ fontSize:12, color:"rgba(255,255,255,0.4)" }}>{t.choosepay}</div>
                    <div style={{ fontWeight:700 }}>{PAY_METHODS.find(m=>m.key===payMethod)?.icon} {t[payMethod]}</div>
                  </div>
                </div>
              </div>

              {/* CARD FORM */}
              {payMethod === "card" && (
                <div style={{ display:"flex", flexDirection:"column", gap:12 }}>
                  <input style={inputStyle} placeholder={t.cardNum} maxLength={19}
                    value={formData.cardNum}
                    onChange={e => setFormData(f => ({ ...f, cardNum: e.target.value.replace(/\D/g,"").replace(/(.{4})/g,"$1 ").trim() }))} />
                  <div style={{ display:"flex", gap:10 }}>
                    <input style={{ ...inputStyle, flex:1 }} placeholder={t.expiry} maxLength={5}
                      value={formData.expiry}
                      onChange={e => { let v=e.target.value.replace(/\D/g,""); if(v.length>2) v=v.slice(0,2)+"/"+v.slice(2); setFormData(f=>({...f,expiry:v})); }} />
                    <input style={{ ...inputStyle, flex:1 }} placeholder={t.cvv} maxLength={3} type="password"
                      value={formData.cvv}
                      onChange={e => setFormData(f => ({ ...f, cvv: e.target.value.replace(/\D/g,"") }))} />
                  </div>
                </div>
              )}

              {/* MONCASH / NATCASH */}
              {(payMethod === "moncash" || payMethod === "natcash") && (
                <div style={{ display:"flex", flexDirection:"column", gap:12 }}>
                  <div style={{ background: payMethod==="moncash" ? "linear-gradient(135deg,#FF6B00,#FF9500)" : "linear-gradient(135deg,#1E3A8A,#3B82F6)", borderRadius:16, padding:"20px", textAlign:"center", marginBottom:4 }}>
                    <div style={{ fontSize:36, marginBottom:6 }}>{payMethod==="moncash" ? "📱" : "📲"}</div>
                    <div style={{ fontWeight:800, fontSize:16 }}>{t[payMethod]}</div>
                    <div style={{ fontSize:22, fontWeight:900, marginTop:6 }}>+509 36 00 0000</div>
                    <div style={{ fontSize:12, color:"rgba(255,255,255,0.7)", marginTop:4 }}>Montant: ${selectedPlan.price} USD</div>
                  </div>
                  <input style={inputStyle} placeholder={t.phone}
                    value={formData.phone}
                    onChange={e => setFormData(f => ({ ...f, phone: e.target.value }))} />
                </div>
              )}

              {/* PAYPAL */}
              {payMethod === "paypal" && (
                <div style={{ display:"flex", flexDirection:"column", gap:12 }}>
                  <div style={{ background:"linear-gradient(135deg,#003087,#009CDE)", borderRadius:16, padding:"16px", textAlign:"center", marginBottom:4 }}>
                    <div style={{ fontSize:32 }}>🅿️</div>
                    <div style={{ fontWeight:800, fontSize:15, marginTop:4 }}>PayPal</div>
                    <div style={{ fontSize:12, color:"rgba(255,255,255,0.7)", marginTop:2 }}>tikeke@paypal.com</div>
                  </div>
                  <input style={inputStyle} placeholder={t.email} type="email"
                    value={formData.email}
                    onChange={e => setFormData(f => ({ ...f, email: e.target.value }))} />
                </div>
              )}

              <button onClick={confirmPay} disabled={paying} style={{
                width:"100%", marginTop:24, padding:"16px", borderRadius:16, border:"none", cursor:"pointer",
                background: paying ? "rgba(255,255,255,0.1)" : "linear-gradient(135deg,#FF3B5C,#A855F7)",
                color:"#fff", fontSize:16, fontWeight:800, display:"flex", alignItems:"center", justifyContent:"center", gap:10,
                transition:"opacity 0.2s",
              }}>
                {paying ? <><span style={{ fontSize:20 }}>⏳</span> Processing...</> : <><span>🔒</span> {t.confirm} — ${selectedPlan.price}</>}
              </button>
              <div style={{ textAlign:"center", fontSize:11, color:"rgba(255,255,255,0.25)", marginTop:10 }}>🔐 Peman Sekirize · SSL Encrypted</div>
            </div>
          )}

          {/* STEP: SUCCESS */}
          {payStep === "success" && (
            <div style={{ textAlign:"center", padding:"20px 0" }}>
              <div style={{ fontSize:72, marginBottom:16, animation:"bounce 0.6s ease" }}>🎉</div>
              <div style={{ fontSize:24, fontWeight:900, background:"linear-gradient(90deg,#FF3B5C,#A855F7)", WebkitBackgroundClip:"text", WebkitTextFillColor:"transparent", marginBottom:8 }}>{t.success}</div>
              <div style={{ fontSize:15, color:"rgba(255,255,255,0.6)", marginBottom:8 }}>{t.successMsg}</div>
              <div style={{ background:"rgba(34,197,94,0.15)", border:"1px solid rgba(34,197,94,0.3)", borderRadius:14, padding:"12px 20px", marginBottom:28, display:"inline-block" }}>
                <span style={{ color:"#22C55E", fontWeight:700 }}>✓ {t[plan]} {t.active}</span>
              </div>
              <br/>
              <button onClick={closePaywall} style={{ background:"linear-gradient(135deg,#FF3B5C,#A855F7)", border:"none", borderRadius:16, padding:"14px 40px", color:"#fff", fontSize:16, fontWeight:800, cursor:"pointer" }}>
                {t.continue} 💕
              </button>
            </div>
          )}

          {payStep === "form" && (
            <div onClick={() => setPayStep("method")} style={{ textAlign:"center", marginTop:14, color:"rgba(255,255,255,0.35)", fontSize:13, cursor:"pointer" }}>
              ← {t.cancel}
            </div>
          )}
        </div>
      </div>
    );
  }

  const inputStyle = {
    width:"100%", padding:"14px 16px", borderRadius:14, background:"rgba(255,255,255,0.07)",
    border:"1px solid rgba(255,255,255,0.12)", color:"#fff", fontSize:15, outline:"none",
  };

  // ── PLAN BADGE ─────────────────────────────────────────────
  const planBadge = PLANS.find(p => p.key === plan);

  return (
    <div style={G.app}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700;800;900&display=swap');
        * { box-sizing:border-box; margin:0; padding:0; }
        ::-webkit-scrollbar { display:none; }
        @keyframes fadeIn { from{opacity:0;transform:scale(0.92)} to{opacity:1;transform:scale(1)} }
        @keyframes bounce { 0%,100%{transform:scale(1)} 50%{transform:scale(1.2)} }
        input::placeholder { color:rgba(255,255,255,0.3); }
      `}</style>

      {/* HEADER */}
      <div style={G.header}>
        <div>
          <div style={G.logo}>Ti Kèkè 💕</div>
          <div style={G.tagline}>{t.tagline}</div>
        </div>
        <div style={{ display:"flex", alignItems:"center", gap:8 }}>
          {/* Plan Badge */}
          {plan !== "free" && (
            <div onClick={() => { setShowPaywall(true); setPayStep("plans"); }} style={{
              background:`linear-gradient(135deg,${planBadge.color}44,${planBadge.color}22)`,
              border:`1px solid ${planBadge.color}66`, borderRadius:20, padding:"4px 10px",
              fontSize:11, fontWeight:700, cursor:"pointer", color:planBadge.color,
            }}>
              {planBadge.icon} {t[plan]}
            </div>
          )}
          {/* Lang */}
          <div style={{ position:"relative" }}>
            <button onClick={() => setLangOpen(!langOpen)} style={{ background:"rgba(255,255,255,0.08)", border:"1px solid rgba(255,255,255,0.12)", borderRadius:20, padding:"6px 12px", color:"#fff", fontSize:12, cursor:"pointer" }}>
              {langList.find(l=>l[0]===lang)?.[1].split(" ")[0]} ▾
            </button>
            {langOpen && (
              <div style={{ position:"absolute", top:38, right:0, background:"#1E1E35", border:"1px solid rgba(255,255,255,0.12)", borderRadius:14, overflow:"hidden", zIndex:100, minWidth:130 }}>
                {langList.map(([code,label]) => (
                  <div key={code} onClick={() => { setLang(code); setLangOpen(false); }}
                    style={{ padding:"10px 16px", cursor:"pointer", fontSize:13, background:lang===code?"rgba(255,59,92,0.15)":"transparent", fontWeight:lang===code?700:400 }}>
                    {label}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* CONTENT */}
      <div style={G.content}>

        {/* ── DISCOVER ── */}
        {tab === "discover" && (
          <div style={{ padding:"16px 20px", display:"flex", flexDirection:"column", alignItems:"center" }}>
            <div style={{ width:"100%", maxWidth:380, height:480, position:"relative", marginBottom:24 }}>
              {cards.length === 0 ? (
                <div style={{ position:"absolute", inset:0, display:"flex", flexDirection:"column", justifyContent:"center", alignItems:"center", textAlign:"center", color:"rgba(255,255,255,0.4)" }}>
                  <div style={{ fontSize:60, marginBottom:16 }}>😅</div>
                  <div style={{ fontSize:18, fontWeight:700, marginBottom:8 }}>{t.noMore}</div>
                  <div style={{ fontSize:14 }}>{t.comeBack}</div>
                </div>
              ) : cards.map((p, i) => (
                <div key={p.id} style={{
                  width:"100%", height:"100%", borderRadius:28,
                  background:`linear-gradient(160deg,${p.color}22,${p.color}55)`,
                  border:`1.5px solid ${p.color}44`,
                  display:"flex", flexDirection:"column", overflow:"hidden",
                  position:"absolute", top:0, left:0,
                  transition: i===cards.length-1 && swipeDir ? "transform 0.4s ease,opacity 0.4s" : "none",
                  transform: i===cards.length-1
                    ? (swipeDir==="right" ? "translateX(120%) rotate(15deg)" : swipeDir==="left" ? "translateX(-120%) rotate(-15deg)" : swipeDir==="super" ? "translateY(-120%)" : `rotate(${i%2===0?-1:1}deg)`)
                    : `scale(${0.94-(cards.length-1-i)*0.03}) translateY(${(cards.length-1-i)*10}px)`,
                  opacity: i===cards.length-1 ? (swipeDir?0:1) : 0.7-(cards.length-1-i)*0.1,
                  zIndex:i, backdropFilter:"blur(10px)", boxShadow:`0 20px 60px ${p.color}33`,
                }}>
                  <div style={{ flex:1, display:"flex", alignItems:"center", justifyContent:"center", fontSize:110, background:`linear-gradient(160deg,${p.color}15,${p.color}35)` }}>{p.emoji}</div>
                  <div style={{ padding:"20px 24px", background:"rgba(0,0,0,0.5)", backdropFilter:"blur(8px)" }}>
                    <div style={{ fontSize:24, fontWeight:800, marginBottom:4 }}>
                      <span style={{ display:"inline-block", width:8, height:8, borderRadius:"50%", background:p.online?"#22C55E":"#6B7280", marginRight:6, verticalAlign:"middle" }} />
                      {p.name}, {p.age} {t.age}
                    </div>
                    <div style={{ fontSize:13, color:"rgba(255,255,255,0.55)", marginBottom:8 }}>📍 {p.city} · {p.km} {t.km}</div>
                    <div style={{ fontSize:14, color:"rgba(255,255,255,0.8)", marginBottom:10, lineHeight:1.5 }}>{p.bio}</div>
                    <div style={{ display:"flex", flexWrap:"wrap", gap:6 }}>
                      {p.interests.map((x,idx) => (
                        <span key={idx} style={{ background:`${p.color}25`, border:`1px solid ${p.color}44`, borderRadius:20, padding:"3px 10px", fontSize:11 }}>{x}</span>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {cards.length > 0 && (
              <div style={{ display:"flex", justifyContent:"center", gap:18, alignItems:"center" }}>
                {[["#EF4444",54,"✕","left"],["#3B82F6",48,"⭐","super"],["#FF3B5C",64,"♥","right"]].map(([color,size,icon,dir]) => (
                  <div key={dir} onClick={() => handleSwipe(dir, currentCard)} style={{
                    width:size, height:size, borderRadius:"50%", background:`${color}18`,
                    border:`2px solid ${color}66`, display:"flex", alignItems:"center", justifyContent:"center",
                    fontSize:dir==="right"?28:dir==="super"?22:18, cursor:"pointer",
                    transition:"transform 0.15s,background 0.15s", position:"relative",
                  }}>
                    {icon}
                    {dir==="super" && !isPremium && (
                      <div style={{ position:"absolute", top:-4, right:-4, width:14, height:14, borderRadius:"50%", background:"#FF3B5C", fontSize:8, display:"flex", alignItems:"center", justifyContent:"center" }}>🔒</div>
                    )}
                  </div>
                ))}
              </div>
            )}

            {/* FREE LIMIT BANNER */}
            {!isPremium && (
              <div onClick={() => setShowPaywall(true)} style={{
                marginTop:20, width:"100%", maxWidth:380, background:"linear-gradient(135deg,rgba(255,59,92,0.15),rgba(168,85,247,0.15))",
                border:"1px solid rgba(255,59,92,0.3)", borderRadius:16, padding:"12px 18px",
                display:"flex", alignItems:"center", gap:12, cursor:"pointer",
              }}>
                <div style={{ fontSize:24 }}>💎</div>
                <div style={{ flex:1 }}>
                  <div style={{ fontSize:13, fontWeight:700, color:"#FF3B5C" }}>{t.unlock}</div>
                  <div style={{ fontSize:11, color:"rgba(255,255,255,0.4)", marginTop:2 }}>{t.unlockSub}</div>
                </div>
                <div style={{ fontSize:18, color:"rgba(255,255,255,0.3)" }}>›</div>
              </div>
            )}
          </div>
        )}

        {/* ── MATCHES ── */}
        {tab === "matches" && !activeChat && (
          <div style={{ padding:"16px 20px" }}>
            <div style={{ fontSize:13, fontWeight:700, color:"rgba(255,255,255,0.4)", letterSpacing:1, textTransform:"uppercase", marginBottom:14 }}>{t.newMatches}</div>
            <div style={{ display:"flex", overflowX:"auto", gap:14, paddingBottom:8, scrollbarWidth:"none" }}>
              {matches.map(m => (
                <div key={m.id} onClick={() => openChat(m)} style={{ display:"flex", flexDirection:"column", alignItems:"center", gap:6, cursor:"pointer" }}>
                  <div style={{ width:64, height:64, borderRadius:"50%", background:`linear-gradient(135deg,${m.color}44,${m.color}88)`, border:`2.5px solid ${m.color}`, display:"flex", alignItems:"center", justifyContent:"center", fontSize:30, flexShrink:0 }}>{m.emoji}</div>
                  <div style={{ fontSize:12, color:"rgba(255,255,255,0.7)" }}>{m.name}</div>
                </div>
              ))}
            </div>
            <div style={{ marginTop:24 }}>
              <div style={{ fontSize:13, fontWeight:700, color:"rgba(255,255,255,0.4)", letterSpacing:1, textTransform:"uppercase", marginBottom:14 }}>{t.messages}</div>
              {matches.filter(m => msgs[m.id]?.length > 0).map(m => (
                <div key={m.id} onClick={() => openChat(m)} style={{ display:"flex", alignItems:"center", gap:14, padding:"14px 0", borderBottom:"1px solid rgba(255,255,255,0.06)", cursor:"pointer" }}>
                  <div style={{ width:50, height:50, borderRadius:"50%", background:`linear-gradient(135deg,${m.color}44,${m.color}88)`, border:`2px solid ${m.color}66`, display:"flex", alignItems:"center", justifyContent:"center", fontSize:24, flexShrink:0 }}>{m.emoji}</div>
                  <div style={{ flex:1 }}>
                    <div style={{ fontSize:15, fontWeight:700 }}>{m.name}</div>
                    <div style={{ fontSize:12, color:"rgba(255,255,255,0.4)", marginTop:2 }}>{msgs[m.id]?.slice(-1)[0]?.text || "..."}</div>
                  </div>
                  
                  {m.online && isPremium && <span style={{ display:"inline-block", width:10, height:10, borderRadius:"50%", background:"#22C55E" }} />}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── CHAT ── */}
        {tab === "chat" && activeChat && (
          <div style={{ display:"flex", flexDirection:"column", height:"calc(100vh - 160px)" }}>
            <div style={{ display:"flex", alignItems:"center", gap:12, padding:"14px 20px", borderBottom:"1px solid rgba(255,255,255,0.08)", background:"rgba(0,0,0,0.3)" }}>
              <span onClick={() => { setActiveChat(null); setTab("matches"); }} style={{ fontSize:22, cursor:"pointer", color:"#FF3B5C" }}>←</span>
              <div style={{ width:38, height:38, borderRadius:"50%", background:`linear-gradient(135deg,${activeChat.color}44,${activeChat.color}88)`, border:`2px solid ${activeChat.color}66`, display:"flex", alignItems:"center", justifyContent:"center", fontSize:18 }}>{activeChat.emoji}</div>
              <div>
                <div style={{ fontWeight:700, fontSize:15 }}>{activeChat.name}</div>
                <div style={{ fontSize:11, color:activeChat.online?"#22C55E":"rgba(255,255,255,0.4)" }}>{activeChat.online ? t.online : "Offline"}</div>
              </div>
            </div>
            <div style={{ flex:1, overflowY:"auto", padding:"16px 20px", display:"flex", flexDirection:"column", gap:10 }}>
              {(msgs[activeChat.id]||[]).map((msg, i) => (
                <div key={i} style={{
                  maxWidth:"75%", padding:"10px 14px", fontSize:14, lineHeight:1.5,
                  borderRadius: msg.from==="me" ? "18px 18px 4px 18px" : "18px 18px 18px 4px",
                  background: msg.from==="me" ? "linear-gradient(135deg,#FF3B5C,#A855F7)" : "rgba(255,255,255,0.1)",
                  alignSelf: msg.from==="me" ? "flex-end" : "flex-start",
                }}>{msg.text}</div>
              ))}
              {!(msgs[activeChat.id]?.length>0) && (
                <div style={{ textAlign:"center", color:"rgba(255,255,255,0.3)", fontSize:13, marginTop:40 }}>💕 Kòmanse yon konvèsasyon!</div>
              )}
            </div>
            <div style={{ display:"flex", gap:10, padding:"12px 20px", borderTop:"1px solid rgba(255,255,255,0.08)", background:"rgba(0,0,0,0.3)" }}>
              <input style={{ flex:1, background:"rgba(255,255,255,0.08)", border:"1px solid rgba(255,255,255,0.12)", borderRadius:22, padding:"10px 16px", color:"#fff", fontSize:14, outline:"none" }}
                value={inputMsg} placeholder={t.sendMsg}
                onChange={e => setInputMsg(e.target.value)}
                onKeyDown={e => e.key==="Enter" && sendMessage()} />
              <button onClick={sendMessage} style={{ width:44, height:44, borderRadius:"50%", background:"linear-gradient(135deg,#FF3B5C,#A855F7)", border:"none", color:"#fff", fontSize:18, cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center" }}>➤</button>
            </div>
          </div>
        )}

        {tab === "chat" && !activeChat && (
          <div style={{ padding:"16px 20px" }}>
            <div style={{ fontSize:13, fontWeight:700, color:"rgba(255,255,255,0.4)", letterSpacing:1, textTransform:"uppercase", marginBottom:14 }}>{t.messages}</div>
            {matches.map(m => (
              <div key={m.id} onClick={() => openChat(m)} style={{ display:"flex", alignItems:"center", gap:14, padding:"14px 0", borderBottom:"1px solid rgba(255,255,255,0.06)", cursor:"pointer" }}>
                <div style={{ width:50, height:50, borderRadius:"50%", background:`linear-gradient(135deg,${m.color}44,${m.color}88)`, border:`2px solid ${m.color}66`, display:"flex", alignItems:"center", justifyContent:"center", fontSize:24 }}>{m.emoji}</div>
                <div style={{ flex:1 }}>
                  <div style={{ fontSize:15, fontWeight:700 }}>{m.name}</div>
                  <div style={{ fontSize:12, color:"rgba(255,255,255,0.4)", marginTop:2 }}>{msgs[m.id]?.slice(-1)[0]?.text || t.itsMatch}</div>
                </div>
                
              </div>
            ))}
          </div>
        )}

        {/* ── PROFILE ── */}
        {tab === "profile" && !showSettings && (
          <div style={{ padding:"24px 20px" }}>
            {/* PROFILE CARD */}
            <div style={{ background:"rgba(255,255,255,0.04)", border:"1px solid rgba(255,255,255,0.09)", borderRadius:24, padding:24, textAlign:"center", marginBottom:20, position:"relative" }}>
              {/* Settings button */}
              <div onClick={() => setShowSettings(true)} style={{ position:"absolute", top:16, right:16, width:36, height:36, borderRadius:"50%", background:"rgba(255,255,255,0.08)", display:"flex", alignItems:"center", justifyContent:"center", cursor:"pointer", fontSize:18 }}>⚙️</div>
              
              {/* Photo */}
              <div style={{ width:90, height:90, borderRadius:"50%", background:"linear-gradient(135deg,#FF3B5C,#A855F7)", margin:"0 auto 12px", display:"flex", alignItems:"center", justifyContent:"center", fontSize:44, overflow:"hidden" }}>
                {user?.photos?.[0] ? <img src={user.photos[0]} alt="profil" style={{ width:"100%", height:"100%", objectFit:"cover" }} /> : user?.photoUrl ? <img src={user.photoUrl} alt="profil" style={{ width:"100%", height:"100%", objectFit:"cover" }} /> : (user?.avatar || "🧑🏾")}
              </div>
              {/* Photo gallery preview */}
              {user?.photos?.length > 1 && (
                <div style={{ display:"flex", gap:6, justifyContent:"center", marginBottom:12 }}>
                  {user.photos.slice(1,4).map((p,i) => (
                    <div key={i} style={{ width:48, height:48, borderRadius:10, overflow:"hidden", border:"2px solid rgba(255,59,92,0.4)" }}>
                      <img src={p} alt="" style={{ width:"100%", height:"100%", objectFit:"cover" }} />
                    </div>
                  ))}
                  {user.photos.length > 4 && <div style={{ width:48, height:48, borderRadius:10, background:"rgba(255,255,255,0.1)", display:"flex", alignItems:"center", justifyContent:"center", fontSize:13, fontWeight:700 }}>+{user.photos.length-4}</div>}
                </div>
              )}
              
              <div style={{ fontSize:22, fontWeight:800, marginBottom:4 }}>{user?.name || "Mwen"}</div>
              <div style={{ fontSize:13, color:"rgba(255,255,255,0.5)", marginBottom:8 }}>
                {user?.country && `🌍 ${user.country}`} {user?.city && `· 📍 ${user.city}`} {user?.age && `· ${user.age} ${t.age}`}
              </div>
              {user?.bio && <div style={{ fontSize:13, color:"rgba(255,255,255,0.7)", marginBottom:12, lineHeight:1.5 }}>{user.bio}</div>}
              {plan !== "free" && (
                <div style={{ background:`linear-gradient(135deg,${planBadge.color}33,${planBadge.color}11)`, border:`1px solid ${planBadge.color}55`, borderRadius:12, padding:"6px 16px", display:"inline-block", marginBottom:12, fontSize:13, fontWeight:700, color:planBadge.color }}>
                  {planBadge.icon} {t[plan]} {t.active}
                </div>
              )}
              {user?.interests?.length > 0 && (
                <div style={{ display:"flex", flexWrap:"wrap", gap:6, justifyContent:"center" }}>
                  {user.interests.map((x,i) => (
                    <span key={i} style={{ background:"rgba(255,59,92,0.2)", border:"1px solid rgba(255,59,92,0.3)", borderRadius:20, padding:"3px 10px", fontSize:11 }}>{x}</span>
                  ))}
                </div>
              )}
            </div>

            {/* SUBSCRIPTION */}
            <div style={{ background:"rgba(255,255,255,0.03)", border:"1px solid rgba(255,255,255,0.08)", borderRadius:20, padding:20, marginBottom:16 }}>
              <div style={{ fontSize:13, fontWeight:700, color:"rgba(255,255,255,0.4)", letterSpacing:1, textTransform:"uppercase", marginBottom:14 }}>{t.currentPlan}</div>
              <div style={{ display:"flex", alignItems:"center", gap:12, marginBottom:14 }}>
                <div style={{ fontSize:32 }}>{planBadge.icon}</div>
                <div>
                  <div style={{ fontWeight:800, fontSize:16, color:planBadge.color }}>{t[plan]}</div>
                  <div style={{ fontSize:12, color:"rgba(255,255,255,0.4)" }}>{t[plan+"Sub"]}</div>
                </div>
              </div>
              <button onClick={() => { setShowPaywall(true); setPayStep("plans"); }} style={{ width:"100%", padding:"13px", borderRadius:14, border:"none", cursor:"pointer", background:"linear-gradient(135deg,#FF3B5C,#A855F7)", color:"#fff", fontSize:15, fontWeight:700 }}>
                {plan==="free" ? t.unlock : t.upgrade} 💎
              </button>
            </div>
          </div>
        )}

        {/* ── SETTINGS ── */}
        {tab === "profile" && showSettings && (
          <div style={{ padding:"0 0 40px" }}>
            {/* Header */}
            <div style={{ display:"flex", alignItems:"center", gap:12, padding:"16px 20px", borderBottom:"1px solid rgba(255,255,255,0.08)" }}>
              <span onClick={() => setShowSettings(false)} style={{ fontSize:22, cursor:"pointer", color:"#FF3B5C" }}>←</span>
              <div style={{ fontSize:18, fontWeight:800 }}>⚙️ Paramèt</div>
            </div>

            {/* ACCOUNT SECTION */}
            <div style={{ padding:"20px 20px 0" }}>
              <div style={{ fontSize:11, fontWeight:700, color:"rgba(255,255,255,0.35)", letterSpacing:1, textTransform:"uppercase", marginBottom:10 }}>👤 Kont</div>
              <div style={{ background:"rgba(255,255,255,0.03)", borderRadius:20, overflow:"hidden", marginBottom:16 }}>
                {[
                  { icon:"✏️", label:"Modifye Pwofil", action: () => { const u = {...user, profileComplete:false}; setUser(u); const s = JSON.parse(localStorage.getItem("tikeke_session")||"{}"); localStorage.setItem("tikeke_session", JSON.stringify({...s, profileComplete:false})); setShowSettings(false); } },
                  { icon:"📸", label:"Chanje Foto", action: () => document.getElementById("settingsPhotoInput").click() },
                  { icon:"🔗", label:"Pataje Pwofil", action: () => { navigator.share ? navigator.share({title:"Ti Kèkè", text:"Jwenn mwen sou Ti Kèkè!", url:"https://ti-keke.vercel.app"}) : alert("Kopi lyen: ti-keke.vercel.app"); } },
                ].map((item, i, arr) => (
                  <div key={i} onClick={item.action} style={{ display:"flex", alignItems:"center", gap:14, padding:"16px 18px", borderBottom: i<arr.length-1 ? "1px solid rgba(255,255,255,0.06)" : "none", cursor:"pointer" }}>
                    <span style={{ fontSize:20 }}>{item.icon}</span>
                    <div style={{ flex:1, fontSize:15 }}>{item.label}</div>
                    <span style={{ color:"rgba(255,255,255,0.3)", fontSize:18 }}>›</span>
                  </div>
                ))}
                <input id="settingsPhotoInput" type="file" accept="image/*" style={{ display:"none" }} onChange={async (e) => {
                  const file = e.target.files[0]; if (!file) return;
                  try {
                    const url = await uploadPhoto(file);
                    const u = {...user, photoUrl: url, photos: [url, ...(user.photos||[]).slice(1)]};
                    setUser(u);
                    const s = JSON.parse(localStorage.getItem("tikeke_session")||"{}");
                    localStorage.setItem("tikeke_session", JSON.stringify({...s, photoUrl: url}));
                    saveUserProfile(u, user?.idToken);
                    alert("✅ Foto chanje!");
                  } catch(e) { alert("Erè telechajman foto — eseye ankò"); }
                }} />
              </div>

              {/* PRIVACY */}
              <div style={{ fontSize:11, fontWeight:700, color:"rgba(255,255,255,0.35)", letterSpacing:1, textTransform:"uppercase", marginBottom:10 }}>🔒 Konfidansyalite</div>
              <div style={{ background:"rgba(255,255,255,0.03)", borderRadius:20, overflow:"hidden", marginBottom:16 }}>
                {[
                  { icon:"👁️", label:"Vizibilite Pwofil", sub: visibility ? "Pwofil ou vizib" : "Pwofil ou kache", action: () => setVisibility(v => !v), toggle: true, val: visibility },
                  { icon:"📍", label:"Lokasyon", sub: locationOn ? "Lokasyon aktive" : "Lokasyon dezaktive", action: () => setLocationOn(v => !v), toggle: true, val: locationOn },
                  { icon:"🚫", label:"Moun ou bloke", sub: blockedUsers.length > 0 ? `${blockedUsers.length} moun bloke` : "Pa gen moun bloke", action: () => setShowBlocked(true) },
                ].map((item, i, arr) => (
                  <div key={i} onClick={item.action} style={{ display:"flex", alignItems:"center", gap:14, padding:"16px 18px", borderBottom: i<arr.length-1 ? "1px solid rgba(255,255,255,0.06)" : "none", cursor:"pointer" }}>
                    <span style={{ fontSize:20 }}>{item.icon}</span>
                    <div style={{ flex:1 }}>
                      <div style={{ fontSize:15 }}>{item.label}</div>
                      <div style={{ fontSize:11, color:"rgba(255,255,255,0.4)", marginTop:2 }}>{item.sub}</div>
                    </div>
                    {item.toggle
                      ? <div style={{ width:44, height:24, borderRadius:12, background: item.val ? "linear-gradient(135deg,#FF3B5C,#A855F7)" : "rgba(255,255,255,0.15)", position:"relative", transition:"background 0.2s" }}>
                          <div style={{ position:"absolute", top:3, left: item.val ? 22 : 3, width:18, height:18, borderRadius:"50%", background:"#fff", transition:"left 0.2s" }} />
                        </div>
                      : <span style={{ color:"rgba(255,255,255,0.3)", fontSize:18 }}>›</span>
                    }
                  </div>
                ))}
              </div>
              {showBlocked && (
                <div style={{ position:"fixed", inset:0, background:"rgba(0,0,0,0.9)", zIndex:500, display:"flex", flexDirection:"column" }}>
                  <div style={{ display:"flex", alignItems:"center", gap:12, padding:"16px 20px", borderBottom:"1px solid rgba(255,255,255,0.08)" }}>
                    <span onClick={() => setShowBlocked(false)} style={{ fontSize:22, cursor:"pointer", color:"#FF3B5C" }}>←</span>
                    <div style={{ fontSize:18, fontWeight:800 }}>🚫 Moun Bloke</div>
                  </div>
                  <div style={{ flex:1, overflowY:"auto", padding:"20px" }}>
                    {blockedUsers.length === 0
                      ? <div style={{ textAlign:"center", color:"rgba(255,255,255,0.4)", marginTop:40 }}>Pa gen moun bloke</div>
                      : blockedUsers.map((u, i) => (
                          <div key={i} style={{ display:"flex", alignItems:"center", justifyContent:"space-between", padding:"14px 0", borderBottom:"1px solid rgba(255,255,255,0.06)" }}>
                            <div style={{ fontSize:15 }}>{u}</div>
                            <div onClick={() => setBlockedUsers(b => b.filter(x => x !== u))} style={{ color:"#FF3B5C", fontSize:13, cursor:"pointer", fontWeight:700 }}>Debloke</div>
                          </div>
                        ))
                    }
                  </div>
                </div>
              )}

              {/* LANGUAGE */}
              <div style={{ fontSize:11, fontWeight:700, color:"rgba(255,255,255,0.35)", letterSpacing:1, textTransform:"uppercase", marginBottom:10 }}>🌍 Lang</div>
              <div style={{ background:"rgba(255,255,255,0.03)", borderRadius:20, padding:16, marginBottom:16 }}>
                <div style={{ display:"flex", gap:8, flexWrap:"wrap" }}>
                  {langList.map(([code,label]) => (
                    <div key={code} onClick={() => setLang(code)} style={{ flex:1, minWidth:80, textAlign:"center", padding:"10px 6px", borderRadius:14, fontSize:12, cursor:"pointer", background:lang===code?"linear-gradient(135deg,#FF3B5C,#A855F7)":"rgba(255,255,255,0.06)", fontWeight:lang===code?700:400 }}>{label}</div>
                  ))}
                </div>
              </div>

              {/* LEGAL */}
              <div style={{ fontSize:11, fontWeight:700, color:"rgba(255,255,255,0.35)", letterSpacing:1, textTransform:"uppercase", marginBottom:10 }}>📋 Legal</div>
              <div style={{ background:"rgba(255,255,255,0.03)", borderRadius:20, overflow:"hidden", marginBottom:16 }}>
                {[
                  { icon:"🔐", label:"Privacy Policy", sub:"Kijan nou pwoteje done w", url:"https://ti-keke.vercel.app/privacy" },
                  { icon:"🇪🇺", label:"GDPR", sub:"Dwa sou done pèsonèl ou", url:"https://ti-keke.vercel.app/gdpr" },
                  { icon:"📄", label:"Kondisyon Itilizasyon", sub:"Règ Ti Kèkè", url:"https://ti-keke.vercel.app/terms" },
                  { icon:"🍪", label:"Cookies", sub:"Politik cookies nou", url:"https://ti-keke.vercel.app/cookies" },
                ].map((item, i, arr) => (
                  <div key={i} onClick={() => window.open(item.url, "_blank")} style={{ display:"flex", alignItems:"center", gap:14, padding:"16px 18px", borderBottom: i<arr.length-1 ? "1px solid rgba(255,255,255,0.06)" : "none", cursor:"pointer" }}>
                    <span style={{ fontSize:20 }}>{item.icon}</span>
                    <div style={{ flex:1 }}>
                      <div style={{ fontSize:15 }}>{item.label}</div>
                      <div style={{ fontSize:11, color:"rgba(255,255,255,0.4)", marginTop:2 }}>{item.sub}</div>
                    </div>
                    <span style={{ color:"rgba(255,255,255,0.3)", fontSize:18 }}>›</span>
                  </div>
                ))}
              </div>

              {/* SUPPORT */}
              <div style={{ fontSize:11, fontWeight:700, color:"rgba(255,255,255,0.35)", letterSpacing:1, textTransform:"uppercase", marginBottom:10 }}>💬 Sipò</div>
              <div style={{ background:"rgba(255,255,255,0.03)", borderRadius:20, overflow:"hidden", marginBottom:16 }}>
                {[
                  { icon:"❓", label:"Èd / FAQ", sub:"Kesyon souvan poze", action: () => setShowFAQ(true) },
                  { icon:"📧", label:"Kontakte Nou", sub:"support@tikeke.com", action: () => window.open("mailto:support@tikeke.com?subject=Ti Kèkè Support", "_blank") },
                  { icon:"⭐", label:"Evalye App la", sub:"Ban nou yon avis", action: () => setShowRating(true) },
                ].map((item, i, arr) => (
                  <div key={i} onClick={item.action} style={{ display:"flex", alignItems:"center", gap:14, padding:"16px 18px", borderBottom: i<arr.length-1 ? "1px solid rgba(255,255,255,0.06)" : "none", cursor:"pointer" }}>
                    <span style={{ fontSize:20 }}>{item.icon}</span>
                    <div style={{ flex:1 }}>
                      <div style={{ fontSize:15 }}>{item.label}</div>
                      <div style={{ fontSize:11, color:"rgba(255,255,255,0.4)", marginTop:2 }}>{item.sub}</div>
                    </div>
                    <span style={{ color:"rgba(255,255,255,0.3)", fontSize:18 }}>›</span>
                  </div>
                ))}
              </div>
              {showFAQ && (
                <div style={{ position:"fixed", inset:0, background:"rgba(0,0,0,0.95)", zIndex:500, overflowY:"auto" }}>
                  <div style={{ display:"flex", alignItems:"center", gap:12, padding:"16px 20px", borderBottom:"1px solid rgba(255,255,255,0.08)", position:"sticky", top:0, background:"rgba(0,0,0,0.95)" }}>
                    <span onClick={() => setShowFAQ(false)} style={{ fontSize:22, cursor:"pointer", color:"#FF3B5C" }}>←</span>
                    <div style={{ fontSize:18, fontWeight:800 }}>❓ FAQ</div>
                  </div>
                  <div style={{ padding:"20px" }}>
                    {[
                      { q:"Kijan pou chanje modpas mwen?", a:"Ale nan ekran koneksyon an epi klike 'Ou bliye modpas ou?' — nou ap voye yon imel ba ou." },
                      { q:"Kijan matche travay?", a:"Lè ou ak yon moun tou de swipe adwat (💙), se yon matche! Ou ka kòmanse chate apre." },
                      { q:"Kijan pou anile kont mwen?", a:"Ale nan Paramèt → Siprime Kont. Tout done ou ap efase pou toujou." },
                      { q:"Foto mwen pa monte — kisa pou m fè?", a:"Asire foto a pa depase 10MB. Eseye yon lòt foto oswa yon lòt navigatè." },
                      { q:"Kijan Premium travay?", a:"Ak Premium ou gen swipe ilimite, Super Like, ak chat san limit. Ou ka peye ak MonCash, NatCash, kat kredi, oswa PayPal." },
                    ].map((item, i) => (
                      <div key={i} style={{ marginBottom:20, background:"rgba(255,255,255,0.04)", borderRadius:16, padding:"16px 18px" }}>
                        <div style={{ fontWeight:700, fontSize:15, marginBottom:8, color:"#FF3B5C" }}>❓ {item.q}</div>
                        <div style={{ fontSize:13, color:"rgba(255,255,255,0.7)", lineHeight:1.6 }}>{item.a}</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              {showRating && (
                <div style={{ position:"fixed", inset:0, background:"rgba(0,0,0,0.92)", zIndex:500, display:"flex", alignItems:"center", justifyContent:"center", padding:"0 24px" }}>
                  <div style={{ background:"linear-gradient(160deg,#12102A,#1E0A3A)", borderRadius:28, width:"100%", maxWidth:400, padding:"32px 28px", textAlign:"center" }}>
                    <div style={{ fontSize:52, marginBottom:12 }}>⭐</div>
                    <div style={{ fontSize:20, fontWeight:900, marginBottom:8 }}>Evalye Ti Kèkè</div>
                    <div style={{ fontSize:14, color:"rgba(255,255,255,0.5)", marginBottom:24 }}>Ki jan ou renmen app la?</div>
                    <div style={{ display:"flex", justifyContent:"center", gap:12, marginBottom:24 }}>
                      {[1,2,3,4,5].map(star => (
                        <span key={star} onClick={() => setRating(star)} style={{ fontSize:36, cursor:"pointer", opacity: rating >= star ? 1 : 0.3 }}>⭐</span>
                      ))}
                    </div>
                    <textarea placeholder="Di nou sa ou panse (opsyonèl)..." value={ratingMsg} onChange={e => setRatingMsg(e.target.value)}
                      style={{ width:"100%", padding:"12px 16px", borderRadius:14, background:"rgba(255,255,255,0.07)", border:"1px solid rgba(255,255,255,0.12)", color:"#fff", fontSize:14, outline:"none", resize:"none", height:80, marginBottom:16 }} />
                    <button onClick={() => { alert("✅ Mèsi pou evalyasyon ou!"); setShowRating(false); setRating(0); setRatingMsg(""); }}
                      style={{ width:"100%", padding:"14px", borderRadius:16, border:"none", background:"linear-gradient(135deg,#FF3B5C,#A855F7)", color:"#fff", fontSize:16, fontWeight:800, cursor:"pointer", marginBottom:12 }}>
                      Voye Evalyasyon 💕
                    </button>
                    <div onClick={() => setShowRating(false)} style={{ fontSize:13, color:"rgba(255,255,255,0.3)", cursor:"pointer" }}>Anile</div>
                  </div>
                </div>
              )}

              {/* LOGOUT & DELETE */}
              <div style={{ background:"rgba(255,255,255,0.03)", borderRadius:20, overflow:"hidden", marginBottom:32 }}>
                <div onClick={handleLogout} style={{ display:"flex", alignItems:"center", gap:14, padding:"16px 18px", borderBottom:"1px solid rgba(255,255,255,0.06)", cursor:"pointer" }}>
                  <span style={{ fontSize:20 }}>🚪</span>
                  <div style={{ flex:1, fontSize:15 }}>Dekonekte</div>
                </div>
                <div onClick={() => { if(window.confirm("Ou sèten ou vle siprime kont ou?")) { handleLogout(); }}} style={{ display:"flex", alignItems:"center", gap:14, padding:"16px 18px", cursor:"pointer" }}>
                  <span style={{ fontSize:20 }}>🗑️</span>
                  <div style={{ flex:1, fontSize:15, color:"#FF3B5C" }}>Siprime Kont</div>
                </div>
              </div>

              <div style={{ textAlign:"center", fontSize:11, color:"rgba(255,255,255,0.2)", marginBottom:20 }}>Ti Kèkè v1.0 · Made with 💕</div>
            </div>
          </div>
        )}
      </div>

      {/* MATCH POPUP */}
      {showMatch && (
        <div style={{ position:"fixed", inset:0, background:"rgba(0,0,0,0.85)", display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", zIndex:200, animation:"fadeIn 0.3s ease" }}>
          <div style={{ display:"flex", gap:24, fontSize:80, marginBottom:24 }}>🧑🏾{showMatch.emoji}</div>
          <div style={{ fontSize:36, fontWeight:900, background:"linear-gradient(90deg,#FF3B5C,#A855F7)", WebkitBackgroundClip:"text", WebkitTextFillColor:"transparent", marginBottom:8 }}>{t.itsMatch}</div>
          <div style={{ fontSize:16, color:"rgba(255,255,255,0.6)", marginBottom:24 }}>{t.matchMsg}</div>
          <button onClick={() => { setShowMatch(null); openChat(showMatch); }} style={{ background:"linear-gradient(135deg,#FF3B5C,#A855F7)", border:"none", borderRadius:22, padding:"13px 36px", color:"#fff", fontSize:16, fontWeight:700, cursor:"pointer" }}>
            💬 {t.sendMsg.split("...")[0]}
          </button>
        </div>
      )}


      {/* AUTH POPUP */}
      {showAuthPopup && (
        <div style={{ position:"fixed", inset:0, background:"rgba(0,0,0,0.92)", zIndex:400, display:"flex", alignItems:"center", justifyContent:"center", padding:"0 24px", overflowY:"auto" }}>
          <div style={{ background:"linear-gradient(160deg,#12102A,#1E0A3A)", borderRadius:28, width:"100%", maxWidth:400, padding:"32px 28px" }}>
            {authMode === "choice" ? (
              <div style={{ textAlign:"center" }}>
                <div style={{ fontSize:52, marginBottom:16 }}>💕</div>
                <div style={{ fontSize:20, fontWeight:900, background:"linear-gradient(90deg,#FF3B5C,#A855F7)", WebkitBackgroundClip:"text", WebkitTextFillColor:"transparent", marginBottom:8 }}>{authPopupMsg}</div>
                <div style={{ fontSize:14, color:"rgba(255,255,255,0.5)", marginBottom:28 }}>Gratis epi pran mwens pase 1 minit!</div>
                <button onClick={() => setAuthMode("register")} style={{ width:"100%", padding:"14px", borderRadius:16, border:"none", background:"linear-gradient(135deg,#FF3B5C,#A855F7)", color:"#fff", fontSize:16, fontWeight:800, cursor:"pointer", marginBottom:12 }}>✨ Kreye Kont Gratis</button>
                <button onClick={() => setAuthMode("login")} style={{ width:"100%", padding:"13px", borderRadius:16, border:"1px solid rgba(255,255,255,0.2)", background:"transparent", color:"rgba(255,255,255,0.7)", fontSize:15, cursor:"pointer", marginBottom:16 }}>🔑 Konekte</button>
                <div onClick={() => setShowAuthPopup(false)} style={{ fontSize:13, color:"rgba(255,255,255,0.3)", cursor:"pointer" }}>Kontinye gade san kont →</div>
              </div>
            ) : (
              <div>
                <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:20 }}>
                  <div style={{ fontSize:18, fontWeight:800 }}>{authMode==="login" ? "🔑 Konekte" : "✨ Kreye Kont"}</div>
                  <div onClick={() => { setShowAuthPopup(false); setAuthMode("choice"); setAuthError(""); }} style={{ fontSize:22, cursor:"pointer", color:"rgba(255,255,255,0.4)" }}>✕</div>
                </div>
                {authMode==="register" && (
                  <input style={{ width:"100%", padding:"13px 16px", borderRadius:14, background:"rgba(255,255,255,0.07)", border:"1px solid rgba(255,255,255,0.12)", color:"#fff", fontSize:14, outline:"none", marginBottom:12, display:"block" }}
                    placeholder="Non ou 👤" value={authName} onChange={e => setAuthName(e.target.value)} />
                )}
                <input style={{ width:"100%", padding:"13px 16px", borderRadius:14, background:"rgba(255,255,255,0.07)", border:"1px solid rgba(255,255,255,0.12)", color:"#fff", fontSize:14, outline:"none", marginBottom:12, display:"block" }}
                  placeholder="📧 Imel / Email" type="email" value={authEmail} onChange={e => setAuthEmail(e.target.value)} />
                <input style={{ width:"100%", padding:"13px 16px", borderRadius:14, background:"rgba(255,255,255,0.07)", border:"1px solid rgba(255,255,255,0.12)", color:"#fff", fontSize:14, outline:"none", marginBottom:16, display:"block" }}
                  placeholder="🔒 Modpas / Password" type="password" value={authPass} onChange={e => setAuthPass(e.target.value)} />
                {authError && <div style={{ color:"#FF3B5C", fontSize:13, marginBottom:12, textAlign:"center", padding:"8px", background:"rgba(255,59,92,0.1)", borderRadius:10 }}>{authError}</div>}
                <button onClick={handleAuth} disabled={authLoading} style={{ width:"100%", padding:"14px", borderRadius:14, border:"none", background:authLoading?"rgba(255,255,255,0.1)":"linear-gradient(135deg,#FF3B5C,#A855F7)", color:"#fff", fontSize:16, fontWeight:800, cursor:"pointer", marginBottom:12 }}>
                  {authLoading ? "⏳ ..." : (authMode==="login" ? "🔑 Konekte" : "✨ Kreye Kont")}
                </button>
                {authMode==="login" && (
                  <div onClick={async () => {
                    if (!authEmail.includes("@")) { setAuthError("Mete imel ou anvan"); return; }
                    try {
                      await firebaseResetPassword(authEmail);
                      setAuthError("✅ Nou voye yon imel pou chanje modpas ou!");
                    } catch(e) { setAuthError("Imel sa pa egziste"); }
                  }} style={{ textAlign:"center", fontSize:13, color:"#A855F7", cursor:"pointer", marginBottom:12, marginTop:-4 }}>
                    🔑 Ou bliye modpas ou?
                  </div>
                )}
                <div style={{ textAlign:"center", fontSize:13, color:"rgba(255,255,255,0.4)" }}>
                  {authMode==="login" ? "Ou pa gen kont?" : "Ou deja gen kont?"}{" "}
                  <span onClick={() => { setAuthMode(authMode==="login"?"register":"login"); setAuthError(""); }} style={{ color:"#FF3B5C", cursor:"pointer", fontWeight:700 }}>
                    {authMode==="login" ? "Kreye youn!" : "Konekte!"}
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* PAYWALL */}
      {showPaywall && <PaywallModal />}

      {/* NAV */}
      <div style={G.nav}>
        {navItems.map(n => (
          <div key={n.key} onClick={() => { setTab(n.key); if(n.key!=="chat") setActiveChat(null); }} style={{ flex:1, display:"flex", flexDirection:"column", alignItems:"center", gap:3, cursor:"pointer", opacity:tab===n.key?1:0.35, transition:"opacity 0.15s" }}>
            <span style={{ fontSize:22 }}>{n.icon}</span>
            <span style={{ fontSize:10, fontWeight:tab===n.key?700:400, background:tab===n.key?"linear-gradient(90deg,#FF3B5C,#A855F7)":"none", WebkitBackgroundClip:tab===n.key?"text":"unset", WebkitTextFillColor:tab===n.key?"transparent":"#fff" }}>{n.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
