import React from 'react';
import { HospitalLogo } from './HospitalLogo';
import {
  LayoutDashboard,
  ClipboardPen,
  FileSpreadsheet,
  Calculator,
  Moon,
  Sun,
  SlidersHorizontal,
  Calendar,
  Layers,
  ChevronRight,
  Menu,
  X,
  Sparkles,
  Eye,
  Cloud,
  CloudOff,
  CloudCheck,
  RefreshCw,
  LogIn,
  LogOut,
  ShieldCheck,
  Users,
  UserCheck,
  User,
  ArrowRightLeft,
} from 'lucide-react';
import { User as FirebaseUser } from 'firebase/auth';
import { AppUser, ROLE_LABELS, DEPARTMENT_LABELS } from '../types/auth';

export type ActiveTab = 'dashboard' | 'entry' | 'reports' | 'standards';

interface SidebarProps {
  activeTab: ActiveTab;
  setActiveTab: (tab: ActiveTab) => void;
  isDark: boolean;
  toggleTheme: () => void;
  openSettingsModal: () => void;
  currentDate: string;
  user: FirebaseUser | null;
  isSyncing: boolean;
  onSignIn: () => void;
  onSignOut: () => void;
  appUser: AppUser | null;
  onOpenAuthModal: () => void;
  onOpenUserManagement: () => void;
  onLogoutUser: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  setActiveTab,
  isDark,
  toggleTheme,
  openSettingsModal,
  currentDate,
  user,
  isSyncing,
  onSignIn,
  onSignOut,
  appUser,
  onOpenAuthModal,
  onOpenUserManagement,
  onLogoutUser,
}) => {
  const [isMobileOpen, setIsMobileOpen] = React.useState(false);

  const dateObj = new Date(currentDate);
  const thaiDateStr = dateObj.toLocaleDateString('th-TH', {
    day: 'numeric',
    month: 'short',
    year: '2-digit',
  });

  const navItems = [
    {
      id: 'dashboard' as ActiveTab,
      label: 'แดชบอร์ดภาพรวม',
      description: 'วิเคราะห์ภาระงานและกำลังคน Real-time',
      icon: LayoutDashboard,
    },
    {
      id: 'entry' as ActiveTab,
      label: 'บันทึกค่างานพยาบาล',
      description: 'งานหลัก • งานรอง • งานสนับสนุน',
      icon: ClipboardPen,
    },
    {
      id: 'reports' as ActiveTab,
      label: 'ระบบรายงานสถิติ',
      description: 'รายวัน • รายเดือน • รายปี (Excel/PDF)',
      icon: FileSpreadsheet,
    },
    {
      id: 'standards' as ActiveTab,
      label: 'เกณฑ์มาตรฐานสภาฯ',
      description: 'สูตรคำนวณและสัมประสิทธิ์ DFTE',
      icon: Calculator,
    },
  ];

  const handleNavClick = (tab: ActiveTab) => {
    setActiveTab(tab);
    setIsMobileOpen(false);
  };

  return (
    <>
      {/* Mobile Top Header with Hamburger Button */}
      <div className="lg:hidden sticky top-0 z-30 flex items-center justify-between px-3.5 py-2.5 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 transition-colors">
        <div className="flex items-center gap-2">
          <HospitalLogo size={34} />
          <div>
            <div className="font-bold text-xs sm:text-sm text-slate-900 dark:text-white leading-tight">
              Sangkhlaburi Hospital
            </div>
            <div className="text-[10px] text-emerald-600 dark:text-emerald-400 font-medium truncate max-w-[200px]">
              Smart Workload Assessment
            </div>
          </div>
        </div>

        <div className="flex items-center gap-1.5">
          {/* Cloud sync indicator */}
          <button
            type="button"
            onClick={user ? undefined : onSignIn}
            title={user ? `Firebase ซิงค์แล้ว: ${user.email}` : 'คลิกเพื่อเข้าสู่ระบบเชื่อมต่อ Firebase'}
            className={`p-2 rounded-xl transition-all ${
              user
                ? 'text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/50'
                : 'text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/50'
            }`}
          >
            {isSyncing ? (
              <RefreshCw className="w-4 h-4 animate-spin text-emerald-500" />
            ) : user ? (
              <CloudCheck className="w-4 h-4" />
            ) : (
              <Cloud className="w-4 h-4" />
            )}
          </button>

          {/* Quick Dark Mode toggle on Mobile Header */}
          <button
            type="button"
            onClick={toggleTheme}
            title={isDark ? 'เปลี่ยนเป็นโหมดสว่าง' : 'เปลี่ยนเป็นโหมดมืด (ถนอมสายตาเวรดึก)'}
            className="p-2 rounded-xl text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 transition-all active:scale-95"
          >
            {isDark ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-slate-600" />}
          </button>
          
          <button
            type="button"
            onClick={() => setIsMobileOpen(!isMobileOpen)}
            className="p-2 rounded-xl text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 transition-all"
          >
            {isMobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Backdrop */}
      {isMobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/60 backdrop-blur-xs lg:hidden"
          onClick={() => setIsMobileOpen(false)}
        />
      )}

      {/* Main Sidebar (Desktop fixed left, Mobile drawer) */}
      <aside
        className={`fixed top-0 bottom-0 left-0 z-40 w-64 bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 flex flex-col justify-between transition-all duration-300 ease-in-out select-none shadow-sm ${
          isMobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        {/* Top: Brand Header with new system title */}
        <div className="p-4 border-b border-slate-100 dark:border-slate-800/80">
          <div className="flex items-start gap-2.5">
            <HospitalLogo size={42} className="shrink-0 mt-0.5" />
            <div className="overflow-hidden">
              <span className="text-[10px] font-bold tracking-wider uppercase text-emerald-600 dark:text-emerald-400 block leading-tight">
                Sangkhlaburi Hospital
              </span>
              <h1 className="font-extrabold text-xs text-slate-900 dark:text-slate-100 leading-tight mt-0.5">
                Smart Workload and Workforce Assessment System
              </h1>
              <span className="text-[10px] text-slate-400 dark:text-slate-500 block leading-tight mt-0.5">
                รพ.สังขละบุรี • สภาการพยาบาล
              </span>
            </div>
          </div>

          {/* Current Date Badge */}
          <div className="mt-3 px-2.5 py-1.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-700/60 text-[11px] text-slate-700 dark:text-slate-300 flex items-center justify-between">
            <span className="flex items-center gap-1 font-medium text-slate-500 dark:text-slate-400">
              <Calendar className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
              <span>วันที่ตรวจนับ:</span>
            </span>
            <span className="font-bold font-mono text-emerald-700 dark:text-emerald-300">{thaiDateStr}</span>
          </div>
        </div>

        {/* User Role & Profile Card */}
        {appUser ? (
          <div className="mx-3 mt-3 p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200/80 dark:border-slate-700/80 space-y-2">
            <div className="flex items-start justify-between gap-2">
              <div className="flex items-center gap-2 overflow-hidden">
                <span className={`w-8 h-8 rounded-xl ${appUser.avatarColor || 'bg-emerald-600'} text-white flex items-center justify-center font-bold text-xs shrink-0 shadow-xs`}>
                  {appUser.name.slice(0, 1)}
                </span>
                <div className="min-w-0">
                  <div className="text-xs font-bold text-slate-800 dark:text-slate-100 truncate">
                    {appUser.name}
                  </div>
                  <div className="text-[10px] text-slate-500 dark:text-slate-400 truncate">
                    {appUser.position}
                  </div>
                </div>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-1">
              <span className={`text-[10px] px-2 py-0.5 rounded-md font-semibold border ${ROLE_LABELS[appUser.role]?.color}`}>
                {ROLE_LABELS[appUser.role]?.badge}
              </span>
              <span className="text-[10px] px-2 py-0.5 rounded-md font-medium bg-slate-200/70 dark:bg-slate-700 text-slate-700 dark:text-slate-300">
                {DEPARTMENT_LABELS[appUser.department]?.short || appUser.department}
              </span>
            </div>

            <div className="pt-1 flex items-center justify-between border-t border-slate-200/60 dark:border-slate-700/60 text-[10px]">
              <button
                type="button"
                onClick={onOpenAuthModal}
                className="text-emerald-600 dark:text-emerald-400 hover:underline flex items-center gap-1 font-semibold cursor-pointer"
                title="สลับบัญชีทดสอบระบบ"
              >
                <ArrowRightLeft className="w-3 h-3" />
                <span>สลับบัญชี</span>
              </button>
              <button
                type="button"
                onClick={onLogoutUser}
                className="text-slate-400 hover:text-rose-500 transition-colors flex items-center gap-1 cursor-pointer"
                title="ออกจากระบบ"
              >
                <LogOut className="w-3 h-3" />
                <span>ออกจากระบบ</span>
              </button>
            </div>
          </div>
        ) : (
          <div className="mx-3 mt-3 p-3 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-center">
            <button
              type="button"
              onClick={onOpenAuthModal}
              className="w-full py-1.5 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-xs"
            >
              <LogIn className="w-3.5 h-3.5" />
              <span>เข้าสู่ระบบ / สมัครสมาชิก</span>
            </button>
          </div>
        )}

        {/* Center: Navigation Menu */}
        <nav className="p-3 space-y-1 flex-1 overflow-y-auto">
          <div className="px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
            ฟังก์ชันการทำงาน (Main Menu)
          </div>

          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => handleNavClick(item.id)}
                className={`w-full flex items-center justify-between p-2.5 rounded-xl text-left transition-all group ${
                  isActive
                    ? 'bg-emerald-600 text-white shadow-md shadow-emerald-700/20 font-semibold'
                    : 'text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800/70 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <div
                    className={`w-8 h-8 rounded-lg flex items-center justify-center transition-colors shrink-0 ${
                      isActive
                        ? 'bg-white/20 text-white'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 group-hover:bg-emerald-50 dark:group-hover:bg-emerald-950/50 group-hover:text-emerald-600'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                  </div>
                  <div className="overflow-hidden">
                    <div className="text-xs font-semibold leading-tight">{item.label}</div>
                    <div
                      className={`text-[10px] font-normal leading-tight mt-0.5 truncate ${
                        isActive ? 'text-emerald-100' : 'text-slate-400'
                      }`}
                    >
                      {item.description}
                    </div>
                  </div>
                </div>
                <ChevronRight
                  className={`w-3.5 h-3.5 shrink-0 transition-transform ${
                    isActive ? 'text-white opacity-100' : 'text-slate-400 opacity-0 group-hover:opacity-100'
                  }`}
                />
              </button>
            );
          })}

          {/* Admin User Management Quick Menu Button */}
          {appUser?.role === 'admin' && (
            <button
              type="button"
              onClick={() => {
                onOpenUserManagement();
                setIsMobileOpen(false);
              }}
              className="w-full mt-2 flex items-center justify-between p-2.5 rounded-xl text-left transition-all group bg-purple-50/70 hover:bg-purple-100 dark:bg-purple-950/40 dark:hover:bg-purple-900/50 border border-purple-200 dark:border-purple-800 text-purple-900 dark:text-purple-200"
            >
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0 bg-purple-600 text-white shadow-xs">
                  <Users className="w-4 h-4" />
                </div>
                <div className="overflow-hidden">
                  <div className="text-xs font-bold leading-tight flex items-center gap-1">
                    <span>จัดการผู้ใช้งานระบบ</span>
                    <span className="text-[9px] px-1 py-0.2 rounded bg-purple-200 dark:bg-purple-800 text-purple-900 dark:text-purple-100 font-bold">Admin</span>
                  </div>
                  <div className="text-[10px] text-purple-700/80 dark:text-purple-300/80 truncate mt-0.5">
                    กำหนดสิทธิ์ 7 บัญชี & เพิ่มผู้ใช้
                  </div>
                </div>
              </div>
              <ChevronRight className="w-3.5 h-3.5 shrink-0 text-purple-400 group-hover:translate-x-0.5 transition-transform" />
            </button>
          )}

          {/* Firebase Database Cloud Sync Panel */}
          <div className="mt-3 p-3 rounded-xl bg-slate-50 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700/80 text-[11px] space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5 font-bold text-slate-800 dark:text-slate-200">
                <Cloud className={`w-3.5 h-3.5 ${user ? 'text-emerald-500' : 'text-amber-500'}`} />
                <span>ฐานข้อมูล Firebase</span>
              </div>
              <span
                className={`text-[9px] px-1.5 py-0.5 rounded-md font-semibold flex items-center gap-1 ${
                  user
                    ? 'bg-emerald-100 dark:bg-emerald-950/70 text-emerald-700 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800'
                    : 'bg-amber-100 dark:bg-amber-950/70 text-amber-700 dark:text-amber-300 border border-amber-300 dark:border-amber-800'
                }`}
              >
                {isSyncing ? (
                  <>
                    <RefreshCw className="w-2.5 h-2.5 animate-spin" />
                    <span>กำลังซิงค์...</span>
                  </>
                ) : user ? (
                  <>
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    <span>คลาวด์สด (Live)</span>
                  </>
                ) : (
                  <>
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                    <span>ออฟไลน์ในเครื่อง</span>
                  </>
                )}
              </span>
            </div>

            {user ? (
              <div className="space-y-1.5 pt-0.5">
                <div className="flex items-center gap-2 overflow-hidden">
                  {user.photoURL ? (
                    <img
                      src={user.photoURL}
                      alt={user.displayName || 'User'}
                      className="w-6 h-6 rounded-full border border-emerald-500/50 shrink-0"
                    />
                  ) : (
                    <div className="w-6 h-6 rounded-full bg-emerald-600 text-white font-bold text-[10px] flex items-center justify-center shrink-0">
                      {(user.displayName || user.email || 'U')[0].toUpperCase()}
                    </div>
                  )}
                  <div className="overflow-hidden leading-tight">
                    <div className="font-semibold text-slate-800 dark:text-slate-200 truncate text-[11px]">
                      {user.displayName || 'เจ้าหน้าที่พยาบาล'}
                    </div>
                    <div className="text-[9px] text-slate-400 dark:text-slate-500 truncate">
                      {user.email}
                    </div>
                  </div>
                </div>

                <div className="text-[10px] text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                  <ShieldCheck className="w-3 h-3 shrink-0" />
                  <span>บันทึก/แก้ไข/ลบ ซิงค์อัตโนมัติ 100%</span>
                </div>

                <button
                  type="button"
                  onClick={onSignOut}
                  className="w-full mt-1 flex items-center justify-center gap-1.5 py-1 px-2 rounded-lg text-[10px] font-medium text-slate-500 dark:text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 border border-slate-200 dark:border-slate-700 transition-colors"
                >
                  <LogOut className="w-3 h-3" />
                  <span>ออกจากระบบ Firebase</span>
                </button>
              </div>
            ) : (
              <div className="space-y-1.5 pt-0.5">
                <p className="text-[10px] text-slate-500 dark:text-slate-400 leading-snug">
                  ข้อมูลจะถูกบันทึกในเครื่องอัตโนมัติ เข้าสู่ระบบด้วย Google เพื่อเชื่อมต่อคลาวด์ Firebase
                </p>
                <button
                  type="button"
                  onClick={onSignIn}
                  className="w-full flex items-center justify-center gap-1.5 py-1.5 px-2.5 rounded-lg text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs active:scale-98 transition-all"
                >
                  <LogIn className="w-3.5 h-3.5" />
                  <span>เข้าสู่ระบบ Google เพื่อเชื่อมต่อ</span>
                </button>
              </div>
            )}
          </div>
        </nav>

        {/* Bottom: Settings & Theme Toggle */}
        <div className="p-3 border-t border-slate-100 dark:border-slate-800 space-y-1.5 bg-slate-50/50 dark:bg-slate-900/50">
          
          {/* Settings Button */}
          <button
            type="button"
            onClick={() => {
              openSettingsModal();
              setIsMobileOpen(false);
            }}
            className="w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <div className="flex items-center gap-2">
              <SlidersHorizontal className="w-4 h-4 text-slate-500" />
              <span>ตั้งค่าเกณฑ์มาตรฐาน สธ.</span>
            </div>
          </button>

          {/* Dark Mode Switcher (ถนอมสายตาเวรดึก) */}
          <button
            type="button"
            onClick={toggleTheme}
            className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-semibold transition-all border ${
              isDark
                ? 'bg-slate-800 border-slate-700 text-slate-100 hover:bg-slate-700'
                : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-100'
            }`}
          >
            <div className="flex items-center gap-2">
              {isDark ? (
                <Sun className="w-4 h-4 text-amber-400" />
              ) : (
                <Moon className="w-4 h-4 text-indigo-600" />
              )}
              <span>{isDark ? 'โหมดมืด (ถนอมสายตาเวรดึก)' : 'โหมดสว่าง (Day Shift)'}</span>
            </div>
            <span
              className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
                isDark
                  ? 'bg-amber-400/20 text-amber-300 border border-amber-400/30'
                  : 'bg-indigo-100 text-indigo-700 border border-indigo-200'
              }`}
            >
              {isDark ? 'Dark ON' : 'Light ON'}
            </span>
          </button>

          <div className="pt-1 text-center text-[10px] text-slate-400">
            โรงพยาบาลสังขละบุรี • Kanchanaburi
          </div>
        </div>
      </aside>
    </>
  );
};
