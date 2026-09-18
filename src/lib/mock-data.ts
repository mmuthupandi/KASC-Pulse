export type Role = "student" | "faculty" | "admin" | "hod" | "parent";

export const currentUser = {
  name: "Rahul Sharma",
  rollNo: "22BCA101",
  email: "rahul.sharma@kongunaducollege.ac.in",
  phone: "+91 98765 43210",
  department: "Computer Applications (BCA)",
  stream: "Un-Aided",
  semester: "5th Semester",
  section: "A",
  avatar: "https://i.pravatar.cc/128?img=12",
};

export const facultyUser = {
  name: "Prof. Anjali Verma",
  email: "anjali.verma@kongunaducollege.ac.in",
  department: "Computer Applications",
  stream: "Aided",
  avatar: "https://i.pravatar.cc/128?img=47",
};

export const adminUser = {
  name: "Dr. Ramesh Iyer",
  email: "admin@kongunaducollege.ac.in",
  avatar: "https://i.pravatar.cc/128?img=15",
};

export const hodUser = {
  name: "Dr. K. Senthilkumar",
  email: "senthilkumar.k@kongunaducollege.ac.in",
  department: "Computer Science",
  stream: "Un-Aided",
  avatar: "https://i.pravatar.cc/128?img=60",
};

export const todayTimetable = [
  { time: "10:00 AM", subject: "Operating Systems",             room: "Class Room", faculty: "Dr. M. Jagadheeswari",  status: "present" as const },
  { time: "11:00 AM", subject: "Software Engineering & Testing", room: "Class Room", faculty: "Dr. Nithya A",         status: "upcoming" as const },
  { time: "12:00 PM", subject: "EDC",                            room: "Class Room", faculty: "—",                    status: "upcoming" as const },
  { time: "02:00 PM", subject: "DBMS Lab",                       room: "Lab",        faculty: "Dr. Saravana Moorthy R", status: "upcoming" as const },
  { time: "03:00 PM", subject: "Database Management System",     room: "Class Room", faculty: "Mrs. Vanjimalar S",    status: "upcoming" as const },
];

export const subjectAttendance = [
  { subject: "Operating Systems", percentage: 92 },
  { subject: "Software Engineering & Testing", percentage: 85 },
  { subject: "Cloud Computing", percentage: 88 },
  { subject: "Database Management System", percentage: 90 },
  { subject: "DBMS Lab", percentage: 80 },
  { subject: "EDC", percentage: 87 },
];

export const notifications = [
  { title: "Internal Exam Schedule Published (Even Semester)", date: "20 May 2024" },
  { title: "DBT Star College Guest Lecture - BioTech", date: "18 May 2024" },
  { title: "Fees Payment Deadline for Un-Aided Stream", date: "17 May 2024" },
];

export type HeatCell = { date: string; status: "present" | "absent" | "leave" | "none" };

export function makeHeatmap(): HeatCell[][] {
  const weeks = 26;
  const rows = 7;
  const grid: HeatCell[][] = [];
  const start = new Date();
  start.setDate(start.getDate() - weeks * 7);
  for (let r = 0; r < rows; r++) {
    const row: HeatCell[] = [];
    for (let w = 0; w < weeks; w++) {
      const d = new Date(start);
      d.setDate(start.getDate() + w * 7 + r);
      const day = d.getDay();
      const rand = Math.random();
      let status: HeatCell["status"] = "present";
      if (day === 0 || day === 6) status = "none";
      else if (rand > 0.92) status = "absent";
      else if (rand > 0.85) status = "leave";
      row.push({ date: d.toISOString().slice(0, 10), status });
    }
    grid.push(row);
  }
  return grid;
}

