/**
 * ============================================================
 *  Faculty Status Board — Backend (server.js)
 *  Stack : Node.js + Express
 *  Storage : In-memory (no database required)
 * ============================================================
 */

const express = require("express");
const path = require("path");
const cors = require("cors");

const app = express();
app.use(express.json());
app.use(cors());
app.use(express.static(path.join(__dirname, "public")));

/* ──────────────────────────────────────────────
   UTILITY : detect current class status from
   weekly schedule (Bangladesh time, UTC+6)
   ────────────────────────────────────────────── */
function getBDTime() {
  const now = new Date();
  // Bangladesh Standard Time = UTC + 6h
  const bd = new Date(now.getTime() + 6 * 60 * 60 * 1000);
  return bd;
}

const DAY_NAMES = ["sunday","monday","tuesday","wednesday","thursday","friday","saturday"];

function isInClass(schedule) {
  if (!schedule || typeof schedule !== "object") return false;
  const bd      = getBDTime();
  const dayKey  = DAY_NAMES[bd.getUTCDay()];
  const slots   = schedule[dayKey];
  if (!Array.isArray(slots) || slots.length === 0) return false;

  const hh = bd.getUTCHours();
  const mm = bd.getUTCMinutes();
  const nowMin = hh * 60 + mm;

  return slots.some(slot => {
    // expected format "HH:MM-HH:MM"  e.g. "10:00-11:30"
    const parts = slot.split("-");
    if (parts.length !== 2) return false;
    const [sh, sm] = parts[0].split(":").map(Number);
    const [eh, em] = parts[1].split(":").map(Number);
    return nowMin >= sh * 60 + sm && nowMin < eh * 60 + em;
  });
}

/**
 * Compute effective status:
 *   1. If manual override is active → use manualStatus
 *   2. Else if currently in a scheduled class → "In Class"
 *   3. Else → "Available"
 */
function effectiveStatus(teacher) {
  if (teacher.overrideActive && teacher.manualStatus) {
    return teacher.manualStatus;
  }
  if (isInClass(teacher.weeklySchedule)) return "In Class";
  return "Available";
}

/* ──────────────────────────────────────────────
   IN-MEMORY DATA STORE
   ────────────────────────────────────────────── */
