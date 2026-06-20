export type ApiUser = {
  id: string;
  name: string;
  email: string;
  type: string;
  role?: string;
  permissions?: string[];
};

export type AuthSession = {
  access_token: string;
  refresh_token: string;
  expires_in: number;
  user: ApiUser;
};

export type Student = {
  id: string;
  name: string;
  register_number: string;
  email: string;
  year?: string;
  section?: string;
  is_active: boolean;
};

export type Group = {
  id: string;
  name: string;
  description?: string;
  type?: string;
  member_count?: number;
};

export type Question = {
  id: string;
  type: string;
  topic?: string;
  difficulty?: string;
  marks?: number;
  mcq?: { body: string; options: string[]; correct_index?: number };
  programming?: {
    title: string;
    description: string;
    sample_input?: string;
    sample_output?: string;
    test_cases?: Array<{
      input: string;
      expected_output: string;
      is_hidden: boolean;
      weight: number;
      ord: number;
    }>;
  };
};

export type Assessment = {
  id: string;
  title: string;
  type: string;
  status: string;
  duration_minutes?: number;
  total_marks?: number;
  passing_marks?: number;
  negative_marking?: boolean;
  negative_marks?: number;
  shuffle_questions?: boolean;
  coding_scoring_mode?: string;
};

export type DashboardStats = {
  students: number;
  groups: number;
  assessments: number;
  questions: number;
};

export type BulkImportResult = {
  created: number;
  failed: number;
  errors?: string[];
};

export type ListMeta = {
  page?: number;
  page_size?: number;
  total?: number;
  total_pages?: number;
};

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080/api/v1";

type ApiPayload<T> = { data: T; meta?: ListMeta; error?: { message: string } };

export async function apiFetch<T>(path: string, token?: string, init?: RequestInit): Promise<T> {
  const headers = new Headers(init?.headers);
  if (!(init?.body instanceof FormData)) {
    headers.set("Content-Type", headers.get("Content-Type") || "application/json");
  }
  if (token) headers.set("Authorization", `Bearer ${token}`);

  const res = await fetch(`${API_BASE}${path}`, { ...init, headers });
  const payload = (await res.json().catch(() => ({}))) as ApiPayload<T>;
  if (!res.ok) {
    throw new Error(payload?.error?.message || "Request failed");
  }
  return payload.data as T;
}

export async function apiFetchWithMeta<T>(path: string, token?: string, init?: RequestInit): Promise<{ data: T; meta?: ListMeta }> {
  const headers = new Headers(init?.headers);
  if (!(init?.body instanceof FormData)) {
    headers.set("Content-Type", headers.get("Content-Type") || "application/json");
  }
  if (token) headers.set("Authorization", `Bearer ${token}`);

  const res = await fetch(`${API_BASE}${path}`, { ...init, headers });
  const payload = (await res.json().catch(() => ({}))) as ApiPayload<T>;
  if (!res.ok) {
    throw new Error(payload?.error?.message || "Request failed");
  }
  return { data: payload.data as T, meta: payload.meta };
}

export async function adminLogin(email: string, password: string) {
  return apiFetch<AuthSession>("/auth/admin/login", undefined, {
    method: "POST",
    body: JSON.stringify({ email, password })
  });
}

export async function listStudents(token: string, search?: string) {
  const query = search ? `?search=${encodeURIComponent(search)}` : "";
  return apiFetchWithMeta<Student[]>(`/students${query}`, token);
}

export async function createStudent(token: string, body: Record<string, string>) {
  return apiFetch<Student>("/students", token, {
    method: "POST",
    body: JSON.stringify(body)
  });
}

export async function bulkImportStudents(token: string, file: File) {
  const form = new FormData();
  form.append("file", file);
  return apiFetch<BulkImportResult>("/students/bulk-import", token, {
    method: "POST",
    body: form
  });
}

