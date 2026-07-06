// ============================================================
// PART 1 of 2 — this goes at the TOP of src/App.jsx
// Part 2 (the App component) goes directly below it
// ============================================================

import { useState, useEffect } from "react";
import {
  User, Phone, MapPin, CreditCard, Camera, Search, Lock, X, ArrowLeft,
  Shield, Users, ChefHat, HeartHandshake, Sparkles, Flower2, Car, Baby,
  ShieldCheck, Building2, Loader2, AlertCircle,
} from "lucide-react";

/* SUPABASE CONFIG — replace with your own project URL and Publishable key */
const SUPABASE_URL = "https://ettfbiycsxeytaonirqo.supabase.co";
const SUPABASE_ANON_KEY = "sb_publishable_kllexAn95R_VnmcDqciTNQ_2LV_iW0F";
const PHOTO_BUCKET = "helper-photos";

const OCCUPATIONS = ["Caretaker", "Cook", "Housekeeper", "Gardener", "Driver", "Nanny", "Security Guard"];

const OCCUPATION_META = {
  Caretaker: { icon: HeartHandshake, gradient: "from-rose-500 to-pink-600" },
  Cook: { icon: ChefHat, gradient: "from-orange-500 to-amber-600" },
  Housekeeper: { icon: Sparkles, gradient: "from-violet-500 to-purple-600" },
  Gardener: { icon: Flower2, gradient: "from-green-500 to-emerald-600" },
  Driver: { icon: Car, gradient: "from-blue-500 to-cyan-600" },
  Nanny: { icon: Baby, gradient: "from-fuchsia-500 to-pink-500" },
  "Security Guard": { icon: ShieldCheck, gradient: "from-slate-600 to-gray-800" },
};

const MAJOR_INDIAN_CITIES = [
  "Mumbai", "Delhi", "Bengaluru", "Chennai", "Kolkata", "Hyderabad", "Pune", "Ahmedabad",
  "Jaipur", "Surat", "Lucknow", "Kanpur", "Nagpur", "Indore", "Thane", "Bhopal",
  "Visakhapatnam", "Patna", "Vadodara", "Ghaziabad", "Ludhiana", "Agra", "Nashik",
  "Faridabad", "Meerut", "Rajkot", "Varanasi", "Srinagar", "Aurangabad", "Dhanbad",
  "Amritsar", "Navi Mumbai", "Prayagraj", "Ranchi", "Howrah", "Coimbatore", "Jabalpur",
  "Gwalior", "Vijayawada", "Jodhpur", "Madurai", "Raipur", "Kota", "Guwahati",
  "Chandigarh", "Thiruvananthapuram", "Mysuru", "Noida", "Gurugram", "Ajmer", "Aligarh",
  "Amravati", "Bareilly", "Belagavi", "Bhavnagar", "Bhiwandi", "Bikaner", "Bilaspur",
  "Bokaro", "Cuttack", "Dehradun", "Dhule", "Durgapur", "Erode", "Firozabad", "Gorakhpur",
  "Kalaburagi", "Guntur", "Hubballi-Dharwad", "Jalandhar", "Jalgaon", "Jammu", "Jhansi",
  "Kakinada", "Kannur", "Kochi", "Kolhapur", "Kollam", "Kozhikode", "Malegaon", "Mangaluru",
  "Moradabad", "Muzaffarnagar", "Muzaffarpur", "Nanded", "Nellore", "Panipat", "Puducherry",
  "Rajahmundry", "Rourkela", "Saharanpur", "Salem", "Sangli", "Shimla", "Siliguri",
  "Solapur", "Thrissur", "Tiruchirappalli", "Tirunelveli", "Tiruppur", "Udaipur", "Ujjain",
  "Vellore", "Warangal",
];

const emptyForm = {
  name: "", occupation: OCCUPATIONS[0], city: "", area: "", address: "",
  aadhar: "", phone: "", password: "",
};

function generateId(name, occupation) {
  const prefix = occupation.slice(0, 3).toUpperCase();
  const namePart = (name || "XXX").replace(/\s/g, "").slice(0, 3).toUpperCase();
  const num = Math.floor(100000 + Math.random() * 900000);
  return `${prefix}-${namePart}-${num}`;
}

/* SUPABASE NETWORK HELPERS */
function supaHeaders(accessToken) {
  return {
    apikey: SUPABASE_ANON_KEY,
    Authorization: `Bearer ${accessToken || SUPABASE_ANON_KEY}`,
    "Content-Type": "application/json",
  };
}