let teachers = [
  /* ──────── PROFESSOR ──────── */
  {
    id: 1,
    name: "Dr. Prof. Ahmed Hossain",
    designation: "Professor",
    phone: "017xxxxxxxx",
    email: "ahmed.hossain@ugv.edu.bd",
    image: "https://i.pravatar.cc/150?img=10",
    role: "professor",
    manualStatus: null,
    overrideActive: false,
    weeklySchedule: {
      sunday:    ["09:00-10:30", "14:00-15:30"],
      monday:    ["11:00-12:30"],
      tuesday:   ["09:00-10:30"],
      wednesday: ["14:00-15:30"],
      thursday:  ["10:00-11:30"],
      friday:    [],
      saturday:  []
    }
  },

  /* ──────── HEAD ──────── */
  {
    id: 2,
    name: "Dr. Golam Saleh Ahmed Salem",
    designation: "Head of Department",
    phone: "01799947335",
    email: "gsa.salem@ugv.edu.bd",
    image: "https://randomuser.me/api/portraits/men/1.jpg",
    role: "head",
    manualStatus: null,
    overrideActive: false,
    weeklySchedule: {
      sunday:    ["10:00-11:30"],
      monday:    ["09:00-10:30", "13:00-14:30"],
      tuesday:   ["11:00-12:30"],
      wednesday: ["09:00-10:30"],
      thursday:  ["14:00-15:30"],
      friday:    [],
      saturday:  []
    }
  },

  /* ──────── CO-HEAD ──────── */
  {
    id: 3,
    name: "Noor Md. Shahriar",
    designation: "Deputy Head of Department",
    phone: "018xxxxxxxx",
    email: "noor.shahriar@ugv.edu.bd",
    image: "https://randomuser.me/api/portraits/men/3.jpg",
    role: "cohead",
    manualStatus: null,
    overrideActive: false,
    weeklySchedule: {
      sunday:    ["13:00-14:30"],
      monday:    ["10:00-11:30"],
      tuesday:   ["13:00-14:30"],
      wednesday: ["11:00-12:30"],
      thursday:  ["09:00-10:30"],
      friday:    [],
      saturday:  []
    }
  },

  /* ──────── LECTURERS ──────── */
  {
    id: 4,
    name: "Mr. Abdul Karim",
    designation: "Lecturer",
    phone: "01990525864",
    email: "a.karim@ugv.edu.bd",
    image: "https://randomuser.me/api/portraits/men/4.jpg",
    role: "lecturer",
    manualStatus: null,
    overrideActive: false,
    weeklySchedule: {
      sunday:    ["09:00-10:30"],
      monday:    ["13:00-14:30"],
      tuesday:   ["11:00-12:30"],
      wednesday: [],
      thursday:  ["09:00-10:30"],
      friday:    [],
      saturday:  []
    }
  },
  {
    id: 5,
    name: "Mr. Santosh Kumar",
    designation: "Lecturer",
    phone: "019xxxxxxxx",
    email: "santosh@ugv.edu.bd",
    image: "https://randomuser.me/api/portraits/men/5.jpg",
    role: "lecturer",
    manualStatus: "On Leave",
    overrideActive: true,
    weeklySchedule: {
      sunday:    ["11:00-12:30"],
      monday:    [],
      tuesday:   ["09:00-10:30"],
      wednesday: ["14:00-15:30"],
      thursday:  [],
      friday:    [],
      saturday:  []
    }
  },
  {
    id: 6,
    name: "Mr. Sourav Islam",
    designation: "Lecturer",
    phone: "019xxxxxxxx",
    email: "sourav@ugv.edu.bd",
    image: "https://randomuser.me/api/portraits/men/6.jpg",
    role: "lecturer",
    manualStatus: null,
    overrideActive: false,
    weeklySchedule: {
      sunday:    ["14:00-15:30"],
      monday:    ["09:00-10:30"],
      tuesday:   [],
      wednesday: ["11:00-12:30"],
      thursday:  ["13:00-14:30"],
      friday:    [],
      saturday:  []
    }
  },
  {
    id: 7,
    name: "Mr. Rahim Uddin",
    designation: "Lecturer",
    phone: "019xxxxxxxx",
    email: "rahim@ugv.edu.bd",
    image: "https://randomuser.me/api/portraits/men/7.jpg",
    role: "lecturer",
    manualStatus: null,
    overrideActive: false,
    weeklySchedule: {
      sunday:    [],
      monday:    ["11:00-12:30"],
      tuesday:   ["13:00-14:30"],
      wednesday: ["09:00-10:30"],
      thursday:  ["14:00-15:30"],
      friday:    [],
      saturday:  []
    }
  },
  {
    id: 8,
    name: "Mr. Sabbir Ahmed",
    designation: "Lecturer",
    phone: "019xxxxxxxx",
    email: "sabbir@ugv.edu.bd",
    image: "https://randomuser.me/api/portraits/men/8.jpg",
    role: "lecturer",
    manualStatus: null,
    overrideActive: false,
    weeklySchedule: {
      sunday:    ["10:00-11:30"],
      monday:    ["14:00-15:30"],
      tuesday:   [],
      wednesday: ["13:00-14:30"],
      thursday:  ["11:00-12:30"],
      friday:    [],
      saturday:  []
    }
  },
  {
    id: 9,
    name: "Mr. Fuad Hassan",
    designation: "Lecturer",
    phone: "019xxxxxxxx",
    email: "fuad@ugv.edu.bd",
    image: "https://randomuser.me/api/portraits/men/9.jpg",
    role: "lecturer",
    manualStatus: null,
    overrideActive: false,
    weeklySchedule: {
      sunday:    [],
      monday:    ["09:00-10:30"],
      tuesday:   ["14:00-15:30"],
      wednesday: [],
      thursday:  ["09:00-10:30"],
      friday:    [],
      saturday:  []
    }
  },

  /* ──────── LAB INSTRUCTORS ──────── */
  {
    id: 10,
    name: "Ms. Sumi Akter",
    designation: "Lab Instructor",
    phone: "01651648512",
    email: "sumi@ugv.edu.bd",
    image: "https://randomuser.me/api/portraits/women/1.jpg",
    role: "lab",
    manualStatus: null,
    overrideActive: false,
    weeklySchedule: {
      sunday:    ["09:00-12:00"],
      monday:    [],
      tuesday:   ["09:00-12:00"],
      wednesday: [],
      thursday:  ["09:00-12:00"],
      friday:    [],
      saturday:  []
    }
  },
  {
    id: 11,
    name: "Ms. Ataur Rahima",
    designation: "Lab Instructor",
    phone: "016xxxxxxxx",
    email: "ata@ugv.edu.bd",
    image: "https://randomuser.me/api/portraits/women/2.jpg",
    role: "lab",
    manualStatus: null,
    overrideActive: false,
    weeklySchedule: {
      sunday:    [],
      monday:    ["09:00-12:00"],
      tuesday:   [],
      wednesday: ["09:00-12:00"],
      thursday:  [],
      friday:    [],
      saturday:  []
    }
  },
  {
    id: 12,
    name: "Ms. Sojol Mim",
    designation: "Lab Instructor",
    phone: "016xxxxxxxx",
    email: "sojol@ugv.edu.bd",
    image: "https://randomuser.me/api/portraits/women/3.jpg",
    role: "lab",
    manualStatus: null,
    overrideActive: false,
    weeklySchedule: {
      sunday:    ["13:00-16:00"],
      monday:    [],
      tuesday:   ["13:00-16:00"],
      wednesday: [],
      thursday:  ["13:00-16:00"],
      friday:    [],
      saturday:  []
    }
  },
  {
    id: 13,
    name: "Ms. Salma Begum",
    designation: "Lab Instructor",
    phone: "016xxxxxxxx",
    email: "salma@ugv.edu.bd",
    image: "https://randomuser.me/api/portraits/women/4.jpg",
    role: "lab",
    manualStatus: null,
    overrideActive: false,
    weeklySchedule: {
      sunday:    [],
      monday:    ["13:00-16:00"],
      tuesday:   [],
      wednesday: ["13:00-16:00"],
      thursday:  [],
      friday:    [],
      saturday:  []
    }
  },
  {
    id: 14,
    name: "Mr. Sakib Hasan",
    designation: "Lab Instructor",
    phone: "016xxxxxxxx",
    email: "sakib@ugv.edu.bd",
    image: "https://randomuser.me/api/portraits/men/14.jpg",
    role: "lab",
    manualStatus: null,
    overrideActive: false,
    weeklySchedule: {
      sunday:    ["09:00-12:00"],
      monday:    [],
      tuesday:   [],
      wednesday: ["09:00-12:00"],
      thursday:  [],
      friday:    [],
      saturday:  []
    }
  },
  {
    id: 15,
    name: "Ms. Ajam Khatun",
    designation: "Lab Instructor",
    phone: "016xxxxxxxx",
    email: "ajam@ugv.edu.bd",
    image: "https://randomuser.me/api/portraits/women/6.jpg",
    role: "lab",
    manualStatus: null,
    overrideActive: false,
    weeklySchedule: {
      sunday:    [],
      monday:    [],
      tuesday:   ["13:00-16:00"],
      wednesday: [],
      thursday:  ["13:00-16:00"],
      friday:    [],
      saturday:  []
    }
  }
];

