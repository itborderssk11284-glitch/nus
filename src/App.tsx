/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { DailyRecord, DepartmentKey, StandardWeightsConfig } from './types/nursing';
import {
  formatDateISO,
  getThemePreference,
  loadRecords,
  loadStandards,
  resetStandards,
  saveRecords,
  saveStandards,
  saveThemePreference,
  createNewDailyRecord,
  FontScale,
  getFontScalePreference,
  saveFontScalePreference,
} from './utils/storage';
import {
  signInWithGoogle,
  signOutUser,
  subscribeToAuth,
  subscribeToDailyRecords,
  subscribeToStandardsCloud,
  saveRecordToCloud,
  deleteRecordFromCloud,
  saveStandardsToCloud,
} from './utils/firebase';
import { User } from 'firebase/auth';
import { exportToExcel } from './utils/exportUtils';
import { Sidebar, ActiveTab } from './components/Sidebar';
import { Dashboard } from './components/Dashboard';
import { DataEntryForm } from './components/DataEntryForm';
import { ReportsView } from './components/ReportsView';
import { CalculationReferenceModal } from './components/CalculationReferenceModal';
import { SettingsModal } from './components/SettingsModal';
import { HospitalLogo } from './components/HospitalLogo';
import {
  MapPin,
  ShieldCheck,
  Cloud,
  CheckCircle2,
  RefreshCw,
  Sun,
  Moon,
  Eye,
  Calendar,
  Layers,
} from 'lucide-react';

