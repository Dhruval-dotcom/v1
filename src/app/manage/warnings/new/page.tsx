"use client";

import { useState, useEffect, useMemo } from "react";
import useSWR from "swr";
import Navbar from "@/components/Navbar";
import { useAuth } from "@/hooks/useAuth";

const fetcher = (url: string) => fetch(url).then((r) => r.json());

interface WarningType {
  id: string;
  title: string;
  severity: string;
  details: string;
}

interface Batch {
  id: string;
  name: string;
}

interface Student {
  id: string;
  name: string;
  email: string;
  batch: Batch;
}

function severityColor(severity: string) {
  switch (severity) {
    case "green": return "bg-emerald-100 text-emerald-700 border-emerald-300";
    case "yellow": return "bg-amber-100 text-amber-700 border-amber-300";
    case "orange": return "bg-orange-100 text-orange-700 border-orange-300";
    case "red": return "bg-red-100 text-red-700 border-red-300";
    case "black": return "bg-gray-900 text-white border-gray-700";
    default: return "bg-gray-100 text-gray-700 border-gray-300";
  }
}

function severityEmoji(severity: string) {
  switch (severity) {
    case "green": return "🟢";
    case "yellow": return "🟡";
    case "orange": return "🟠";
    case "red": return "🔴";
    case "black": return "⚫";
    default: return "⚪";
  }
}

function severityBorder(severity: string) {
  switch (severity) {
    case "green": return "border-l-emerald-500";
    case "yellow": return "border-l-amber-500";
    case "orange": return "border-l-orange-500";
    case "red": return "border-l-red-500";
    case "black": return "border-l-gray-900";
    default: return "border-l-gray-300";
  }
}

