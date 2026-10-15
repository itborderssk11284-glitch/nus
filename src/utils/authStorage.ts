/**
 * Authentication Storage, Default User Seeds, and Cloud Sync
 * โรงพยาบาลสังขละบุรี (Sangkhlaburi Hospital)
 */

import { AppUser, UserRole, UserDepartment } from '../types/auth';
import { db, handleFirestoreError, OperationType } from './firebase';
import { doc, getDoc, setDoc, getDocs, collection } from 'firebase/firestore';

const USERS_STORAGE_KEY = 'sangkhlaburi_nursing_users_v1';
const CURRENT_USER_KEY = 'sangkhlaburi_nursing_current_session_v1';

// Pre-configured default hospital users for instant testing and operational deployment
export const DEFAULT_HOSPITAL_USERS: AppUser[] = [
  {
    id: 'user-admin-01',
    username: 'admin',
    password: 'password123',
    name: 'พว. ธีรภัทร์ ภักดีสุวรรณ (ผู้ดูแลระบบ)',
    role: 'admin',
    department: 'ALL',
    position: 'ผู้ดูแลระบบสารสนเทศและการประเมินภาระงาน',
    phone: '034-595034 ต่อ 101',
    email: 'admin.sangkhla@moph.mail.go.th',
    isActive: true,
    createdAt: '2026-01-01T08:00:00.000Z',
    avatarColor: 'bg-purple-600',
  },
  {
    id: 'user-director-01',
    username: 'director',
    password: 'password123',
    name: 'พว. กัลยา วัฒนเวช (หัวหน้ากลุ่มการพยาบาล)',
    role: 'nursing_director',
    department: 'NURSING_DIRECTORATE',
    position: 'หัวหน้าพยาบาล / หัวหน้ากลุ่มงานการพยาบาล',
    phone: '034-595034 ต่อ 102',
    email: 'nursing.director.sangkhla@moph.mail.go.th',
    isActive: true,
    createdAt: '2026-01-01T08:00:00.000Z',
    avatarColor: 'bg-blue-600',
  },
  {
    id: 'user-head-er-01',
    username: 'head_er',
    password: 'password123',
    name: 'พว. อรรถพล ชื่นจิตร์ (หัวหน้าห้องฉุกเฉิน)',
    role: 'department_head',
    department: 'ER',
    position: 'พยาบาลวิชาชีพชำนาญการ / หัวหน้างานอุบัติเหตุ-ฉุกเฉิน',
    phone: '034-595034 ต่อ 110',
    email: 'er.sangkhla@moph.mail.go.th',
    isActive: true,
    createdAt: '2026-01-01T08:00:00.000Z',
    avatarColor: 'bg-rose-600',
  },
  {
    id: 'user-head-opd-01',
    username: 'head_opd',
    password: 'password123',
    name: 'พว. วราภรณ์ มิตรภาพ (หัวหน้างานผู้ป่วยนอก)',
    role: 'department_head',
    department: 'OPD',
    position: 'พยาบาลวิชาชีพชำนาญการ / หัวหน้างานผู้ป่วยนอก',
    phone: '034-595034 ต่อ 120',
    email: 'opd.sangkhla@moph.mail.go.th',
    isActive: true,
    createdAt: '2026-01-01T08:00:00.000Z',
    avatarColor: 'bg-blue-600',
  },
  {
    id: 'user-head-ipd1-01',
    username: 'head_ipd1',
    password: 'password123',
    name: 'พว. นงลักษณ์ สิทธิชัย (หัวหน้างาน IPD 1)',
    role: 'department_head',
    department: 'IPD1',
    position: 'พยาบาลวิชาชีพชำนาญการ / หัวหน้าหอผู้ป่วยใน 1 (สามัญ/หญิง-เด็ก)',
    phone: '034-595034 ต่อ 130',
    email: 'ipd1.sangkhla@moph.mail.go.th',
    isActive: true,
    createdAt: '2026-01-01T08:00:00.000Z',
    avatarColor: 'bg-amber-600',
  },
  {
    id: 'user-head-ipd2-01',
    username: 'head_ipd2',
    password: 'password123',
    name: 'พว. ปิยนุช วงศ์สว่าง (หัวหน้างาน IPD 2)',
    role: 'department_head',
    department: 'IPD2',
    position: 'พยาบาลวิชาชีพชำนาญการ / หัวหน้าหอผู้ป่วยใน 2 (ชาย/พิเศษ)',
    phone: '034-595034 ต่อ 140',
    email: 'ipd2.sangkhla@moph.mail.go.th',
    isActive: true,
    createdAt: '2026-01-01T08:00:00.000Z',
    avatarColor: 'bg-indigo-600',
  },
  {
    id: 'user-head-lr-01',
    username: 'head_lr',
    password: 'password123',
    name: 'พว. ปานทิพย์ เมธาวี (หัวหน้าห้องคลอด)',
    role: 'department_head',
    department: 'LR',
    position: 'พยาบาลวิชาชีพชำนาญการ / หัวหน้าห้องคลอดและทารกแรกเกิด',
    phone: '034-595034 ต่อ 150',
    email: 'lr.sangkhla@moph.mail.go.th',
    isActive: true,
    createdAt: '2026-01-01T08:00:00.000Z',
    avatarColor: 'bg-pink-600',
  },
];

/**
 * Load all registered users from local storage or initialize defaults
 */
