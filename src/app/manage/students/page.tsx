"use client";

import { useState } from "react";
import useSWR from "swr";
import Navbar from "@/components/Navbar";
import Dialog from "@/components/Dialog";
import ConfirmDialog from "@/components/ConfirmDialog";
import { useAuth } from "@/hooks/useAuth";
import Link from "next/link";

const fetcher = (url: string) => fetch(url).then((r) => r.json());

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

export default function ManageStudentsPage() {
  const { user } = useAuth();
  const isSuperAdmin = user?.role === "super_admin";

  const [selectedBatchId, setSelectedBatchId] = useState("");
  const [search, setSearch] = useState("");

  const { data: batches } = useSWR<(Batch & { _count: { students: number } })[]>(
    "/api/batches",
    fetcher
  );

  const { data: students, error, isLoading, mutate } = useSWR<Student[]>(
    selectedBatchId
      ? `/api/students?batchId=${selectedBatchId}`
      : "/api/students",
    fetcher
  );

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

    if (!editName.trim() || !editEmail.trim() || !editBatchId) {
      setEditError("Name, email, and batch are required.");
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
          email: editEmail,
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

  const filteredStudents = students?.filter((s) => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return (
      s.name.toLowerCase().includes(q) ||
      s.email.toLowerCase().includes(q) ||
      s.phoneNumbers.some((p) => p.includes(q))
    );
  });

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

        {isLoading && <p className="text-gray-500 text-sm">Loading students...</p>}
        {error && <p className="text-red-500 text-sm">Failed to load students.</p>}

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
                {filteredStudents && filteredStudents.length === 0 && (
                  <tr>
                    <td colSpan={isSuperAdmin ? 6 : 5} className="px-4 py-8 text-center text-gray-400">
                      No students found.
                    </td>
                  </tr>
                )}
                {filteredStudents?.map((s) => (
                  <tr key={s.id} className="border-b border-gray-100 hover:bg-gray-50/50">
                    <td className="px-4 py-3 text-gray-700 font-medium">{s.name}</td>
                    <td className="px-4 py-3 text-gray-500 text-xs">{s.email}</td>
                    <td className="px-4 py-3 text-gray-500 text-xs">
                      {s.phoneNumbers.length > 0 ? s.phoneNumbers.join(", ") : "-"}
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
        </div>
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
            <label className="block text-sm font-medium text-gray-600 mb-1">Email</label>
            <input
              type="email"
              value={editEmail}
              onChange={(e) => setEditEmail(e.target.value)}
              className="neu-input w-full"
              required
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
            <input
              type="password"
              value={makeAdminPassword}
              onChange={(e) => setMakeAdminPassword(e.target.value)}
              className="neu-input w-full"
              placeholder="Enter admin password"
              required
            />
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
