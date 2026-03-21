"use client";

import { useState } from "react";
import useSWR from "swr";
import Navbar from "@/components/Navbar";
import Dialog from "@/components/Dialog";
import ConfirmDialog from "@/components/ConfirmDialog";
import { useAuth } from "@/hooks/useAuth";

const fetcher = (url: string) => fetch(url).then((r) => r.json());

interface WarningType {
  id: string;
  title: string;
  severity: string;
  details: string;
  createdAt: string;
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

const SEVERITY_OPTIONS = ["green", "yellow", "orange", "red", "black"];

const PRESET_SUGGESTIONS = [
  { severity: "green", suggestions: "General Note, Heads Up" },
  { severity: "yellow", suggestions: "Medium Priority, Important, Action Needed, Notice" },
  { severity: "orange", suggestions: "High Priority Discussion, Urgent, Time-Sensitive, Important Alert" },
  { severity: "red", suggestions: "Critical, Very Critical, Top Priority" },
  { severity: "black", suggestions: "Immediate Action Required, Final Warning, Deadline Critical, Zero Tolerance Notice" },
];

export default function WarningTypesPage() {
  const { user, isLoading: authLoading } = useAuth();

  const [title, setTitle] = useState("");
  const [severity, setSeverity] = useState("green");
  const [details, setDetails] = useState("");
  const [saving, setSaving] = useState(false);
  const [refOpen, setRefOpen] = useState(false);

  // Edit state
  const [editOpen, setEditOpen] = useState(false);
  const [editId, setEditId] = useState("");
  const [editTitle, setEditTitle] = useState("");
  const [editSeverity, setEditSeverity] = useState("green");
  const [editDetails, setEditDetails] = useState("");
  const [editSaving, setEditSaving] = useState(false);

  // Delete state
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleteId, setDeleteId] = useState("");
  const [deleteName, setDeleteName] = useState("");
  const [deleting, setDeleting] = useState(false);

  const { data: warningTypes, mutate } = useSWR<WarningType[]>(
    "/api/warning-types",
    fetcher
  );

  if (authLoading) {
    return (
      <>
        <Navbar />
        <div className="mx-auto max-w-4xl px-4 py-8">
          <p className="text-gray-500">Loading...</p>
        </div>
      </>
    );
  }

