import {
  Activity,
  Home,
  UploadCloud,
  ClipboardList,
} from 'lucide-react'

export const pageTransition = {
  initial: { opacity: 0, y: 12 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.28, ease: 'easeOut' },
}

export const navItems = [
  { key: 'home', label: 'Home', icon: Home },
  { key: 'dashboard', label: 'Dashboard', icon: Activity },
  { key: 'upload', label: 'Upload & Analyze', icon: UploadCloud },
  { key: 'records', label: 'Diagnostic Vault', icon: ClipboardList },
]

export const gradeLabels = {
  0: 'No diabetic retinopathy',
  1: 'Mild non-proliferative DR',
  2: 'Moderate non-proliferative DR',
  3: 'Severe non-proliferative DR',
  4: 'Proliferative diabetic retinopathy',
}