export async function downloadImportTemplate(token: string) {
  const res = await fetch(`${API_BASE}/students/import-template`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  if (!res.ok) throw new Error("Could not download template");
  return res.blob();
}

export async function listGroups(token: string) {
  return apiFetch<Group[]>("/groups", token);
}

export async function createGroup(token: string, body: { name: string; description?: string; type?: string }) {
  return apiFetch<Group>("/groups", token, {
    method: "POST",
    body: JSON.stringify(body)
  });
}

export async function listGroupMembers(token: string, groupId: string) {
  return apiFetch<Student[]>(`/groups/${groupId}/members`, token);
}

export async function addGroupMembers(token: string, groupId: string, studentIds: string[]) {
  return apiFetch<{ added: number }>(`/groups/${groupId}/members`, token, {
    method: "POST",
    body: JSON.stringify({ student_ids: studentIds })
  });
}

export async function removeGroupMember(token: string, groupId: string, studentId: string) {
  return apiFetch<void>(`/groups/${groupId}/members/${studentId}`, token, { method: "DELETE" });
}

export async function listQuestions(token: string) {
  return apiFetch<Question[]>("/questions", token);
}

export async function createMCQQuestion(token: string, body: Record<string, unknown>) {
  return apiFetch<Question>("/questions/mcq", token, {
    method: "POST",
    body: JSON.stringify(body)
  });
}

export async function createProgrammingQuestion(token: string, body: Record<string, unknown>) {
  return apiFetch<Question>("/questions/programming", token, {
    method: "POST",
    body: JSON.stringify(body)
  });
}

export async function listAssessments(token: string) {
  return apiFetch<Assessment[]>("/assessments", token);
}

export async function createAssessment(token: string, body: Record<string, unknown>) {
  return apiFetch<Assessment>("/assessments", token, {
    method: "POST",
    body: JSON.stringify(body)
  });
}

export async function getDashboardStats(token: string) {
  return apiFetch<DashboardStats>("/dashboard/stats", token);
}

export type AdminUser = {
  id: string;
  name: string;
  email: string;
  phone?: string;
  is_active: boolean;
  role?: { id: string; name: string; slug: string };
};

export type Role = { id: string; name: string; slug: string };

export type ResultRow = {
  id: string;
  assessment_id: string;
  marks_scored: number;
  total_marks: number;
  percentage: number;
  rank: number;
  student?: { name: string; register_number?: string };
};

export async function listAdmins(token: string) {
  return apiFetch<AdminUser[]>("/admins", token);
}

export async function createAdmin(token: string, body: Record<string, string>) {
  return apiFetch<AdminUser>("/admins", token, { method: "POST", body: JSON.stringify(body) });
}

export async function listRoles(token: string) {
  return apiFetch<Role[]>("/roles", token);
}

export async function publishAssessment(token: string, id: string) {
  return apiFetch<Assessment>(`/assessments/${id}/publish`, token, { method: "POST", body: "{}" });
}

export async function assignAssessment(token: string, id: string, targetType: string, targetId?: string) {
  return apiFetch<{ assigned: boolean }>(`/assessments/${id}/assign`, token, {
    method: "POST",
    body: JSON.stringify({ target_type: targetType, target_id: targetId })
  });
}

export async function updateAssessmentQuestion(token: string, assessmentId: string, questionId: string, body: {
  coding_time_limit_minutes?: number; marks?: number; ord?: number;
}) {
  return apiFetch<{ updated: boolean }>(`/assessments/${assessmentId}/questions/${questionId}`, token, {
    method: "PATCH",
    body: JSON.stringify(body)
  });
}

export async function attachAssessmentQuestions(token: string, id: string, questionIds: string[]) {
  return apiFetch<{ attached: number }>(`/assessments/${id}/questions`, token, {
    method: "POST",
    body: JSON.stringify({ question_ids: questionIds })
  });
}

export async function listResults(token: string, assessmentId?: string) {
  const q = assessmentId ? `?assessment_id=${assessmentId}` : "";
  return apiFetch<ResultRow[]>(`/results${q}`, token);
}

export async function getAnalytics(token: string) {
  return apiFetch<{ stats: DashboardStats; average_score: number; results_count: number }>("/analytics/dashboard", token);
}

export async function exportResultsCSV(token: string) {
  const res = await fetch(`${API_BASE}/results/export`, { headers: { Authorization: `Bearer ${token}` } });
  if (!res.ok) throw new Error("Export failed");
  return res.blob();
}

// ── Practice Modules ──────────────────────────────────────────────────────────

export type PracticeModule = {
  id: string;
  name: string;
  category: string; // "mcq" | "coding" | "mixed"
  description?: string;
  tags?: string;
  is_published: boolean;
  ord: number;
  created_at?: string;
};

export type ModuleQuestionSlot = {
  id: string;
  question_id: string;
  ord: number;
  marks: number;       // 0 = inherit from question
  max_attempts: number; // 0 = unlimited
  question?: {
    id: string;
    type: string;
    topic?: string;
    difficulty?: string;
    marks: number;
    title?: string; // coding
    body?: string;  // mcq
  };
};

export async function listPracticeModules(token: string) {
  return apiFetch<PracticeModule[]>("/admin/practice/modules", token);
}

export async function createPracticeModule(token: string, body: {
  name: string; category?: string; description?: string; tags?: string; ord?: number;
}) {
  return apiFetch<PracticeModule>("/admin/practice/modules", token, { method: "POST", body: JSON.stringify(body) });
}

export async function updatePracticeModule(token: string, id: string, body: {
  name?: string; category?: string; description?: string; tags?: string; is_published?: boolean; ord?: number;
}) {
  return apiFetch<PracticeModule>(`/admin/practice/modules/${id}`, token, { method: "PUT", body: JSON.stringify(body) });
}

export async function deletePracticeModule(token: string, id: string) {
  return apiFetch<{ deleted: boolean }>(`/admin/practice/modules/${id}`, token, { method: "DELETE" });
}

export async function listModuleQuestions(token: string, moduleId: string) {
  return apiFetch<ModuleQuestionSlot[]>(`/admin/practice/modules/${moduleId}/questions`, token);
}

export async function addModuleQuestions(token: string, moduleId: string, questions: Array<{
  question_id: string; ord?: number; marks?: number; max_attempts?: number;
}>) {
  return apiFetch<{ added: number; failed: number; errors?: string[] }>(
    `/admin/practice/modules/${moduleId}/questions`, token,
    { method: "POST", body: JSON.stringify({ questions }) }
  );
}

export async function updateModuleQuestionSlot(token: string, moduleId: string, questionId: string, body: {
  marks?: number; max_attempts?: number; ord?: number;
}) {
  return apiFetch<{ updated: boolean }>(
    `/admin/practice/modules/${moduleId}/questions/${questionId}`, token,
    { method: "PATCH", body: JSON.stringify(body) }
  );
}

export async function removeModuleQuestion(token: string, moduleId: string, questionId: string) {
  return apiFetch<{ removed: boolean }>(
    `/admin/practice/modules/${moduleId}/questions/${questionId}`, token,
    { method: "DELETE" }
  );
}

export async function reorderModuleQuestions(token: string, moduleId: string, questionIds: string[]) {
  return apiFetch<{ reordered: boolean }>(
    `/admin/practice/modules/${moduleId}/questions/reorder`, token,
    { method: "PUT", body: JSON.stringify({ question_ids: questionIds }) }
  );
}

// ── Bulk Import ───────────────────────────────────────────────────────────────

export async function bulkImportMCQ(token: string, questions: unknown[]) {
  return apiFetch<BulkImportResult>("/questions/bulk/mcq", token, {
    method: "POST",
    body: JSON.stringify({ questions })
  });
}

export async function bulkImportCoding(token: string, questions: unknown[]) {
  return apiFetch<BulkImportResult>("/questions/bulk/coding", token, {
    method: "POST",
    body: JSON.stringify({ questions })
  });
}