  if (!user || (user.role !== "super_admin" && user.role !== "admin")) {
    return (
      <>
        <Navbar />
        <div className="mx-auto max-w-4xl px-4 py-8">
          <p className="text-red-500">Access denied.</p>
        </div>
      </>
    );
  }

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;
    setSaving(true);
    try {
      const res = await fetch("/api/warning-types", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: title.trim(), severity, details: details.trim() }),
      });
      if (res.ok) {
        setTitle("");
        setSeverity("green");
        setDetails("");
        mutate();
      }
    } finally {
      setSaving(false);
    }
  };

  const openEdit = (wt: WarningType) => {
    setEditId(wt.id);
    setEditTitle(wt.title);
    setEditSeverity(wt.severity);
    setEditDetails(wt.details);
    setEditOpen(true);
  };

  const handleEdit = async () => {
    if (!editTitle.trim()) return;
    setEditSaving(true);
    try {
      const res = await fetch(`/api/warning-types/${editId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: editTitle.trim(), severity: editSeverity, details: editDetails.trim() }),
      });
      if (res.ok) {
        setEditOpen(false);
        mutate();
      }
    } finally {
      setEditSaving(false);
    }
  };

  const openDelete = (wt: WarningType) => {
    setDeleteId(wt.id);
    setDeleteName(wt.title);
    setDeleteOpen(true);
  };

  const handleDelete = async () => {
    setDeleting(true);
    try {
      const res = await fetch(`/api/warning-types/${deleteId}`, { method: "DELETE" });
      if (res.ok) {
        setDeleteOpen(false);
        mutate();
      }
    } finally {
      setDeleting(false);
    }
  };

  // Sort by severity order
  const severityOrder = ["green", "yellow", "orange", "red", "black"];
  const sorted = [...(warningTypes || [])].sort(
    (a, b) => severityOrder.indexOf(a.severity) - severityOrder.indexOf(b.severity)
  );

  return (
    <>
      <Navbar />
      <div className="mx-auto max-w-4xl px-4 py-8">
        <h1 className="text-2xl font-bold text-gray-700 mb-6">Warning Types</h1>

        {/* Preset Suggestions (collapsible) */}
        <div className="neu-raised p-4 mb-6">
          <button
            onClick={() => setRefOpen(!refOpen)}
            className="flex items-center gap-2 text-sm font-medium text-gray-600 w-full text-left"
          >
            <svg
              className={`w-4 h-4 transition-transform ${refOpen ? "rotate-90" : ""}`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
            Preset Suggestions (Reference)
          </button>
          {refOpen && (
            <div className="mt-3 space-y-2">
              {PRESET_SUGGESTIONS.map((ps) => (
                <div key={ps.severity} className="flex items-start gap-2 text-sm">
                  <span
                    className={`inline-block px-2 py-0.5 rounded border text-xs font-medium ${severityColor(ps.severity)}`}
                  >
                    {severityEmoji(ps.severity)} {ps.severity}
                  </span>
                  <span className="text-gray-600">{ps.suggestions}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Create Form */}
        <form onSubmit={handleCreate} className="neu-raised p-6 mb-6 space-y-4">
          <h2 className="text-lg font-semibold text-gray-700">Add Warning Type</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-600 mb-1">Title</label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Critical, Final Warning"
                className="neu-input w-full px-3 py-2 text-sm"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-600 mb-1">Severity</label>
              <select
                value={severity}
                onChange={(e) => setSeverity(e.target.value)}
                className="neu-input w-full px-3 py-2 text-sm"
              >
                {SEVERITY_OPTIONS.map((s) => (
                  <option key={s} value={s}>
                    {severityEmoji(s)} {s.charAt(0).toUpperCase() + s.slice(1)}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-600 mb-1">Details</label>
            <input
              type="text"
              value={details}
              onChange={(e) => setDetails(e.target.value)}
              placeholder="e.g. not being on time in lecture"
              className="neu-input w-full px-3 py-2 text-sm"
            />
          </div>
          <button
            type="submit"
            disabled={saving}
            className="neu-btn-gradient px-5 py-2 text-sm font-medium"
          >
            {saving ? "Saving..." : "Add Warning Type"}
          </button>
        </form>

        {/* Warning Types Table */}
        <div className="neu-raised overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left px-4 py-3 text-gray-600 font-medium">Severity</th>
                  <th className="text-left px-4 py-3 text-gray-600 font-medium">Title</th>
                  <th className="text-left px-4 py-3 text-gray-600 font-medium">Details</th>
                  <th className="text-right px-4 py-3 text-gray-600 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {sorted.length === 0 && (
                  <tr>
                    <td colSpan={4} className="px-4 py-6 text-center text-gray-400">
                      No warning types yet.
                    </td>
                  </tr>
                )}
                {sorted.map((wt) => (
                  <tr key={wt.id} className="border-b border-gray-100 hover:bg-gray-50/50">
                    <td className="px-4 py-3">
                      <span
                        className={`inline-block px-2 py-0.5 rounded border text-xs font-medium ${severityColor(wt.severity)}`}
                      >
                        {severityEmoji(wt.severity)} {wt.severity}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-700 font-medium">{wt.title}</td>
                    <td className="px-4 py-3 text-gray-500">{wt.details || "—"}</td>
                    <td className="px-4 py-3 text-right">
                      <button
                        onClick={() => openEdit(wt)}
                        className="neu-btn px-3 py-1 text-xs font-medium text-gray-600 mr-2"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => openDelete(wt)}
                        className="neu-btn-danger px-3 py-1 text-xs font-medium"
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Edit Dialog */}
      <Dialog open={editOpen} onClose={() => setEditOpen(false)} title="Edit Warning Type">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-600 mb-1">Title</label>
            <input
              type="text"
              value={editTitle}
              onChange={(e) => setEditTitle(e.target.value)}
              className="neu-input w-full px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-600 mb-1">Severity</label>
            <select
              value={editSeverity}
              onChange={(e) => setEditSeverity(e.target.value)}
              className="neu-input w-full px-3 py-2 text-sm"
            >
              {SEVERITY_OPTIONS.map((s) => (
                <option key={s} value={s}>
                  {severityEmoji(s)} {s.charAt(0).toUpperCase() + s.slice(1)}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-600 mb-1">Details</label>
            <input
              type="text"
              value={editDetails}
              onChange={(e) => setEditDetails(e.target.value)}
              className="neu-input w-full px-3 py-2 text-sm"
            />
          </div>
          <div className="flex justify-end gap-3">
            <button
              onClick={() => setEditOpen(false)}
              className="neu-btn px-4 py-2 text-sm font-medium text-gray-600"
            >
              Cancel
            </button>
            <button
              onClick={handleEdit}
              disabled={editSaving}
              className="neu-btn-gradient px-4 py-2 text-sm font-medium"
            >
              {editSaving ? "Saving..." : "Save"}
            </button>
          </div>
        </div>
      </Dialog>

      {/* Delete Confirm */}
      <ConfirmDialog
        open={deleteOpen}
        onClose={() => setDeleteOpen(false)}
        onConfirm={handleDelete}
        title="Delete Warning Type"
        message={`Are you sure you want to delete "${deleteName}"? This cannot be undone.`}
        loading={deleting}
      />
    </>
  );
}
