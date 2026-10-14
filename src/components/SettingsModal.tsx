import React, { useState } from 'react';
import { StandardWeightsConfig } from '../types/nursing';
import { DEFAULT_STANDARDS } from '../utils/calculator';
import {
  X,
  SlidersHorizontal,
  RotateCcw,
  Save,
  CheckCircle2,
} from 'lucide-react';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  standardsConfig: StandardWeightsConfig;
  onSaveStandards: (newConfig: StandardWeightsConfig) => void;
  onResetStandards: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  standardsConfig,
  onSaveStandards,
  onResetStandards,
}) => {
  const [cfg, setCfg] = useState<StandardWeightsConfig>(JSON.parse(JSON.stringify(standardsConfig)));
  const [savedToast, setSavedToast] = useState(false);

  if (!isOpen) return null;

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    onSaveStandards(cfg);
    setSavedToast(true);
    setTimeout(() => {
      setSavedToast(false);
      onClose();
    }, 1200);
  };

  const handleReset = () => {
    if (confirm('คุณต้องการคืนค่าเกณฑ์มาตรฐานเริ่มต้นตามกระทรวงสาธารณสุขหรือไม่?')) {
      onResetStandards();
      setCfg(JSON.parse(JSON.stringify(DEFAULT_STANDARDS)));
      setSavedToast(true);
      setTimeout(() => setSavedToast(false), 1200);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs animate-in fade-in">
      <div className="relative w-full max-w-2xl bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden max-h-[90vh] flex flex-col">
        
        <div className="px-5 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-900 text-white">
          <div className="flex items-center gap-2.5">
            <SlidersHorizontal className="w-5 h-5 text-emerald-400" />
            <div>
              <h3 className="font-bold text-base">ปรับแต่งเกณฑ์เวลามาตรฐาน (Standard Weights)</h3>
              <p className="text-xs text-slate-400">กำหนดค่าน้ำหนักชั่วโมงการพยาบาลสำหรับ รพ.สังขละบุรี</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {savedToast && (
          <div className="bg-emerald-600 text-white px-5 py-2.5 flex items-center gap-2 text-xs font-semibold animate-in slide-in-from-top">
            <CheckCircle2 className="w-4 h-4" />
            <span>บันทึกการตั้งค่าเกณฑ์มาตรฐานเรียบร้อยแล้ว</span>
          </div>
        )}

        <form onSubmit={handleSave} className="p-5 overflow-y-auto space-y-5 flex-1 text-xs">
          
          {/* General Config */}
          <div className="space-y-3 p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700">
            <h4 className="font-bold text-slate-800 dark:text-slate-200">เกณฑ์คำนวณทั่วไป (General)</h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-slate-500 block mb-1">เวลาปฏิบัติงานจริงสุทธิ/เวร (ชม.)</label>
                <input
                  type="number"
                  step="0.5"
                  value={cfg.general.productiveHoursPerShift}
                  onChange={(e) => setCfg({
                    ...cfg,
                    general: { ...cfg.general, productiveHoursPerShift: parseFloat(e.target.value) || 7.0 },
                  })}
                  className="w-full p-2 rounded-lg bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-600 font-mono font-bold"
                />
              </div>
              <div>
                <label className="text-slate-500 block mb-1">สัมประสิทธิ์วันหยุด/ลา (DFTE Factor)</label>
                <input
                  type="number"
                  step="0.05"
                  value={cfg.general.dfteReliefFactor}
                  onChange={(e) => setCfg({
                    ...cfg,
                    general: { ...cfg.general, dfteReliefFactor: parseFloat(e.target.value) || 1.25 },
                  })}
                  className="w-full p-2 rounded-lg bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-600 font-mono font-bold"
                />
              </div>
            </div>
          </div>

          {/* ER Triage Weights */}
          <div className="space-y-3 p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700">
            <h4 className="font-bold text-rose-600 dark:text-rose-400">ER: น้ำหนักเวลาการดูแลผู้ป่วยฉุกเฉิน (ชั่วโมง/ราย)</h4>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
              <div>
                <label className="text-slate-500">Triage 1 (แดง-กู้ชีพ)</label>
                <input
                  type="number"
                  step="0.25"
                  value={cfg.er.triage1Hours}
                  onChange={(e) => setCfg({ ...cfg, er: { ...cfg.er, triage1Hours: parseFloat(e.target.value) || 0 } })}
                  className="w-full p-1.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-600 font-mono"
                />
              </div>
              <div>
                <label className="text-slate-500">Triage 2 (ฉุกเฉินมาก)</label>
                <input
                  type="number"
                  step="0.25"
                  value={cfg.er.triage2Hours}
                  onChange={(e) => setCfg({ ...cfg, er: { ...cfg.er, triage2Hours: parseFloat(e.target.value) || 0 } })}
                  className="w-full p-1.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-600 font-mono"
                />
              </div>
              <div>
                <label className="text-slate-500">Triage 3 (เร่งด่วน)</label>
                <input
                  type="number"
                  step="0.1"
                  value={cfg.er.triage3Hours}
                  onChange={(e) => setCfg({ ...cfg, er: { ...cfg.er, triage3Hours: parseFloat(e.target.value) || 0 } })}
                  className="w-full p-1.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-600 font-mono"
                />
              </div>
              <div>
                <label className="text-slate-500">Triage 4 (กึ่งฉุกเฉิน)</label>
                <input
                  type="number"
                  step="0.05"
                  value={cfg.er.triage4Hours}
                  onChange={(e) => setCfg({ ...cfg, er: { ...cfg.er, triage4Hours: parseFloat(e.target.value) || 0 } })}
                  className="w-full p-1.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-600 font-mono"
                />
              </div>
              <div>
                <label className="text-slate-500">Triage 5 (ไม่ฉุกเฉิน)</label>
                <input
                  type="number"
                  step="0.05"
                  value={cfg.er.triage5Hours}
                  onChange={(e) => setCfg({ ...cfg, er: { ...cfg.er, triage5Hours: parseFloat(e.target.value) || 0 } })}
                  className="w-full p-1.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-600 font-mono"
                />
              </div>
              <div>
                <label className="text-slate-500">ส่งต่อ Ambulance (Refer)</label>
                <input
                  type="number"
                  step="0.5"
                  value={cfg.er.referralHours}
                  onChange={(e) => setCfg({ ...cfg, er: { ...cfg.er, referralHours: parseFloat(e.target.value) || 0 } })}
                  className="w-full p-1.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-600 font-mono"
                />
              </div>
            </div>
          </div>

          {/* IPD PCS Weights */}
          <div className="space-y-3 p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700">
            <h4 className="font-bold text-emerald-600 dark:text-emerald-400">IPD: ชั่วโมงการพยาบาลมาตรฐานต่อคนต่อวัน (HPPN)</h4>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
              <div>
                <label className="text-slate-500">PCS 1 (Self Care)</label>
                <input
                  type="number"
                  step="0.25"
                  value={cfg.ipd.pcs1HPPN}
                  onChange={(e) => setCfg({ ...cfg, ipd: { ...cfg.ipd, pcs1HPPN: parseFloat(e.target.value) || 0 } })}
                  className="w-full p-1.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-600 font-mono"
                />
              </div>
              <div>
                <label className="text-slate-500">PCS 2 (Moderate)</label>
                <input
                  type="number"
                  step="0.25"
                  value={cfg.ipd.pcs2HPPN}
                  onChange={(e) => setCfg({ ...cfg, ipd: { ...cfg.ipd, pcs2HPPN: parseFloat(e.target.value) || 0 } })}
                  className="w-full p-1.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-600 font-mono"
                />
              </div>
              <div>
                <label className="text-slate-500">PCS 3 (Maximum)</label>
                <input
                  type="number"
                  step="0.5"
                  value={cfg.ipd.pcs3HPPN}
                  onChange={(e) => setCfg({ ...cfg, ipd: { ...cfg.ipd, pcs3HPPN: parseFloat(e.target.value) || 0 } })}
                  className="w-full p-1.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-600 font-mono"
                />
              </div>
              <div>
                <label className="text-slate-500">PCS 4 (Intensive)</label>
                <input
                  type="number"
                  step="0.5"
                  value={cfg.ipd.pcs4HPPN}
                  onChange={(e) => setCfg({ ...cfg, ipd: { ...cfg.ipd, pcs4HPPN: parseFloat(e.target.value) || 0 } })}
                  className="w-full p-1.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-600 font-mono"
                />
              </div>
              <div>
                <label className="text-slate-500">PCS 5 (Ventilator)</label>
                <input
                  type="number"
                  step="1.0"
                  value={cfg.ipd.pcs5HPPN}
                  onChange={(e) => setCfg({ ...cfg, ipd: { ...cfg.ipd, pcs5HPPN: parseFloat(e.target.value) || 0 } })}
                  className="w-full p-1.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-600 font-mono"
                />
              </div>
            </div>
          </div>

          <div className="pt-2 flex items-center justify-between">
            <button
              type="button"
              onClick={handleReset}
              className="text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>คืนค่ามาตรฐาน สธ.</span>
            </button>

            <button
              type="submit"
              className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold flex items-center gap-1.5 shadow-sm"
            >
              <Save className="w-3.5 h-3.5" />
              <span>บันทึกเกณฑ์มาตรฐาน</span>
            </button>
          </div>

        </form>
      </div>
    </div>
  );
};
