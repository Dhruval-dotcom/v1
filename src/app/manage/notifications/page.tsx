"use client";

import { useState } from "react";
import useSWR from "swr";
import Navbar from "@/components/Navbar";
import Dialog from "@/components/Dialog";
import ConfirmDialog from "@/components/ConfirmDialog";
import TiptapEditor from "@/components/TiptapEditor";

const fetcher = (url: string) => fetch(url).then((r) => r.json());

interface Notification {
  id: string;
  content: string;
  link: string | null;
  createdAt: string;
}

export default function ManageNotificationsPage() {
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");

  const queryParams = new URLSearchParams();
  if (fromDate) queryParams.set("from", fromDate);
  if (toDate) queryParams.set("to", toDate);
  const queryString = queryParams.toString();

  const { data: notifications, error, isLoading, mutate } = useSWR<Notification[]>(
    `/api/notifications${queryString ? `?${queryString}` : ""}`,
    fetcher
  );

  // Add form state
  const [showAddForm, setShowAddForm] = useState(false);
  const [addContent, setAddContent] = useState("");
  const [addLink, setAddLink] = useState("");
  const [addError, setAddError] = useState("");
  const [addLoading, setAddLoading] = useState(false);

  // Edit dialog state
  const [editOpen, setEditOpen] = useState(false);
  const [editId, setEditId] = useState("");
  const [editContent, setEditContent] = useState("");
  const [editLink, setEditLink] = useState("");
  const [editError, setEditError] = useState("");
  const [editLoading, setEditLoading] = useState(false);

  // Delete confirm state
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleteId, setDeleteId] = useState("");
  const [deleteLoading, setDeleteLoading] = useState(false);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    setAddError("");
    if (!addContent.trim()) {
      setAddError("Content is required.");
      return;
    }
    setAddLoading(true);
    try {
      const res = await fetch("/api/notifications", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          content: addContent,
          link: addLink || null,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setAddError(data.error || "Failed to create notification.");
        return;
      }
      setAddContent("");
      setAddLink("");
      setShowAddForm(false);
      mutate();
    } catch {
      setAddError("Network error. Please try again.");
    } finally {
      setAddLoading(false);
    }
  };

  const openEdit = (n: Notification) => {
    setEditId(n.id);
    setEditContent(n.content);
    setEditLink(n.link || "");
    setEditError("");
    setEditOpen(true);
  };

  const handleEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    setEditError("");
    if (!editContent.trim()) {
      setEditError("Content is required.");
      return;
    }
    setEditLoading(true);
    try {
      const res = await fetch(`/api/notifications/${editId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          content: editContent,
          link: editLink || null,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setEditError(data.error || "Failed to update notification.");
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
      await fetch(`/api/notifications/${deleteId}`, { method: "DELETE" });
      setDeleteOpen(false);
      mutate();
    } catch {
      // silent fail
    } finally {
      setDeleteLoading(false);
    }
  };

  return (
    <>
      <Navbar />
      <div className="mx-auto max-w-4xl px-4 py-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
          <h1 className="text-2xl font-bold text-gray-700">Manage Notifications</h1>
          <button
            onClick={() => setShowAddForm(!showAddForm)}
            className="neu-btn-gradient px-5 py-2 text-sm font-medium"
          >
            {showAddForm ? "Cancel" : "Add Notification"}
          </button>
        </div>

        {/* Add Form */}
        {showAddForm && (
          <div className="neu-raised p-6 mb-6">
            <h2 className="text-lg font-semibold text-gray-700 mb-4">New Notification</h2>
            <form onSubmit={handleAdd} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1">Content</label>
                <TiptapEditor content={addContent} onChange={setAddContent} />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1">Link (optional)</label>
                <input
                  type="text"
                  value={addLink}
                  onChange={(e) => setAddLink(e.target.value)}
                  placeholder="https://example.com"
                  className="neu-input w-full"
                />
              </div>
              {addError && <p className="text-sm text-red-500">{addError}</p>}
              <button
                type="submit"
                className="neu-btn-gradient px-5 py-2 text-sm font-medium"
                disabled={addLoading}
              >
                {addLoading ? "Saving..." : "Save Notification"}
              </button>
            </form>
          </div>
        )}

        {/* Date Filters */}
        <div className="neu-flat p-4 mb-6 flex flex-col sm:flex-row gap-4 items-end">
          <div>
            <label className="block text-sm font-medium text-gray-600 mb-1">From</label>
            <input
              type="date"
              value={fromDate}
              onChange={(e) => setFromDate(e.target.value)}
              className="neu-input"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-600 mb-1">To</label>
            <input
              type="date"
              value={toDate}
              onChange={(e) => setToDate(e.target.value)}
              className="neu-input"
            />
          </div>
          {(fromDate || toDate) && (
            <button
              onClick={() => { setFromDate(""); setToDate(""); }}
              className="neu-btn px-4 py-2 text-sm text-gray-600"
            >
              Clear
            </button>
          )}
        </div>

        {/* Loading / Error */}
        {isLoading && <p className="text-gray-500 text-sm">Loading notifications...</p>}
        {error && <p className="text-red-500 text-sm">Failed to load notifications.</p>}

        {/* Notification Cards */}
        <div className="space-y-4">
          {notifications && notifications.length === 0 && (
            <div className="neu-flat p-8 text-center text-gray-400 text-sm">
              No notifications found.
            </div>
          )}
          {notifications?.map((n) => (
            <div key={n.id} className="neu-raised p-5">
              <div
                className="prose prose-sm max-w-none text-gray-700 mb-3"
                dangerouslySetInnerHTML={{ __html: n.content }}
              />
              {n.link && (
                <a
                  href={n.link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-blue-500 hover:underline mb-2 inline-block"
                >
                  {n.link}
                </a>
              )}
              <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-200">
                <span className="text-xs text-gray-400">
                  {new Date(n.createdAt).toLocaleDateString("en-US", {
                    year: "numeric",
                    month: "short",
                    day: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </span>
                <div className="flex gap-2">
                  <button
                    onClick={() => openEdit(n)}
                    className="neu-btn px-3 py-1.5 text-xs text-gray-600"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => { setDeleteId(n.id); setDeleteOpen(true); }}
                    className="neu-btn-danger px-3 py-1.5 text-xs"
                  >
                    Delete
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Edit Dialog */}
      <Dialog open={editOpen} onClose={() => setEditOpen(false)} title="Edit Notification">
        <form onSubmit={handleEdit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-600 mb-1">Content</label>
            <TiptapEditor content={editContent} onChange={setEditContent} />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-600 mb-1">Link (optional)</label>
            <input
              type="text"
              value={editLink}
              onChange={(e) => setEditLink(e.target.value)}
              placeholder="https://example.com"
              className="neu-input w-full"
            />
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
        title="Delete Notification"
        message="Are you sure you want to delete this notification? This action cannot be undone."
        confirmLabel="Delete"
        loading={deleteLoading}
      />
    </>
  );
}
