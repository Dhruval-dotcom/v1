"use client";

import { useState } from "react";
import useSWR from "swr";
import Navbar from "@/components/Navbar";
import Dialog from "@/components/Dialog";
import ConfirmDialog from "@/components/ConfirmDialog";

const fetcher = (url: string) => fetch(url).then((r) => r.json());

interface Batch {
  id: string;
  name: string;
  createdAt: string;
  _count: {
    students: number;
  };
}

export default function ManageBatchesPage() {
  const { data: batches, error, isLoading, mutate } = useSWR<Batch[]>(
    "/api/batches",
    fetcher
  );

  // Dialog state
  const [dialogOpen, setDialogOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editId, setEditId] = useState("");
  const [formName, setFormName] = useState("");
  const [formError, setFormError] = useState("");
  const [formLoading, setFormLoading] = useState(false);

  // Delete state
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleteId, setDeleteId] = useState("");
  const [deleteLoading, setDeleteLoading] = useState(false);

  const resetForm = () => {
    setFormName("");
    setFormError("");
    setIsEditing(false);
    setEditId("");
  };

  const openAdd = () => {
    resetForm();
    setDialogOpen(true);
  };

  const openEdit = (batch: Batch) => {
    resetForm();
    setIsEditing(true);
    setEditId(batch.id);
    setFormName(batch.name);
    setDialogOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError("");

    if (!formName.trim()) {
      setFormError("Name is required.");
      return;
    }

    setFormLoading(true);
    try {
      const url = isEditing ? `/api/batches/${editId}` : "/api/batches";
      const method = isEditing ? "PUT" : "POST";
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: formName }),
      });
      const data = await res.json();
      if (!res.ok) {
        setFormError(data.error || "Failed to save.");
        return;
      }
      setDialogOpen(false);
      resetForm();
      mutate();
    } catch {
      setFormError("Network error. Please try again.");
    } finally {
      setFormLoading(false);
    }
  };

  const handleDelete = async () => {
    setDeleteLoading(true);
    try {
      await fetch(`/api/batches/${deleteId}`, { method: "DELETE" });
      setDeleteOpen(false);
      mutate();
    } catch {
      // silent
    } finally {
      setDeleteLoading(false);
    }
  };

  return (
    <>
      <Navbar />
      <div className="mx-auto max-w-4xl px-4 py-6">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold text-gray-700">Manage Batches</h1>
          <button onClick={openAdd} className="neu-btn-gradient px-5 py-2 text-sm font-medium">
            Add Batch
          </button>
        </div>

        {isLoading && <p className="text-gray-500 text-sm">Loading...</p>}
        {error && <p className="text-red-500 text-sm">Failed to load batches.</p>}

        <div className="neu-raised overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left px-4 py-3 font-semibold text-gray-600">Name</th>
                  <th className="text-center px-4 py-3 font-semibold text-gray-600">Students</th>
                  <th className="text-left px-4 py-3 font-semibold text-gray-600">Created</th>
                  <th className="text-right px-4 py-3 font-semibold text-gray-600">Actions</th>
                </tr>
              </thead>
              <tbody>
                {batches && batches.length === 0 && (
                  <tr>
                    <td colSpan={4} className="px-4 py-8 text-center text-gray-400">
                      No batches found.
                    </td>
                  </tr>
                )}
                {batches?.map((batch) => (
                  <tr key={batch.id} className="border-b border-gray-100 hover:bg-gray-50/50">
                    <td className="px-4 py-3 text-gray-700 font-medium">{batch.name}</td>
                    <td className="px-4 py-3 text-center text-gray-500">{batch._count.students}</td>
                    <td className="px-4 py-3 text-gray-500 text-xs">
                      {new Date(batch.createdAt).toLocaleDateString("en-US", {
                        year: "numeric",
                        month: "short",
                        day: "numeric",
                      })}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex justify-end gap-2">
                        <button
                          onClick={() => openEdit(batch)}
                          className="neu-btn px-3 py-1.5 text-xs text-gray-600"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => { setDeleteId(batch.id); setDeleteOpen(true); }}
                          className="neu-btn-danger px-3 py-1.5 text-xs"
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Add/Edit Dialog */}
      <Dialog
        open={dialogOpen}
        onClose={() => { setDialogOpen(false); resetForm(); }}
        title={isEditing ? "Edit Batch" : "Add Batch"}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-600 mb-1">Batch Name</label>
            <input
              type="text"
              value={formName}
              onChange={(e) => setFormName(e.target.value)}
              className="neu-input w-full"
              placeholder="e.g. Batch 2024-A"
              required
            />
          </div>
          {formError && <p className="text-sm text-red-500">{formError}</p>}
          <div className="flex justify-end gap-3">
            <button
              type="button"
              onClick={() => { setDialogOpen(false); resetForm(); }}
              className="neu-btn px-4 py-2 text-sm text-gray-600"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="neu-btn-gradient px-5 py-2 text-sm font-medium"
              disabled={formLoading}
            >
              {formLoading ? "Saving..." : isEditing ? "Save Changes" : "Add Batch"}
            </button>
          </div>
        </form>
      </Dialog>

      {/* Delete Confirm */}
      <ConfirmDialog
        open={deleteOpen}
        onClose={() => setDeleteOpen(false)}
        onConfirm={handleDelete}
        title="Delete Batch"
        message="Are you sure you want to delete this batch? This will also delete all students in this batch. This action cannot be undone."
        confirmLabel="Delete"
        loading={deleteLoading}
      />
    </>
  );
}
