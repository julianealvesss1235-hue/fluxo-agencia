"use client";
import React, { useState, useEffect, useMemo, useCallback } from "react";
import {
  LayoutGrid, Users, Star, StarOff, Search, Plus, X, Sun, Moon,
  Phone, MessageCircle, Calendar, Clock, AlertTriangle, CheckCircle2,
  ChevronDown, ChevronRight, Link2, Trash2, Edit3, ArrowLeft, Circle, Menu, Plug
} from "lucide-react";
import {
  CLIENT_COLORS, CATEGORIES, STATUS, PRIORITY,
  uid, todayISO, colorForClient, initials, daysUntil,
} from "../lib/constants";
import Integrations from "./Integrations";
import { upsertEvent, deleteEvent, googleColorForIndex, requestGoogleToken, listEvents } from "../lib/googleCalendar";

/* constants moved to ../lib/constants so Integrations.jsx can share them */

/* ----------------------------- storage (localStorage) ----------------------------- */

async function loadData() {
  try {
    const c = localStorage.getItem("clients-data");
    const t = localStorage.getItem("tasks-data");
    return { clients: c ? JSON.parse(c) : null, tasks: t ? JSON.parse(t) : null };
  } catch (e) {
    return { clients: null, tasks: null };
  }
}
async function saveClients(clients) {
  try { localStorage.setItem("clients-data", JSON.stringify(clients)); } catch (e) {}
}
async function saveTasks(tasks) {
  try { localStorage.setItem("tasks-data", JSON.stringify(tasks)); } catch (e) {}
}

/* ----------------------------- seed data ----------------------------- */

function seedData() {
  const clients = [
    { id: uid(), name: "Loja Verde Vida", area: "E-commerce · Alimentos naturais", contact: "Marina Souza", whatsapp: "(71) 99123-4567", notes: "Prefere aprovar tudo pelo WhatsApp.", contractType: "Mensal recorrente", monthlyValue: "2400", startDate: "2025-03-01", favorite: true },
    { id: uid(), name: "Dr. Felipe Andrade", area: "Odontologia", contact: "Felipe Andrade", whatsapp: "(71) 98888-2211", notes: "Gravações só às terças.", contractType: "Mensal recorrente", monthlyValue: "1800", startDate: "2025-06-15", favorite: false },
    { id: uid(), name: "Estúdio Bahia Fit", area: "Academia / Fitness", contact: "Camila Reis", whatsapp: "(71) 99777-0099", notes: "", contractType: "Avulso", monthlyValue: "", startDate: "2026-01-10", favorite: false },
  ];
  const tasks = [
    { id: uid(), clientId: clients[0].id, name: "Reels — receita da semana", category: "instagram", subcategory: "Reels", description: "Roteiro já aprovado, falta gravar.", responsible: "Você", priority: "alta", status: "em_andamento", createdAt: todayISO(), dueDate: todayISO(), tags: ["urgente-cliente"], checklist: [{ text: "Roteiro", done: true }, { text: "Gravação", done: false }, { text: "Edição", done: false }], link: "" },
    { id: uid(), clientId: clients[0].id, name: "Planejamento de conteúdo — mês 07", category: "estrategia", subcategory: "", description: "", responsible: "Você", priority: "media", status: "nao_iniciado", createdAt: todayISO(), dueDate: futureDate(2), tags: [], checklist: [], link: "" },
    { id: uid(), clientId: clients[1].id, name: "Stories — antes/depois", category: "instagram", subcategory: "Stories", description: "", responsible: "Equipe design", priority: "urgente", status: "aguardando_cliente", createdAt: pastDate(6), dueDate: pastDate(1), tags: [], checklist: [], link: "" },
    { id: uid(), clientId: clients[1].id, name: "Cobertura — mutirão odontológico", category: "captacao", subcategory: "Cobertura", description: "", responsible: "Storymaker", priority: "media", status: "concluido", createdAt: pastDate(10), dueDate: pastDate(3), tags: [], checklist: [], link: "" },
    { id: uid(), clientId: clients[2].id, name: "Carrossel — dicas de treino", category: "instagram", subcategory: "Carrossel", description: "", responsible: "Você", priority: "baixa", status: "em_revisao", createdAt: pastDate(2), dueDate: futureDate(1), tags: [], checklist: [], link: "" },
  ];
  return { clients, tasks };
}
function futureDate(days) { const d = new Date(); d.setDate(d.getDate() + days); return d.toISOString().slice(0, 10); }
function pastDate(days) { const d = new Date(); d.setDate(d.getDate() - days); return d.toISOString().slice(0, 10); }

/* ----------------------------- small UI atoms ----------------------------- */

function Avatar({ name, color, size = 36 }) {
  return (
    <div
      style={{
        width: size, height: size, borderRadius: size * 0.32, background: color,
        display: "flex", alignItems: "center", justifyContent: "center",
        color: "#fff", fontWeight: 600, fontSize: size * 0.38, flexShrink: 0,
        fontFamily: "var(--font-display)",
      }}
    >
      {initials(name)}
    </div>
  );
}

function Badge({ color, children }) {
  return (
    <span
      style={{
        display: "inline-flex", alignItems: "center", gap: 5, fontSize: 12, fontWeight: 500,
        padding: "3px 9px", borderRadius: 999, color, background: color + "1A", whiteSpace: "nowrap",
      }}
    >
      <span style={{ width: 6, height: 6, borderRadius: 999, background: color }} />
      {children}
    </span>
  );
}