const rawStudents = [
  { rollNo: "241SC001", name: "ANGEL JASMINE R" },
  { rollNo: "241SC002", name: "TEJASWINI M A" },
  { rollNo: "241SC003", name: "SATHISHKUMAR.S" },
  { rollNo: "241SC004", name: "SENTHILKUMAR.G" },
  { rollNo: "241SC005", name: "HARINI C" },
  { rollNo: "241SC006", name: "SATHYA M" },
  { rollNo: "241SC007", name: "VINEESHA M" },
  { rollNo: "241SC008", name: "GOMATHI S" },
  { rollNo: "241SC009", name: "VINODH.S" },
  { rollNo: "241SC010", name: "ISACC.G" },
  { rollNo: "241SC011", name: "MEGALA G" },
  { rollNo: "241SC012", name: "PRAVEEN.M" },
  { rollNo: "241SC013", name: "PRASANNA.M" },
  { rollNo: "241SC014", name: "MADHUPRIYA V" },
  { rollNo: "241SC015", name: "MALARVIZHI R" },
  { rollNo: "241SC016", name: "MUTHUPANDI.M" },
  { rollNo: "241SC017", name: "THARUN KUMAR.M" },
  { rollNo: "241SC018", name: "LOKESH.N" },
  { rollNo: "241SC019", name: "AJAY.VU" },
  { rollNo: "241SC020", name: "DHARANI M" },
  { rollNo: "241SC021", name: "AJAY.C" },
  { rollNo: "241SC022", name: "SURESH KUMAR.L" },
  { rollNo: "241SC023", name: "RITHIKA S" },
  { rollNo: "241SC024", name: "DHARANEESH.M" },
  { rollNo: "241SC026", name: "ANEESHA S" },
  { rollNo: "241SC027", name: "KISHOR.M" },
  { rollNo: "241SC028", name: "KARTHICK.P" },
  { rollNo: "241SC029", name: "ABARNA S" },
  { rollNo: "241SC030", name: "SAILA K" },
  { rollNo: "241SC031", name: "MUTHU LAKSHMI S" },
  { rollNo: "241SC033", name: "AKSHAYA S" },
  { rollNo: "241SC034", name: "DARWIN.E" },
  { rollNo: "241SC035", name: "VIGNESH.R" },
  { rollNo: "241SC036", name: "RAM PRASANTH.S" },
  { rollNo: "241SC037", name: "ABINAYA K" },
  { rollNo: "241SC039", name: "GOKUL.K" },
  { rollNo: "241SC040", name: "SWATHIKA M" },
  { rollNo: "241SC041", name: "DHUVARAKA D" },
  { rollNo: "241SC042", name: "KARTHIKEYAN.V" },
  { rollNo: "241SC043", name: "SADHURTHIYA A" },
  { rollNo: "241SC044", name: "PRANEETH.V" },
  { rollNo: "241SC045", name: "VIGNESH.S" },
  { rollNo: "241SC046", name: "SRIRAM.PK" },
  { rollNo: "241SC047", name: "SRIDHARAN.K" },
  { rollNo: "241SC049", name: "RAM PRAKASH.P" },
  { rollNo: "241SC050", name: "THANUJA S K" },
  { rollNo: "241SC051", name: "RISHI KUMAR.S" },
  { rollNo: "241SC052", name: "KIRTHIKA S" },
  { rollNo: "241SC053", name: "ALBERT SANTHOSH.S" },
  { rollNo: "241SC054", name: "MOHANA PRIYAN.A" },
  { rollNo: "241SC055", name: "OM PRAKASH.S" },
  { rollNo: "241SC056", name: "JAI HARISH.S" },
  { rollNo: "241SC057", name: "VIKRAM VAISHNAV.M" },
  { rollNo: "241SC059", name: "HARIHARAN.M" },
  { rollNo: "241SC060", name: "SAKTHIVEL.S" },
  { rollNo: "241SC062", name: "VIGNESHWARAN S" },
  { rollNo: "241SC063", name: "HARIPRASATH G" },
  { rollNo: "241SC064", name: "ILAIYARASU D" },
  { rollNo: "241SC065", name: "SHAHIRA NAZEEM S" },
  { rollNo: "241SC066", name: "DHANUSH" },
];

export const students = rawStudents.map((s, i) => ({
  id: i + 1,
  rollNo: s.rollNo,
  name: s.name,
  department: "B.Sc. Computer Science",
  stream: "Un-Aided",
  semester: "3rd",
  section: "A",
  attendance: 70 + Math.floor(Math.random() * 30),
  avatar: "",
  status: ["present", "present", "present", "absent", "late"][i % 5] as "present" | "absent" | "late",
}));