let nextId = teachers.length + 1;

/* ──────────────────────────────────────────────
   PUBLIC API
   ────────────────────────────────────────────── */

/**
 * GET /data
 * Returns all teachers with computed effective status.
 * Sensitive fields (manualStatus, overrideActive) are stripped for public view.
 */
app.get("/data", (req, res) => {
  const payload = teachers.map(t => ({
    id:              t.id,
    name:            t.name,
    designation:     t.designation,
    phone:           t.phone,
    email:           t.email,
    image:           t.image,
    role:            t.role,
    status:          effectiveStatus(t),
    weeklySchedule:  t.weeklySchedule
  }));
  res.json(payload);
});

/* ──────────────────────────────────────────────
   ADMIN API  (no auth — add JWT/session in prod)
   ────────────────────────────────────────────── */

/** GET /admin/teachers — full teacher list including admin fields */
app.get("/admin/teachers", (req, res) => {
  res.json(teachers);
});

/** POST /admin/add — add a new teacher */
app.post("/admin/add", (req, res) => {
  const { name, designation, phone, email, image, role, weeklySchedule } = req.body;
  if (!name || !role) {
    return res.status(400).json({ error: "name and role are required" });
  }
  const teacher = {
    id: nextId++,
    name,
    designation: designation || "",
    phone: phone || "",
    email: email || "",
    image: image || "https://i.pravatar.cc/150?img=" + Math.floor(Math.random() * 70),
    role,
    manualStatus: null,
    overrideActive: false,
    weeklySchedule: weeklySchedule || {
      sunday:[], monday:[], tuesday:[], wednesday:[], thursday:[], friday:[], saturday:[]
    }
  };
  teachers.push(teacher);
  res.json({ success: true, teacher });
});

