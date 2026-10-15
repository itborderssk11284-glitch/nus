/**
 * Storage & Initial Seed Data for Sangkhlaburi Hospital
 * Configured with 3-Part Workload Model (Direct, Indirect, Support)
 */

import { DailyRecord, StandardWeightsConfig } from '../types/nursing';
import {
  DEFAULT_STANDARDS,
  createDefaultIndirectItems,
  createDefaultSupportItems,
} from './calculator';

const STORAGE_KEY_RECORDS = 'sangkhlaburi_nursing_records_v2';
const STORAGE_KEY_STANDARDS = 'sangkhlaburi_nursing_standards_v2';
const STORAGE_KEY_THEME = 'sangkhlaburi_nursing_theme';

export function formatDateISO(d: Date): string {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

// Create a blank/template new daily record for any date
export function createNewDailyRecord(dateStr: string, recorderName = 'พว. พยาบาลตรวจการเวร'): DailyRecord {
  return {
    id: `sk-rec-${dateStr}`,
    date: dateStr,
    recorderName,
    recorderPosition: 'พยาบาลวิชาชีพชำนาญการ / พยาบาลตรวจการเวร',
    recorderPhone: '089-456-7890',
    notes: '',
    shiftType: 'all_day',
    er: {
      triage1_resus: 1,
      triage2_emergency: 4,
      triage3_urgency: 11,
      triage4_semiUrgent: 18,
      triage5_nonUrgent: 8,
      cprCount: 0,
      ambulanceReferral: 1,
      observationCases: 4,
      indirectItems: createDefaultIndirectItems(42),
      supportItems: createDefaultSupportItems(),
      actualStaff: { morning: 3, afternoon: 3, night: 2 },
    },
    opd: {
      generalPatients: 140,
      chronicPatients: 70,
      minorSurgery: 20,
      specialClinic: 25,
      screeningPatients: 210,
      indirectItems: createDefaultIndirectItems(230),
      supportItems: createDefaultSupportItems(),
      actualStaff: { morning: 5, afternoon: 3, night: 0 },
    },
    ipd1: {
      wardName: 'หอผู้ป่วยใน 1 (IPD1 หญิง/กุมาร)',
      bedCapacity: 30,
      currentCensus: 24,
      pcs1_selfCare: 4,
      pcs2_moderateCare: 11,
      pcs3_maximumCare: 7,
      pcs4_intensiveCare: 2,
      pcs5_ventilator: 0,
      admissions: 5,
      discharges: 4,
      indirectItems: createDefaultIndirectItems(24),
      supportItems: createDefaultSupportItems(),
      actualStaff: { morning: 3, afternoon: 3, night: 2 },
    },
    ipd2: {
      wardName: 'หอผู้ป่วยใน 2 (IPD2 ชาย/พิเศษ)',
      bedCapacity: 28,
      currentCensus: 21,
      pcs1_selfCare: 3,
      pcs2_moderateCare: 9,
      pcs3_maximumCare: 6,
      pcs4_intensiveCare: 2,
      pcs5_ventilator: 1,
      admissions: 4,
      discharges: 3,
      indirectItems: createDefaultIndirectItems(21),
      supportItems: createDefaultSupportItems(),
      actualStaff: { morning: 3, afternoon: 2, night: 2 },
    },
    lr: {
      stage1Latent: 2,
      stage1Active: 1,
      stage2Delivery: 2,
      stage3Placenta: 2,
      postpartumRecovery: 2,
      highRiskCases: 1,
      newbornResuscitation: 0,
      referralCases: 0,
      indirectItems: createDefaultIndirectItems(7),
      supportItems: createDefaultSupportItems(),
      actualStaff: { morning: 2, afternoon: 2, night: 1 },
    },
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
}

// Generate Realistic Seed Data
function generateSeedRecords(): DailyRecord[] {
  const records: DailyRecord[] = [];
  const today = new Date();

  for (let i = 6; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(today.getDate() - i);
    const dateStr = formatDateISO(d);
    const rec = createNewDailyRecord(dateStr, i % 2 === 0 ? 'พว. กัลยา วงศ์สุวรรณ' : 'พว. สุภาพร รัตนกาญจน์');
    rec.notes = i === 2 ? 'มีเคส CPR และส่งต่อผู้ป่วยวิกฤตไป รพ.พหลฯ' : 'สถานการณ์เวรปกติ';
    records.push(rec);
  }

  return records;
}

export function loadRecords(): DailyRecord[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_RECORDS);
    if (!raw) {
      const initial = generateSeedRecords();
      saveRecords(initial);
      return initial;
    }
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed) && parsed.length > 0) {
      // Ensure all loaded records have indirectItems & supportItems
      return parsed.map((r: DailyRecord) => {
        if (!r.er.indirectItems) r.er.indirectItems = createDefaultIndirectItems(40);
        if (!r.er.supportItems) r.er.supportItems = createDefaultSupportItems();
        if (!r.opd.indirectItems) r.opd.indirectItems = createDefaultIndirectItems(200);
        if (!r.opd.supportItems) r.opd.supportItems = createDefaultSupportItems();
        if (!r.ipd1.indirectItems) r.ipd1.indirectItems = createDefaultIndirectItems(24);
        if (!r.ipd1.supportItems) r.ipd1.supportItems = createDefaultSupportItems();
        if (!r.ipd2.indirectItems) r.ipd2.indirectItems = createDefaultIndirectItems(20);
        if (!r.ipd2.supportItems) r.ipd2.supportItems = createDefaultSupportItems();
        if (!r.lr.indirectItems) r.lr.indirectItems = createDefaultIndirectItems(6);
        if (!r.lr.supportItems) r.lr.supportItems = createDefaultSupportItems();
        return r;
      });
    }
    const initial = generateSeedRecords();
    saveRecords(initial);
    return initial;
  } catch (err) {
    console.error('Failed to load records from storage', err);
    return generateSeedRecords();
  }
}

