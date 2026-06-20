import {
  BarChart3,
  BookOpen,
  CheckCircle2,
  ClipboardList,
  FileDown,
  FolderOpen,
  GraduationCap,
  Shield,
  Upload,
  Users
} from "lucide-react";

export type Student = {
  id: string;
  name: string;
  register_number: string;
  email: string;
  year?: string;
  section?: string;
  is_active: boolean;
};

export const fallbackStudents: Student[] = [
  { id: "1", name: "Aravind Kumar", register_number: "CSE22001", email: "aravind@demo.edu", year: "3", section: "A", is_active: true },
  { id: "2", name: "Meera Nair", register_number: "ECE22014", email: "meera@demo.edu", year: "3", section: "B", is_active: true },
  { id: "3", name: "Vikram S", register_number: "IT21042", email: "vikram@demo.edu", year: "4", section: "A", is_active: false }
];

export const adminNav = [
  { label: "Dashboard",  href: "/dashboard",  icon: BarChart3 },
  { label: "Students",   href: "/students",   icon: GraduationCap },
  { label: "Groups",     href: "/groups",     icon: Users },
  { label: "Questions",  href: "/questions",  icon: BookOpen },
  { label: "Practice",   href: "/practice",   icon: FolderOpen },
  { label: "Import",     href: "/import",     icon: Upload },
  { label: "Assessments", href: "/assessments", icon: ClipboardList },
  { label: "Results",    href: "/results",    icon: CheckCircle2 },
  { label: "Analytics",  href: "/analytics",  icon: BarChart3 },
  { label: "Admins",     href: "/admins",     icon: Shield },
  { label: "Reports",    href: "/reports",    icon: FileDown },
];