async function fetchPublicHelpers() {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/helpers_public?select=*&order=registered_on.desc`, { headers: supaHeaders() });
  if (!res.ok) throw new Error("Could not load helpers from the database.");
  return res.json();
}

async function fetchAdminHelpers(accessToken) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/helpers?select=*&order=registered_on.desc`, { headers: supaHeaders(accessToken) });
  if (!res.ok) throw new Error("Could not load helper records as admin.");
  return res.json();
}

async function insertHelperRecord(helper) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/helpers`, {
    method: "POST",
    headers: { ...supaHeaders(), Prefer: "return=representation" },
    body: JSON.stringify([helper]),
  });
  if (!res.ok) { const text = await res.text(); throw new Error(`Registration failed: ${text}`); }
  const data = await res.json();
  return data[0];
}

async function uploadPhoto(file, path) {
  const res = await fetch(`${SUPABASE_URL}/storage/v1/object/${PHOTO_BUCKET}/${path}`, {
    method: "POST",
    headers: {
      apikey: SUPABASE_ANON_KEY,
      Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
      "Content-Type": file.type || "application/octet-stream",
    },
    body: file,
  });
  if (!res.ok) throw new Error("Photo upload failed.");
  return `${SUPABASE_URL}/storage/v1/object/public/${PHOTO_BUCKET}/${path}`;
}

async function adminSignIn(email, password) {
  const res = await fetch(`${SUPABASE_URL}/auth/v1/token?grant_type=password`, {
    method: "POST",
    headers: { apikey: SUPABASE_ANON_KEY, "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });
  if (!res.ok) throw new Error("Incorrect admin email or password.");
  return res.json();
}

async function updateAdminPassword(accessToken, newPassword) {
  const res = await fetch(`${SUPABASE_URL}/auth/v1/user`, {
    method: "PUT",
    headers: supaHeaders(accessToken),
    body: JSON.stringify({ password: newPassword }),
  });
  if (!res.ok) throw new Error("Failed to update admin password.");
  return res.json();
}

async function helperLoginRPC(id, password) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/rpc/helper_login`, {
    method: "POST",
    headers: supaHeaders(),
    body: JSON.stringify({ p_id: id, p_password: password }),
  });
  if (!res.ok) throw new Error("Login request failed.");
  return res.json();
}