export function saveRecords(records: DailyRecord[]): void {
  try {
    localStorage.setItem(STORAGE_KEY_RECORDS, JSON.stringify(records));
  } catch (err) {
    console.error('Failed to save records to storage', err);
  }
}

export function loadStandards(): StandardWeightsConfig {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_STANDARDS);
    if (!raw) return DEFAULT_STANDARDS;
    return JSON.parse(raw);
  } catch {
    return DEFAULT_STANDARDS;
  }
}

export function saveStandards(config: StandardWeightsConfig): void {
  try {
    localStorage.setItem(STORAGE_KEY_STANDARDS, JSON.stringify(config));
  } catch (err) {
    console.error('Failed to save standards config', err);
  }
}

export function resetStandards(): StandardWeightsConfig {
  saveStandards(DEFAULT_STANDARDS);
  return DEFAULT_STANDARDS;
}

export function getThemePreference(): 'light' | 'dark' {
  try {
    const val = localStorage.getItem(STORAGE_KEY_THEME);
    if (val === 'dark' || val === 'light') return val;
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  } catch {
    return 'light';
  }
}

export function saveThemePreference(theme: 'light' | 'dark'): void {
  try {
    localStorage.setItem(STORAGE_KEY_THEME, theme);
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  } catch (e) {
    console.error(e);
  }
}

export type FontScale = 'normal' | 'comfort' | 'large';
const STORAGE_KEY_FONT_SCALE = 'sangkhlaburi_font_scale_v2';

export function getFontScalePreference(): FontScale {
  try {
    const val = localStorage.getItem(STORAGE_KEY_FONT_SCALE);
    if (val === 'comfort' || val === 'large' || val === 'normal') return val as FontScale;
    return 'comfort'; // default to comfort for pleasing legibility
  } catch {
    return 'comfort';
  }
}

export function saveFontScalePreference(scale: FontScale): void {
  try {
    localStorage.setItem(STORAGE_KEY_FONT_SCALE, scale);
    document.documentElement.setAttribute('data-font-scale', scale);
  } catch (e) {
    console.error(e);
  }
}