// ─── Subject & Staff definitions ─────────────────────────────────────────────

const SUBJECTS = {
  OS:       { name: "Operating Systems",                     code: "24USC506", staff: "Dr. M. Jagadheeswari" },
  SE:       { name: "Software Engineering & Testing",        code: "24USC505", staff: "Dr. Nithya A" },
  SE_add:   { name: "Software Engineering & Testing",        code: "24USC505", staff: "Mrs. Sumitha Pandit Shanmugaraja S" },
  CC:       { name: "Cloud Computing (Major Elective)",      code: "24USC5E1", staff: "Dr. Saravana Moorthy R" },
  CC_add:   { name: "Cloud Computing (Major Elective)",      code: "24USC5E1", staff: "Mrs. Juliet Monolisa Esther M" },
  DBMS:     { name: "Database Management System",            code: "24USC507", staff: "Mrs. Vanjimalar S" },
  DBMS_lab: { name: "DBMS Lab",                              code: "24USC5CP", staff: "Mrs. Vanjimalar S" },
  DBMS_lab_add1: { name: "DBMS Lab",                        code: "24USC5CP", staff: "Dr. Saravana Moorthy R" },
  DBMS_lab_add2: { name: "DBMS Lab",                        code: "24USC5CP", staff: "Dr. M. Jagadheeswari" },
  DBMS_lab_add3: { name: "DBMS Lab",                        code: "24USC5CP", staff: "Dr. Nithya A" },
  EDC:      { name: "Extra Departmental Course (EDC)",       code: "",         staff: "—" },
};

const TIMES = [
  "10:00 - 11:00",
  "11:00 - 12:00",
  "12:00 - 01:00",
  "02:00 - 03:00",
  "03:00 - 04:00",
];

function slot(period: number, key: keyof typeof SUBJECTS) {
  const s = SUBJECTS[key];
  return { time: TIMES[period - 1], subject: s.name, code: s.code, faculty: s.staff };
}

export const weeklyTimetable = [
  {
    day: "Day 1 (Mon)",
    slots: [
      slot(1, "OS"),
      slot(2, "SE"),
      slot(3, "EDC"),
      slot(4, "DBMS_lab_add1"),
      slot(5, "DBMS"),
    ],
  },
  {
    day: "Day 2 (Tue)",
    slots: [
      slot(1, "CC_add"),
      slot(2, "CC"),
      slot(3, "EDC"),
      slot(4, "OS"),
      slot(5, "DBMS_lab_add3"),
    ],
  },
  {
    day: "Day 3 (Wed)",
    slots: [
      slot(1, "OS"),
      slot(2, "CC"),
      slot(3, "DBMS"),
      slot(4, "SE_add"),
      slot(5, "DBMS_lab_add1"),
    ],
  },
  {
    day: "Day 4 (Thu)",
    slots: [
      slot(1, "CC_add"),
      slot(2, "DBMS"),
      slot(3, "OS"),
      slot(4, "DBMS_lab_add3"),
      slot(5, "SE_add"),
    ],
  },
  {
    day: "Day 5 (Fri)",
    slots: [
      slot(1, "OS"),
      slot(2, "SE"),
      slot(3, "DBMS_lab_add2"),
      slot(4, "DBMS"),
      slot(5, "SE"),
    ],
  },
  {
    day: "Day 6 (Sat)",
    slots: [
      slot(1, "SE"),
      slot(2, "CC"),
      slot(3, "OS"),
      slot(4, "DBMS"),
      slot(5, "DBMS_lab_add2"),
    ],
  },
];

export const leaveHistory = [
  { id: 1, reason: "Medical", from: "10 May 2024", to: "12 May 2024", status: "approved" },
  { id: 2, reason: "NSS Camp", from: "22 Apr 2024", to: "23 Apr 2024", status: "approved" },
  { id: 3, reason: "Personal", from: "05 Apr 2024", to: "05 Apr 2024", status: "pending" },
];

