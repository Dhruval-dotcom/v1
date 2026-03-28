"use client";

import { useState, useEffect } from "react";
import useSWR from "swr";
import Navbar from "@/components/Navbar";
import Dialog from "@/components/Dialog";
import ConfirmDialog from "@/components/ConfirmDialog";
import { useAuth } from "@/hooks/useAuth";
import Link from "next/link";
import { TableLoader } from "@/components/Loader";

const fetcher = (url: string) => fetch(url).then((r) => r.json());

const PAGE_SIZES = [25, 40, 50];

interface Batch {
  id: string;
  name: string;
}

interface Student {
  id: string;
  name: string;
  email: string;
  phoneNumbers: string[];
  batchId: string;
  batch: Batch;
  adminRole: { id: string } | null;
  createdAt: string;
}

interface StudentsResponse {
  students: Student[];
  total: number;
  page: number;
  totalPages: number;
}

export default function ManageStudentsPage() {
  const { user } = useAuth();
  const isSuperAdmin = user?.role === "super_admin";

  const [selectedBatchId, setSelectedBatchId] = useState("");
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search), 300);
    return () => clearTimeout(timer);
  }, [search]);

  // Reset page on filter changes
  useEffect(() => {
    setPage(1);
  }, [selectedBatchId, debouncedSearch, pageSize]);

  const { data: batches } = useSWR<(Batch & { _count: { students: number } })[]>(
    "/api/batches",
    fetcher
  );

  // Build query string for paginated API
  const queryParams = new URLSearchParams();
  if (selectedBatchId) queryParams.set("batchId", selectedBatchId);
  if (debouncedSearch) queryParams.set("search", debouncedSearch);
  queryParams.set("page", String(page));
  queryParams.set("limit", String(pageSize));

  const { data: studentsData, error, isLoading, mutate } = useSWR<StudentsResponse>(
    `/api/students?${queryParams.toString()}`,
    fetcher
  );

  const students = studentsData?.students || [];
  const totalPages = studentsData?.totalPages || 1;
  const total = studentsData?.total || 0;

  // Edit dialog state
  const [editOpen, setEditOpen] = useState(false);
  const [editId, setEditId] = useState("");
  const [editName, setEditName] = useState("");
  const [editEmail, setEditEmail] = useState("");
  const [editPhones, setEditPhones] = useState<string[]>([""]);
  const [editBatchId, setEditBatchId] = useState("");
  const [editError, setEditError] = useState("");
  const [editLoading, setEditLoading] = useState(false);

  // Delete state
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleteId, setDeleteId] = useState("");
  const [deleteLoading, setDeleteLoading] = useState(false);

  // Make admin state
  const [makeAdminOpen, setMakeAdminOpen] = useState(false);
  const [makeAdminId, setMakeAdminId] = useState("");
  const [makeAdminPassword, setMakeAdminPassword] = useState("");
  const [makeAdminShowPassword, setMakeAdminShowPassword] = useState(false);
  const [makeAdminError, setMakeAdminError] = useState("");
  const [makeAdminLoading, setMakeAdminLoading] = useState(false);

  // Remove admin state
  const [removeAdminOpen, setRemoveAdminOpen] = useState(false);
  const [removeAdminId, setRemoveAdminId] = useState("");
  const [removeAdminLoading, setRemoveAdminLoading] = useState(false);

  const openEdit = (s: Student) => {
    setEditId(s.id);
    setEditName(s.name);
    setEditEmail(s.email);
    setEditPhones(s.phoneNumbers.length > 0 ? [...s.phoneNumbers] : [""]);
    setEditBatchId(s.batchId);
    setEditError("");
    setEditOpen(true);
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setEditError("");

    if (!editName.trim() || !editBatchId) {
      setEditError("Name and batch are required.");
      return;
    }

    setEditLoading(true);
    try {
      const phones = editPhones.filter((p) => p.trim() !== "");
      const res = await fetch(`/api/students/${editId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: editName,
          email: editEmail.trim() || null,
          phoneNumbers: phones,
          batchId: editBatchId,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setEditError(data.error || "Failed to update student.");
        return;
      }
      setEditOpen(false);
      mutate();
    } catch {
      setEditError("Network error. Please try again.");
    } finally {
      setEditLoading(false);
    }
  };

  const handleDelete = async () => {
    setDeleteLoading(true);
    try {
      await fetch(`/api/students/${deleteId}`, { method: "DELETE" });
      setDeleteOpen(false);
      mutate();
    } catch {
      // silent
    } finally {
      setDeleteLoading(false);
    }
  };

  const handleMakeAdmin = async (e: React.FormEvent) => {
    e.preventDefault();
    setMakeAdminError("");
    if (!makeAdminPassword.trim()) {
      setMakeAdminError("Password is required.");
      return;
    }
    setMakeAdminLoading(true);
    try {
      const res = await fetch(`/api/students/${makeAdminId}/make-admin`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password: makeAdminPassword }),
      });
      const data = await res.json();
      if (!res.ok) {
        setMakeAdminError(data.error || "Failed to make admin.");
        return;
      }
      setMakeAdminOpen(false);
      setMakeAdminPassword("");
      setMakeAdminShowPassword(false);
      mutate();
    } catch {
      setMakeAdminError("Network error. Please try again.");
    } finally {
      setMakeAdminLoading(false);
    }
  };

  const handleRemoveAdmin = async () => {
    setRemoveAdminLoading(true);
    try {
      await fetch(`/api/students/${removeAdminId}/remove-admin`, { method: "DELETE" });
      setRemoveAdminOpen(false);
      mutate();
    } catch {
      // silent
    } finally {
      setRemoveAdminLoading(false);
    }
  };

  const addPhoneField = () => setEditPhones([...editPhones, ""]);
  const removePhoneField = (index: number) => {
    setEditPhones(editPhones.filter((_, i) => i !== index));
  };
  const updatePhone = (index: number, value: string) => {
    const updated = [...editPhones];
    updated[index] = value;
    setEditPhones(updated);
  };

  return (
    <>
      <Navbar />
      <div className="mx-auto max-w-6xl px-4 py-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
          <h1 className="text-2xl font-bold text-gray-700">Manage Students</h1>
          {isSuperAdmin && (
            <Link
              href="/manage/students/add"
              className="neu-btn-gradient px-5 py-2 text-sm font-medium inline-block"
            >
              Add Student
            </Link>
          )}
        </div>

        {/* Filters */}
        <div className="mb-6 flex flex-col sm:flex-row gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-600 mb-1">Filter by Batch</label>
            <select
              value={selectedBatchId}
              onChange={(e) => setSelectedBatchId(e.target.value)}
              className="neu-input w-full sm:w-64"
            >
              <option value="">All Batches</option>
              {batches?.map((batch) => (
                <option key={batch.id} value={batch.id}>
                  {batch.name} ({batch._count.students})
                </option>
              ))}
            </select>
          </div>
          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-600 mb-1">Search</label>
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="neu-input w-full"
              placeholder="Search by name, email, or phone..."
            />
          </div>
        </div>

        {error && <p className="text-red-500 text-sm">Failed to load students.</p>}

        {isLoading ? (
          <TableLoader columns={isSuperAdmin ? 6 : 5} rows={6} />
        ) : (
        <div className="neu-raised overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left px-4 py-3 font-semibold text-gray-600">Name</th>
                  <th className="text-left px-4 py-3 font-semibold text-gray-600">Email</th>
                  <th className="text-left px-4 py-3 font-semibold text-gray-600">Phone Numbers</th>
                  <th className="text-left px-4 py-3 font-semibold text-gray-600">Batch</th>
                  <th className="text-center px-4 py-3 font-semibold text-gray-600">Status</th>
                  {isSuperAdmin && (
                    <th className="text-right px-4 py-3 font-semibold text-gray-600">Actions</th>
                  )}
                </tr>
              </thead>
              <tbody>
                {students.length === 0 && (
                  <tr>
                    <td colSpan={isSuperAdmin ? 6 : 5} className="px-4 py-8 text-center text-gray-400">
                      No students found.
                    </td>
                  </tr>
                )}
                {students.map((s) => (
                  <tr key={s.id} className="border-b border-gray-100 hover:bg-gray-50/50">
                    <td className="px-4 py-3 text-gray-700 font-medium">{s.name}</td>
                    <td className="px-4 py-3 text-gray-500 text-xs">{s.email || "-"}</td>
                    <td className="px-4 py-3 text-gray-500 text-xs">
                      {s.phoneNumbers.length > 0 ? s.phoneNumbers.map((p, i) => (
                        <span key={i}>
                          {i > 0 && ", "}
                          <a href={`tel:${p}`} className="text-blue-600 hover:underline">{p}</a>
                        </span>
                      )) : "-"}
                    </td>
                    <td className="px-4 py-3 text-gray-500">{s.batch?.name || "-"}</td>
                    <td className="px-4 py-3 text-center">
                      {s.adminRole ? (
                        <span className="inline-block px-2 py-0.5 text-xs font-medium rounded-full bg-green-100 text-green-700">
                          Admin
                        </span>
                      ) : (
                        <span className="inline-block px-2 py-0.5 text-xs font-medium rounded-full bg-gray-100 text-gray-500">
                          Student
                        </span>
                      )}
                    </td>
                    {isSuperAdmin && (
                      <td className="px-4 py-3 text-right">
                        <div className="flex justify-end gap-2 flex-wrap">
                          <button
                            onClick={() => openEdit(s)}
                            className="neu-btn px-3 py-1.5 text-xs text-gray-600"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => { setDeleteId(s.id); setDeleteOpen(true); }}
                            className="neu-btn-danger px-3 py-1.5 text-xs"
                          >
                            Delete
                          </button>
                          {s.adminRole ? (
                            <button
                              onClick={() => { setRemoveAdminId(s.id); setRemoveAdminOpen(true); }}
                              className="neu-btn px-3 py-1.5 text-xs text-orange-600"
                            >
                              Remove Admin
                            </button>
                          ) : (
                            <button
                              onClick={() => {
                                setMakeAdminId(s.id);
                                setMakeAdminPassword("");
                                setMakeAdminShowPassword(false);
                                setMakeAdminError("");
                                setMakeAdminOpen(true);
                              }}
                              className="neu-btn px-3 py-1.5 text-xs text-green-600"
                            >
                              Make Admin
                            </button>
                          )}
                        </div>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div className="flex flex-col sm:flex-row items-center justify-between px-4 py-3 border-t border-gray-200 gap-3">
            <div className="flex items-center gap-2 text-sm text-gray-500">
              <span>Show</span>
              <select
                value={pageSize}
                onChange={(e) => setPageSize(Number(e.target.value))}
                className="neu-input px-2 py-1 text-xs"
              >
                {PAGE_SIZES.map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
              <span>per page</span>
              <span className="text-gray-400 ml-2">({total} total)</span>
            </div>
            {totalPages > 1 && (
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page <= 1}
                  className="neu-btn px-3 py-1.5 text-xs font-medium text-gray-600 disabled:opacity-40"
                >
                  Previous
                </button>
                <span className="text-sm text-gray-500">
                  Page {page} of {totalPages}
                </span>
                <button
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page >= totalPages}
                  className="neu-btn px-3 py-1.5 text-xs font-medium text-gray-600 disabled:opacity-40"
                >
                  Next
                </button>
              </div>
            )}
          </div>
        </div>
        )}
      </div>

      {/* Edit Dialog */}
      <Dialog open={editOpen} onClose={() => setEditOpen(false)} title="Edit Student">
        <form onSubmit={handleEditSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-600 mb-1">Name</label>
            <input
              type="text"
              value={editName}
              onChange={(e) => setEditName(e.target.value)}
              className="neu-input w-full"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-600 mb-1">Email <span className="text-gray-400 font-normal">(optional)</span></label>
            <input
              type="email"
              value={editEmail}
              onChange={(e) => setEditEmail(e.target.value)}
              className="neu-input w-full"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-600 mb-1">Phone Numbers</label>
            {editPhones.map((phone, i) => (
              <div key={i} className="flex gap-2 mb-2">
                <input
                  type="text"
                  value={phone}
                  onChange={(e) => updatePhone(i, e.target.value)}
                  className="neu-input w-full"
                  placeholder="Phone number"
                />
                {editPhones.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removePhoneField(i)}
                    className="neu-btn-danger px-3 py-1.5 text-xs shrink-0"
                  >
                    X
                  </button>
                )}
              </div>
            ))}
            <button
              type="button"
              onClick={addPhoneField}
              className="neu-btn px-3 py-1.5 text-xs text-gray-600"
            >
              Add Phone
            </button>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-600 mb-1">Batch</label>
            <select
              value={editBatchId}
              onChange={(e) => setEditBatchId(e.target.value)}
              className="neu-input w-full"
              required
            >
              <option value="">Select batch...</option>
              {batches?.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.name}
                </option>
              ))}
            </select>
          </div>
          {editError && <p className="text-sm text-red-500">{editError}</p>}
          <div className="flex justify-end gap-3">
            <button
              type="button"
              onClick={() => setEditOpen(false)}
              className="neu-btn px-4 py-2 text-sm text-gray-600"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="neu-btn-gradient px-5 py-2 text-sm font-medium"
              disabled={editLoading}
            >
              {editLoading ? "Saving..." : "Save Changes"}
            </button>
          </div>
        </form>
      </Dialog>

      {/* Delete Confirm */}
      <ConfirmDialog
        open={deleteOpen}
        onClose={() => setDeleteOpen(false)}
        onConfirm={handleDelete}
        title="Delete Student"
        message="Are you sure you want to delete this student? This action cannot be undone."
        confirmLabel="Delete"
        loading={deleteLoading}
      />

      {/* Make Admin Dialog */}
      <Dialog
        open={makeAdminOpen}
        onClose={() => setMakeAdminOpen(false)}
        title="Make Admin"
      >
        <form onSubmit={handleMakeAdmin} className="space-y-4">
          <p className="text-sm text-gray-500">
            Set a password for this student to grant them admin access to their batch.
          </p>
          <div>
            <label className="block text-sm font-medium text-gray-600 mb-1">Password</label>
            <div className="relative">
              <input
                type={makeAdminShowPassword ? "text" : "password"}
                value={makeAdminPassword}
                onChange={(e) => setMakeAdminPassword(e.target.value)}
                className="neu-input w-full pr-10"
                placeholder="Enter admin password"
                required
              />
              <button
                type="button"
                onClick={() => setMakeAdminShowPassword(!makeAdminShowPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                {makeAdminShowPassword ? (
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L3 3m6.878 6.878L21 21" />
                  </svg>
                ) : (
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                  </svg>
                )}
              </button>
            </div>
          </div>
          {makeAdminError && <p className="text-sm text-red-500">{makeAdminError}</p>}
          <div className="flex justify-end gap-3">
            <button
              type="button"
              onClick={() => setMakeAdminOpen(false)}
              className="neu-btn px-4 py-2 text-sm text-gray-600"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="neu-btn-gradient px-5 py-2 text-sm font-medium"
              disabled={makeAdminLoading}
            >
              {makeAdminLoading ? "Saving..." : "Make Admin"}
            </button>
          </div>
        </form>
      </Dialog>

      {/* Remove Admin Confirm */}
      <ConfirmDialog
        open={removeAdminOpen}
        onClose={() => setRemoveAdminOpen(false)}
        onConfirm={handleRemoveAdmin}
        title="Remove Admin"
        message="Are you sure you want to remove admin privileges from this student?"
        confirmLabel="Remove Admin"
        loading={removeAdminLoading}
      />
    </>
  );
}
