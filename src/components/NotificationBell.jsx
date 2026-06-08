import { useState, useEffect, useRef } from "react";
import { Bell, CheckCheck, ExternalLink } from "lucide-react";
import { getAuthToken } from "../utils/authStorage";

const BASE = (import.meta.env.VITE_API_URL || "http://localhost:5000/api").replace(/\/api$/, "");

async function apiFetch(path, options = {}) {
  const token = getAuthToken();
  const res = await fetch(`${BASE}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
  });
  return res.json();
}

const TYPE_STYLES = {
  status_update: "bg-blue-50 border-blue-100",
  assignment:    "bg-green-50 border-green-100",
  upload:        "bg-amber-50 border-amber-100",
  update:        "bg-slate-50 border-slate-100",
};

export default function NotificationBell({ accentColor = "blue", onBellClick, onNotificationClick }) {
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unread, setUnread] = useState(0);
  const [loading, setLoading] = useState(false);
  const panelRef = useRef(null);

  const load = async () => {
    try {
      setLoading(true);
      const data = await apiFetch("/api/notifications");
      setNotifications(data.notifications || []);
      setUnread(data.unread || 0);
    } catch {
      // silent fail
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    const interval = setInterval(load, 30000); // poll every 30s
    return () => clearInterval(interval);
  }, []);

  // Close panel on outside click
  useEffect(() => {
    const handler = (e) => {
      if (panelRef.current && !panelRef.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const markOne = async (id) => {
    await apiFetch(`/api/notifications/${id}/read`, { method: "PATCH" });
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: 1 } : n));
    setUnread(prev => Math.max(0, prev - 1));
  };

  const markAll = async () => {
    await apiFetch("/api/notifications/read-all", { method: "PATCH" });
    setNotifications(prev => prev.map(n => ({ ...n, is_read: 1 })));
    setUnread(0);
  };

  const handleBellClick = () => {
    if (typeof onBellClick === "function") {
      setOpen(false);
      onBellClick();
      return;
    }
    setOpen((prevOpen) => {
      const nextOpen = !prevOpen;
      if (!prevOpen) load();
      return nextOpen;
    });
  };

  const handleNotificationClick = async (notification) => {
    if (!notification.is_read) {
      try {
        await markOne(notification.id);
      } catch {
        // ignore failure and continue navigating
      }
    }
    setOpen(false);
    if (typeof onNotificationClick === "function") {
      onNotificationClick(notification);
    }
  };

  const accentRing = { blue: "ring-blue-400", green: "ring-green-500" }[accentColor] || "ring-blue-400";

  return (
    <div className="relative" ref={panelRef}>
      <button
        onClick={handleBellClick}
        className={`relative p-2 rounded-xl hover:bg-slate-100 transition-colors ${open ? `ring-2 ${accentRing}` : ""}`}
        aria-label="Notifications"
      >
        <Bell className="w-5 h-5 text-slate-500" />
        {unread > 0 && (
          <span className="absolute -top-0.5 -right-0.5 min-w-4.5 h-4.5 bg-red-500 text-white text-[10px] font-extrabold rounded-full flex items-center justify-center px-1">
            {unread > 9 ? "9+" : unread}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-2 w-80 bg-white rounded-2xl shadow-2xl border border-slate-100 z-50 overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100">
            <p className="text-[13px] font-extrabold text-slate-800">Notifications</p>
            {unread > 0 && (
              <button onClick={markAll} className="flex items-center gap-1 text-[11px] font-semibold text-blue-600 hover:text-blue-800">
                <CheckCheck className="w-3.5 h-3.5" /> Mark all read
              </button>
            )}
          </div>

          {/* List */}
          <div className="max-h-80 overflow-y-auto divide-y divide-slate-50">
            {loading && <p className="text-[12px] text-slate-400 text-center py-6">Loading…</p>}
            {!loading && notifications.length === 0 && (
              <p className="text-[12px] text-slate-400 text-center py-8">No notifications yet</p>
            )}
            {!loading && notifications.map(n => (
              <div
                key={n.id}
                onClick={() => handleNotificationClick(n)}
                className={`flex items-start gap-3 px-4 py-3 cursor-pointer hover:bg-slate-50 transition-colors ${!n.is_read ? "bg-blue-50/40" : ""}`}
              >
                <div className={`w-2 h-2 rounded-full mt-1.5 shrink-0 ${!n.is_read ? "bg-blue-500" : "bg-slate-200"}`} />
                <div className="flex-1 min-w-0">
                  <p className={`text-[12px] leading-snug ${!n.is_read ? "font-semibold text-slate-800" : "text-slate-600"}`}>
                    {n.message}
                  </p>
                  <p className="text-[10px] text-slate-400 mt-0.5">
                    {new Date(n.created_at).toLocaleString()}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