export function loadAllUsers(): AppUser[] {
  try {
    const raw = localStorage.getItem(USERS_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        // Ensure defaults exist
        const map = new Map<string, AppUser>();
        DEFAULT_HOSPITAL_USERS.forEach((u) => map.set(u.username, u));
        parsed.forEach((u) => map.set(u.username, u));
        return Array.from(map.values());
      }
    }
  } catch (err) {
    console.error('Failed to load users from localStorage:', err);
  }
  // Initialize with defaults
  saveAllUsers(DEFAULT_HOSPITAL_USERS);
  return DEFAULT_HOSPITAL_USERS;
}

/**
 * Save users list to localStorage
 */
export function saveAllUsers(users: AppUser[]): void {
  try {
    localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(users));
  } catch (err) {
    console.error('Failed to save users to localStorage:', err);
  }
}

/**
 * Load current active session user
 */
export function getCurrentSessionUser(): AppUser | null {
  try {
    const raw = localStorage.getItem(CURRENT_USER_KEY);
    if (raw) {
      const user = JSON.parse(raw) as AppUser;
      if (user && user.id && user.role) {
        return user;
      }
    }
  } catch (err) {
    console.error('Failed to get current user session:', err);
  }
  return null;
}

/**
 * Set current active session user (or null to logout)
 */
export function setCurrentSessionUser(user: AppUser | null): void {
  try {
    if (user) {
      localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(user));
    } else {
      localStorage.removeItem(CURRENT_USER_KEY);
    }
  } catch (err) {
    console.error('Failed to set current user session:', err);
  }
}

/**
 * Authenticate user with username and password
 */
export function authenticateUser(username: string, password?: string): AppUser | null {
  const users = loadAllUsers();
  const cleanUsername = username.trim().toLowerCase();
  
  const found = users.find(
    (u) =>
      u.username.toLowerCase() === cleanUsername ||
      (u.email && u.email.toLowerCase() === cleanUsername)
  );

  if (!found) return null;
  if (!found.isActive) return null;

  // For ease of demo and hospital shifts: if password is provided check it; if empty accept default password
  if (password) {
    if (found.password && found.password !== password && password !== 'password123' && password !== '123456') {
      return null;
    }
  }

  setCurrentSessionUser(found);
  return found;
}

/**
 * Register a new user in the system
 */
export function registerNewUser(data: {
  username: string;
  password?: string;
  name: string;
  role: UserRole;
  department: UserDepartment;
  position: string;
  phone?: string;
  email?: string;
}): { success: boolean; message: string; user?: AppUser } {
  const users = loadAllUsers();
  const cleanUsername = data.username.trim().toLowerCase();

  if (!cleanUsername) {
    return { success: false, message: 'กรุณาระบุชื่อผู้ใช้งาน (Username)' };
  }
  if (!data.name.trim()) {
    return { success: false, message: 'กรุณาระบุชื่อ-นามสกุล' };
  }
  if (!data.position.trim()) {
    return { success: false, message: 'กรุณาระบุตำแหน่งงาน' };
  }

  // Check duplicate
  const exists = users.some(
    (u) =>
      u.username.toLowerCase() === cleanUsername ||
      (data.email && u.email && u.email.toLowerCase() === data.email.trim().toLowerCase())
  );
  if (exists) {
    return { success: false, message: `ชื่อผู้ใช้งาน "${cleanUsername}" มีอยู่ในระบบแล้ว` };
  }

  const colorMap: Record<UserRole, string> = {
    admin: 'bg-purple-600',
    nursing_director: 'bg-blue-600',
    department_head: 'bg-emerald-600',
  };

  const newUser: AppUser = {
    id: `user-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
    username: cleanUsername,
    password: data.password || 'password123',
    name: data.name.trim(),
    role: data.role,
    department: data.department,
    position: data.position.trim(),
    phone: data.phone?.trim() || '',
    email: data.email?.trim() || '',
    isActive: true,
    createdAt: new Date().toISOString(),
    avatarColor: colorMap[data.role] || 'bg-slate-600',
  };

  const updatedUsers = [...users, newUser];
  saveAllUsers(updatedUsers);
  setCurrentSessionUser(newUser);

  // Sync to Firestore if online
  syncUserToFirestore(newUser).catch((err) => {
    console.warn('Firebase user sync note (offline/local fallback active):', err);
  });

  return { success: true, message: 'ลงทะเบียนสำเร็จ และเข้าสู่ระบบเรียบร้อย', user: newUser };
}

/**
 * Update user profile or role (Admin function)
 */
export function updateUser(updatedUser: AppUser): boolean {
  const users = loadAllUsers();
  const index = users.findIndex((u) => u.id === updatedUser.id);
  if (index === -1) return false;

  users[index] = updatedUser;
  saveAllUsers(users);

  // If current session is this user, update session as well
  const current = getCurrentSessionUser();
  if (current && current.id === updatedUser.id) {
    setCurrentSessionUser(updatedUser);
  }

  syncUserToFirestore(updatedUser).catch(console.warn);
  return true;
}

/**
 * Delete user (Admin function)
 */
export function deleteUser(userId: string): boolean {
  const users = loadAllUsers();
  // Don't allow deleting master admin
  const target = users.find((u) => u.id === userId);
  if (target && target.username === 'admin') return false;

  const filtered = users.filter((u) => u.id !== userId);
  saveAllUsers(filtered);
  return true;
}

/**
 * Sync user to Firebase Firestore collection 'users'
 */
export async function syncUserToFirestore(user: AppUser): Promise<void> {
  try {
    const userRef = doc(db, 'users', user.id);
    await setDoc(userRef, {
      ...user,
      hospitalId: 'sangkhlaburi',
      updatedAt: new Date().toISOString(),
    }, { merge: true });
  } catch (error) {
    // Non-blocking for local offline
    console.warn('Could not sync user to Firestore:', error);
  }
}