/** PUT /admin/update/:id — update teacher details */
app.put("/admin/update/:id", (req, res) => {
  const id = parseInt(req.params.id);
  const idx = teachers.findIndex(t => t.id === id);
  if (idx === -1) return res.status(404).json({ error: "Teacher not found" });

  const allowed = ["name","designation","phone","email","image","role","weeklySchedule","manualStatus","overrideActive"];
  allowed.forEach(field => {
    if (req.body[field] !== undefined) {
      teachers[idx][field] = req.body[field];
    }
  });

  res.json({ success: true, teacher: teachers[idx] });
});

/** DELETE /admin/delete/:id — remove a teacher */
app.delete("/admin/delete/:id", (req, res) => {
  const id = parseInt(req.params.id);
  const idx = teachers.findIndex(t => t.id === id);
  if (idx === -1) return res.status(404).json({ error: "Teacher not found" });
  teachers.splice(idx, 1);
  res.json({ success: true });
});

/** PUT /admin/override/:id — set manual status override */
app.put("/admin/override/:id", (req, res) => {
  const id = parseInt(req.params.id);
  const idx = teachers.findIndex(t => t.id === id);
  if (idx === -1) return res.status(404).json({ error: "Teacher not found" });

  const { manualStatus, overrideActive } = req.body;
  if (manualStatus  !== undefined) teachers[idx].manualStatus  = manualStatus;
  if (overrideActive !== undefined) teachers[idx].overrideActive = overrideActive;

  res.json({
    success: true,
    effectiveStatus: effectiveStatus(teachers[idx]),
    teacher: teachers[idx]
  });
});

/* ──────────────────────────────────────────────
   SERVE PAGES
   ────────────────────────────────────────────── */
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});
app.get("/admin", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "admin.html"));
});

/* ──────────────────────────────────────────────
   START
   ────────────────────────────────────────────── */
const PORT = process.env.PORT || 3000;
app.listen(PORT, "0.0.0.0", () => {
  console.log(`✅  Faculty Status Board running → http://localhost:${PORT}`);
  console.log(`🛠   Admin Panel               → http://localhost:${PORT}/admin`);
});
