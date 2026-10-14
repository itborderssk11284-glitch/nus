import React, { useState, useMemo } from 'react';
import { DailyRecord, StandardWeightsConfig } from '../types/nursing';
import { calculateHospitalOverall } from '../utils/calculator';
import { exportToExcel } from '../utils/exportUtils';
import { HospitalLogo } from './HospitalLogo';
import {
  FileSpreadsheet,
  Printer,
  Calendar,
  Search,
  Filter,
  Eye,
  Trash2,
  Download,
  CalendarDays,
  CalendarRange,
  Clock,
  Layers,
  ChevronDown,
} from 'lucide-react';

export type ReportPeriodType = 'daily' | 'monthly' | 'yearly';

interface ReportsViewProps {
  records: DailyRecord[];
  onSelectRecord: (date: string) => void;
  onDeleteRecord: (id: string) => void;
  standardsConfig: StandardWeightsConfig;
}

export const ReportsView: React.FC<ReportsViewProps> = ({
  records,
  onSelectRecord,
  onDeleteRecord,
  standardsConfig,
}) => {
  // Period Mode: 'daily' | 'monthly' | 'yearly'
  const [periodType, setPeriodType] = useState<ReportPeriodType>('daily');

  // Selected Date, Month, Year
  const today = new Date();
  const todayISO = today.toISOString().slice(0, 10);
  const currentMonthISO = today.toISOString().slice(0, 7); // YYYY-MM
  const currentYearStr = String(today.getFullYear());       // YYYY

  const [selectedDailyDate, setSelectedDailyDate] = useState<string>(todayISO);
  const [selectedMonth, setSelectedMonth] = useState<string>(currentMonthISO);
  const [selectedYear, setSelectedYear] = useState<string>(currentYearStr);

  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'understaffed' | 'balanced'>('all');

  // Filter records based on active period type
  const periodFilteredRecords = useMemo(() => {
    return records.filter((r) => {
      if (periodType === 'daily') {
        return r.date === selectedDailyDate;
      } else if (periodType === 'monthly') {
        return r.date.startsWith(selectedMonth);
      } else if (periodType === 'yearly') {
        return r.date.startsWith(selectedYear);
      }
      return true;
    });
  }, [records, periodType, selectedDailyDate, selectedMonth, selectedYear]);

  // Apply search and status filter
  const displayedRecords = useMemo(() => {
    return periodFilteredRecords.filter((rec) => {
      const calc = calculateHospitalOverall(rec, standardsConfig);
      const matchSearch =
        rec.date.includes(searchTerm) ||
        (rec.recorderName && rec.recorderName.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (rec.notes && rec.notes.toLowerCase().includes(searchTerm.toLowerCase()));

      if (!matchSearch) return false;

      if (statusFilter === 'understaffed') return calc.overallStatus === 'understaffed';
      if (statusFilter === 'balanced') return calc.overallStatus === 'balanced';
      return true;
    });
  }, [periodFilteredRecords, searchTerm, statusFilter, standardsConfig]);

  // Aggregate metrics for the period
  const aggregateMetrics = useMemo(() => {
    if (displayedRecords.length === 0) {
      return {
        totalDays: 0,
        totalTNH: 0,
        totalDirect: 0,
        totalIndirect: 0,
        totalSupport: 0,
        avgActualStaff: 0,
        avgRequiredStaff: 0,
        avgFTE: 0,
        avgProductivity: 0,
        understaffedDays: 0,
      };
    }

    let sumTNH = 0;
    let sumDirect = 0;
    let sumIndirect = 0;
    let sumSupport = 0;
    let sumActual = 0;
    let sumRequired = 0;
    let sumFTE = 0;
    let sumProd = 0;
    let underDays = 0;

    displayedRecords.forEach((r) => {
      const c = calculateHospitalOverall(r, standardsConfig);
      sumTNH += c.totalNursingHours;
      sumDirect += c.totalDirectCareHours;
      sumIndirect += c.totalIndirectCareHours;
      sumSupport += c.totalSupportCareHours;
      sumActual += c.totalActualStaff;
      sumRequired += c.totalRequiredStaff;
      sumFTE += c.totalRequiredFTE;
      sumProd += c.averageProductivityRate;
      if (c.overallStatus === 'understaffed') underDays++;
    });

    const count = displayedRecords.length;
    return {
      totalDays: count,
      totalTNH: Number(sumTNH.toFixed(1)),
      totalDirect: Number(sumDirect.toFixed(1)),
      totalIndirect: Number(sumIndirect.toFixed(1)),
      totalSupport: Number(sumSupport.toFixed(1)),
      avgActualStaff: Math.round(sumActual / count),
      avgRequiredStaff: Math.round(sumRequired / count),
      avgFTE: Number((sumFTE / count).toFixed(2)),
      avgProductivity: Math.round(sumProd / count),
      understaffedDays: underDays,
    };
  }, [displayedRecords, standardsConfig]);

  const handlePrint = () => {
    window.print();
  };

  const handleExcelExport = () => {
    const periodLabel =
      periodType === 'daily'
        ? `รายงานค่างานประจำวัน_${selectedDailyDate}`
        : periodType === 'monthly'
        ? `รายงานค่างานประจำเดือน_${selectedMonth}`
        : `รายงานค่างานประจำปี_${selectedYear}`;
    exportToExcel(displayedRecords, standardsConfig, periodLabel);
  };

  // Thai Period Display Title
  const periodTitle = useMemo(() => {
    if (periodType === 'daily') {
      const d = new Date(selectedDailyDate);
      return `รายงานประจำวัน: ${d.toLocaleDateString('th-TH', { dateStyle: 'long' })}`;
    } else if (periodType === 'monthly') {
      const [y, m] = selectedMonth.split('-');
      const d = new Date(parseInt(y), parseInt(m) - 1, 1);
      return `รายงานประจำเดือน: ${d.toLocaleDateString('th-TH', { month: 'long', year: 'numeric' })}`;
    } else {
      const thaiYear = parseInt(selectedYear) + 543;
      return `รายงานประจำปี: พ.ศ. ${thaiYear} (ค.ศ. ${selectedYear})`;
    }
  }, [periodType, selectedDailyDate, selectedMonth, selectedYear]);

  return (
    <div className="space-y-5">
      
      {/* Official Government Print Layout (Hidden on Screen, Printed on Paper/PDF) */}
      <div className="hidden print:block print-only p-8 text-black bg-white max-w-4xl mx-auto space-y-5">
        <div className="text-center space-y-1.5 border-b-2 border-emerald-900 pb-4">
          <div className="flex justify-center mb-1">
            <HospitalLogo size={60} />
          </div>
          <h1 className="text-lg font-bold font-serif">โรงพยาบาลสังขละบุรี จังหวัดกาญจนบุรี</h1>
          <h2 className="text-base font-bold text-emerald-950">
            Sangkhlaburi Hospital Smart Workload and Workforce Assessment System
          </h2>
          <p className="text-xs text-gray-700 font-semibold">{periodTitle} • ค่างาน 3 ส่วน (งานหลัก • งานรอง • งานสนับสนุน)</p>
          <p className="text-[11px] text-gray-500">
            กลุ่มงานการพยาบาล • มาตรฐานการคำนวณสภาการพยาบาลและกระทรวงสาธารณสุข
          </p>
        </div>

        {/* Aggregate Summary Box on Print */}
        <div className="grid grid-cols-4 gap-2 text-xs border border-gray-300 p-3 rounded">
          <div>
            <span className="text-gray-600 block">จำนวนวันบันทึก:</span>
            <span className="font-bold">{aggregateMetrics.totalDays} วัน</span>
          </div>
          <div>
            <span className="text-gray-600 block">ค่างานรวม (TNH):</span>
            <span className="font-bold">{aggregateMetrics.totalTNH} ชม.</span>
          </div>
          <div>
            <span className="text-gray-600 block">งานหลัก/รอง/หนุน:</span>
            <span className="font-bold">
              {aggregateMetrics.totalDirect} / {aggregateMetrics.totalIndirect} / {aggregateMetrics.totalSupport} ชม.
            </span>
          </div>
          <div>
            <span className="text-gray-600 block">พยาบาลเฉลี่ยจริง/ควรมี:</span>
            <span className="font-bold">
              {aggregateMetrics.avgActualStaff} / {aggregateMetrics.avgRequiredStaff} คน (FTE: {aggregateMetrics.avgFTE})
            </span>
          </div>
        </div>

        {/* Records Table on Print */}
        <table className="w-full text-[11px] border-collapse border border-gray-400 mt-3">
          <thead>
            <tr className="bg-gray-100 font-bold text-center">
              <th className="border border-gray-400 p-1.5">วันที่</th>
              <th className="border border-gray-400 p-1.5">งานหลัก</th>
              <th className="border border-gray-400 p-1.5">งานรอง</th>
              <th className="border border-gray-400 p-1.5">งานสนับสนุน</th>
              <th className="border border-gray-400 p-1.5">ค่างานรวม (TNH)</th>
              <th className="border border-gray-400 p-1.5">จริง/ควรมี</th>
              <th className="border border-gray-400 p-1.5">Gap</th>
              <th className="border border-gray-400 p-1.5">ผลิตภาพ</th>
              <th className="border border-gray-400 p-1.5">สถานะ</th>
              <th className="border border-gray-400 p-1.5">ผู้ตรวจนับ</th>
            </tr>
          </thead>
          <tbody>
            {displayedRecords.map((r) => {
              const c = calculateHospitalOverall(r, standardsConfig);
              return (
                <tr key={r.id} className="text-center">
                  <td className="border border-gray-400 p-1 font-mono">{r.date}</td>
                  <td className="border border-gray-400 p-1">{c.totalDirectCareHours}</td>
                  <td className="border border-gray-400 p-1">{c.totalIndirectCareHours}</td>
                  <td className="border border-gray-400 p-1">{c.totalSupportCareHours}</td>
                  <td className="border border-gray-400 p-1 font-bold">{c.totalNursingHours}</td>
                  <td className="border border-gray-400 p-1">{c.totalActualStaff}/{c.totalRequiredStaff}</td>
                  <td className="border border-gray-400 p-1 font-bold">
                    {c.overallGap >= 0 ? `+${c.overallGap}` : c.overallGap}
                  </td>
                  <td className="border border-gray-400 p-1">{c.averageProductivityRate}%</td>
                  <td className="border border-gray-400 p-1">
                    {c.overallStatus === 'balanced' ? 'พอเหมาะ' : c.overallStatus === 'understaffed' ? 'ขาดแคลน' : 'เกินเกณฑ์'}
                  </td>
                  <td className="border border-gray-400 p-1 text-left">{r.recorderName || '-'}</td>
                </tr>
              );
            })}
          </tbody>
        </table>

        {/* Signature Blocks */}
        <div className="grid grid-cols-3 gap-6 pt-16 text-center text-xs">
          <div className="space-y-12">
            <div>ลงชื่อ..........................................................</div>
            <div>
              <p className="font-semibold">(..........................................................)</p>
              <p className="text-gray-600">พยาบาลตรวจการเวรผู้จัดทำ</p>
            </div>
          </div>
          <div className="space-y-12">
            <div>ลงชื่อ..........................................................</div>
            <div>
              <p className="font-semibold">(..........................................................)</p>
              <p className="text-gray-600">หัวหน้ากลุ่มงานการพยาบาล</p>
            </div>
          </div>
          <div className="space-y-12">
            <div>ลงชื่อ..........................................................</div>
            <div>
              <p className="font-semibold">(..........................................................)</p>
              <p className="text-gray-600">ผู้อำนวยการโรงพยาบาลสังขละบุรี</p>
            </div>
          </div>
        </div>
      </div>

      {/* Screen Interface (no-print) */}
      <div className="no-print space-y-5">
        
        {/* Top Header Card */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl p-4 sm:p-5 border border-slate-200/80 dark:border-slate-800 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <FileSpreadsheet className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
              <span>ระบบรายงานค่างานและอัตรากำลังพยาบาล</span>
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              เลือกดูสรุปสถิติ รายวัน • รายเดือน • รายปี พร้อมส่งออกไฟล์ Excel (.xlsx) และ PDF
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={handleExcelExport}
              className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs flex items-center gap-1.5 shadow-sm transition-all active:scale-95"
            >
              <Download className="w-4 h-4" />
              <span>ส่งออก Excel ({displayedRecords.length} รายการ)</span>
            </button>

            <button
              onClick={handlePrint}
              className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 dark:bg-slate-800 text-white font-semibold text-xs flex items-center gap-1.5 transition-all"
            >
              <Printer className="w-4 h-4" />
              <span>พิมพ์ PDF ทางการ</span>
            </button>
          </div>
        </div>

        {/* Period Selector Tabs & Calendar Pickers */}
        <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-3.5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            
            {/* Period Type Segmented Controls (รายวัน / รายเดือน / รายปี) */}
            <div className="flex items-center gap-1 p-1 bg-slate-100 dark:bg-slate-800 rounded-xl w-fit">
              <button
                onClick={() => setPeriodType('daily')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  periodType === 'daily'
                    ? 'bg-emerald-600 text-white shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <Calendar className="w-3.5 h-3.5" />
                <span>รายวัน (Daily)</span>
              </button>

              <button
                onClick={() => setPeriodType('monthly')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  periodType === 'monthly'
                    ? 'bg-emerald-600 text-white shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <CalendarDays className="w-3.5 h-3.5" />
                <span>รายเดือน (Monthly)</span>
              </button>

              <button
                onClick={() => setPeriodType('yearly')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  periodType === 'yearly'
                    ? 'bg-emerald-600 text-white shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <CalendarRange className="w-3.5 h-3.5" />
                <span>รายปี (Yearly)</span>
              </button>
            </div>

            {/* Interactive Calendar / Month / Year Picker Controls */}
            <div className="flex items-center gap-2">
              {/* Daily Date Picker Button */}
              {periodType === 'daily' && (
                <div className="flex items-center gap-1.5 bg-slate-50 dark:bg-slate-800 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700">
                  <Calendar className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                  <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">เลือกวันที่:</span>
                  <input
                    type="date"
                    value={selectedDailyDate}
                    onChange={(e) => setSelectedDailyDate(e.target.value)}
                    className="text-xs font-bold font-mono bg-transparent text-slate-900 dark:text-white focus:outline-hidden cursor-pointer"
                  />
                </div>
              )}

              {/* Monthly Picker Button */}
              {periodType === 'monthly' && (
                <div className="flex items-center gap-1.5 bg-slate-50 dark:bg-slate-800 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700">
                  <CalendarDays className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                  <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">เลือกเดือน:</span>
                  <input
                    type="month"
                    value={selectedMonth}
                    onChange={(e) => setSelectedMonth(e.target.value)}
                    className="text-xs font-bold font-mono bg-transparent text-slate-900 dark:text-white focus:outline-hidden cursor-pointer"
                  />
                </div>
              )}

              {/* Yearly Picker Button */}
              {periodType === 'yearly' && (
                <div className="flex items-center gap-1.5 bg-slate-50 dark:bg-slate-800 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700">
                  <CalendarRange className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                  <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">เลือกปี พ.ศ./ค.ศ.:</span>
                  <select
                    value={selectedYear}
                    onChange={(e) => setSelectedYear(e.target.value)}
                    className="text-xs font-bold font-mono bg-transparent text-slate-900 dark:text-white focus:outline-hidden cursor-pointer"
                  >
                    {[2024, 2025, 2026, 2027].map((y) => (
                      <option key={y} value={String(y)} className="dark:bg-slate-900">
                        พ.ศ. {y + 543} (ค.ศ. {y})
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>
          </div>

          <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 pt-2 border-t border-slate-100 dark:border-slate-800">
            <span className="font-semibold text-slate-800 dark:text-slate-200">
              {periodTitle}
            </span>
            <span>พบข้อมูลทั้งหมด: {displayedRecords.length} วัน</span>
          </div>
        </div>

        {/* Aggregated Analytics KPI Cards for Selected Period */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
          {/* Card 1: Total Hours & Care 3 Parts */}
          <div className="p-3.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800">
            <div className="text-[11px] text-slate-500">ค่างานรวม (TNH) ประจำช่วง</div>
            <div className="text-2xl font-extrabold font-mono text-emerald-600 dark:text-emerald-400 mt-1">
              {aggregateMetrics.totalTNH} <span className="text-xs font-normal">ชม.</span>
            </div>
            <div className="text-[10px] text-slate-400 mt-1">
              หลัก: {aggregateMetrics.totalDirect} • รอง: {aggregateMetrics.totalIndirect} • หนุน: {aggregateMetrics.totalSupport}
            </div>
          </div>

          {/* Card 2: Average Staff */}
          <div className="p-3.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800">
            <div className="text-[11px] text-slate-500">พยาบาลเฉลี่ย (จริง/ควรมี)</div>
            <div className="text-2xl font-extrabold font-mono text-slate-900 dark:text-white mt-1">
              <span className="text-blue-600 dark:text-blue-400">{aggregateMetrics.avgActualStaff}</span>
              <span className="text-slate-400 font-light"> / </span>
              {aggregateMetrics.avgRequiredStaff}
              <span className="text-xs font-normal text-slate-400"> คน/วัน</span>
            </div>
            <div className="text-[10px] text-slate-400 mt-1">
              FTE เฉลี่ย: {aggregateMetrics.avgFTE} อัตรา
            </div>
          </div>

          {/* Card 3: Productivity */}
          <div className="p-3.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800">
            <div className="text-[11px] text-slate-500">อัตราผลิตภาพเฉลี่ย</div>
            <div className="text-2xl font-extrabold font-mono text-purple-600 dark:text-purple-400 mt-1">
              {aggregateMetrics.avgProductivity}%
            </div>
            <div className="text-[10px] text-slate-400 mt-1">
              เป้าหมายสภาฯ: 85 - 115%
            </div>
          </div>

          {/* Card 4: Understaffed alert count */}
          <div className="p-3.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800">
            <div className="text-[11px] text-slate-500">วันที่กำลังคนขาด/งานล้น</div>
            <div className="text-2xl font-extrabold font-mono text-rose-600 dark:text-rose-400 mt-1">
              {aggregateMetrics.understaffedDays} <span className="text-xs font-normal">วัน</span>
            </div>
            <div className="text-[10px] text-slate-400 mt-1">
              จากทั้งหมด {aggregateMetrics.totalDays} วันที่บันทึก
            </div>
          </div>
        </div>

        {/* Search & Filter Toolbar */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white dark:bg-slate-900 p-3 rounded-2xl border border-slate-200/80 dark:border-slate-800">
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="ค้นหาวันที่, ผู้ตรวจนับ..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:outline-hidden"
            />
          </div>

          <div className="flex items-center gap-1 text-xs">
            <Filter className="w-3.5 h-3.5 text-slate-400" />
            <button
              onClick={() => setStatusFilter('all')}
              className={`px-2.5 py-1 rounded-lg font-medium transition-colors ${
                statusFilter === 'all'
                  ? 'bg-emerald-600 text-white'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
              }`}
            >
              ทั้งหมด ({periodFilteredRecords.length})
            </button>
            <button
              onClick={() => setStatusFilter('understaffed')}
              className={`px-2.5 py-1 rounded-lg font-medium transition-colors ${
                statusFilter === 'understaffed'
                  ? 'bg-rose-600 text-white'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
              }`}
            >
              🔴 ขาดแคลน
            </button>
            <button
              onClick={() => setStatusFilter('balanced')}
              className={`px-2.5 py-1 rounded-lg font-medium transition-colors ${
                statusFilter === 'balanced'
                  ? 'bg-emerald-600 text-white'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
              }`}
            >
              🟢 พอเหมาะ
            </button>
          </div>
        </div>

        {/* Data Records Table */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 font-semibold">
                <tr>
                  <th className="py-3 px-3">วันที่</th>
                  <th className="py-3 px-2 text-right">งานหลัก</th>
                  <th className="py-3 px-2 text-right">งานรอง</th>
                  <th className="py-3 px-2 text-right">งานหนุน</th>
                  <th className="py-3 px-2.5 text-right">TNH รวม</th>
                  <th className="py-3 px-2 text-center">จริง / ควรมี</th>
                  <th className="py-3 px-2 text-center">ส่วนต่าง (Gap)</th>
                  <th className="py-3 px-2 text-center">ผลิตภาพ</th>
                  <th className="py-3 px-2 text-center">สถานะ</th>
                  <th className="py-3 px-3">ผู้บันทึก</th>
                  <th className="py-3 px-3 text-center">การจัดการ</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-medium">
                {displayedRecords.length === 0 ? (
                  <tr>
                    <td colSpan={11} className="py-8 text-center text-slate-400 text-xs">
                      ไม่พบข้อมูลบันทึกสถิติในรอบเวลา {periodTitle}
                    </td>
                  </tr>
                ) : (
                  displayedRecords.map((r) => {
                    const c = calculateHospitalOverall(r, standardsConfig);
                    return (
                      <tr
                        key={r.id}
                        className="hover:bg-slate-50/80 dark:hover:bg-slate-800/50 transition-colors"
                      >
                        <td className="py-3 px-3 font-mono font-bold text-slate-900 dark:text-white">
                          {r.date}
                        </td>
                        <td className="py-3 px-2 text-right font-mono text-emerald-600 dark:text-emerald-400">
                          {c.totalDirectCareHours}
                        </td>
                        <td className="py-3 px-2 text-right font-mono text-blue-600 dark:text-blue-400">
                          {c.totalIndirectCareHours}
                        </td>
                        <td className="py-3 px-2 text-right font-mono text-purple-600 dark:text-purple-400">
                          {c.totalSupportCareHours}
                        </td>
                        <td className="py-3 px-2.5 text-right font-mono font-bold text-slate-900 dark:text-white">
                          {c.totalNursingHours}
                        </td>
                        <td className="py-3 px-2 text-center font-mono">
                          <span className="font-bold text-blue-600 dark:text-blue-400">{c.totalActualStaff}</span>
                          <span className="text-slate-400"> / </span>
                          <span>{c.totalRequiredStaff}</span>
                        </td>
                        <td className="py-3 px-2 text-center font-mono font-bold">
                          <span className={`px-1.5 py-0.5 rounded text-[11px] ${
                            c.overallGap < 0
                              ? 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300'
                              : c.overallGap === 0
                              ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                              : 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                          }`}>
                            {c.overallGap >= 0 ? `+${c.overallGap}` : c.overallGap}
                          </span>
                        </td>
                        <td className="py-3 px-2 text-center font-mono text-purple-600 dark:text-purple-400 font-semibold">
                          {c.averageProductivityRate}%
                        </td>
                        <td className="py-3 px-2 text-center">
                          <span className={`px-1.5 py-0.5 rounded text-[10px] font-semibold ${
                            c.overallStatus === 'balanced'
                              ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300'
                              : c.overallStatus === 'understaffed'
                              ? 'bg-rose-50 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300'
                              : 'bg-amber-50 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300'
                          }`}>
                            {c.overallStatus === 'balanced' ? '🟢 พอเหมาะ' : c.overallStatus === 'understaffed' ? '🔴 ขาดแคลน' : '🟡 เกิน'}
                          </span>
                        </td>
                        <td className="py-3 px-3 text-slate-600 dark:text-slate-400 truncate max-w-[120px]">
                          {r.recorderName || '-'}
                        </td>
                        <td className="py-3 px-3 text-center">
                          <div className="flex items-center justify-center gap-1">
                            <button
                              onClick={() => onSelectRecord(r.date)}
                              title="ดูรายละเอียดวันที่นี้"
                              className="p-1 rounded-lg bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950 dark:hover:bg-emerald-900 text-emerald-600 dark:text-emerald-400"
                            >
                              <Eye className="w-3.5 h-3.5" />
                            </button>
                            {records.length > 1 && (
                              <button
                                onClick={() => {
                                  if (confirm(`ยืนยันการลบข้อมูลวันที่ ${r.date}?`)) {
                                    onDeleteRecord(r.id);
                                  }
                                }}
                                title="ลบข้อมูล"
                                className="p-1 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>

      </div>

    </div>
  );
};
