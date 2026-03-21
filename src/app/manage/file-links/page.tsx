"use client";

import { useState } from "react";
import useSWR from "swr";
import Navbar from "@/components/Navbar";
import Dialog from "@/components/Dialog";
import ConfirmDialog from "@/components/ConfirmDialog";

const fetcher = (url: string) => fetch(url).then((r) => r.json());

interface FileLink {
  id: string;
  title: string;
  description: string | null;
  route: string;
  url: string;
  grade: string | null;
  createdAt: string;
}

interface NavbarLink {
  id: string;
  label: string;
  href: string;
  isGradePage: boolean;
  order: number;
}

export default function ManageFileLinksPage() {
  const { data: fileLinks, error, isLoading, mutate } = useSWR<FileLink[]>(
    "/api/file-links",
    fetcher
  );
  const { data: navbarLinks } = useSWR<NavbarLink[]>("/api/navbar-links", fetcher);

  const gradeLinks = navbarLinks?.filter((l) => l.isGradePage) ?? [];

  // Dialog state
  const [dialogOpen, setDialogOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editId, setEditId] = useState("");
  const [formTitle, setFormTitle] = useState("");
  const [formDescription, setFormDescription] = useState("");
  const [formRoute, setFormRoute] = useState("");
  const [formUrl, setFormUrl] = useState("");
  const [formGrade, setFormGrade] = useState("");
  const [formError, setFormError] = useState("");
  const [formLoading, setFormLoading] = useState(false);

  // Delete state
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleteId, setDeleteId] = useState("");
  const [deleteLoading, setDeleteLoading] = useState(false);

  const resetForm = () => {
    setFormTitle("");
    setFormDescription("");
    setFormRoute("");
    setFormUrl("");
    setFormGrade("");
    setFormError("");
    setIsEditing(false);
    setEditId("");
  };

  const openAdd = () => {
    resetForm();
    setDialogOpen(true);
  };

  const openEdit = (fl: FileLink) => {
    resetForm();
    setIsEditing(true);
    setEditId(fl.id);
    setFormTitle(fl.title);
    setFormDescription(fl.description || "");
    setFormRoute(fl.route);
    setFormUrl(fl.url);
    setFormGrade(fl.grade || "");
    setDialogOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError("");

    if (!formTitle.trim() || !formRoute.trim() || !formUrl.trim()) {
      setFormError("Title, route, and URL are required.");
      return;
    }

    setFormLoading(true);
    try {
      const url = isEditing ? `/api/file-links/${editId}` : "/api/file-links";
      const method = isEditing ? "PUT" : "POST";
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: formTitle,
          description: formDescription || null,
          route: formRoute,
          url: formUrl,
          grade: formGrade || null,
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
      await fetch(`/api/file-links/${deleteId}`, { method: "DELETE" });
      setDeleteOpen(false);
      mutate();
    } catch {
      // silent
    } finally {
      setDeleteLoading(false);
    }
  };

  const truncateUrl = (url: string, maxLen = 40) => {
    return url.length > maxLen ? url.slice(0, maxLen) + "..." : url;
  };

  return (
    <>
      <Navbar />
      <div className="mx-auto max-w-5xl px-4 py-6">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold text-gray-700">Manage File Links</h1>
          <button onClick={openAdd} className="neu-btn-gradient px-5 py-2 text-sm font-medium">
            Add File Link
          </button>
        </div>

        {isLoading && <p className="text-gray-500 text-sm">Loading...</p>}
        {error && <p className="text-red-500 text-sm">Failed to load file links.</p>}

        <div className="neu-raised overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left px-4 py-3 font-semibold text-gray-600">Title</th>
                  <th className="text-left px-4 py-3 font-semibold text-gray-600">Route</th>
                  <th className="text-left px-4 py-3 font-semibold text-gray-600">URL</th>
                  <th className="text-left px-4 py-3 font-semibold text-gray-600">Grade</th>
                  <th className="text-right px-4 py-3 font-semibold text-gray-600">Actions</th>
                </tr>
              </thead>
              <tbody>
                {fileLinks && fileLinks.length === 0 && (
                  <tr>
                    <td colSpan={5} className="px-4 py-8 text-center text-gray-400">
                      No file links found.
                    </td>
                  </tr>
                )}
                {fileLinks?.map((fl) => (
                  <tr key={fl.id} className="border-b border-gray-100 hover:bg-gray-50/50">
                    <td className="px-4 py-3 text-gray-700 font-medium">{fl.title}</td>
                    <td className="px-4 py-3">
                      <a
                        href={`/file/${fl.route}`}
                        className="text-blue-500 hover:underline font-mono text-xs"
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        /file/{fl.route}
                      </a>
                    </td>
                    <td className="px-4 py-3 text-gray-500 text-xs" title={fl.url}>
                      {truncateUrl(fl.url)}
                    </td>
                    <td className="px-4 py-3 text-gray-500">{fl.grade || "-"}</td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex justify-end gap-2">
                        <button
                          onClick={() => openEdit(fl)}
                          className="neu-btn px-3 py-1.5 text-xs text-gray-600"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => { setDeleteId(fl.id); setDeleteOpen(true); }}
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
        title={isEditing ? "Edit File Link" : "Add File Link"}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-600 mb-1">Title</label>
            <input
              type="text"
              value={formTitle}
              onChange={(e) => setFormTitle(e.target.value)}
              className="neu-input w-full"
              placeholder="e.g. Math Textbook"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-600 mb-1">Description (optional)</label>
            <textarea
              value={formDescription}
              onChange={(e) => setFormDescription(e.target.value)}
              className="neu-input w-full"
              placeholder="Brief description"
              rows={2}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-600 mb-1">Route (unique slug)</label>
            <input
              type="text"
              value={formRoute}
              onChange={(e) => setFormRoute(e.target.value)}
              className="neu-input w-full"
              placeholder="e.g. math-textbook-grade10"
              required
            />
            <p className="text-xs text-gray-400 mt-1">Accessible at /file/{formRoute || "slug"}</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-600 mb-1">URL</label>
            <input
              type="text"
              value={formUrl}
              onChange={(e) => setFormUrl(e.target.value)}
              className="neu-input w-full"
              placeholder="https://drive.google.com/..."
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-600 mb-1">Grade (optional)</label>
            <select
              value={formGrade}
              onChange={(e) => setFormGrade(e.target.value)}
              className="neu-input w-full"
            >
              <option value="">-- No grade --</option>
              {gradeLinks.map((gl) => (
                <option key={gl.id} value={gl.href.replace("/", "")}>
                  {gl.label}
                </option>
              ))}
            </select>
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
              {formLoading ? "Saving..." : isEditing ? "Save Changes" : "Add File Link"}
            </button>
          </div>
        </form>
      </Dialog>

      {/* Delete Confirm */}
      <ConfirmDialog
        open={deleteOpen}
        onClose={() => setDeleteOpen(false)}
        onConfirm={handleDelete}
        title="Delete File Link"
        message="Are you sure you want to delete this file link?"
        confirmLabel="Delete"
        loading={deleteLoading}
      />
    </>
  );
}