export default function IssueWarningPage() {
  const { user, isLoading: authLoading } = useAuth();

  const [warningTypeId, setWarningTypeId] = useState("");
  const [batchId, setBatchId] = useState("");
  const [studentId, setStudentId] = useState("");
  const [studentSearch, setStudentSearch] = useState("");
  const [studentDropdownOpen, setStudentDropdownOpen] = useState(false);
  const [detailsText, setDetailsText] = useState("");
  const [actionPlan, setActionPlan] = useState("");
  const [date, setDate] = useState(() => new Date().toISOString().split("T")[0]);
  const [generatedMessage, setGeneratedMessage] = useState("");
  const [generating, setGenerating] = useState(false);
  const [saving, setSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState("");
  const [copied, setCopied] = useState(false);

  const { data: warningTypes } = useSWR<WarningType[]>("/api/warning-types", fetcher);
  const { data: batches } = useSWR<Batch[]>("/api/batches", fetcher);
  const { data: students } = useSWR<Student[]>(
    batchId ? `/api/students?batchId=${batchId}` : null,
    fetcher
  );

  // Auto-select batch for admin
  useEffect(() => {
    if (user?.role === "admin" && user.batchId) {
      setBatchId(user.batchId);
    }
  }, [user]);

  const selectedWarningType = warningTypes?.find((wt) => wt.id === warningTypeId);
  const accentSeverity = selectedWarningType?.severity || "default";

  // Filter students for search
  const filteredStudents = useMemo(() => {
    if (!students) return [];
    if (!studentSearch.trim()) return students;
    const q = studentSearch.toLowerCase();
    return students.filter(
      (s) => s.name.toLowerCase().includes(q) || (s.email && s.email.toLowerCase().includes(q))
    );
  }, [students, studentSearch]);

  const selectedStudent = students?.find((s) => s.id === studentId);

  // When student is selected from dropdown
  const selectStudent = (s: Student) => {
    setStudentId(s.id);
    setStudentSearch(s.name);
    setStudentDropdownOpen(false);
  };

  // Reset student when batch changes
  useEffect(() => {
    setStudentId("");
    setStudentSearch("");
  }, [batchId]);

  const handleGenerateMessage = async () => {
    setGenerating(true);
    try {
      const res = await fetch("/api/warnings/generate-message", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          studentName: selectedStudent?.name,
          warningTitle: selectedWarningType?.title,
          severity: selectedWarningType?.severity,
          details: detailsText,
          actionPlan,
          date,
        }),
      });
      const data = await res.json();
      if (res.ok) {
        setGeneratedMessage(data.message || "");
      }
    } finally {
      setGenerating(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    setSuccessMsg("");
    try {
      const res = await fetch("/api/warnings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          warningTypeId,
          studentId,
          batchId,
          details: detailsText,
          actionPlan,
          date,
          message: generatedMessage,
        }),
      });
      if (res.ok) {
        setSuccessMsg("Warning issued successfully!");
        // Reset form
        setWarningTypeId("");
        setStudentId("");
        setStudentSearch("");
        setDetailsText("");
        setActionPlan("");
        setDate(new Date().toISOString().split("T")[0]);
        setGeneratedMessage("");
        setTimeout(() => setSuccessMsg(""), 4000);
      }
    } finally {
      setSaving(false);
    }
  };

  const handleCopy = async () => {
    await navigator.clipboard.writeText(generatedMessage);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (authLoading) {
    return (
      <>
        <Navbar />
        <div className="mx-auto max-w-3xl px-4 py-8">
          <p className="text-gray-500">Loading...</p>
        </div>
      </>
    );
  }

  if (!user || (user.role !== "super_admin" && user.role !== "admin")) {
    return (
      <>
        <Navbar />
        <div className="mx-auto max-w-3xl px-4 py-8">
          <p className="text-red-500">Access denied.</p>
        </div>
      </>
    );
  }

  const canGenerate = warningTypeId && studentId && batchId;
  const canSave = warningTypeId && studentId && batchId;

  return (
    <>
      <Navbar />
      <div className="mx-auto max-w-3xl px-4 py-8">
        <h1 className="text-2xl font-bold text-gray-700 mb-6">Issue Warning</h1>

        {successMsg && (
          <div className="mb-4 p-3 rounded-lg bg-emerald-100 text-emerald-700 border border-emerald-300 text-sm">
            {successMsg}
          </div>
        )}

        <div
          className={`neu-raised p-6 space-y-5 border-l-4 ${severityBorder(accentSeverity)}`}
        >
          {/* Warning Type */}
          <div>
            <label className="block text-sm font-medium text-gray-600 mb-1">Warning Type</label>
            <select
              value={warningTypeId}
              onChange={(e) => setWarningTypeId(e.target.value)}
              className="neu-input w-full px-3 py-2 text-sm"
            >
              <option value="">Select a warning type...</option>
              {warningTypes?.map((wt) => (
                <option key={wt.id} value={wt.id}>
                  {severityEmoji(wt.severity)} {wt.title} — {wt.details || "No details"}
                </option>
              ))}
            </select>
            {selectedWarningType && (
              <div className="mt-2">
                <span
                  className={`inline-block px-2 py-0.5 rounded border text-xs font-medium ${severityColor(selectedWarningType.severity)}`}
                >
                  {severityEmoji(selectedWarningType.severity)} {selectedWarningType.severity} — {selectedWarningType.title}
                </span>
              </div>
            )}
          </div>

          {/* Batch */}
          <div>
            <label className="block text-sm font-medium text-gray-600 mb-1">Batch</label>
            <select
              value={batchId}
              onChange={(e) => setBatchId(e.target.value)}
              className="neu-input w-full px-3 py-2 text-sm"
              disabled={user.role === "admin"}
            >
              <option value="">Select a batch...</option>
              {batches?.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.name}
                </option>
              ))}
            </select>
            {user.role === "admin" && (
              <p className="text-xs text-gray-400 mt-1">Batch is locked to your assigned batch.</p>
            )}
          </div>

          {/* Student (searchable) */}
          <div className="relative">
            <label className="block text-sm font-medium text-gray-600 mb-1">Student</label>
            <input
              type="text"
              value={studentSearch}
              onChange={(e) => {
                setStudentSearch(e.target.value);
                setStudentId("");
                setStudentDropdownOpen(true);
              }}
              onFocus={() => setStudentDropdownOpen(true)}
              placeholder={batchId ? "Search student by name..." : "Select a batch first"}
              className="neu-input w-full px-3 py-2 text-sm"
              disabled={!batchId}
            />
            {studentDropdownOpen && batchId && filteredStudents.length > 0 && (
              <div className="absolute z-30 mt-1 w-full neu-raised max-h-48 overflow-y-auto">
                {filteredStudents.map((s) => (
                  <button
                    key={s.id}
                    type="button"
                    onClick={() => selectStudent(s)}
                    className="w-full text-left px-3 py-2 text-sm hover:bg-gray-100 flex items-center justify-between"
                  >
                    <span className="text-gray-700">{s.name}</span>
                    <span className="text-xs text-gray-400">{s.batch?.name}</span>
                  </button>
                ))}
              </div>
            )}
            {studentDropdownOpen && batchId && filteredStudents.length === 0 && studentSearch && (
              <div className="absolute z-30 mt-1 w-full neu-raised p-3 text-sm text-gray-400">
                No students found.
              </div>
            )}
            {/* Close dropdown on outside click */}
            {studentDropdownOpen && (
              <div
                className="fixed inset-0 z-20"
                onClick={() => setStudentDropdownOpen(false)}
              />
            )}
          </div>

          {/* Details */}
          <div>
            <label className="block text-sm font-medium text-gray-600 mb-1">Details</label>
            <textarea
              value={detailsText}
              onChange={(e) => setDetailsText(e.target.value)}
              placeholder="Specific details about this warning..."
              className="neu-input w-full px-3 py-2 text-sm min-h-[80px]"
              rows={3}
            />
          </div>

          {/* Action Plan */}
          <div>
            <label className="block text-sm font-medium text-gray-600 mb-1">Action Plan</label>
            <textarea
              value={actionPlan}
              onChange={(e) => setActionPlan(e.target.value)}
              placeholder="What the student should do..."
              className="neu-input w-full px-3 py-2 text-sm min-h-[80px]"
              rows={3}
            />
          </div>

          {/* Date */}
          <div>
            <label className="block text-sm font-medium text-gray-600 mb-1">Date</label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="neu-input w-full px-3 py-2 text-sm"
            />
          </div>

          {/* Generate Message Button */}
          {!generatedMessage && (
            <div className="pt-2">
              <button
                onClick={handleGenerateMessage}
                disabled={!canGenerate || generating}
                className="neu-btn px-5 py-2 text-sm font-medium text-gray-600"
              >
                {generating ? "Generating..." : "Generate Message"}
              </button>
            </div>
          )}

          {/* Generated Message Preview */}
          {generatedMessage && (
            <div className="p-4 rounded-lg bg-gray-50 border border-gray-200">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-medium text-gray-500 uppercase">Generated Message</span>
                <div className="flex gap-2">
                  <button
                    onClick={handleGenerateMessage}
                    disabled={generating}
                    className="neu-btn px-3 py-1 text-xs font-medium text-gray-600"
                  >
                    {generating ? "Regenerating..." : "Regenerate"}
                  </button>
                  <button
                    onClick={handleCopy}
                    className="neu-btn px-3 py-1 text-xs font-medium text-gray-600"
                  >
                    {copied ? "Copied!" : "Copy"}
                  </button>
                </div>
              </div>
              <pre className="text-sm text-gray-700 whitespace-pre-wrap font-sans">{generatedMessage}</pre>
            </div>
          )}

          {/* Save Warning - only visible after message is generated */}
          {generatedMessage && (
            <div className="pt-2">
              <button
                onClick={handleSave}
                disabled={!canSave || saving}
                className="neu-btn-gradient px-5 py-2 text-sm font-medium"
              >
                {saving ? "Saving..." : "Save Warning"}
              </button>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