export const departmentAttendance = [
  { name: "B.Sc. BioTech", value: 89 },
  { name: "B.Sc. CS", value: 85 },
  { name: "B.Com", value: 82 },
  { name: "BCA", value: 78 },
  { name: "B.A. English", value: 80 },
];

export const attendanceTrend = Array.from({ length: 12 }).map((_, i) => ({
  day: `${i * 2 + 1} May`,
  value: 70 + Math.round(Math.sin(i / 2) * 10 + Math.random() * 8),
}));

export const departmentClasses = [
  { id: "class-1", name: "I B.Sc. Computer Science - A", stream: "Aided", strength: 52, avgAttendance: 88.5 },
  { id: "class-2", name: "II B.Sc. Computer Science - A", stream: "Aided", strength: 50, avgAttendance: 83.1 },
  { id: "class-3", name: "III B.Sc. Computer Science - A", stream: "Aided", strength: 48, avgAttendance: 85.9 },
  { id: "class-4", name: "I B.Sc. Computer Science - B", stream: "Un-Aided", strength: 55, avgAttendance: 81.2 },
  { id: "class-5", name: "II B.Sc. Computer Science - B", stream: "Un-Aided", strength: 53, avgAttendance: 79.8 },
  { id: "class-6", name: "III B.Sc. Computer Science - B", stream: "Un-Aided", strength: 50, avgAttendance: 74.5 },
];

export const hodPendingApprovals = [
  {
    id: "req-1",
    studentName: "MUTHUPANDI.M",
    rollNo: "241SC016",
    class: "III B.Sc. CS - B",
    type: "OD" as const,
    reason: "Inter-Collegiate Sports Meet (Athletics)",
    duration: "05 Aug 2026 - 06 Aug 2026 (2 Days)",
    status: "pending" as const,
    attachment: "sports_certificate_2026.pdf",
  },
  {
    id: "req-2",
    studentName: "ANGEL JASMINE R",
    rollNo: "241SC001",
    class: "III B.Sc. CS - B",
    type: "Leave" as const,
    reason: "Severe Typhoid Fever (Medical treatment)",
    duration: "01 Aug 2026 - 04 Aug 2026 (4 Days)",
    status: "pending" as const,
    attachment: "medical_certificate.pdf",
  },
  {
    id: "req-3",
    studentName: "SATHISHKUMAR.S",
    rollNo: "241SC003",
    class: "III B.Sc. CS - B",
    type: "OD" as const,
    reason: "National Level Hackathon, CIT Coimbatore",
    duration: "07 Aug 2026 (1 Day)",
    status: "pending" as const,
    attachment: "hackathon_id_card.pdf",
  },
  {
    id: "req-4",
    studentName: "SENTHILKUMAR.G",
    rollNo: "241SC004",
    class: "III B.Sc. CS - B",
    type: "Leave" as const,
    reason: "Family functions / Marriage attendance",
    duration: "10 Aug 2026 (1 Day)",
    status: "pending" as const,
    attachment: null,
  },
];

export const condonationCandidates = [
  { id: "cand-1", name: "VINEESHA M", rollNo: "241SC007", attendance: 72.4, hoursAttended: 246, hoursConducted: 340, recommended: false },
  { id: "cand-2", name: "ISACC.G", rollNo: "241SC010", attendance: 68.9, hoursAttended: 234, hoursConducted: 340, recommended: false },
  { id: "cand-3", name: "PRASANNA.M", rollNo: "241SC013", attendance: 70.1, hoursAttended: 238, hoursConducted: 340, recommended: false },
  { id: "cand-4", name: "LOKESH.N", rollNo: "241SC018", attendance: 74.2, hoursAttended: 252, hoursConducted: 340, recommended: true },
  { id: "cand-5", name: "DARWIN.E", rollNo: "241SC034", attendance: 67.5, hoursAttended: 229, hoursConducted: 340, recommended: false },
  { id: "cand-6", name: "SRIRAM.PK", rollNo: "241SC046", attendance: 71.8, hoursAttended: 244, hoursConducted: 340, recommended: false },
];