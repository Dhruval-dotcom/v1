"use client";

import { useState } from "react";
import useSWR from "swr";
import Navbar from "@/components/Navbar";
import Dialog from "@/components/Dialog";
import ConfirmDialog from "@/components/ConfirmDialog";
import TiptapEditor from "@/components/TiptapEditor";
import { CardLoader } from "@/components/Loader";

const fetcher = (url: string) => fetch(url).then((r) => r.json());

interface Rule {
  id: string;
  content: string;
  order: number;
  sectionId: string;
  createdAt: string;
}

interface RuleSection {
  id: string;
  title: string;
  order: number;
  rules: Rule[];
  createdAt: string;
}

export default function ManageRulesPage() {
  const {
    data: sections,
    error,
    isLoading,
    mutate,
  } = useSWR<RuleSection[]>("/api/rule-sections", fetcher);

  // Section form state
  const [sectionTitle, setSectionTitle] = useState("");
  const [sectionOrder, setSectionOrder] = useState("");
  const [sectionError, setSectionError] = useState("");
  const [sectionLoading, setSectionLoading] = useState(false);

  // Rule form state
  const [ruleContent, setRuleContent] = useState("");
  const [ruleSectionId, setRuleSectionId] = useState("");
  const [ruleOrder, setRuleOrder] = useState("");
  const [ruleError, setRuleError] = useState("");
  const [ruleLoading, setRuleLoading] = useState(false);

  // Edit section dialog
  const [editSectionOpen, setEditSectionOpen] = useState(false);
  const [editSectionId, setEditSectionId] = useState("");
  const [editSectionTitle, setEditSectionTitle] = useState("");
  const [editSectionOrder, setEditSectionOrder] = useState("");
  const [editSectionError, setEditSectionError] = useState("");
  const [editSectionLoading, setEditSectionLoading] = useState(false);

  // Edit rule dialog
  const [editRuleOpen, setEditRuleOpen] = useState(false);
  const [editRuleId, setEditRuleId] = useState("");
  const [editRuleContent, setEditRuleContent] = useState("");
  const [editRuleSectionId, setEditRuleSectionId] = useState("");
  const [editRuleOrder, setEditRuleOrder] = useState("");
  const [editRuleError, setEditRuleError] = useState("");
  const [editRuleLoading, setEditRuleLoading] = useState(false);

  // Delete state
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleteType, setDeleteType] = useState<"section" | "rule">("section");
  const [deleteId, setDeleteId] = useState("");
  const [deleteLoading, setDeleteLoading] = useState(false);

  const handleAddSection = async (e: React.FormEvent) => {
    e.preventDefault();
    setSectionError("");
    if (!sectionTitle.trim()) {
      setSectionError("Title is required.");
      return;
    }
    setSectionLoading(true);
    try {
      const res = await fetch("/api/rule-sections", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: sectionTitle,
          order: sectionOrder ? parseInt(sectionOrder) : 0,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setSectionError(data.error || "Failed to create section.");
        return;
      }
      setSectionTitle("");
      setSectionOrder("");
      mutate();
    } catch {
      setSectionError("Network error. Please try again.");
    } finally {
      setSectionLoading(false);
    }
  };

  const handleAddRule = async (e: React.FormEvent) => {
    e.preventDefault();
    setRuleError("");
    if (!ruleContent.trim()) {
      setRuleError("Content is required.");
      return;
    }
    if (!ruleSectionId) {
      setRuleError("Please select a section.");
      return;
    }
    setRuleLoading(true);
    try {
      const res = await fetch("/api/rules", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          content: ruleContent,
          sectionId: ruleSectionId,
          order: ruleOrder ? parseInt(ruleOrder) : 0,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setRuleError(data.error || "Failed to create rule.");
        return;
      }
      setRuleContent("");
      setRuleOrder("");
      mutate();
    } catch {
      setRuleError("Network error. Please try again.");
    } finally {
      setRuleLoading(false);
    }
  };

  const openEditSection = (s: RuleSection) => {
    setEditSectionId(s.id);
    setEditSectionTitle(s.title);
    setEditSectionOrder(String(s.order));
    setEditSectionError("");
    setEditSectionOpen(true);
  };

  const handleEditSection = async (e: React.FormEvent) => {
    e.preventDefault();
    setEditSectionError("");
    if (!editSectionTitle.trim()) {
      setEditSectionError("Title is required.");
      return;
    }
    setEditSectionLoading(true);
    try {
      const res = await fetch(`/api/rule-sections/${editSectionId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: editSectionTitle,
          order: editSectionOrder ? parseInt(editSectionOrder) : 0,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setEditSectionError(data.error || "Failed to update section.");
        return;
      }
      setEditSectionOpen(false);
      mutate();
    } catch {
      setEditSectionError("Network error. Please try again.");
    } finally {
      setEditSectionLoading(false);
    }
  };

  const openEditRule = (r: Rule) => {
    setEditRuleId(r.id);
    setEditRuleContent(r.content);
    setEditRuleSectionId(r.sectionId);
    setEditRuleOrder(String(r.order));
    setEditRuleError("");
    setEditRuleOpen(true);
  };

  const handleEditRule = async (e: React.FormEvent) => {
    e.preventDefault();
    setEditRuleError("");
    if (!editRuleContent.trim()) {
      setEditRuleError("Content is required.");
      return;
    }
    setEditRuleLoading(true);
    try {
      const res = await fetch(`/api/rules/${editRuleId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          content: editRuleContent,
          sectionId: editRuleSectionId,
          order: editRuleOrder ? parseInt(editRuleOrder) : 0,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setEditRuleError(data.error || "Failed to update rule.");
        return;
      }
      setEditRuleOpen(false);
      mutate();
    } catch {
      setEditRuleError("Network error. Please try again.");
    } finally {
      setEditRuleLoading(false);
    }
  };

  const handleDelete = async () => {
    setDeleteLoading(true);
    try {
      const endpoint =
        deleteType === "section"
          ? `/api/rule-sections/${deleteId}`
          : `/api/rules/${deleteId}`;
      await fetch(endpoint, { method: "DELETE" });
      setDeleteOpen(false);
      mutate();
    } catch {
      // silent fail
    } finally {
      setDeleteLoading(false);
    }
  };

  const confirmDelete = (type: "section" | "rule", id: string) => {
    setDeleteType(type);
    setDeleteId(id);
    setDeleteOpen(true);
  };

  return (
    <>
      <Navbar />
      <div className="mx-auto max-w-4xl px-4 py-6">
        <h1 className="text-2xl font-bold text-gray-700 mb-6">Manage Rules</h1>

        {/* Add Section Form */}
        <div className="neu-raised p-6 mb-6">
          <h2 className="text-lg font-semibold text-gray-700 mb-4">
            Add Section
          </h2>
          <form onSubmit={handleAddSection} className="space-y-4">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1">
                <label className="block text-sm font-medium text-gray-600 mb-1">
                  Section Title
                </label>
                <input
                  type="text"
                  value={sectionTitle}
                  onChange={(e) => setSectionTitle(e.target.value)}
                  placeholder="e.g. Student Rules"
                  className="neu-input w-full"
                />
              </div>
              <div className="w-full sm:w-28">
                <label className="block text-sm font-medium text-gray-600 mb-1">
                  Order
                </label>
                <input
                  type="number"
                  value={sectionOrder}
                  onChange={(e) => setSectionOrder(e.target.value)}
                  placeholder="0"
                  className="neu-input w-full"
                />
              </div>
            </div>
            {sectionError && (
              <p className="text-sm text-red-500">{sectionError}</p>
            )}
            <button
              type="submit"
              className="neu-btn-gradient px-5 py-2 text-sm font-medium"
              disabled={sectionLoading}
            >
              {sectionLoading ? "Saving..." : "Add Section"}
            </button>
          </form>
        </div>

        {/* Add Rule Form */}
        <div className="neu-raised p-6 mb-6">
          <h2 className="text-lg font-semibold text-gray-700 mb-4">
            Add Rule
          </h2>
          <form onSubmit={handleAddRule} className="space-y-4">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1">
                <label className="block text-sm font-medium text-gray-600 mb-1">
                  Section
                </label>
                <select
                  value={ruleSectionId}
                  onChange={(e) => setRuleSectionId(e.target.value)}
                  className="neu-input w-full"
                >
                  <option value="">Select a section...</option>
                  {sections?.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.title}
                    </option>
                  ))}
                </select>
              </div>
              <div className="w-full sm:w-28">
                <label className="block text-sm font-medium text-gray-600 mb-1">
                  Order
                </label>
                <input
                  type="number"
                  value={ruleOrder}
                  onChange={(e) => setRuleOrder(e.target.value)}
                  placeholder="0"
                  className="neu-input w-full"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-600 mb-1">
                Rule Content
              </label>
              <TiptapEditor content={ruleContent} onChange={setRuleContent} />
            </div>
            {ruleError && <p className="text-sm text-red-500">{ruleError}</p>}
            <button
              type="submit"
              className="neu-btn-gradient px-5 py-2 text-sm font-medium"
              disabled={ruleLoading}
            >
              {ruleLoading ? "Saving..." : "Add Rule"}
            </button>
          </form>
        </div>

        {/* Existing Sections & Rules */}
        {error && (
          <p className="text-red-500 text-sm mb-4">Failed to load rules.</p>
        )}

        {isLoading ? (
          <CardLoader count={3} />
        ) : (
          <div className="space-y-6">
            {sections && sections.length === 0 && (
              <div className="neu-flat p-8 text-center text-gray-400 text-sm">
                No sections yet. Add a section above to get started.
              </div>
            )}
            {sections?.map((section) => (
              <div key={section.id} className="neu-raised p-5">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-700">
                      {section.title}
                    </h3>
                    <span className="text-xs text-gray-400">
                      Order: {section.order} &middot; {section.rules.length}{" "}
                      rule{section.rules.length !== 1 ? "s" : ""}
                    </span>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => openEditSection(section)}
                      className="neu-btn px-3 py-1.5 text-xs text-gray-600"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => confirmDelete("section", section.id)}
                      className="neu-btn-danger px-3 py-1.5 text-xs"
                    >
                      Delete
                    </button>
                  </div>
                </div>

                {section.rules.length === 0 ? (
                  <p className="text-gray-400 text-sm italic">
                    No rules in this section.
                  </p>
                ) : (
                  <div className="space-y-2">
                    {section.rules.map((rule, index) => (
                      <div
                        key={rule.id}
                        className="neu-flat p-3 flex items-start gap-3"
                      >
                        <span className="flex-shrink-0 flex items-center justify-center w-6 h-6 rounded-full bg-gradient-to-br from-[#667eea] to-[#764ba2] text-white text-xs font-bold">
                          {index + 1}
                        </span>
                        <div
                          className="prose prose-sm max-w-none text-gray-600 flex-1"
                          dangerouslySetInnerHTML={{ __html: rule.content }}
                        />
                        <div className="flex gap-1 flex-shrink-0">
                          <button
                            onClick={() => openEditRule(rule)}
                            className="neu-btn px-2 py-1 text-xs text-gray-600"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => confirmDelete("rule", rule.id)}
                            className="neu-btn-danger px-2 py-1 text-xs"
                          >
                            Del
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Edit Section Dialog */}
      <Dialog
        open={editSectionOpen}
        onClose={() => setEditSectionOpen(false)}
        title="Edit Section"
      >
        <form onSubmit={handleEditSection} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-600 mb-1">
              Title
            </label>
            <input
              type="text"
              value={editSectionTitle}
              onChange={(e) => setEditSectionTitle(e.target.value)}
              className="neu-input w-full"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-600 mb-1">
              Order
            </label>
            <input
              type="number"
              value={editSectionOrder}
              onChange={(e) => setEditSectionOrder(e.target.value)}
              className="neu-input w-full"
            />
          </div>
          {editSectionError && (
            <p className="text-sm text-red-500">{editSectionError}</p>
          )}
          <div className="flex justify-end gap-3">
            <button
              type="button"
              onClick={() => setEditSectionOpen(false)}
              className="neu-btn px-4 py-2 text-sm text-gray-600"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="neu-btn-gradient px-5 py-2 text-sm font-medium"
              disabled={editSectionLoading}
            >
              {editSectionLoading ? "Saving..." : "Save Changes"}
            </button>
          </div>
        </form>
      </Dialog>

      {/* Edit Rule Dialog */}
      <Dialog
        open={editRuleOpen}
        onClose={() => setEditRuleOpen(false)}
        title="Edit Rule"
      >
        <form onSubmit={handleEditRule} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-600 mb-1">
              Section
            </label>
            <select
              value={editRuleSectionId}
              onChange={(e) => setEditRuleSectionId(e.target.value)}
              className="neu-input w-full"
            >
              {sections?.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.title}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-600 mb-1">
              Content
            </label>
            <TiptapEditor
              content={editRuleContent}
              onChange={setEditRuleContent}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-600 mb-1">
              Order
            </label>
            <input
              type="number"
              value={editRuleOrder}
              onChange={(e) => setEditRuleOrder(e.target.value)}
              className="neu-input w-full"
            />
          </div>
          {editRuleError && (
            <p className="text-sm text-red-500">{editRuleError}</p>
          )}
          <div className="flex justify-end gap-3">
            <button
              type="button"
              onClick={() => setEditRuleOpen(false)}
              className="neu-btn px-4 py-2 text-sm text-gray-600"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="neu-btn-gradient px-5 py-2 text-sm font-medium"
              disabled={editRuleLoading}
            >
              {editRuleLoading ? "Saving..." : "Save Changes"}
            </button>
          </div>
        </form>
      </Dialog>

      {/* Delete Confirm */}
      <ConfirmDialog
        open={deleteOpen}
        onClose={() => setDeleteOpen(false)}
        onConfirm={handleDelete}
        title={`Delete ${deleteType === "section" ? "Section" : "Rule"}`}
        message={
          deleteType === "section"
            ? "Are you sure? This will delete the section and all its rules. This action cannot be undone."
            : "Are you sure you want to delete this rule? This action cannot be undone."
        }
        confirmLabel="Delete"
        loading={deleteLoading}
      />
    </>
  );
}