async function helperChangePasswordRPC(id, oldPassword, newPassword) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/rpc/helper_change_password`, {
    method: "POST",
    headers: supaHeaders(),
    body: JSON.stringify({ p_id: id, p_old_password: oldPassword, p_new_password: newPassword }),
  });
  if (!res.ok) throw new Error("Password change request failed.");
  return res.json();
}

/* ==== END OF PART 1 — Part 2 (the App component) goes directly below ==== */


/* ============================================================
   PART 2 of 2 — paste this directly below Part 1, same file
   ============================================================ */

export default function App() {
  const [helpers, setHelpers] = useState([]);
  const [adminHelpers, setAdminHelpers] = useState([]);
  const [dataLoading, setDataLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [view, setView] = useState("landing");
  const [searchTerm, setSearchTerm] = useState("");
  const [filterOccupation, setFilterOccupation] = useState("All");
  const [filterCity, setFilterCity] = useState("All");
  const [filterArea, setFilterArea] = useState("All");

  const [form, setForm] = useState(emptyForm);
  const [cityChoice, setCityChoice] = useState("");
  const [photoFile, setPhotoFile] = useState(null);
  const [photoPreview, setPhotoPreview] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const [adminEmail, setAdminEmail] = useState("");
  const [adminPasswordInput, setAdminPasswordInput] = useState("");
  const [adminAccessToken, setAdminAccessToken] = useState("");
  const [isAdminLoggedIn, setIsAdminLoggedIn] = useState(false);
  const [adminLoginError, setAdminLoginError] = useState("");
  const [showAdminPwChange, setShowAdminPwChange] = useState(false);
  const [adminNewPw, setAdminNewPw] = useState("");
  const [adminNewPw2, setAdminNewPw2] = useState("");
  const [adminPwMsg, setAdminPwMsg] = useState("");

  const [helperLoginId, setHelperLoginId] = useState("");
  const [helperLoginPw, setHelperLoginPw] = useState("");
  const [helperLoginError, setHelperLoginError] = useState("");
  const [loggedInHelper, setLoggedInHelper] = useState(null);
  const [showHelperPwChange, setShowHelperPwChange] = useState(false);
  const [helperOldPw, setHelperOldPw] = useState("");
  const [helperNewPw, setHelperNewPw] = useState("");
  const [helperNewPw2, setHelperNewPw2] = useState("");
  const [helperPwMsg, setHelperPwMsg] = useState("");

  const [showContactModal, setShowContactModal] = useState(false);
  const [registeredMsg, setRegisteredMsg] = useState("");
  const [lastRegistered, setLastRegistered] = useState(null);
  const [saveError, setSaveError] = useState("");

  useEffect(() => {
    (async () => {
      try {
        const data = await fetchPublicHelpers();
        setHelpers(data);
        setLoadError("");
      } catch (e) {
        setLoadError(e.message || "Could not connect to the database.");
      } finally {
        setDataLoading(false);
      }
    })();
  }, []);

  function handleFormChange(field, value) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  function handlePhotoUpload(e) {
    const file = e.target.files && e.target.files[0];
    if (!file) return;
    setPhotoFile(file);
    setPhotoPreview(URL.createObjectURL(file));
  }

  function startRegistration(occupation) {
    setForm({ ...emptyForm, occupation });
    setCityChoice("");
    setPhotoFile(null);
    setPhotoPreview("");
    setRegisteredMsg("");
    setLastRegistered(null);
    setSaveError("");
    setView("register");
  }

  async function submitRegistration(e) {
    if (e && e.preventDefault) e.preventDefault();
    setSubmitting(true);
    setSaveError("");
    try {
      const id = generateId(form.name, form.occupation);
      let photo_url = "";
      if (photoFile) {
        const path = `${id}-${Date.now()}-${photoFile.name}`;
        photo_url = await uploadPhoto(photoFile, path);
      }
      const helperToInsert = {
        id, name: form.name, occupation: form.occupation, city: form.city,
        area: form.area, address: form.address, aadhar: form.aadhar,
        phone: form.phone, photo_url, password: form.password,
      };
      const created = await insertHelperRecord(helperToInsert);
      const refreshed = await fetchPublicHelpers();
      setHelpers(refreshed);
      setForm(emptyForm);
      setPhotoFile(null);
      setPhotoPreview("");
      setRegisteredMsg(`Registration successful! Your Unique ID is ${id}. Please save it to login later.`);
      setLastRegistered(created);
    } catch (err) {
      setSaveError(err.message || "Something went wrong while saving your registration.");
    } finally {
      setSubmitting(false);
    }
  }

  async function adminLogin() {
    setAdminLoginError("");
    try {
      const data = await adminSignIn(adminEmail, adminPasswordInput);
      setAdminAccessToken(data.access_token);
      setIsAdminLoggedIn(true);
      setAdminEmail("");
      setAdminPasswordInput("");
      const list = await fetchAdminHelpers(data.access_token);
      setAdminHelpers(list);
      setView("admin");
    } catch (err) {
      setAdminLoginError(err.message || "Login failed.");
    }
  }

  async function changeAdminPassword() {
    if (!adminNewPw || adminNewPw !== adminNewPw2) {
      setAdminPwMsg("Passwords do not match");
      return;
    }
    try {
      await updateAdminPassword(adminAccessToken, adminNewPw);
      setAdminPwMsg("Password updated successfully!");
      setAdminNewPw("");
      setAdminNewPw2("");
      setTimeout(() => { setShowAdminPwChange(false); setAdminPwMsg(""); }, 1400);
    } catch (err) {
      setAdminPwMsg(err.message || "Failed to update password.");
    }
  }

  async function helperLogin() {
    setHelperLoginError("");
    try {
      const result = await helperLoginRPC(helperLoginId, helperLoginPw);
      if (result) {
        setLoggedInHelper(result);
        setHelperLoginId("");
        setHelperLoginPw("");
        setView("helperProfile");
      } else {
        setHelperLoginError("Invalid ID or password");
      }
    } catch (err) {
      setHelperLoginError(err.message || "Login failed.");
    }
  }

  async function changeHelperPassword() {
    if (!helperNewPw || helperNewPw !== helperNewPw2) {
      setHelperPwMsg("New passwords do not match");
      return;
    }
    try {
      const ok = await helperChangePasswordRPC(loggedInHelper.id, helperOldPw, helperNewPw);
      if (!ok) { setHelperPwMsg("Current password is incorrect"); return; }
      setHelperPwMsg("Password updated successfully!");
      setHelperOldPw("");
      setHelperNewPw("");
      setHelperNewPw2("");
      setTimeout(() => { setShowHelperPwChange(false); setHelperPwMsg(""); }, 1200);
    } catch (err) {
      setHelperPwMsg(err.message || "Failed to update password.");
    }
  }

  function uniqueCitiesFrom(list) {
    const set = new Set(list.map((h) => (h.city || "").trim()).filter(Boolean));
    return Array.from(set).sort();
  }

  function uniqueAreasFrom(list, city) {
    const relevant = city === "All" ? list : list.filter((h) => (h.city || "").trim() === city);
    const set = new Set(relevant.map((h) => (h.area || "").trim()).filter(Boolean));
    return Array.from(set).sort();
  }

  function filterList(list) {
    return list.filter((h) => {
      const matchesOccupation = filterOccupation === "All" || h.occupation === filterOccupation;
      const matchesCity = filterCity === "All" || (h.city || "").trim() === filterCity;
      const matchesArea = filterArea === "All" || (h.area || "").trim() === filterArea;
      const term = searchTerm.toLowerCase();
      const matchesSearch = !term ||
        (h.name || "").toLowerCase().includes(term) ||
        (h.id || "").toLowerCase().includes(term) ||
        (h.address || "").toLowerCase().includes(term) ||
        (h.city || "").toLowerCase().includes(term) ||
        (h.area || "").toLowerCase().includes(term);
      return matchesOccupation && matchesCity && matchesArea && matchesSearch;
    });
  }

  function Header() {
    return (
      <div style={{ background: "linear-gradient(135deg,#3b82f6,#06b6d4)" }} className="text-white py-6 px-4 shadow-lg">
        <div className="max-w-6xl mx-auto flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <Users size={32} />
            <div>
              <h1 className="text-2xl font-bold">Household Helper Portal</h1>
              <p className="text-blue-100 text-sm">Find trusted caretakers, cooks & household help</p>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            {view !== "landing" && (
              <button onClick={() => setView("landing")} className="flex items-center gap-1 bg-white/20 hover:bg-white/30 px-3 py-2 rounded-lg text-sm font-medium transition">
                <ArrowLeft size={16} /> Home
              </button>
            )}
            <button onClick={() => setView("helperLogin")} className="bg-white/20 hover:bg-white/30 px-4 py-2 rounded-lg text-sm font-semibold transition">
              Helper Login
            </button>
            {isAdminLoggedIn ? (
              <button onClick={() => setView("admin")} className="flex items-center gap-1 bg-amber-400 text-amber-900 hover:bg-amber-300 px-4 py-2 rounded-lg text-sm font-semibold transition">
                <Shield size={16} /> Admin Panel
              </button>
            ) : (
              <button onClick={() => setView("adminLogin")} className="flex items-center gap-1 bg-white/20 hover:bg-white/30 px-4 py-2 rounded-lg text-sm font-semibold transition">
                <Shield size={16} /> Admin Login
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  function RegisterButtons() {
    return (
      <div className="mb-8">
        <h2 className="text-xl font-bold text-gray-800 mb-1">Join as a Helper</h2>
        <p className="text-sm text-gray-500 mb-4">Pick your occupation to start your registration</p>
        <div className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-7 gap-3">
          {OCCUPATIONS.map((o) => {
            const meta = OCCUPATION_META[o];
            const Icon = meta.icon;
            return (
              <button key={o} onClick={() => startRegistration(o)} className={`group relative overflow-hidden rounded-xl bg-gradient-to-br ${meta.gradient} text-white p-2.5 flex flex-col items-center justify-center gap-1 shadow-sm hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200`}>
                <div className="absolute inset-0 bg-white/0 group-hover:bg-white/10 transition" />
                <Icon size={18} className="drop-shadow" />
                <span className="text-[11px] font-bold text-center leading-tight drop-shadow">{o}</span>
              </button>
            );
          })}
        </div>
      </div>
    );
  }

  function HelperCard({ h, isAdminView }) {
    const meta = OCCUPATION_META[h.occupation] || {};
    const Icon = meta.icon || User;
    return (
      <div className={`bg-white rounded-2xl shadow-md hover:shadow-xl transition p-5 flex flex-col items-center text-center border-t-4 ${isAdminView ? "border-amber-400" : "border-indigo-400"}`}>
        {h.photo_url ? (
          <img src={h.photo_url} alt={h.name} className={`w-24 h-24 rounded-full object-cover border-4 ${isAdminView ? "border-amber-300" : "border-indigo-300"}`} />
        ) : (
          <div className={`w-24 h-24 rounded-full flex items-center justify-center border-4 ${isAdminView ? "border-amber-300 bg-amber-50" : "border-indigo-300 bg-indigo-50"}`}>
            <User size={40} className="text-gray-400" />
          </div>
        )}
        <h3 className="mt-3 text-lg font-bold text-gray-800">{h.name || "Unnamed"}</h3>
        <p className="text-xs text-gray-500 font-mono">{h.id}</p>
        <span className={`mt-2 inline-flex items-center gap-1 bg-gradient-to-r ${meta.gradient || "from-indigo-500 to-purple-600"} text-white text-xs font-semibold px-3 py-1 rounded-full`}>
          <Icon size={12} /> {h.occupation}
        </span>
        {h.city ? (
          <div className="mt-2 flex items-center gap-1 text-xs text-gray-500">
            <Building2 size={12} />
            <span>{h.area ? `${h.area}, ${h.city}` : h.city}</span>
          </div>
        ) : null}
        <div className="mt-2 flex items-center gap-1 text-sm text-gray-600">
          <MapPin size={14} />
          <span>{h.address || "No address provided"}</span>
        </div>
        <p className="text-xs text-gray-400 mt-1">
          Registered on {h.registered_on ? new Date(h.registered_on).toLocaleDateString() : "—"}
        </p>
        {isAdminView ? (
          <div className="w-full mt-4 space-y-2 text-sm">
            <div className="bg-green-50 border border-green-200 rounded-lg px-3 py-2 flex items-center gap-2">
              <Phone size={14} className="text-green-600" />
              <span className="text-green-800 font-medium">{h.phone || "N/A"}</span>
            </div>
            <div className="bg-blue-50 border border-blue-200 rounded-lg px-3 py-2 flex items-center gap-2">
              <CreditCard size={14} className="text-blue-600" />
              <span className="text-blue-800 font-medium">{h.aadhar || "N/A"}</span>
            </div>
            <div className="bg-red-50 border border-red-200 rounded-lg px-3 py-2 flex items-center gap-2">
              <MapPin size={14} className="text-red-600" />
              <span className="text-red-800 font-medium">{h.address || "N/A"}</span>
            </div>
          </div>
        ) : (
          <button onClick={() => setShowContactModal(true)} className="mt-4 w-full bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold py-2 rounded-lg transition">
            Contact Helper
          </button>
        )}
      </div>
    );
  }

  function FilterBar({ list }) {
    const cities = uniqueCitiesFrom(list);
    const areas = uniqueAreasFrom(list, filterCity);
    return (
      <div className="bg-white rounded-2xl shadow p-4 mb-6 flex flex-col md:flex-row gap-3">
        <div className="flex-1 flex items-center gap-2 border rounded-lg px-3 py-2">
          <Search size={18} className="text-gray-400" />
          <input className="flex-1 outline-none text-sm" placeholder="Search by name, ID, location or address..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
        </div>
        <select className="border rounded-lg px-3 py-2 text-sm" value={filterOccupation} onChange={(e) => setFilterOccupation(e.target.value)}>
          <option value="All">All Occupations</option>
          {OCCUPATIONS.map((o) => <option key={o} value={o}>{o}</option>)}
        </select>
        <select className="border rounded-lg px-3 py-2 text-sm" value={filterCity} onChange={(e) => { setFilterCity(e.target.value); setFilterArea("All"); }}>
          <option value="All">All Cities</option>
          {cities.map((c) => <option key={c} value={c}>{c}</option>)}
        </select>
        <select className="border rounded-lg px-3 py-2 text-sm" value={filterArea} onChange={(e) => setFilterArea(e.target.value)}>
          <option value="All">All Areas</option>
          {areas.map((a) => <option key={a} value={a}>{a}</option>)}
        </select>
      </div>
    );
  }

  function Landing() {
    const list = filterList(helpers);
    return (
      <div className="max-w-6xl mx-auto px-4 py-8">
        <RegisterButtons />
        {loadError ? (
          <div className="bg-red-50 border border-red-300 text-red-700 rounded-lg p-4 mb-6 text-sm flex items-center gap-2">
            <AlertCircle size={16} />
            <span>{loadError} Make sure SUPABASE_URL and SUPABASE_ANON_KEY are set correctly and your database is configured per the deployment guide.</span>
          </div>
        ) : null}
        <FilterBar list={helpers} />
        <h2 className="text-xl font-bold text-gray-800 mb-4">Registered Helpers ({list.length})</h2>
        {dataLoading ? (
          <div className="text-center py-16 text-gray-400">
            <Loader2 size={32} className="mx-auto mb-3 animate-spin" />
            <p>Loading helpers from database...</p>
          </div>
        ) : list.length === 0 ? (
          <div className="text-center py-16 text-gray-400">
            <Users size={48} className="mx-auto mb-3" />
            <p>No helpers found. Try adjusting filters or register a new helper above.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {list.map((h) => <HelperCard key={h.id} h={h} isAdminView={false} />)}
          </div>
        )}
      </div>
    );
  }

  function Register() {
    const meta = OCCUPATION_META[form.occupation] || {};
    const Icon = meta.icon || User;
    return (
      <div className="max-w-2xl mx-auto px-4 py-8">
        <div className="bg-white rounded-2xl shadow p-6">
          <div className={`flex items-center gap-3 mb-1 rounded-xl bg-gradient-to-r ${meta.gradient || "from-indigo-500 to-purple-600"} text-white p-4 -mt-2 -mx-2 mb-4`}>
            <Icon size={28} />
            <div>
              <h2 className="text-xl font-bold">Register as {form.occupation}</h2>
              <p className="text-white/80 text-xs">All fields are open — no validation required.</p>
            </div>
          </div>
          {registeredMsg ? <div className="bg-green-50 border border-green-300 text-green-800 rounded-lg p-4 mb-4 text-sm">{registeredMsg}</div> : null}
          {saveError ? <div className="bg-red-50 border border-red-300 text-red-700 rounded-lg p-3 mb-4 text-xs flex items-center gap-2"><AlertCircle size={14} /><span>{saveError}</span></div> : null}
          {lastRegistered ? (
            <div className="mb-6">
              <p className="text-sm font-semibold text-gray-700 mb-2">Your Profile Card:</p>
              <div className="max-w-xs mx-auto"><HelperCard h={lastRegistered} isAdminView={false} /></div>
              <div className="flex gap-2 mt-4">
                <button onClick={() => setView("landing")} className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold py-2 rounded-lg transition">View All Helpers</button>
                <button onClick={() => { setLastRegistered(null); setRegisteredMsg(""); }} className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm font-semibold py-2 rounded-lg transition">Register Another</button>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex flex-col items-center">
                <div className="w-24 h-24 rounded-full bg-indigo-50 border-4 border-indigo-200 flex items-center justify-center overflow-hidden">
                  {photoPreview ? <img src={photoPreview} alt="preview" className="w-full h-full object-cover" /> : <Camera size={28} className="text-indigo-300" />}
                </div>
                <label className="mt-2 text-xs text-indigo-600 font-medium cursor-pointer">
                  Upload Photo
                  <input type="file" accept="image/*" className="hidden" onChange={handlePhotoUpload} />
                </label>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700">Full Name</label>
                <input className="mt-1 w-full border rounded-lg px-3 py-2 text-sm" value={form.name} onChange={(e) => handleFormChange("name", e.target.value)} placeholder="Enter name" />
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700">Occupation</label>
                <select className="mt-1 w-full border rounded-lg px-3 py-2 text-sm" value={form.occupation} onChange={(e) => handleFormChange("occupation", e.target.value)}>
                  {OCCUPATIONS.map((o) => <option key={o} value={o}>{o}</option>)}
                </select>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700">City</label>
                <select className="mt-1 w-full border rounded-lg px-3 py-2 text-sm" value={cityChoice} onChange={(e) => { const val = e.target.value; setCityChoice(val); handleFormChange("city", val === "Other" ? "" : val); }}>
                  <option value="">Select a city</option>
                  {MAJOR_INDIAN_CITIES.map((c) => <option key={c} value={c}>{c}</option>)}
                  <option value="Other">Other (type manually)</option>
                </select>
                {cityChoice === "Other" && (
                  <input className="mt-2 w-full border rounded-lg px-3 py-2 text-sm" value={form.city} onChange={(e) => handleFormChange("city", e.target.value)} placeholder="Enter city name" />
                )}
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700">Area / Locality</label>
                <input className="mt-1 w-full border rounded-lg px-3 py-2 text-sm" value={form.area} onChange={(e) => handleFormChange("area", e.target.value)} placeholder="Enter area or locality (e.g. Anna Nagar)" />
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700">Permanent Address</label>
                <textarea className="mt-1 w-full border rounded-lg px-3 py-2 text-sm" rows={2} value={form.address} onChange={(e) => handleFormChange("address", e.target.value)} placeholder="Enter permanent address" />
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700">Aadhar Number</label>
                <input className="mt-1 w-full border rounded-lg px-3 py-2 text-sm" value={form.aadhar} onChange={(e) => handleFormChange("aadhar", e.target.value)} placeholder="Enter Aadhar number" />
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700">Phone Number</label>
                <input className="mt-1 w-full border rounded-lg px-3 py-2 text-sm" value={form.phone} onChange={(e) => handleFormChange("phone", e.target.value)} placeholder="Enter phone number" />
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700">Create Password</label>
                <input type="password" className="mt-1 w-full border rounded-lg px-3 py-2 text-sm" value={form.password} onChange={(e) => handleFormChange("password", e.target.value)} placeholder="Set a password for your profile login" />
              </div>
              <button onClick={submitRegistration} disabled={submitting} className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:opacity-60 text-white font-semibold py-2.5 rounded-lg transition flex items-center justify-center gap-2">
                {submitting ? <Loader2 size={16} className="animate-spin" /> : null}
                {submitting ? "Saving..." : "Submit Registration"}
              </button>
            </div>
          )}
        </div>
      </div>
    );
  }

  function AdminLoginView() {
    return (
      <div className="max-w-md mx-auto px-4 py-16">
        <div className="bg-white rounded-2xl shadow p-6">
          <div className="flex items-center gap-2 mb-4"><Shield className="text-indigo-600" /><h2 className="text-xl font-bold text-gray-800">Admin Login</h2></div>
          <input type="email" className="w-full border rounded-lg px-3 py-2 text-sm mb-2" placeholder="Admin email" value={adminEmail} onChange={(e) => setAdminEmail(e.target.value)} />
          <input type="password" className="w-full border rounded-lg px-3 py-2 text-sm mb-2" placeholder="Admin password" value={adminPasswordInput} onChange={(e) => setAdminPasswordInput(e.target.value)} />
          {adminLoginError ? <p className="text-red-500 text-xs mb-2">{adminLoginError}</p> : null}
          <button onClick={adminLogin} className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-2.5 rounded-lg transition">Login</button>
          <p className="text-xs text-gray-400 mt-3">Use the admin account you created in Supabase Studio → Authentication → Users.</p>
        </div>
      </div>
    );
  }

  function AdminPanel() {
    const list = filterList(adminHelpers);
    return (
      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
          <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2"><Shield className="text-amber-500" /> Admin Panel — Full Access</h2>
          <div className="flex gap-2">
            <button onClick={() => setShowAdminPwChange(true)} className="flex items-center gap-1 bg-amber-100 text-amber-700 hover:bg-amber-200 px-4 py-2 rounded-lg text-sm font-semibold transition"><Lock size={14} /> Change Password</button>
            <button onClick={() => { setIsAdminLoggedIn(false); setAdminAccessToken(""); setAdminHelpers([]); setView("landing"); }} className="bg-gray-100 text-gray-700 hover:bg-gray-200 px-4 py-2 rounded-lg text-sm font-semibold transition">Logout</button>
          </div>
        </div>
        <FilterBar list={adminHelpers} />
        {list.length === 0 ? (
          <div className="text-center py-16 text-gray-400"><Users size={48} className="mx-auto mb-3" /><p>No helpers registered yet.</p></div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {list.map((h) => <HelperCard key={h.id} h={h} isAdminView={true} />)}
          </div>
        )}
        {showAdminPwChange && (
          <div className="fixed inset-0 bg-black/40 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-2xl shadow-xl p-6 max-w-sm w-full relative">
              <button onClick={() => setShowAdminPwChange(false)} className="absolute top-3 right-3 text-gray-400 hover:text-gray-600"><X size={18} /></button>
              <h3 className="text-lg font-bold text-gray-800 mb-4">Change Admin Password</h3>
              <input type="password" placeholder="New password" className="w-full border rounded-lg px-3 py-2 text-sm mb-2" value={adminNewPw} onChange={(e) => setAdminNewPw(e.target.value)} />
              <input type="password" placeholder="Confirm new password" className="w-full border rounded-lg px-3 py-2 text-sm mb-2" value={adminNewPw2} onChange={(e) => setAdminNewPw2(e.target.value)} />
              {adminPwMsg ? <p className="text-xs mb-2 text-indigo-600">{adminPwMsg}</p> : null}
              <button onClick={changeAdminPassword} className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-2 rounded-lg transition">Update Password</button>
            </div>
          </div>
        )}
      </div>
    );
  }

  function HelperLoginView() {
    return (
      <div className="max-w-md mx-auto px-4 py-16">
        <div className="bg-white rounded-2xl shadow p-6">
          <div className="flex items-center gap-2 mb-4"><User className="text-indigo-600" /><h2 className="text-xl font-bold text-gray-800">Helper Login</h2></div>
          <input className="w-full border rounded-lg px-3 py-2 text-sm mb-2" placeholder="Enter your Unique ID" value={helperLoginId} onChange={(e) => setHelperLoginId(e.target.value)} />
          <input type="password" className="w-full border rounded-lg px-3 py-2 text-sm mb-2" placeholder="Enter your password" value={helperLoginPw} onChange={(e) => setHelperLoginPw(e.target.value)} />
          {helperLoginError ? <p className="text-red-500 text-xs mb-2">{helperLoginError}</p> : null}
          <button onClick={helperLogin} className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-2.5 rounded-lg transition">Login</button>
        </div>
      </div>
    );
  }

  function HelperProfileView() {
    if (!loggedInHelper) return null;
    const h = loggedInHelper;
    return (
      <div className="max-w-md mx-auto px-4 py-8">
        <div className="bg-white rounded-2xl shadow p-6 text-center">
          {h.photo_url ? (
            <img src={h.photo_url} alt={h.name} className="w-28 h-28 rounded-full object-cover border-4 border-indigo-300 mx-auto" />
          ) : (
            <div className="w-28 h-28 rounded-full bg-indigo-50 border-4 border-indigo-300 mx-auto flex items-center justify-center"><User size={40} className="text-indigo-300" /></div>
          )}
          <h2 className="text-xl font-bold text-gray-800 mt-3">{h.name}</h2>
          <p className="text-xs text-gray-500 font-mono">{h.id}</p>
          <span className="mt-2 inline-block bg-indigo-100 text-indigo-700 text-xs font-semibold px-3 py-1 rounded-full">{h.occupation}</span>
          <div className="text-left mt-5 space-y-2 text-sm">
            <div className="bg-gray-50 rounded-lg px-3 py-2 flex items-center gap-2"><Building2 size={14} className="text-gray-500" /><span>{h.area ? `${h.area}, ${h.city}` : h.city}</span></div>
            <div className="bg-gray-50 rounded-lg px-3 py-2 flex items-center gap-2"><Phone size={14} className="text-gray-500" /><span>{h.phone}</span></div>
            <div className="bg-gray-50 rounded-lg px-3 py-2 flex items-center gap-2"><CreditCard size={14} className="text-gray-500" /><span>{h.aadhar}</span></div>
            <div className="bg-gray-50 rounded-lg px-3 py-2 flex items-center gap-2"><MapPin size={14} className="text-gray-500" /><span>{h.address}</span></div>
          </div>
          <div className="flex gap-2 mt-5">
            <button onClick={() => setShowHelperPwChange(true)} className="flex-1 flex items-center justify-center gap-1 bg-indigo-100 text-indigo-700 hover:bg-indigo-200 px-4 py-2 rounded-lg text-sm font-semibold transition"><Lock size={14} /> Change Password</button>
            <button onClick={() => { setLoggedInHelper(null); setView("landing"); }} className="flex-1 bg-gray-100 text-gray-700 hover:bg-gray-200 px-4 py-2 rounded-lg text-sm font-semibold transition">Logout</button>
          </div>
          {showHelperPwChange && (
            <div className="fixed inset-0 bg-black/40 flex items-center justify-center p-4 z-50">
              <div className="bg-white rounded-2xl shadow-xl p-6 max-w-sm w-full relative text-left">
                <button onClick={() => setShowHelperPwChange(false)} className="absolute top-3 right-3 text-gray-400 hover:text-gray-600"><X size={18} /></button>
                <h3 className="text-lg font-bold text-gray-800 mb-4">Change Your Password</h3>
                <input type="password" placeholder="Current password" className="w-full border rounded-lg px-3 py-2 text-sm mb-2" value={helperOldPw} onChange={(e) => setHelperOldPw(e.target.value)} />
                <input type="password" placeholder="New password" className="w-full border rounded-lg px-3 py-2 text-sm mb-2" value={helperNewPw} onChange={(e) => setHelperNewPw(e.target.value)} />
                <input type="password" placeholder="Confirm new password" className="w-full border rounded-lg px-3 py-2 text-sm mb-2" value={helperNewPw2} onChange={(e) => setHelperNewPw2(e.target.value)} />
                {helperPwMsg ? <p className="text-xs mb-2 text-indigo-600">{helperPwMsg}</p> : null}
                <button onClick={changeHelperPassword} className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-2 rounded-lg transition">Update Password</button>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  function ContactModal() {
    if (!showContactModal) return null;
    return (
      <div className="fixed inset-0 bg-black/40 flex items-center justify-center p-4 z-50">
        <div className="bg-white rounded-2xl shadow-xl p-6 max-w-sm w-full relative text-center">
          <button onClick={() => setShowContactModal(false)} className="absolute top-3 right-3 text-gray-400 hover:text-gray-600"><X size={18} /></button>
          <Shield size={32} className="text-indigo-500 mx-auto mb-2" />
          <h3 className="text-lg font-bold text-gray-800 mb-2">Contact via Admin</h3>
          <p className="text-sm text-gray-600 mb-4">Helper phone numbers are private. Please reach out to our admin team to get connected safely.</p>
          <div className="bg-indigo-50 rounded-lg p-3 text-sm text-indigo-700 font-medium">Admin Contact: +91 98765 43210<br />Email: admin@helperportal.com</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      {view === "landing" && <Landing />}
      {view === "register" && <Register />}
      {view === "adminLogin" && <AdminLoginView />}
      {view === "admin" && (isAdminLoggedIn ? <AdminPanel /> : <AdminLoginView />)}
      {view === "helperLogin" && <HelperLoginView />}
      {view === "helperProfile" && (loggedInHelper ? <HelperProfileView /> : <HelperLoginView />)}
      <ContactModal />
    </div>
  );
}


