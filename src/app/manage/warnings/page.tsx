"use client";

import { useState, useEffect } from "react";
import useSWR from "swr";
import Navbar from "@/components/Navbar";
import Dialog from "@/components/Dialog";
import ConfirmDialog from "@/components/ConfirmDialog";
import { useAuth } from "@/hooks/useAuth";

const fetcher = (url: string) => fetch(url).then((r) => r.json());

interface Batch {
  id: string;
  name: string;
}

interface WarningType {
  id: string;
  title: string;
  severity: string;
  details: string;
}

interface Student {
  id: string;
  name: string;
  email: string;
}

interface Warning {
  id: string;
  warningTypeId: string;
  warningType: WarningType;
  studentId: string;
  student: Student;
  batchId: string;
  details: string;
  actionPlan: string;
  message: string;
  date: string;
  createdAt: string;
}

interface WarningsResponse {
  warnings: Warning[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
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

const PAGE_SIZE = 15;

export default function WarningsPage() {
  const { user, isLoading: authLoading } = useAuth();

  const [batchId, setBatchId] = useState("");
  const [studentFilter, setStudentFilter] = useState("");
  const [page, setPage] = useState(1);

  // Edit state
  const [editOpen, setEditOpen] = useState(false);
  const [editId, setEditId] = useState("");
  const [editWarningTypeId, setEditWarningTypeId] = useState("");
  const [editDetails, setEditDetails] = useState("");
  const [editActionPlan, setEditActionPlan] = useState("");
  const [editDate, setEditDate] = useState("");
  const [editMessage, setEditMessage] = useState("");
  const [editSaving, setEditSaving] = useState(false);

  // Delete state
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleteId, setDeleteId] = useState("");
  const [deleteName, setDeleteName] = useState("");
  const [deleting, setDeleting] = useState(false);

  const { data: batches } = useSWR<Batch[]>("/api/batches", fetcher);
  const { data: warningTypes } = useSWR<WarningType[]>("/api/warning-types", fetcher);

  // Auto-select batch for admin
  useEffect(() => {
    if (user?.role === "admin" && user.batchId) {
      setBatchId(user.batchId);
    }
  }, [user]);

  // Build query string
  const queryParams = new URLSearchParams();
  if (batchId) queryParams.set("batchId", batchId);
  if (studentFilter) queryParams.set("studentId", studentFilter);
  queryParams.set("page", String(page));
  queryParams.set("pageSize", String(PAGE_SIZE));

  const { data: warningsData, mutate } = useSWR<WarningsResponse>(
    batchId ? `/api/warnings?${queryParams.toString()}` : null,
    fetcher
  );

  // Students for filter (in selected batch)
  const { data: students } = useSWR<Student[]>(
    batchId ? `/api/students?batchId=${batchId}` : null,
    fetcher
  );

  // Reset page when filters change
  useEffect(() => {
    setPage(1);
  }, [batchId, studentFilter]);

  const openEdit = (w: Warning) => {
    setEditId(w.id);
    setEditWarningTypeId(w.warningTypeId);
    setEditDetails(w.details);
    setEditActionPlan(w.actionPlan);
    setEditDate(w.date ? w.date.split("T")[0] : "");
    setEditMessage(w.message || "");
    setEditOpen(true);
  };

  const handleEdit = async () => {
    setEditSaving(true);
    try {
      const res = await fetch(`/api/warnings/${editId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          warningTypeId: editWarningTypeId,
          details: editDetails,
          actionPlan: editActionPlan,
          date: editDate,
          message: editMessage,
        }),
      });
      if (res.ok) {
        setEditOpen(false);
        mutate();
      }
    } finally {
      setEditSaving(false);
    }
  };

  const openDelete = (w: Warning) => {
    setDeleteId(w.id);
    setDeleteName(`${w.student?.name} — ${w.warningType?.title}`);
    setDeleteOpen(true);
  };

  const handleDelete = async () => {
    setDeleting(true);
    try {
      const res = await fetch(`/api/warnings/${deleteId}`, { method: "DELETE" });
      if (res.ok) {
        setDeleteOpen(false);
        mutate();
      }
    } finally {
      setDeleting(false);
    }
  };

  const totalPages = warningsData?.totalPages || 1;
  const warnings = warningsData?.warnings || [];

  const truncate = (text: string, len: number) =>
    text && text.length > len ? text.slice(0, len) + "..." : text || "—";

  if (authLoading) {
    return (
      <>
        <Navbar />
        <div className="mx-auto max-w-6xl px-4 py-8">
          <p className="text-gray-500">Loading...</p>
        </div>
      </>
    );
  }

  if (!user || (user.role !== "super_admin" && user.role !== "admin")) {
    return (
      <>
        <Navbar />
        <div className="mx-auto max-w-6xl px-4 py-8">
          <p className="text-red-500">Access denied.</p>
        </div>
      </>
    );
  }

  return (
    <>
      <Navbar />
      <div className="mx-auto max-w-6xl px-4 py-8">
        <h1 className="text-2xl font-bold text-gray-700 mb-6">Warnings</h1>

        {/* Filters */}
        <div className="neu-raised p-4 mb-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-600 mb-1">Batch</label>
              <select
                value={batchId}
                onChange={(e) => {
                  setBatchId(e.target.value);
                  setStudentFilter("");
                }}
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
            <div>
              <label className="block text-sm font-medium text-gray-600 mb-1">Student</label>
              <select
                value={studentFilter}
                onChange={(e) => setStudentFilter(e.target.value)}
                className="neu-input w-full px-3 py-2 text-sm"
                disabled={!batchId}
              >
                <option value="">All Students</option>
                {students?.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Table */}
        {!batchId ? (
          <div className="neu-raised p-8 text-center text-gray-400 text-sm">
            Select a batch to view warnings.
          </div>
        ) : (
          <div className="neu-raised overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left px-4 py-3 text-gray-600 font-medium">Date</th>
                    <th className="text-left px-4 py-3 text-gray-600 font-medium">Student</th>
                    <th className="text-left px-4 py-3 text-gray-600 font-medium">Warning Type</th>
                    <th className="text-left px-4 py-3 text-gray-600 font-medium">Details</th>
                    <th className="text-left px-4 py-3 text-gray-600 font-medium">Action Plan</th>
                    <th className="text-left px-4 py-3 text-gray-600 font-medium">Message</th>
                    <th className="text-right px-4 py-3 text-gray-600 font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {warnings.length === 0 && (
                    <tr>
                      <td colSpan={7} className="px-4 py-6 text-center text-gray-400">
                        No warnings found.
                      </td>
                    </tr>
                  )}
                  {warnings.map((w) => (
                    <tr key={w.id} className="border-b border-gray-100 hover:bg-gray-50/50">
                      <td className="px-4 py-3 text-gray-600 whitespace-nowrap">
                        {w.date ? new Date(w.date).toLocaleDateString() : "—"}
                      </td>
                      <td className="px-4 py-3 text-gray-700 font-medium">{w.student?.name || "—"}</td>
                      <td className="px-4 py-3">
                        <span
                          className={`inline-block px-2 py-0.5 rounded border text-xs font-medium ${severityColor(w.warningType?.severity)}`}
                        >
                          {severityEmoji(w.warningType?.severity)} {w.warningType?.title}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-gray-500 max-w-[150px]">{truncate(w.details, 40)}</td>
                      <td className="px-4 py-3 text-gray-500 max-w-[150px]">{truncate(w.actionPlan, 40)}</td>
                      <td className="px-4 py-3 text-gray-500 max-w-[120px]">
                        {w.message ? truncate(w.message, 30) : "No message"}
                      </td>
                      <td className="px-4 py-3 text-right whitespace-nowrap">
                        <button
                          onClick={() => openEdit(w)}
                          className="neu-btn px-3 py-1 text-xs font-medium text-gray-600 mr-2"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => openDelete(w)}
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

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between px-4 py-3 border-t border-gray-200">
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page <= 1}
                  className="neu-btn px-4 py-1.5 text-sm font-medium text-gray-600 disabled:opacity-40"
                >
                  Previous
                </button>
                <span className="text-sm text-gray-500">
                  Page {page} of {totalPages}
                </span>
                <button
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page >= totalPages}
                  className="neu-btn px-4 py-1.5 text-sm font-medium text-gray-600 disabled:opacity-40"
                >
                  Next
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Edit Dialog */}
      <Dialog open={editOpen} onClose={() => setEditOpen(false)} title="Edit Warning">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-600 mb-1">Warning Type</label>
            <select
              value={editWarningTypeId}
              onChange={(e) => setEditWarningTypeId(e.target.value)}
              className="neu-input w-full px-3 py-2 text-sm"
            >
              <option value="">Select...</option>
              {warningTypes?.map((wt) => (
                <option key={wt.id} value={wt.id}>
                  {severityEmoji(wt.severity)} {wt.title}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-600 mb-1">Details</label>
            <textarea
              value={editDetails}
              onChange={(e) => setEditDetails(e.target.value)}
              className="neu-input w-full px-3 py-2 text-sm min-h-[60px]"
              rows={2}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-600 mb-1">Action Plan</label>
            <textarea
              value={editActionPlan}
              onChange={(e) => setEditActionPlan(e.target.value)}
              className="neu-input w-full px-3 py-2 text-sm min-h-[60px]"
              rows={2}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-600 mb-1">Date</label>
            <input
              type="date"
              value={editDate}
              onChange={(e) => setEditDate(e.target.value)}
              className="neu-input w-full px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-600 mb-1">Message</label>
            <textarea
              value={editMessage}
              onChange={(e) => setEditMessage(e.target.value)}
              className="neu-input w-full px-3 py-2 text-sm min-h-[80px]"
              rows={3}
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
        title="Delete Warning"
        message={`Are you sure you want to delete the warning for "${deleteName}"?`}
        loading={deleting}
      />
    </>
  );
}
