"use client";

import { useState } from "react";
import useSWR from "swr";
import Navbar from "@/components/Navbar";
import Dialog from "@/components/Dialog";
import ConfirmDialog from "@/components/ConfirmDialog";

const fetcher = (url: string) => fetch(url).then((r) => r.json());

interface NavbarLink {
  id: string;
  label: string;
  href: string;
  isGradePage: boolean;
  order: number;
}

export default function ManageNavbarLinksPage() {
  const { data: links, error, isLoading, mutate } = useSWR<NavbarLink[]>(
    "/api/navbar-links",
    fetcher
  );

  // Add/Edit dialog state
  const [dialogOpen, setDialogOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editId, setEditId] = useState("");
  const [formLabel, setFormLabel] = useState("");
  const [formHref, setFormHref] = useState("");
  const [formIsGradePage, setFormIsGradePage] = useState(false);
  const [formOrder, setFormOrder] = useState(0);
  const [formError, setFormError] = useState("");
  const [formLoading, setFormLoading] = useState(false);

  // Delete state
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleteId, setDeleteId] = useState("");
  const [deleteLoading, setDeleteLoading] = useState(false);

  const resetForm = () => {
    setFormLabel("");
    setFormHref("");
    setFormIsGradePage(false);
    setFormOrder(0);
    setFormError("");
    setIsEditing(false);
    setEditId("");
  };

  const openAdd = () => {
    resetForm();
    setDialogOpen(true);
  };

  const openEdit = (link: NavbarLink) => {
    resetForm();
    setIsEditing(true);
    setEditId(link.id);
    setFormLabel(link.label);
    setFormHref(link.href);
    setFormIsGradePage(link.isGradePage);
    setFormOrder(link.order);
    setDialogOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError("");

    if (!formLabel.trim() || !formHref.trim()) {
      setFormError("Label and href are required.");
      return;
    }
    if (!formHref.startsWith("/")) {
      setFormError("Href must start with '/'.");
      return;
    }

    setFormLoading(true);
    try {
      const url = isEditing ? `/api/navbar-links/${editId}` : "/api/navbar-links";
      const method = isEditing ? "PUT" : "POST";
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          label: formLabel,
          href: formHref,
          isGradePage: formIsGradePage,
          order: formOrder,
        }),
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
      await fetch(`/api/navbar-links/${deleteId}`, { method: "DELETE" });
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
          <h1 className="text-2xl font-bold text-gray-700">Manage Navbar Links</h1>
          <button onClick={openAdd} className="neu-btn-gradient px-5 py-2 text-sm font-medium">
            Add Link
          </button>
        </div>

        {isLoading && <p className="text-gray-500 text-sm">Loading...</p>}
        {error && <p className="text-red-500 text-sm">Failed to load navbar links.</p>}

        <div className="neu-raised overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left px-4 py-3 font-semibold text-gray-600">Label</th>
                  <th className="text-left px-4 py-3 font-semibold text-gray-600">Href</th>
                  <th className="text-center px-4 py-3 font-semibold text-gray-600">Grade Page</th>
                  <th className="text-center px-4 py-3 font-semibold text-gray-600">Order</th>
                  <th className="text-right px-4 py-3 font-semibold text-gray-600">Actions</th>
                </tr>
              </thead>
              <tbody>
                {links && links.length === 0 && (
                  <tr>
                    <td colSpan={5} className="px-4 py-8 text-center text-gray-400">
                      No navbar links found.
                    </td>
                  </tr>
                )}
                {links?.map((link) => (
                  <tr key={link.id} className="border-b border-gray-100 hover:bg-gray-50/50">
                    <td className="px-4 py-3 text-gray-700">{link.label}</td>
                    <td className="px-4 py-3 text-gray-500 font-mono text-xs">{link.href}</td>
                    <td className="px-4 py-3 text-center">
                      {link.isGradePage ? (
                        <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-green-100 text-green-600">
                          <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                          </svg>
                        </span>
                      ) : (
                        <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-gray-100 text-gray-400">
                          <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                          </svg>
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-center text-gray-500">{link.order}</td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex justify-end gap-2">
                        <button
                          onClick={() => openEdit(link)}
                          className="neu-btn px-3 py-1.5 text-xs text-gray-600"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => { setDeleteId(link.id); setDeleteOpen(true); }}
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
        title={isEditing ? "Edit Link" : "Add Link"}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-600 mb-1">Label</label>
            <input
              type="text"
              value={formLabel}
              onChange={(e) => setFormLabel(e.target.value)}
              className="neu-input w-full"
              placeholder="e.g. Grade 10"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-600 mb-1">Href</label>
            <input
              type="text"
              value={formHref}
              onChange={(e) => setFormHref(e.target.value)}
              className="neu-input w-full"
              placeholder="/grade-10"
              required
            />
            <p className="text-xs text-gray-400 mt-1">Must start with &quot;/&quot;</p>
          </div>
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="isGradePage"
              checked={formIsGradePage}
              onChange={(e) => setFormIsGradePage(e.target.checked)}
              className="rounded border-gray-300"
            />
            <label htmlFor="isGradePage" className="text-sm text-gray-600">
              Is Grade Page
            </label>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-600 mb-1">Order</label>
            <input
              type="number"
              value={formOrder}
              onChange={(e) => setFormOrder(parseInt(e.target.value) || 0)}
              className="neu-input w-full"
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
              {formLoading ? "Saving..." : isEditing ? "Save Changes" : "Add Link"}
            </button>
          </div>
        </form>
      </Dialog>

      {/* Delete Confirm */}
      <ConfirmDialog
        open={deleteOpen}
        onClose={() => setDeleteOpen(false)}
        onConfirm={handleDelete}
        title="Delete Link"
        message="Are you sure you want to delete this navbar link?"
        confirmLabel="Delete"
        loading={deleteLoading}
      />
    </>
  );
}
