"use client";

import { Calendar } from "lucide-react";
import { useState, useEffect } from "react";

interface DateRangePickerProps {
  onDateRangeChange: (startDate: string, endDate: string, compareStartDate?: string, compareEndDate?: string) => void;
}

export function DateRangePicker({ onDateRangeChange }: DateRangePickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedMode, setSelectedMode] = useState<"preset" | "custom" | "month">("preset");
  const [selectedLabel, setSelectedLabel] = useState("Last 30 days");
  
  const [customStart, setCustomStart] = useState("");
  const [customEnd, setCustomEnd] = useState("");
  
  const [selectedMonth, setSelectedMonth] = useState("");
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear().toString());
  
  const [compareEnabled, setCompareEnabled] = useState(false);

  const presets = [
    { label: "Today", getDates: () => {
      const today = new Date();
      return { start: today, end: today };
    }},
    { label: "Yesterday", getDates: () => {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      return { start: yesterday, end: yesterday };
    }},
    { label: "Last 7 days", getDates: () => {
      const end = new Date();
      const start = new Date();
      start.setDate(end.getDate() - 7);
      return { start, end };
    }},
    { label: "Last 30 days", getDates: () => {
      const end = new Date();
      const start = new Date();
      start.setDate(end.getDate() - 30);
      return { start, end };
    }},
    { label: "This month", getDates: () => {
      const now = new Date();
      const start = new Date(now.getFullYear(), now.getMonth(), 1);
      const end = new Date();
      return { start, end };
    }},
    { label: "Last month", getDates: () => {
      const now = new Date();
      const start = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      const end = new Date(now.getFullYear(), now.getMonth(), 0);
      return { start, end };
    }},
    { label: "This quarter", getDates: () => {
      const now = new Date();
      const quarter = Math.floor(now.getMonth() / 3);
      const start = new Date(now.getFullYear(), quarter * 3, 1);
      const end = new Date();
      return { start, end };
    }},
    { label: "Last quarter", getDates: () => {
      const now = new Date();
      const quarter = Math.floor(now.getMonth() / 3);
      const start = new Date(now.getFullYear(), (quarter - 1) * 3, 1);
      const end = new Date(now.getFullYear(), quarter * 3, 0);
      return { start, end };
    }},
    { label: "This year", getDates: () => {
      const now = new Date();
      const start = new Date(now.getFullYear(), 0, 1);
      const end = new Date();
      return { start, end };
    }},
    { label: "Last year", getDates: () => {
      const now = new Date();
      const start = new Date(now.getFullYear() - 1, 0, 1);
      const end = new Date(now.getFullYear() - 1, 11, 31);
      return { start, end };
    }},
  ];

  const months = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];

  const years = Array.from({ length: 10 }, (_, i) => new Date().getFullYear() - i);

  const formatDate = (date: Date) => date.toISOString().split('T')[0];

  const getPreviousPeriod = (start: Date, end: Date) => {
    const duration = end.getTime() - start.getTime();
    const compareEnd = new Date(start.getTime() - 1);
    const compareStart = new Date(compareEnd.getTime() - duration);
    return { compareStart, compareEnd };
  };

  const handlePresetClick = (preset: typeof presets[0]) => {
    const { start, end } = preset.getDates();
    setSelectedLabel(preset.label);
    setSelectedMode("preset");
    
    if (compareEnabled) {
      const { compareStart, compareEnd } = getPreviousPeriod(start, end);
      onDateRangeChange(formatDate(start), formatDate(end), formatDate(compareStart), formatDate(compareEnd));
    } else {
      onDateRangeChange(formatDate(start), formatDate(end));
    }
    
    setIsOpen(false);
  };

  const handleCustomApply = () => {
    if (!customStart || !customEnd) return;
    
    const start = new Date(customStart);
    const end = new Date(customEnd);
    
    setSelectedLabel(`${customStart} - ${customEnd}`);
    setSelectedMode("custom");
    
    if (compareEnabled) {
      const { compareStart, compareEnd } = getPreviousPeriod(start, end);
      onDateRangeChange(customStart, customEnd, formatDate(compareStart), formatDate(compareEnd));
    } else {
      onDateRangeChange(customStart, customEnd);
    }
    
    setIsOpen(false);
  };

  const handleMonthApply = () => {
    if (!selectedMonth) return;
    
    const monthIndex = months.indexOf(selectedMonth);
    const year = parseInt(selectedYear);
    const start = new Date(year, monthIndex, 1);
    const end = new Date(year, monthIndex + 1, 0);
    
    setSelectedLabel(`${selectedMonth} ${selectedYear}`);
    setSelectedMode("month");
    
    if (compareEnabled) {
      const { compareStart, compareEnd } = getPreviousPeriod(start, end);
      onDateRangeChange(formatDate(start), formatDate(end), formatDate(compareStart), formatDate(compareEnd));
    } else {
      onDateRangeChange(formatDate(start), formatDate(end));
    }
    
    setIsOpen(false);
  };

  useEffect(() => {
    const preset = presets.find(p => p.label === "Last 30 days");
    if (preset) {
      const { start, end } = preset.getDates();
      onDateRangeChange(formatDate(start), formatDate(end));
    }
  }, []);

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-lg text-gray-900 hover:bg-gray-50 transition text-sm font-medium shadow-sm"
      >
        <Calendar className="h-4 w-4" />
        {selectedLabel}
        {compareEnabled && <span className="text-xs text-purple-600 ml-1">(vs previous)</span>}
      </button>
      
      {isOpen && (
        <>
          <div 
            className="fixed inset-0 z-40" 
            onClick={() => setIsOpen(false)}
          />
          <div className="absolute left-0 mt-2 w-96 bg-white border border-gray-200 rounded-lg shadow-xl z-50 overflow-hidden">
            <div className="flex border-b border-gray-200">
              <button
                onClick={() => setSelectedMode("preset")}
                className={`flex-1 px-4 py-2 text-sm font-medium transition ${
                  selectedMode === "preset"
                    ? "bg-purple-50 text-purple-700 border-b-2 border-purple-600"
                    : "text-gray-600 hover:bg-gray-50"
                }`}
              >
                Quick Select
              </button>
              <button
                onClick={() => setSelectedMode("month")}
                className={`flex-1 px-4 py-2 text-sm font-medium transition ${
                  selectedMode === "month"
                    ? "bg-purple-50 text-purple-700 border-b-2 border-purple-600"
                    : "text-gray-600 hover:bg-gray-50"
                }`}
              >
                Month/Year
              </button>
              <button
                onClick={() => setSelectedMode("custom")}
                className={`flex-1 px-4 py-2 text-sm font-medium transition ${
                  selectedMode === "custom"
                    ? "bg-purple-50 text-purple-700 border-b-2 border-purple-600"
                    : "text-gray-600 hover:bg-gray-50"
                }`}
              >
                Custom Range
              </button>
            </div>

            <div className="p-4 max-h-96 overflow-y-auto">
              {selectedMode === "preset" && (
                <div className="grid grid-cols-2 gap-2">
                  {presets.map((preset) => (
                    <button
                      key={preset.label}
                      onClick={() => handlePresetClick(preset)}
                      className="text-left px-3 py-2 text-sm rounded-md transition hover:bg-purple-50 hover:text-purple-700 text-gray-900 font-medium"
                    >
                      {preset.label}
                    </button>
                  ))}
                </div>
              )}

              {selectedMode === "month" && (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-bold text-gray-900 mb-2">
                      Select Month
                    </label>
                    <div className="grid grid-cols-3 gap-2">
                      {months.map((month) => (
                        <button
                          key={month}
                          onClick={() => setSelectedMonth(month)}
                          className={`px-3 py-2 text-sm font-semibold rounded-md transition ${
                            selectedMonth === month
                              ? "bg-purple-600 text-white"
                              : "bg-gray-100 text-gray-900 hover:bg-gray-200"
                          }`}
                        >
                          {month.slice(0, 3)}
                        </button>
                      ))}
                    </div>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-bold text-gray-900 mb-2">
                      Select Year
                    </label>
                    <select
                      value={selectedYear}
                      onChange={(e) => setSelectedYear(e.target.value)}
                      className="w-full px-3 py-2 bg-white border border-gray-300 rounded-md text-sm font-medium text-gray-900"
                    >
                      {years.map((year) => (
                        <option key={year} value={year}>
                          {year}
                        </option>
                      ))}
                    </select>
                  </div>

                  <button
                    onClick={handleMonthApply}
                    disabled={!selectedMonth}
                    className="w-full px-4 py-2 bg-purple-600 text-white rounded-md text-sm font-bold hover:bg-purple-700 disabled:bg-gray-300 disabled:cursor-not-allowed disabled:text-gray-500 transition"
                  >
                    Apply
                  </button>
                </div>
              )}

              {selectedMode === "custom" && (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-bold text-gray-900 mb-2">
                      Start Date
                    </label>
                    <input
                      type="date"
                      value={customStart}
                      onChange={(e) => setCustomStart(e.target.value)}
                      className="w-full px-3 py-2.5 border-2 border-gray-300 rounded-md text-sm font-medium text-gray-900 focus:border-purple-500 focus:ring-2 focus:ring-purple-200"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-bold text-gray-900 mb-2">
                      End Date
                    </label>
                    <input
                      type="date"
                      value={customEnd}
                      onChange={(e) => setCustomEnd(e.target.value)}
                      className="w-full px-3 py-2.5 border-2 border-gray-300 rounded-md text-sm font-medium text-gray-900 focus:border-purple-500 focus:ring-2 focus:ring-purple-200"
                    />
                  </div>

                  <button
                    onClick={handleCustomApply}
                    disabled={!customStart || !customEnd}
                    className="w-full px-4 py-2 bg-purple-600 text-white rounded-md text-sm font-bold hover:bg-purple-700 disabled:bg-gray-300 disabled:cursor-not-allowed disabled:text-gray-500 transition"
                  >
                    Apply
                  </button>
                </div>
              )}
            </div>

            <div className="border-t border-gray-200 p-3 bg-gray-50">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={compareEnabled}
                  onChange={(e) => {
                    setCompareEnabled(e.target.checked);
                    if (selectedMode === "preset") {
                      const preset = presets.find(p => p.label === selectedLabel);
                      if (preset) handlePresetClick(preset);
                    }
                  }}
                  className="w-4 h-4 text-purple-600 border-gray-300 rounded focus:ring-purple-500"
                />
                <span className="text-sm font-semibold text-gray-900">
                  Compare to previous period
                </span>
              </label>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
