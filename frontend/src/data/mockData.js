import {
  Activity,
  BarChart3,
  ClipboardList,
  Gauge,
  Home,
  Settings,
  UploadCloud,
  UsersRound,
} from 'lucide-react'

export const pageTransition = {
  initial: { opacity: 0, y: 12 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.28, ease: 'easeOut' },
}

export const navItems = [
  { key: 'dashboard', label: 'Dashboard', icon: Home },
  { key: 'upload', label: 'Upload & Analyze', icon: UploadCloud },
  { key: 'records', label: 'Patient Records', icon: ClipboardList },
  { key: 'analytics', label: 'Analytics', icon: BarChart3 },
  { key: 'settings', label: 'Settings', icon: Settings },
]

export const gradeLabels = {
  0: 'No diabetic retinopathy',
  1: 'Mild non-proliferative DR',
  2: 'Moderate non-proliferative DR',
  3: 'Severe non-proliferative DR',
  4: 'Proliferative diabetic retinopathy',
}

export const records = [
  {
    id: 'DR-1048',
    name: 'Meera Sharma',
    age: 58,
    lastScan: '2026-04-26',
    grade: 2,
    risk: 'Medium',
    status: 'Pending',
    timeline: ['2026-04-26: Grade 2 detected', '2026-01-18: Grade 1 follow-up', '2025-09-02: Baseline scan'],
  },
  {
    id: 'DR-1049',
    name: 'Kabir Singh',
    age: 64,
    lastScan: '2026-04-26',
    grade: 4,
    risk: 'Critical',
    status: 'Urgent',
    timeline: ['2026-04-26: Grade 4 detected', '2026-02-09: Grade 3 detected', '2025-10-14: Referral requested'],
  },
  {
    id: 'DR-1050',
    name: 'Ananya Rao',
    age: 47,
    lastScan: '2026-04-25',
    grade: 0,
    risk: 'Low',
    status: 'Reviewed',
    timeline: ['2026-04-25: No DR detected', '2025-12-20: Routine screening', '2025-06-11: Baseline scan'],
  },
  {
    id: 'DR-1051',
    name: 'Rohan Patel',
    age: 53,
    lastScan: '2026-04-24',
    grade: 3,
    risk: 'High',
    status: 'Urgent',
    timeline: ['2026-04-24: Grade 3 detected', '2026-03-08: Macular edema review', '2025-11-19: Grade 2 detected'],
  },
  {
    id: 'DR-1052',
    name: 'Nisha Verma',
    age: 61,
    lastScan: '2026-04-23',
    grade: 1,
    risk: 'Low',
    status: 'Reviewed',
    timeline: ['2026-04-23: Grade 1 detected', '2026-01-05: Routine follow-up', '2025-08-28: No DR detected'],
  },
  {
    id: 'DR-1053',
    name: 'Arjun Nair',
    age: 69,
    lastScan: '2026-04-22',
    grade: 2,
    risk: 'Medium',
    status: 'Pending',
    timeline: ['2026-04-22: Grade 2 detected', '2026-02-12: Treatment response scan', '2025-12-01: Grade 2 detected'],
  },
]

export const summaryCards = [
  { title: 'Scans Today', value: '48', tone: 'blue', icon: Activity },
  { title: 'Urgent Cases', value: '7', tone: 'red', icon: Gauge },
  { title: 'Pending Review', value: '16', tone: 'amber', icon: ClipboardList },
  { title: 'Active Patients', value: '1,284', tone: 'green', icon: UsersRound },
]

export const weeklyScanData = [
  { day: 'Mon', scans: 36 },
  { day: 'Tue', scans: 44 },
  { day: 'Wed', scans: 39 },
  { day: 'Thu', scans: 52 },
  { day: 'Fri', scans: 48 },
  { day: 'Sat', scans: 31 },
  { day: 'Sun', scans: 27 },
]

export const severityDistribution = [
  { name: 'Grade 0', value: 38, color: '#22C55E' },
  { name: 'Grade 1', value: 24, color: '#60A5FA' },
  { name: 'Grade 2', value: 20, color: '#FACC15' },
  { name: 'Grade 3', value: 11, color: '#F97316' },
  { name: 'Grade 4', value: 7, color: '#EF4444' },
]

export const monthlyGradeData = [
  { month: 'Nov', grade0: 42, grade1: 24, grade2: 16, grade3: 9, grade4: 5 },
  { month: 'Dec', grade0: 39, grade1: 28, grade2: 18, grade3: 10, grade4: 6 },
  { month: 'Jan', grade0: 45, grade1: 25, grade2: 21, grade3: 11, grade4: 8 },
  { month: 'Feb', grade0: 48, grade1: 29, grade2: 23, grade3: 12, grade4: 7 },
  { month: 'Mar', grade0: 51, grade1: 31, grade2: 22, grade3: 14, grade4: 9 },
  { month: 'Apr', grade0: 55, grade1: 30, grade2: 26, grade3: 15, grade4: 10 },
]

export const modelAccuracyData = [
  { month: 'Nov', accuracy: 88.6 },
  { month: 'Dec', accuracy: 89.4 },
  { month: 'Jan', accuracy: 90.1 },
  { month: 'Feb', accuracy: 91.2 },
  { month: 'Mar', accuracy: 92.4 },
  { month: 'Apr', accuracy: 93.1 },
]