function StatCard({ icon: Icon, label, value, accent, sub }) {
  return (
    <div className="card" style={{ padding: "18px 20px", display: "flex", flexDirection: "column", gap: 10, minWidth: 0 }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <span style={{ fontSize: 13, color: "var(--muted)", fontWeight: 500 }}>{label}</span>
        <div style={{ width: 30, height: 30, borderRadius: 9, background: accent + "1A", display: "flex", alignItems: "center", justifyContent: "center" }}>
          <Icon size={15} color={accent} strokeWidth={2.2} />
        </div>
      </div>
      <div style={{ fontFamily: "var(--font-display)", fontSize: 30, fontWeight: 600, color: "var(--text)", lineHeight: 1 }}>{value}</div>
      {sub && <span style={{ fontSize: 12.5, color: "var(--muted)" }}>{sub}</span>}
    </div>
  );
}

function Modal({ title, onClose, children, width = 480 }) {
  return (
    <div
      onClick={onClose}
      style={{
        position: "fixed", inset: 0, background: "rgba(20,18,26,0.45)", backdropFilter: "blur(3px)",
        display: "flex", alignItems: "center", justifyContent: "center", zIndex: 100, padding: 20,
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="card"
        style={{ width: "100%", maxWidth: width, maxHeight: "88vh", overflowY: "auto", padding: 0 }}
      >
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "18px 22px", borderBottom: "1px solid var(--border)", position: "sticky", top: 0, background: "var(--surface)", zIndex: 1 }}>
          <h3 style={{ margin: 0, fontFamily: "var(--font-display)", fontSize: 17, fontWeight: 600 }}>{title}</h3>
          <button onClick={onClose} className="icon-btn"><X size={17} /></button>
        </div>
        <div style={{ padding: 22 }}>{children}</div>
      </div>
    </div>
  );
}

function Field({ label, children }) {
  return (
    <label style={{ display: "flex", flexDirection: "column", gap: 6, marginBottom: 14 }}>
      <span style={{ fontSize: 12.5, fontWeight: 600, color: "var(--muted)" }}>{label}</span>
      {children}
    </label>
  );
}

const inputStyle = {
  width: "100%", padding: "9px 12px", borderRadius: 10, border: "1px solid var(--border)",
  background: "var(--bg)", color: "var(--text)", fontSize: 14, fontFamily: "inherit", outline: "none", boxSizing: "border-box",
};

/* ----------------------------- app ----------------------------- */

export default function App() {
  const [clients, setClients] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [loaded, setLoaded] = useState(false);
  const [theme, setTheme] = useState("light");
  const [view, setView] = useState("dashboard");
  const [selectedClientId, setSelectedClientId] = useState(null);
  const [search, setSearch] = useState("");
  const [clientModal, setClientModal] = useState(null);
  const [taskModal, setTaskModal] = useState(null);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  const [googleAuth, setGoogleAuth] = useState({ clientId: "", calendarId: "primary", connected: false, accessToken: null, expiresAt: null });
  const [googleEvents, setGoogleEvents] = useState([]); // external (non-Fluxo) events, for read-only display
  const [googleSyncing, setGoogleSyncing] = useState(false);
  const [googleError, setGoogleError] = useState("");

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 860);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem("fluxo-google") || "null");
      if (saved) setGoogleAuth((g) => ({ ...g, ...saved, accessToken: null, expiresAt: null }));
    } catch (e) {}
  }, []);

  useEffect(() => {
    const savedTheme = localStorage.getItem("fluxo-theme");
    if (savedTheme) setTheme(savedTheme);
    (async () => {
      const { clients: c, tasks: t } = await loadData();
      if (c && t) {
        setClients(c); setTasks(t);
      } else {
        const seed = seedData();
        setClients(seed.clients); setTasks(seed.tasks);
        saveClients(seed.clients); saveTasks(seed.tasks);
      }
      setLoaded(true);
    })();
  }, []);

  const toggleTheme = () => {
    const next = theme === "light" ? "dark" : "light";
    setTheme(next);
    localStorage.setItem("fluxo-theme", next);
  };

  const persistClients = useCallback((next) => { setClients(next); saveClients(next); }, []);
  const persistTasks = useCallback((next) => { setTasks(next); saveTasks(next); }, []);

  const saveGoogleSettings = (next) => {
    setGoogleAuth((g) => ({ ...g, ...next }));
    const { clientId, calendarId, connected } = { ...googleAuth, ...next };
    localStorage.setItem("fluxo-google", JSON.stringify({ clientId, calendarId, connected }));
  };

  const ensureGoogleToken = useCallback(async () => {
    if (googleAuth.accessToken && googleAuth.expiresAt && Date.now() < googleAuth.expiresAt - 30000) {
      return googleAuth.accessToken;
    }
    const resp = await requestGoogleToken(googleAuth.clientId, { silent: true }).catch(() =>
      requestGoogleToken(googleAuth.clientId, { silent: false })
    );
    const expiresAt = Date.now() + (resp.expires_in || 3500) * 1000;
    setGoogleAuth((g) => ({ ...g, accessToken: resp.access_token, expiresAt }));
    return resp.access_token;
  }, [googleAuth]);

  const connectGoogle = async (clientId) => {
    setGoogleError("");
    try {
      const resp = await requestGoogleToken(clientId, { silent: false });
      const expiresAt = Date.now() + (resp.expires_in || 3500) * 1000;
      setGoogleAuth((g) => ({ ...g, clientId, connected: true, accessToken: resp.access_token, expiresAt }));
      localStorage.setItem("fluxo-google", JSON.stringify({ clientId, calendarId: googleAuth.calendarId, connected: true }));
      setTimeout(() => syncGoogleCalendar({ clientId, accessToken: resp.access_token }), 300);
    } catch (e) {
      setGoogleError("Não foi possível conectar. Confira o Client ID e se este domínio está autorizado no Google Cloud.");
    }
  };

  const disconnectGoogle = () => {
    setGoogleAuth((g) => ({ ...g, connected: false, accessToken: null, expiresAt: null }));
    setGoogleEvents([]);
    localStorage.setItem("fluxo-google", JSON.stringify({ clientId: googleAuth.clientId, calendarId: googleAuth.calendarId, connected: false }));
  };

  const syncGoogleCalendar = useCallback(async (override) => {
    if (!googleAuth.connected && !override) return;
    setGoogleSyncing(true);
    setGoogleError("");
    try {
      const accessToken = override?.accessToken || (await ensureGoogleToken());
      const calendarId = googleAuth.calendarId || "primary";
      const timeMin = new Date(Date.now() - 7 * 86400000).toISOString();
      const timeMax = new Date(Date.now() + 60 * 86400000).toISOString();
      const events = await listEvents(accessToken, calendarId, timeMin, timeMax);

      const external = [];
      let latestTasks = tasks;
      const updates = [];
      for (const ev of events) {
        const isFluxo = ev.extendedProperties?.private?.fluxoApp === "true";
        if (isFluxo) {
          const linkedTask = latestTasks.find((t) => t.googleEventId === ev.id);
          const evDate = ev.start?.date || ev.start?.dateTime?.slice(0, 10);
          if (linkedTask && evDate && evDate !== linkedTask.dueDate) {
            updates.push({ id: linkedTask.id, dueDate: evDate });
          }
        } else {
          external.push({
            id: ev.id,
            name: ev.summary || "(sem título)",
            date: ev.start?.date || ev.start?.dateTime?.slice(0, 10),
          });
        }
      }
      if (updates.length) {
        const merged = latestTasks.map((t) => {
          const u = updates.find((u) => u.id === t.id);
          return u ? { ...t, dueDate: u.dueDate } : t;
        });
        persistTasks(merged);
      }
      setGoogleEvents(external);
    } catch (e) {
      setGoogleError("Não foi possível sincronizar agora. Tente reconectar.");
    } finally {
      setGoogleSyncing(false);
    }
  }, [googleAuth, ensureGoogleToken, tasks, persistTasks]);

  const pushTaskToGoogle = useCallback(async (task) => {
    if (!googleAuth.connected || !task.dueDate || !task.clientId) return;
    try {
      const accessToken = await ensureGoogleToken();
      const client = clients.find((c) => c.id === task.clientId);
      const idx = clients.findIndex((c) => c.id === task.clientId);
      const result = await upsertEvent(accessToken, googleAuth.calendarId || "primary", {
        googleEventId: task.googleEventId,
        summary: `${client ? client.name + " · " : ""}${task.name}`,
        description: task.description,
        dateISO: task.dueDate,
        colorId: googleColorForIndex(idx),
      });
      if (result?.id && result.id !== task.googleEventId) {
        setTasks((prev) => {
          const next = prev.map((t) => (t.id === task.id ? { ...t, googleEventId: result.id } : t));
          saveTasks(next);
          return next;
        });
      }
    } catch (e) {
      // silent — user can hit "sincronizar" manually in Integrações if needed
    }
  }, [googleAuth, ensureGoogleToken, clients]);

  const removeTaskFromGoogle = useCallback(async (task) => {
    if (!googleAuth.connected || !task.googleEventId) return;
    try {
      const accessToken = await ensureGoogleToken();
      await deleteEvent(accessToken, googleAuth.calendarId || "primary", task.googleEventId);
    } catch (e) {}
  }, [googleAuth, ensureGoogleToken]);

  const selectedClient = clients.find((c) => c.id === selectedClientId) || null;

  const openClient = (id) => { setSelectedClientId(id); setView("clientDetail"); setMobileNavOpen(false); };
  const goto = (v) => { setView(v); setMobileNavOpen(false); };

  const upsertClient = (data) => {
    if (data.id) {
      persistClients(clients.map((c) => (c.id === data.id ? data : c)));
    } else {
      const newClient = { ...data, id: uid(), favorite: false };
      persistClients([...clients, newClient]);
    }
    setClientModal(null);
  };

  const deleteClient = (id) => {
    persistClients(clients.filter((c) => c.id !== id));
    persistTasks(tasks.filter((t) => t.clientId !== id));
    setView("dashboard");
  };

  const toggleFavorite = (id) => {
    persistClients(clients.map((c) => (c.id === id ? { ...c, favorite: !c.favorite } : c)));
  };

  const upsertTask = (data) => {
    let finalTask;
    if (data.id) {
      finalTask = data;
      persistTasks(tasks.map((t) => (t.id === data.id ? data : t)));
    } else {
      finalTask = { ...data, id: uid(), createdAt: todayISO() };
      persistTasks([...tasks, finalTask]);
    }
    setTaskModal(null);
    pushTaskToGoogle(finalTask);
  };

  const deleteTask = (id) => {
    const task = tasks.find((t) => t.id === id);
    persistTasks(tasks.filter((t) => t.id !== id));
    if (task) removeTaskFromGoogle(task);
  };
  const updateTaskStatus = (id, status) => persistTasks(tasks.map((t) => (t.id === id ? { ...t, status } : t)));

  const importFromTrello = ({ newClient, newTasks }) => {
    let targetClientId = newClient?.existingId || null;
    let updatedClients = clients;
    if (newClient?.create) {
      const created = { ...newClient.create, id: uid(), favorite: false };
      updatedClients = [...clients, created];
      targetClientId = created.id;
      persistClients(updatedClients);
    }
    const tasksToAdd = newTasks.map((t) => ({ ...t, clientId: targetClientId, id: uid(), createdAt: todayISO() }));
    persistTasks([...tasks, ...tasksToAdd]);
    return tasksToAdd.length;
  };

  const stats = useMemo(() => {
    const today = todayISO();
    const notDone = tasks.filter((t) => t.status !== "concluido");
    const dueToday = notDone.filter((t) => t.dueDate === today);
    const overdue = notDone.filter((t) => t.dueDate && t.dueDate < today);
    const upcoming = notDone
      .filter((t) => t.dueDate && t.dueDate > today)
      .sort((a, b) => a.dueDate.localeCompare(b.dueDate))
      .slice(0, 6);
    const inProgress = tasks.filter((t) => t.status === "em_andamento");
    const doneThisMonth = tasks.filter((t) => t.status === "concluido" && t.dueDate && t.dueDate.slice(0, 7) === today.slice(0, 7));
    const byClient = clients
      .map((c) => ({ client: c, count: tasks.filter((t) => t.clientId === c.id && t.status !== "concluido").length }))
      .sort((a, b) => b.count - a.count);
    const byCategory = CATEGORIES.map((cat) => ({
      cat, count: tasks.filter((t) => t.category === cat.id).length,
    })).filter((c) => c.count > 0);
    const maxCat = Math.max(1, ...byCategory.map((c) => c.count));
    return { dueToday, overdue, upcoming, inProgress, doneThisMonth, byClient, byCategory, maxCat };
  }, [tasks, clients]);

  const weekDays = useMemo(() => {
    const start = new Date();
    start.setDate(start.getDate() - start.getDay());
    return Array.from({ length: 7 }).map((_, i) => {
      const d = new Date(start);
      d.setDate(start.getDate() + i);
      const iso = d.toISOString().slice(0, 10);
      return { date: d, iso, tasks: tasks.filter((t) => t.dueDate === iso) };
    });
  }, [tasks]);

  const filteredClients = useMemo(() => {
    const q = search.trim().toLowerCase();
    let list = clients;
    if (q) list = list.filter((c) => c.name.toLowerCase().includes(q) || c.area.toLowerCase().includes(q));
    return [...list].sort((a, b) => (b.favorite - a.favorite) || a.name.localeCompare(b.name));
  }, [clients, search]);

  if (!loaded) {
    return (
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100vh", color: "#8B8681", fontFamily: "sans-serif" }}>
        Carregando…
      </div>
    );
  }

  return (
    <div className={theme === "dark" ? "theme-dark" : "theme-light"}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@500;600;700&family=Inter:wght@400;500;600&display=swap');
        .theme-light {
          --bg: #FAFAF9; --surface: #FFFFFF; --text: #1C1B1A; --muted: #8B8681;
          --border: #E8E5E0; --accent: #5B47E0; --accent-soft: #5B47E01A; --hover: #F1EFEA;
        }
        .theme-dark {
          --bg: #15141A; --surface: #1D1B24; --text: #EDEBF5; --muted: #8B8797;
          --border: #2C2934; --accent: #7C6AF0; --accent-soft: #7C6AF026; --hover: #262330;
        }
        * { box-sizing: border-box; }
        html, body { background: var(--bg); }
        .app-root { background: var(--bg); color: var(--text); min-height: 100vh; --font-display: 'Space Grotesk', sans-serif; --font-body: 'Inter', sans-serif; font-family: var(--font-body); }
        .card { background: var(--surface); border: 1px solid var(--border); border-radius: 16px; }
        .icon-btn { border: none; background: transparent; color: var(--muted); cursor: pointer; width: 34px; height: 34px; border-radius: 8px; display: flex; align-items: center; justify-content: center; transition: background .15s; }
        .icon-btn:hover { background: var(--hover); color: var(--text); }
        .nav-item { display: flex; align-items: center; gap: 10px; padding: 10px 12px; border-radius: 10px; cursor: pointer; font-size: 14px; font-weight: 500; color: var(--muted); transition: background .15s, color .15s; }
        .nav-item:hover { background: var(--hover); color: var(--text); }
        .nav-item.active { background: var(--accent-soft); color: var(--accent); }
        .btn-primary { background: var(--accent); color: #fff; border: none; padding: 10px 16px; border-radius: 10px; font-size: 14px; font-weight: 600; cursor: pointer; display: inline-flex; align-items: center; gap: 6px; font-family: var(--font-body); }
        .btn-secondary { background: var(--hover); color: var(--text); border: 1px solid var(--border); padding: 10px 16px; border-radius: 10px; font-size: 14px; font-weight: 600; cursor: pointer; font-family: var(--font-body); }
        .client-row { transition: background .15s; cursor: pointer; }
        .client-row:hover { background: var(--hover); }
        select, input, textarea { font-family: var(--font-body); font-size: 16px; }
        ::placeholder { color: var(--muted); opacity: 0.7; }
        @media (max-width: 859px) {
          select, input, textarea { font-size: 16px; }
          .grid-stack { grid-template-columns: 1fr !important; }
        }
      `}</style>

      <div className="app-root" style={{ display: "flex" }}>
        {/* SIDEBAR - desktop */}
        {!isMobile && (
          <div style={{ width: 240, flexShrink: 0, borderRight: "1px solid var(--border)", background: "var(--surface)", display: "flex", flexDirection: "column", padding: "18px 14px", gap: 4, height: "100vh", position: "sticky", top: 0 }}>
            <SidebarContent
              clients={clients} view={view} selectedClientId={selectedClientId} theme={theme}
              onNav={goto} onOpenClient={openClient} onNewClient={() => setClientModal({})} onToggleTheme={toggleTheme}
            />
          </div>
        )}


        {/* MOBILE top bar */}
        {isMobile && (
          <div style={{ position: "fixed", top: 0, left: 0, right: 0, zIndex: 50, background: "var(--surface)", borderBottom: "1px solid var(--border)", display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px 14px" }}>
            <button className="icon-btn" onClick={() => setMobileNavOpen(true)}><Menu size={19} /></button>
            <span style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 15 }}>Fluxo</span>
            <button className="icon-btn" onClick={toggleTheme}>{theme === "light" ? <Moon size={16} /> : <Sun size={16} />}</button>
          </div>
        )}

        {/* MOBILE drawer */}
        {isMobile && mobileNavOpen && (
          <div onClick={() => setMobileNavOpen(false)} style={{ position: "fixed", inset: 0, background: "rgba(20,18,26,0.45)", zIndex: 60, display: "flex" }}>
            <div onClick={(e) => e.stopPropagation()} style={{ width: 260, height: "100vh", background: "var(--surface)", padding: "18px 14px", display: "flex", flexDirection: "column", gap: 4 }}>
              <SidebarContent
                clients={clients} view={view} selectedClientId={selectedClientId} theme={theme}
                onNav={goto} onOpenClient={openClient} onNewClient={() => { setMobileNavOpen(false); setClientModal({}); }} onToggleTheme={toggleTheme}
              />
            </div>
          </div>
        )}

        {/* MAIN */}
        <div style={{ flex: 1, minWidth: 0, padding: isMobile ? "72px 16px 90px" : "24px 30px", maxWidth: 1200, margin: "0 auto", width: "100%" }}>
          {view === "dashboard" && (
            <Dashboard
              stats={stats} weekDays={weekDays} clients={clients} tasks={tasks}
              onOpenClient={openClient} onOpenTask={(t) => setTaskModal({ clientId: t.clientId, task: t })}
            />
          )}
          {view === "clientsList" && (
            <ClientsList
              clients={filteredClients} tasks={tasks} search={search} setSearch={setSearch}
              onOpen={openClient} onNew={() => setClientModal({})} onToggleFav={toggleFavorite}
            />
          )}
          {view === "clientDetail" && selectedClient && (
            <ClientDetail
              client={selectedClient} clients={clients} tasks={tasks.filter((t) => t.clientId === selectedClient.id)}
              onBack={() => setView("clientsList")}
              onEdit={() => setClientModal(selectedClient)}
              onDelete={() => deleteClient(selectedClient.id)}
              onToggleFav={() => toggleFavorite(selectedClient.id)}
              onNewTask={(cat) => setTaskModal({ clientId: selectedClient.id, task: { category: cat } })}
              onOpenTask={(t) => setTaskModal({ clientId: selectedClient.id, task: t })}
              onStatusChange={updateTaskStatus}
              onDeleteTask={deleteTask}
            />
          )}
          {view === "integrations" && (
            <Integrations
              clients={clients}
              googleAuth={googleAuth}
              googleEvents={googleEvents}
              googleSyncing={googleSyncing}
              googleError={googleError}
              onConnectGoogle={connectGoogle}
              onDisconnectGoogle={disconnectGoogle}
              onSyncGoogle={() => syncGoogleCalendar()}
              onSetCalendarId={(calendarId) => saveGoogleSettings({ calendarId })}
              onImportTrello={importFromTrello}
            />
          )}
        </div>

        {/* MOBILE bottom tab bar */}
        {isMobile && (
          <div style={{ position: "fixed", bottom: 0, left: 0, right: 0, zIndex: 50, background: "var(--surface)", borderTop: "1px solid var(--border)", display: "flex", padding: "8px 10px calc(8px + env(safe-area-inset-bottom))" }}>
            <button onClick={() => goto("dashboard")} style={{ flex: 1, background: "none", border: "none", display: "flex", flexDirection: "column", alignItems: "center", gap: 3, color: view === "dashboard" ? "var(--accent)" : "var(--muted)", padding: "4px 0" }}>
              <LayoutGrid size={19} /><span style={{ fontSize: 10.5, fontWeight: 600 }}>Dashboard</span>
            </button>
            <button onClick={() => goto("clientsList")} style={{ flex: 1, background: "none", border: "none", display: "flex", flexDirection: "column", alignItems: "center", gap: 3, color: view !== "dashboard" ? "var(--accent)" : "var(--muted)", padding: "4px 0" }}>
              <Users size={19} /><span style={{ fontSize: 10.5, fontWeight: 600 }}>Clientes</span>
            </button>
            <button onClick={() => setClientModal({})} style={{ flex: 1, background: "none", border: "none", display: "flex", flexDirection: "column", alignItems: "center", gap: 3, color: "var(--muted)", padding: "4px 0" }}>
              <Plus size={19} /><span style={{ fontSize: 10.5, fontWeight: 600 }}>Novo</span>
            </button>
          </div>
        )}
      </div>

      {clientModal && <ClientModal initial={clientModal} onClose={() => setClientModal(null)} onSave={upsertClient} />}
      {taskModal && (
        <TaskModal
          clientId={taskModal.clientId}
          initial={taskModal.task || {}}
          clients={clients}
          onClose={() => setTaskModal(null)}
          onSave={upsertTask}
          onDelete={taskModal.task?.id ? () => { deleteTask(taskModal.task.id); setTaskModal(null); } : null}
        />
      )}
    </div>
  );
}

function SidebarContent({ clients, view, selectedClientId, theme, onNav, onOpenClient, onNewClient, onToggleTheme }) {
  return (
    <>
      <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "4px 8px 18px" }}>
        <div style={{ width: 26, height: 26, borderRadius: 8, background: "var(--accent)", display: "flex", alignItems: "center", justifyContent: "center" }}>
          <Circle size={12} color="#fff" fill="#fff" />
        </div>
        <span style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 16 }}>Fluxo</span>
      </div>
      <div className={`nav-item ${view === "dashboard" ? "active" : ""}`} onClick={() => onNav("dashboard")}><LayoutGrid size={16} /> Dashboard</div>
      <div className={`nav-item ${view === "clientsList" ? "active" : ""}`} onClick={() => onNav("clientsList")}><Users size={16} /> Todos os clientes</div>
      <div style={{ marginTop: 18, marginBottom: 8, padding: "0 8px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <span style={{ fontSize: 11.5, fontWeight: 700, letterSpacing: 0.4, color: "var(--muted)", textTransform: "uppercase" }}>Clientes</span>
        <button className="icon-btn" style={{ width: 22, height: 22 }} onClick={onNewClient}><Plus size={14} /></button>
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 2, overflowY: "auto", flex: 1 }}>
        {clients.map((c) => (
          <div key={c.id} className={`nav-item ${selectedClientId === c.id && view === "clientDetail" ? "active" : ""}`} onClick={() => onOpenClient(c.id)} style={{ justifyContent: "space-between" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 9, minWidth: 0 }}>
              <span style={{ width: 8, height: 8, borderRadius: 999, background: colorForClient(clients, c.id), flexShrink: 0 }} />
              <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{c.name}</span>
            </div>
            {c.favorite && <Star size={12} fill="var(--accent)" color="var(--accent)" style={{ flexShrink: 0 }} />}
          </div>
        ))}
      </div>
      <div className={`nav-item ${view === "integrations" ? "active" : ""}`} onClick={() => onNav("integrations")} style={{ marginTop: 8 }}>
        <Plug size={16} /> Integrações
      </div>
      <button className="icon-btn" style={{ alignSelf: "flex-start", marginTop: 8 }} onClick={onToggleTheme}>
        {theme === "light" ? <Moon size={16} /> : <Sun size={16} />}
      </button>
    </>
  );
}

/* ----------------------------- Dashboard ----------------------------- */

function Dashboard({ stats, weekDays, clients, tasks, onOpenClient, onOpenTask }) {
  const dayLabels = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 22 }}>
      <div>
        <h1 style={{ fontFamily: "var(--font-display)", fontSize: 24, fontWeight: 600, margin: "0 0 2px" }}>Visão geral</h1>
        <p style={{ margin: 0, color: "var(--muted)", fontSize: 14 }}>{new Date().toLocaleDateString("pt-BR", { weekday: "long", day: "numeric", month: "long" })}</p>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))", gap: 14 }}>
        <StatCard icon={Clock} label="Hoje" value={stats.dueToday.length} accent="#3C9EE0" sub="tarefas com prazo hoje" />
        <StatCard icon={AlertTriangle} label="Atrasadas" value={stats.overdue.length} accent="#FF6B5B" sub="precisam de atenção" />
        <StatCard icon={CheckCircle2} label="Concluídas no mês" value={stats.doneThisMonth.length} accent="#1FA97A" />
        <StatCard icon={Circle} label="Em andamento" value={stats.inProgress.length} accent="#5B47E0" />
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1.3fr 1fr", gap: 16, alignItems: "start" }} className="grid-stack">
        <div className="card" style={{ padding: 20 }}>
          <h3 style={{ fontFamily: "var(--font-display)", fontSize: 15, fontWeight: 600, margin: "0 0 14px" }}>Semana</h3>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 8 }}>
            {weekDays.map((d, i) => {
              const isToday = d.iso === todayISO();
              return (
                <div key={i} style={{ borderRadius: 12, border: `1px solid ${isToday ? "var(--accent)" : "var(--border)"}`, padding: 6, minHeight: 78, display: "flex", flexDirection: "column", gap: 4 }}>
                  <span style={{ fontSize: 10.5, color: "var(--muted)", fontWeight: 600 }}>{dayLabels[i]} {d.date.getDate()}</span>
                  {d.tasks.slice(0, 2).map((t) => (
                    <div key={t.id} onClick={() => onOpenTask(t)} style={{ fontSize: 9.5, padding: "2px 5px", borderRadius: 6, background: colorForClient(clients, t.clientId) + "22", color: colorForClient(clients, t.clientId), cursor: "pointer", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", fontWeight: 600 }}>
                      {t.name}
                    </div>
                  ))}
                  {d.tasks.length > 2 && <span style={{ fontSize: 9, color: "var(--muted)" }}>+{d.tasks.length - 2}</span>}
                </div>
              );
            })}
          </div>
        </div>

        <div className="card" style={{ padding: 20 }}>
          <h3 style={{ fontFamily: "var(--font-display)", fontSize: 15, fontWeight: 600, margin: "0 0 14px" }}>Demandas por cliente</h3>
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {stats.byClient.slice(0, 6).map(({ client, count }) => (
              <div key={client.id} onClick={() => onOpenClient(client.id)} style={{ cursor: "pointer" }}>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, marginBottom: 4 }}>
                  <span style={{ fontWeight: 500 }}>{client.name}</span>
                  <span style={{ color: "var(--muted)" }}>{count}</span>
                </div>
                <div style={{ height: 6, borderRadius: 999, background: "var(--hover)", overflow: "hidden" }}>
                  <div style={{ height: "100%", width: `${Math.min(100, (count / (stats.byClient[0]?.count || 1)) * 100)}%`, background: colorForClient(clients, client.id), borderRadius: 999 }} />
                </div>
              </div>
            ))}
            {clients.length === 0 && <p style={{ color: "var(--muted)", fontSize: 13 }}>Nenhum cliente cadastrado ainda.</p>}
          </div>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }} className="grid-stack">
        <div className="card" style={{ padding: 20 }}>
          <h3 style={{ fontFamily: "var(--font-display)", fontSize: 15, fontWeight: 600, margin: "0 0 14px" }}>Próximas entregas</h3>
          <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
            {stats.upcoming.length === 0 && <p style={{ color: "var(--muted)", fontSize: 13 }}>Nada agendado nos próximos dias.</p>}
            {stats.upcoming.map((t) => <TaskRow key={t.id} task={t} clients={clients} onClick={() => onOpenTask(t)} />)}
          </div>
        </div>

        <div className="card" style={{ padding: 20 }}>
          <h3 style={{ fontFamily: "var(--font-display)", fontSize: 15, fontWeight: 600, margin: "0 0 14px" }}>Por categoria</h3>
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {stats.byCategory.map(({ cat, count }) => (
              <div key={cat.id} style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <cat.icon size={14} color="var(--muted)" style={{ flexShrink: 0 }} />
                <span style={{ fontSize: 13, width: 110, flexShrink: 0 }}>{cat.label}</span>
                <div style={{ flex: 1, height: 6, borderRadius: 999, background: "var(--hover)", overflow: "hidden" }}>
                  <div style={{ height: "100%", width: `${(count / stats.maxCat) * 100}%`, background: "var(--accent)", borderRadius: 999 }} />
                </div>
                <span style={{ fontSize: 12, color: "var(--muted)", width: 18, textAlign: "right" }}>{count}</span>
              </div>
            ))}
            {stats.byCategory.length === 0 && <p style={{ color: "var(--muted)", fontSize: 13 }}>Sem tarefas ainda.</p>}
          </div>
        </div>
      </div>
    </div>
  );
}

function TaskRow({ task, clients, onClick, showStatus }) {
  const client = clients.find((c) => c.id === task.clientId);
  const days = daysUntil(task.dueDate);
  const prio = PRIORITY.find((p) => p.id === task.priority);
  const status = STATUS.find((s) => s.id === task.status);
  return (
    <div onClick={onClick} style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 6px", borderRadius: 10, cursor: "pointer" }} className="client-row">
      <span style={{ width: 7, height: 7, borderRadius: 999, background: colorForClient(clients, task.clientId), flexShrink: 0 }} />
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 13.5, fontWeight: 500, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{task.name}</div>
        <div style={{ fontSize: 11.5, color: "var(--muted)" }}>{client?.name}</div>
      </div>
      {showStatus && status && <Badge color={status.color}>{status.label}</Badge>}
      {prio && prio.id !== "baixa" && <Badge color={prio.color}>{prio.label}</Badge>}
      {days !== null && (
        <span style={{ fontSize: 11.5, color: days < 0 ? "#FF6B5B" : "var(--muted)", fontWeight: 600, flexShrink: 0 }}>
          {days === 0 ? "hoje" : days < 0 ? `${Math.abs(days)}d atraso` : `em ${days}d`}
        </span>
      )}
    </div>
  );
}

/* ----------------------------- Clients List ----------------------------- */

function ClientsList({ clients, tasks, search, setSearch, onOpen, onNew, onToggleFav }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 14, flexWrap: "wrap" }}>
        <h1 style={{ fontFamily: "var(--font-display)", fontSize: 24, fontWeight: 600, margin: 0 }}>Clientes</h1>
        <button className="btn-primary" onClick={onNew}><Plus size={15} /> Novo cliente</button>
      </div>

      <div style={{ position: "relative", maxWidth: 320 }}>
        <Search size={15} style={{ position: "absolute", left: 12, top: 12, color: "var(--muted)" }} />
        <input style={{ ...inputStyle, paddingLeft: 34 }} placeholder="Buscar cliente..." value={search} onChange={(e) => setSearch(e.target.value)} />
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))", gap: 14 }}>
        {clients.map((c) => {
          const open = tasks.filter((t) => t.clientId === c.id && t.status !== "concluido").length;
          return (
            <div key={c.id} className="card client-row" style={{ padding: 18 }} onClick={() => onOpen(c.id)}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                <div style={{ display: "flex", gap: 12 }}>
                  <Avatar name={c.name} color={colorForClient(clients, c.id)} />
                  <div>
                    <div style={{ fontWeight: 600, fontSize: 14.5 }}>{c.name}</div>
                    <div style={{ fontSize: 12.5, color: "var(--muted)" }}>{c.area}</div>
                  </div>
                </div>
                <button className="icon-btn" onClick={(e) => { e.stopPropagation(); onToggleFav(c.id); }}>
                  {c.favorite ? <Star size={15} fill="var(--accent)" color="var(--accent)" /> : <StarOff size={15} />}
                </button>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 16 }}>
                <Badge color={colorForClient(clients, c.id)}>{open} demandas ativas</Badge>
                <span style={{ fontSize: 12, color: "var(--muted)" }}>{c.contractType}</span>
              </div>
            </div>
          );
        })}
        {clients.length === 0 && <p style={{ color: "var(--muted)" }}>Nenhum cliente encontrado.</p>}
      </div>
    </div>
  );
}

/* ----------------------------- Client Detail ----------------------------- */

function ClientDetail({ client, clients, tasks, onBack, onEdit, onDelete, onToggleFav, onNewTask, onOpenTask, onStatusChange, onDeleteTask }) {
  const [openCats, setOpenCats] = useState(() => new Set(CATEGORIES.map((c) => c.id)));
  const toggleCat = (id) => setOpenCats((prev) => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n; });

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 22 }}>
      <div>
        <button className="icon-btn" onClick={onBack} style={{ marginBottom: 10 }}><ArrowLeft size={16} /></button>
        <div className="card" style={{ padding: 22 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 16, flexWrap: "wrap" }}>
            <div style={{ display: "flex", gap: 16 }}>
              <Avatar name={client.name} color={colorForClient(clients, client.id)} size={54} />
              <div>
                <h1 style={{ fontFamily: "var(--font-display)", fontSize: 21, fontWeight: 600, margin: 0 }}>{client.name}</h1>
                <p style={{ margin: "3px 0 0", color: "var(--muted)", fontSize: 13.5 }}>{client.area}</p>
              </div>
            </div>
            <div style={{ display: "flex", gap: 8 }}>
              <button className="icon-btn" onClick={onToggleFav}>{client.favorite ? <Star size={16} fill="var(--accent)" color="var(--accent)" /> : <StarOff size={16} />}</button>
              <button className="btn-secondary" onClick={onEdit}><Edit3 size={13} style={{ marginRight: 6 }} />Editar</button>
              <button className="icon-btn" onClick={onDelete}><Trash2 size={15} /></button>
            </div>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px,1fr))", gap: 16, marginTop: 22, paddingTop: 18, borderTop: "1px solid var(--border)" }}>
            <InfoItem icon={Users} label="Contato" value={client.contact || "—"} />
            <InfoItem icon={Phone} label="WhatsApp" value={client.whatsapp || "—"} />
            <InfoItem icon={Calendar} label="Início" value={client.startDate ? new Date(client.startDate + "T00:00:00").toLocaleDateString("pt-BR") : "—"} />
            <InfoItem icon={CheckCircle2} label="Contrato" value={client.contractType || "—"} />
            {client.monthlyValue && <InfoItem icon={TrendingUp} label="Valor mensal" value={`R$ ${client.monthlyValue}`} />}
          </div>
          {client.notes && (
            <div style={{ marginTop: 16, padding: 12, background: "var(--hover)", borderRadius: 10, fontSize: 13, color: "var(--muted)" }}>{client.notes}</div>
          )}
        </div>
      </div>

      <div>
        <h2 style={{ fontFamily: "var(--font-display)", fontSize: 17, fontWeight: 600, margin: "0 0 12px" }}>Demandas por categoria</h2>
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {CATEGORIES.map((cat) => {
            const catTasks = tasks.filter((t) => t.category === cat.id);
            const isOpen = openCats.has(cat.id);
            return (
              <div key={cat.id} className="card" style={{ padding: 0, overflow: "hidden" }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "13px 16px", cursor: "pointer", gap: 8, flexWrap: "wrap" }} onClick={() => toggleCat(cat.id)}>
                  <div style={{ display: "flex", alignItems: "center", gap: 9 }}>
                    {isOpen ? <ChevronDown size={15} color="var(--muted)" /> : <ChevronRight size={15} color="var(--muted)" />}
                    <cat.icon size={15} color="var(--accent)" />
                    <span style={{ fontWeight: 600, fontSize: 14 }}>{cat.label}</span>
                    <span style={{ fontSize: 12, color: "var(--muted)" }}>({catTasks.length})</span>
                  </div>
                  <button className="btn-secondary" style={{ padding: "5px 11px", fontSize: 12.5 }} onClick={(e) => { e.stopPropagation(); onNewTask(cat.id); }}>
                    <Plus size={12} style={{ marginRight: 4 }} />Nova tarefa
                  </button>
                </div>
                {isOpen && (
                  <div style={{ borderTop: catTasks.length ? "1px solid var(--border)" : "none", padding: catTasks.length ? "6px 10px" : 0 }}>
                    {catTasks.map((t) => (
                      <div key={t.id} style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 6px", flexWrap: "wrap" }}>
                        <select
                          value={t.status}
                          onChange={(e) => onStatusChange(t.id, e.target.value)}
                          onClick={(e) => e.stopPropagation()}
                          style={{ border: "none", background: STATUS.find(s => s.id === t.status).color + "1A", color: STATUS.find(s => s.id === t.status).color, fontSize: 11.5, fontWeight: 600, borderRadius: 7, padding: "4px 6px", flexShrink: 0 }}
                        >
                          {STATUS.map((s) => <option key={s.id} value={s.id}>{s.label}</option>)}
                        </select>
                        <div style={{ flex: 1, minWidth: 120, cursor: "pointer" }} onClick={() => onOpenTask(t)}>
                          <div style={{ fontSize: 13.5, fontWeight: 500 }}>{t.name}{t.subcategory ? ` · ${t.subcategory}` : ""}</div>
                        </div>
                        <Badge color={PRIORITY.find(p => p.id === t.priority).color}>{PRIORITY.find(p => p.id === t.priority).label}</Badge>
                        {t.dueDate && <span style={{ fontSize: 11.5, color: "var(--muted)", flexShrink: 0 }}>{new Date(t.dueDate + "T00:00:00").toLocaleDateString("pt-BR")}</span>}
                        <button className="icon-btn" onClick={() => onDeleteTask(t.id)}><Trash2 size={13} /></button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function InfoItem({ icon: Icon, label, value }) {
  return (
    <div style={{ display: "flex", gap: 9, alignItems: "flex-start" }}>
      <Icon size={14} color="var(--muted)" style={{ marginTop: 2, flexShrink: 0 }} />
      <div>
        <div style={{ fontSize: 11.5, color: "var(--muted)" }}>{label}</div>
        <div style={{ fontSize: 13.5, fontWeight: 500 }}>{value}</div>
      </div>
    </div>
  );
}

/* ----------------------------- Modals ----------------------------- */

function ClientModal({ initial, onClose, onSave }) {
  const [form, setForm] = useState({
    id: initial.id, name: initial.name || "", area: initial.area || "", contact: initial.contact || "",
    whatsapp: initial.whatsapp || "", notes: initial.notes || "", contractType: initial.contractType || "Mensal recorrente",
    monthlyValue: initial.monthlyValue || "", startDate: initial.startDate || todayISO(),
  });
  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });
  return (
    <Modal title={initial.id ? "Editar cliente" : "Novo cliente"} onClose={onClose}>
      <Field label="Nome do cliente"><input style={inputStyle} value={form.name} onChange={set("name")} placeholder="Ex: Loja Verde Vida" /></Field>
      <Field label="Área de atuação"><input style={inputStyle} value={form.area} onChange={set("area")} placeholder="Ex: E-commerce de alimentos" /></Field>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
        <Field label="Contato"><input style={inputStyle} value={form.contact} onChange={set("contact")} /></Field>
        <Field label="WhatsApp"><input style={inputStyle} value={form.whatsapp} onChange={set("whatsapp")} placeholder="(00) 00000-0000" /></Field>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
        <Field label="Tipo de contrato">
          <select style={inputStyle} value={form.contractType} onChange={set("contractType")}>
            <option>Mensal recorrente</option><option>Avulso</option><option>Projeto fechado</option>
          </select>
        </Field>
        <Field label="Data de início"><input type="date" style={inputStyle} value={form.startDate} onChange={set("startDate")} /></Field>
      </div>
      <Field label="Valor mensal (opcional)"><input style={inputStyle} value={form.monthlyValue} onChange={set("monthlyValue")} placeholder="R$" /></Field>
      <Field label="Observações"><textarea style={{ ...inputStyle, minHeight: 70, resize: "vertical" }} value={form.notes} onChange={set("notes")} /></Field>
      <div style={{ display: "flex", justifyContent: "flex-end", gap: 10, marginTop: 6 }}>
        <button className="btn-secondary" onClick={onClose}>Cancelar</button>
        <button className="btn-primary" disabled={!form.name.trim()} onClick={() => onSave(form)}>Salvar</button>
      </div>
    </Modal>
  );
}

function TaskModal({ clientId, initial, clients, onClose, onSave, onDelete }) {
  const [form, setForm] = useState({
    id: initial.id, clientId: initial.clientId || clientId, name: initial.name || "",
    category: initial.category || CATEGORIES[0].id, subcategory: initial.subcategory || "",
    description: initial.description || "", responsible: initial.responsible || "",
    priority: initial.priority || "media", status: initial.status || "nao_iniciado",
    dueDate: initial.dueDate || "", link: initial.link || "",
    checklist: initial.checklist || [], createdAt: initial.createdAt || todayISO(),
  });
  const [newCheck, setNewCheck] = useState("");
  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });
  const cat = CATEGORIES.find((c) => c.id === form.category);

  const addCheck = () => {
    if (!newCheck.trim()) return;
    setForm({ ...form, checklist: [...form.checklist, { text: newCheck.trim(), done: false }] });
    setNewCheck("");
  };
  const toggleCheck = (i) => setForm({ ...form, checklist: form.checklist.map((c, idx) => idx === i ? { ...c, done: !c.done } : c) });
  const removeCheck = (i) => setForm({ ...form, checklist: form.checklist.filter((_, idx) => idx !== i) });

  return (
    <Modal title={initial.id ? "Editar tarefa" : "Nova tarefa"} onClose={onClose} width={540}>
      <Field label="Nome da tarefa"><input style={inputStyle} value={form.name} onChange={set("name")} placeholder="Ex: Reels da semana" /></Field>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
        <Field label="Cliente">
          <select style={inputStyle} value={form.clientId} onChange={set("clientId")}>
            {clients.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        </Field>
        <Field label="Categoria">
          <select style={inputStyle} value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value, subcategory: "" })}>
            {CATEGORIES.map((c) => <option key={c.id} value={c.id}>{c.label}</option>)}
          </select>
        </Field>
      </div>
      {cat.sub.length > 0 && (
        <Field label="Subcategoria">
          <select style={inputStyle} value={form.subcategory} onChange={set("subcategory")}>
            <option value="">—</option>
            {cat.sub.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
        </Field>
      )}
      <Field label="Descrição"><textarea style={{ ...inputStyle, minHeight: 60, resize: "vertical" }} value={form.description} onChange={set("description")} /></Field>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
        <Field label="Responsável"><input style={inputStyle} value={form.responsible} onChange={set("responsible")} /></Field>
        <Field label="Prazo"><input type="date" style={inputStyle} value={form.dueDate} onChange={set("dueDate")} /></Field>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
        <Field label="Prioridade">
          <select style={inputStyle} value={form.priority} onChange={set("priority")}>
            {PRIORITY.map((p) => <option key={p.id} value={p.id}>{p.label}</option>)}
          </select>
        </Field>
        <Field label="Status">
          <select style={inputStyle} value={form.status} onChange={set("status")}>
            {STATUS.map((s) => <option key={s.id} value={s.id}>{s.label}</option>)}
          </select>
        </Field>
      </div>
      <Field label="Link (Drive, Notion, Canva...)"><input style={inputStyle} value={form.link} onChange={set("link")} placeholder="https://..." /></Field>

      <Field label="Checklist">
        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          {form.checklist.map((c, i) => (
            <div key={i} style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <input type="checkbox" checked={c.done} onChange={() => toggleCheck(i)} />
              <span style={{ flex: 1, fontSize: 13.5, textDecoration: c.done ? "line-through" : "none", color: c.done ? "var(--muted)" : "var(--text)" }}>{c.text}</span>
              <button className="icon-btn" style={{ width: 22, height: 22 }} onClick={() => removeCheck(i)}><X size={12} /></button>
            </div>
          ))}
          <div style={{ display: "flex", gap: 6 }}>
            <input style={inputStyle} value={newCheck} onChange={(e) => setNewCheck(e.target.value)} placeholder="Adicionar item..." onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addCheck())} />
            <button className="btn-secondary" onClick={addCheck}><Plus size={13} /></button>
          </div>
        </div>
      </Field>

      <div style={{ display: "flex", justifyContent: "space-between", marginTop: 10, flexWrap: "wrap", gap: 10 }}>
        {onDelete ? <button className="btn-secondary" onClick={onDelete}><Trash2 size={13} style={{ marginRight: 6 }} />Excluir</button> : <span />}
        <div style={{ display: "flex", gap: 10 }}>
          <button className="btn-secondary" onClick={onClose}>Cancelar</button>
          <button className="btn-primary" disabled={!form.name.trim()} onClick={() => onSave(form)}>Salvar</button>
        </div>
      </div>
    </Modal>
  );
}