export default function App() {
  // Theme state
  const [isDark, setIsDark] = useState<boolean>(() => getThemePreference() === 'dark');

  // Eye-care Font Scaling state ('normal' | 'comfort' | 'large')
  const [fontScale, setFontScale] = useState<FontScale>(() => getFontScalePreference());

  // Active navigation tab (left sidebar)
  const [activeTab, setActiveTab] = useState<ActiveTab>('dashboard');

  // Pre-selected department when jumping from dashboard to entry form
  const [targetDept, setTargetDept] = useState<DepartmentKey>('ER');

  // Settings & Standards Modal states
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isStandardsModalOpen, setIsStandardsModalOpen] = useState(false);

  // Firebase Auth and Cloud Sync states
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [cloudSyncToast, setCloudSyncToast] = useState<string | null>(null);

  // Data records & standards config
  const [records, setRecords] = useState<DailyRecord[]>(() => loadRecords());
  const [standardsConfig, setStandardsConfig] = useState<StandardWeightsConfig>(() => loadStandards());

  // Current selected date
  const [selectedDate, setSelectedDate] = useState<string>(() => {
    const existing = loadRecords();
    if (existing.length > 0) {
      const sorted = [...existing].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
      return sorted[0].date;
    }
    return formatDateISO(new Date());
  });

  // Apply dark mode class to html element
  useEffect(() => {
    if (isDark) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDark]);

  // Apply font scale attribute to html element
  useEffect(() => {
    document.documentElement.setAttribute('data-font-scale', fontScale);
  }, [fontScale]);

  const toggleTheme = () => {
    const next = !isDark;
    setIsDark(next);
    saveThemePreference(next ? 'dark' : 'light');
  };

  const handleChangeFontScale = (scale: FontScale) => {
    setFontScale(scale);
    saveFontScalePreference(scale);
  };

  // Subscribe to Firebase Auth changes
  useEffect(() => {
    const unsubAuth = subscribeToAuth((user) => {
      setCurrentUser(user);
      if (user) {
        setCloudSyncToast(`เข้าสู่ระบบสำเร็จ: เชื่อมต่อฐานข้อมูล Firebase แล้ว (${user.displayName || user.email})`);
        setTimeout(() => setCloudSyncToast(null), 4000);
      }
    });
    return () => unsubAuth();
  }, []);

  // When user is authenticated, subscribe to Firestore real-time updates
  useEffect(() => {
    if (!currentUser) return;

    setIsSyncing(true);
    const unsubRecords = subscribeToDailyRecords((cloudRecords) => {
      setIsSyncing(false);
      if (cloudRecords && cloudRecords.length > 0) {
        setRecords(cloudRecords);
        saveRecords(cloudRecords);
      } else {
        // If Firestore collection is empty, automatically seed existing local records to cloud!
        const local = loadRecords();
        if (local.length > 0) {
          local.forEach((r) => {
            saveRecordToCloud(r).catch(console.error);
          });
        }
      }
    });

    const unsubStandards = subscribeToStandardsCloud((cloudStandards) => {
      if (cloudStandards) {
        setStandardsConfig(cloudStandards);
        saveStandards(cloudStandards);
      }
    });

    return () => {
      if (unsubRecords) unsubRecords();
      if (unsubStandards) unsubStandards();
    };
  }, [currentUser]);

  // Find or create current active record
  const currentRecord = React.useMemo(() => {
    const found = records.find((r) => r.date === selectedDate);
    if (found) return found;
    return createNewDailyRecord(selectedDate);
  }, [records, selectedDate]);

  // Save or update record (Automatic Firebase Sync)
  const handleSaveRecord = async (updatedRecord: DailyRecord) => {
    const existingIndex = records.findIndex((r) => r.date === updatedRecord.date);
    let newRecords: DailyRecord[];
    if (existingIndex >= 0) {
      newRecords = [...records];
      newRecords[existingIndex] = updatedRecord;
    } else {
      newRecords = [updatedRecord, ...records];
    }
    setRecords(newRecords);
    saveRecords(newRecords);

    // Sync to Firebase Cloud if authenticated
    if (currentUser) {
      setIsSyncing(true);
      try {
        await saveRecordToCloud(updatedRecord);
        setCloudSyncToast('ซิงค์ข้อมูลลงฐานข้อมูล Firebase สำเร็จเรียบร้อย');
        setTimeout(() => setCloudSyncToast(null), 3000);
      } catch (err) {
        console.error('Firebase cloud save error:', err);
      } finally {
        setIsSyncing(false);
      }
    } else {
      setCloudSyncToast('บันทึกในเครื่องเรียบร้อย (เข้าสู่ระบบด้วย Google เพื่อซิงค์คลาวด์ Firebase)');
      setTimeout(() => setCloudSyncToast(null), 3500);
    }
  };

  // Add new date record (Automatic Firebase Sync)
  const handleAddNewDateRecord = async (dateStr: string) => {
    const existing = records.find((r) => r.date === dateStr);
    if (existing) {
      setSelectedDate(dateStr);
      return;
    }
    const newRec = createNewDailyRecord(dateStr);
    const updated = [newRec, ...records];
    setRecords(updated);
    saveRecords(updated);
    setSelectedDate(dateStr);

    if (currentUser) {
      setIsSyncing(true);
      try {
        await saveRecordToCloud(newRec);
        setCloudSyncToast(`เพิ่มเวรวันที่ ${dateStr} ในฐานข้อมูล Firebase สำเร็จ`);
        setTimeout(() => setCloudSyncToast(null), 3000);
      } catch (err) {
        console.error('Firebase cloud create error:', err);
      } finally {
        setIsSyncing(false);
      }
    }
  };

  // Delete record (Automatic Firebase Sync)
  const handleDeleteRecord = async (id: string) => {
    const newRecords = records.filter((r) => r.id !== id);
    setRecords(newRecords);
    saveRecords(newRecords);
    if (newRecords.length > 0) {
      setSelectedDate(newRecords[0].date);
    }

    if (currentUser) {
      setIsSyncing(true);
      try {
        await deleteRecordFromCloud(id);
        setCloudSyncToast('ลบข้อมูลออกจากฐานข้อมูล Firebase เรียบร้อย');
        setTimeout(() => setCloudSyncToast(null), 3000);
      } catch (err) {
        console.error('Firebase cloud delete error:', err);
      } finally {
        setIsSyncing(false);
      }
    }
  };

  // Handle standard weights update (Automatic Firebase Sync)
  const handleSaveStandards = async (newConfig: StandardWeightsConfig) => {
    setStandardsConfig(newConfig);
    saveStandards(newConfig);

    if (currentUser) {
      setIsSyncing(true);
      try {
        await saveStandardsToCloud(newConfig);
        setCloudSyncToast('บันทึกเกณฑ์มาตรฐานลงฐานข้อมูล Firebase แล้ว');
        setTimeout(() => setCloudSyncToast(null), 3000);
      } catch (err) {
        console.error('Firebase cloud save standards error:', err);
      } finally {
        setIsSyncing(false);
      }
    }
  };

  const handleResetStandards = () => {
    const reset = resetStandards();
    setStandardsConfig(reset);
    if (currentUser) {
      saveStandardsToCloud(reset).catch(console.error);
    }
  };

  // Google Login and Logout
  const handleSignIn = async () => {
    try {
      await signInWithGoogle();
    } catch (err) {
      console.error('Sign in error:', err);
    }
  };

  const handleSignOut = async () => {
    try {
      await signOutUser();
      setCloudSyncToast('ออกจากระบบ Firebase แล้ว (สลับเป็นโหมดออฟไลน์)');
      setTimeout(() => setCloudSyncToast(null), 3000);
    } catch (err) {
      console.error('Sign out error:', err);
    }
  };

  // Navigation handlers
  const handleNavigateToEntry = (dept?: string) => {
    if (dept && (dept === 'ER' || dept === 'OPD' || dept === 'IPD1' || dept === 'IPD2' || dept === 'LR')) {
      setTargetDept(dept as DepartmentKey);
    }
    setActiveTab('entry');
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex transition-colors">
      
      {/* Real-time Cloud Sync Toast Notification */}
      {cloudSyncToast && (
        <div className="fixed top-4 right-4 z-50 flex items-center gap-2.5 px-4 py-2.5 rounded-xl bg-emerald-700 text-white shadow-lg shadow-emerald-900/30 text-xs font-medium animate-in fade-in slide-in-from-top-2 duration-300">
          <Cloud className="w-4 h-4 shrink-0 text-emerald-200" />
          <span>{cloudSyncToast}</span>
        </div>
      )}

      {/* Left Sidebar Navigation */}
      <Sidebar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        isDark={isDark}
        toggleTheme={toggleTheme}
        openSettingsModal={() => setIsSettingsOpen(true)}
        currentDate={selectedDate}
        user={currentUser}
        isSyncing={isSyncing}
        onSignIn={handleSignIn}
        onSignOut={handleSignOut}
      />

      {/* Main Content Area (offset left by sidebar width on desktop) */}
      <div className="flex-1 flex flex-col min-w-0 lg:pl-64">
        
        {/* Top Header Control Bar: Context Header, Eye-Care Font Scaling, Dark Mode & Live Status */}
        <header className="no-print sticky top-0 z-20 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md border-b border-slate-200/80 dark:border-slate-800 px-3.5 sm:px-6 lg:px-8 py-2.5 transition-colors">
          <div className="max-w-[1600px] mx-auto flex items-center justify-between gap-3">
            {/* Left: Active Section & Date badge */}
            <div className="flex items-center gap-2.5">
              <span className="text-xs sm:text-sm font-bold text-slate-800 dark:text-slate-100 hidden sm:inline flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-500" />
                {activeTab === 'dashboard' && 'แดชบอร์ดภาพรวมอัตรากำลัง'}
                {activeTab === 'entry' && 'บันทึกค่างานพยาบาล 3 ส่วน'}
                {activeTab === 'reports' && 'ระบบรายงานสถิติ'}
                {activeTab === 'standards' && 'เกณฑ์มาตรฐานสภาการพยาบาล'}
              </span>
              <span className="text-slate-300 dark:text-slate-700 hidden sm:inline">•</span>
              <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-slate-100 dark:bg-slate-800/80 text-slate-700 dark:text-slate-300 text-xs font-medium border border-slate-200 dark:border-slate-700">
                <Calendar className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                <span>วันที่: {new Date(selectedDate).toLocaleDateString('th-TH', { day: 'numeric', month: 'short', year: '2-digit' })}</span>
              </div>
            </div>

            {/* Right: Eye-Care Font Scaling, Dark Mode Toggle, Cloud Status */}
            <div className="flex items-center gap-2">
              {/* Eye-Care Font Scaling Selector */}
              <div className="flex items-center bg-slate-100 dark:bg-slate-800 p-0.5 rounded-xl border border-slate-200 dark:border-slate-700 text-xs">
                <span className="text-[11px] text-slate-500 dark:text-slate-400 px-2 font-medium hidden md:inline flex items-center gap-1">
                  <Eye className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                  <span>ปรับสายตา:</span>
                </span>
                <button
                  type="button"
                  onClick={() => handleChangeFontScale('normal')}
                  title="ขนาดตัวอักษรปกติ (100%)"
                  className={`px-2 py-1 rounded-lg font-bold text-xs transition-all ${
                    fontScale === 'normal'
                      ? 'bg-white dark:bg-slate-700 text-emerald-700 dark:text-emerald-300 shadow-xs'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  A ปกติ
                </button>
                <button
                  type="button"
                  onClick={() => handleChangeFontScale('comfort')}
                  title="ขนาดตัวอักษรสบายตา (110% - แนะนำสำหรับคอมพิวเตอร์และเวรดึก)"
                  className={`px-2 py-1 rounded-lg font-bold text-xs transition-all ${
                    fontScale === 'comfort'
                      ? 'bg-emerald-600 text-white shadow-xs'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  A+ สบายตา
                </button>
                <button
                  type="button"
                  onClick={() => handleChangeFontScale('large')}
                  title="ขนาดตัวอักษรใหญ่พิเศษ (120% - อ่านง่ายระยะไกล)"
                  className={`px-2 py-1 rounded-lg font-bold text-xs transition-all ${
                    fontScale === 'large'
                      ? 'bg-emerald-600 text-white shadow-xs'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  A++ ใหญ่
                </button>
              </div>

              {/* Quick Dark Mode Switcher (ถนอมสายตาเวรดึก) */}
              <button
                type="button"
                onClick={toggleTheme}
                title={isDark ? 'เปลี่ยนเป็นโหมดสว่าง (Day Shift)' : 'เปลี่ยนเป็นโหมดมืด (ถนอมสายตาเวรดึก)'}
                className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 transition-all text-xs font-semibold"
              >
                {isDark ? <Sun className="w-3.5 h-3.5 text-amber-400" /> : <Moon className="w-3.5 h-3.5 text-indigo-600" />}
                <span className="hidden sm:inline">{isDark ? 'โหมดมืด' : 'โหมดสว่าง'}</span>
              </button>

              {/* Firebase Cloud Sync Status */}
              <div
                title={currentUser ? `เชื่อมต่อฐานข้อมูล Firebase แล้ว: ${currentUser.email}` : 'บันทึกในเครื่อง (Local Storage)'}
                className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-semibold border ${
                  currentUser
                    ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border-emerald-300 dark:border-emerald-800'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700'
                }`}
              >
                {isSyncing ? (
                  <RefreshCw className="w-3.5 h-3.5 animate-spin text-emerald-600" />
                ) : (
                  <Cloud className={`w-3.5 h-3.5 ${currentUser ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-400'}`} />
                )}
                <span className="hidden lg:inline">{currentUser ? 'Firebase ซิงค์สด' : 'ในเครื่อง'}</span>
              </div>
            </div>
          </div>
        </header>

        {/* Main View Container with Fluid Eye-Care Width */}
        <main className="flex-1 p-3.5 sm:p-5 lg:p-7 max-w-[1600px] w-full mx-auto">
          {activeTab === 'dashboard' && (
            <Dashboard
              currentRecord={currentRecord}
              records={records}
              onSelectDate={setSelectedDate}
              onNavigateToEntry={handleNavigateToEntry}
              onExportExcel={() => exportToExcel(records, standardsConfig)}
              onOpenStandards={() => setIsStandardsModalOpen(true)}
              standardsConfig={standardsConfig}
            />
          )}

          {activeTab === 'entry' && (
            <DataEntryForm
              currentRecord={currentRecord}
              onSaveRecord={handleSaveRecord}
              onAddNewDateRecord={handleAddNewDateRecord}
              standardsConfig={standardsConfig}
              initialDept={targetDept}
              onOpenStandards={() => setIsStandardsModalOpen(true)}
            />
          )}

          {activeTab === 'reports' && (
            <ReportsView
              records={records}
              onSelectRecord={(date) => {
                setSelectedDate(date);
                setActiveTab('dashboard');
              }}
              onDeleteRecord={handleDeleteRecord}
              standardsConfig={standardsConfig}
            />
          )}

          {activeTab === 'standards' && (
            <CalculationReferenceModal
              standardsConfig={standardsConfig}
              isStandaloneTab={true}
            />
          )}
        </main>

        {/* Footer */}
        <footer className="no-print mt-auto border-t border-slate-200 dark:border-slate-800 bg-white/70 dark:bg-slate-900/70 backdrop-blur-xs py-4 px-4 sm:px-6 text-xs text-slate-500 dark:text-slate-400">
          <div className="max-w-[1600px] mx-auto flex flex-col sm:flex-row items-center justify-between gap-3 text-center sm:text-left">
            <div className="flex items-center gap-2.5">
              <HospitalLogo size={28} />
              <div>
                <span className="font-bold text-slate-800 dark:text-slate-200">
                  กลุ่มงานการพยาบาล โรงพยาบาลสังขละบุรี
                </span>
                <span className="hidden md:inline text-slate-400"> • Sangkhlaburi Hospital Smart Workload and Workforce Assessment System</span>
              </div>
            </div>

            <div className="flex items-center gap-4 text-[11px]">
              <span className="flex items-center gap-1">
                <MapPin className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                <span>สังขละบุรี จ.กาญจนบุรี</span>
              </span>
              <span className="flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                <span>MOPH & TNC Certified</span>
              </span>
              <span className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-semibold">
                <Cloud className="w-3.5 h-3.5" />
                <span>Firebase Connected</span>
              </span>
            </div>
          </div>
        </footer>

      </div>

      {/* Modals */}
      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        standardsConfig={standardsConfig}
        onSaveStandards={handleSaveStandards}
        onResetStandards={handleResetStandards}
      />

      <CalculationReferenceModal
        isOpen={isStandardsModalOpen}
        onClose={() => setIsStandardsModalOpen(false)}
        standardsConfig={standardsConfig}
      />

    </div>
  );
}
