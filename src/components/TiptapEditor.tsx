"use client";

import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";

interface TiptapEditorProps {
  content: string;
  onChange: (html: string) => void;
}

export default function TiptapEditor({ content, onChange }: TiptapEditorProps) {
  const editor = useEditor({
    extensions: [StarterKit],
    content,
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML());
    },
    editorProps: {
      attributes: {
        class: "neu-input min-h-[120px] prose prose-sm max-w-none focus:outline-none",
      },
    },
  });

  if (!editor) return null;

  return (
    <div className="tiptap-editor">
      <div className="flex gap-1 mb-2">
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleBold().run()}
          className={`px-3 py-1.5 rounded-lg text-sm font-bold transition-all ${
            editor.isActive("bold")
              ? "neu-pressed text-gray-700"
              : "neu-btn text-gray-500"
          }`}
        >
          B
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleItalic().run()}
          className={`px-3 py-1.5 rounded-lg text-sm italic transition-all ${
            editor.isActive("italic")
              ? "neu-pressed text-gray-700"
              : "neu-btn text-gray-500"
          }`}
        >
          I
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleBulletList().run()}
          className={`px-3 py-1.5 rounded-lg text-sm transition-all ${
            editor.isActive("bulletList")
              ? "neu-pressed text-gray-700"
              : "neu-btn text-gray-500"
          }`}
        >
          List
        </button>
      </div>
      <EditorContent editor={editor} />
    </div>
  );
}
