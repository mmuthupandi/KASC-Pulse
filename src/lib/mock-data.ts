export type Role = "student" | "faculty" | "admin";

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

export const todayTimetable = [
  { time: "09:30 AM", subject: "Java Programming", room: "Lab-4", faculty: "Prof. Verma", status: "present" as const },
  { time: "10:30 AM", subject: "Software Engineering", room: "A-102", faculty: "Prof. Rao", status: "upcoming" as const },
  { time: "11:30 AM", subject: "Web Technologies", room: "A-103", faculty: "Prof. Nair", status: "upcoming" as const },
  { time: "01:15 PM", subject: "Computer Networks", room: "A-104", faculty: "Prof. Khan", status: "upcoming" as const },
];

export const subjectAttendance = [
  { subject: "Java Programming", percentage: 92 },
  { subject: "Software Engineering", percentage: 85 },
  { subject: "Web Technologies", percentage: 88 },
  { subject: "Computer Networks", percentage: 90 },
  { subject: "Operating Systems", percentage: 80 },
  { subject: "Multimedia Systems", percentage: 87 },
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

export const weeklyTimetable = [
  { day: "Monday", slots: [
    { time: "09:30 - 10:30", subject: "Java Programming", faculty: "Prof. Verma", room: "Lab-4" },
    { time: "10:30 - 11:30", subject: "Software Engineering", faculty: "Prof. Rao", room: "A-102" },
    { time: "11:45 - 12:45", subject: "Web Technologies", faculty: "Prof. Nair", room: "A-103" },
  ]},
  { day: "Tuesday", slots: [
    { time: "09:30 - 10:30", subject: "Computer Networks", faculty: "Prof. Khan", room: "A-104" },
    { time: "10:30 - 11:30", subject: "Multimedia Systems", faculty: "Prof. Iyer", room: "Lab-2" },
  ]},
  { day: "Wednesday", slots: [
    { time: "09:30 - 10:30", subject: "Operating Systems", faculty: "Prof. Bose", room: "A-201" },
    { time: "10:30 - 11:30", subject: "Java Lab", faculty: "Prof. Verma", room: "Lab-4" },
  ]},
  { day: "Thursday", slots: [
    { time: "09:30 - 10:30", subject: "Software Engineering", faculty: "Prof. Rao", room: "A-102" },
    { time: "11:45 - 12:45", subject: "Web Technologies", faculty: "Prof. Nair", room: "A-103" },
  ]},
  { day: "Friday", slots: [
    { time: "09:30 - 10:30", subject: "Multimedia Systems", faculty: "Prof. Iyer", room: "Lab-2" },
    { time: "01:15 - 02:15", subject: "Computer Networks", faculty: "Prof. Khan", room: "A-104" },
  ]},
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