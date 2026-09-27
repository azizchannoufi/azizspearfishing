"use client";

import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import { useEffect } from "react";
import { btnSecondary } from "./ui";

export function RichTextEditor({
  value,
  onChange,
}: {
  value: string;
  onChange: (html: string) => void;
}) {
  const editor = useEditor({
    extensions: [StarterKit],
    content: value || "",
    immediatelyRender: false,
    onUpdate: ({ editor: ed }) => onChange(ed.getHTML()),
    editorProps: {
      attributes: {
        class:
          "prose prose-sm max-w-none min-h-[180px] px-3 py-2 focus:outline-none text-slate-900",
      },
    },
  });

  useEffect(() => {
    if (!editor) return;
    if (value !== editor.getHTML()) {
      editor.commands.setContent(value || "", { emitUpdate: false });
    }
  }, [value, editor]);

  if (!editor) return null;

  return (
    <div className="overflow-hidden rounded-lg border border-slate-200 bg-white">
      <div className="flex flex-wrap gap-1 border-b border-slate-200 bg-slate-50 p-2">
        {(
          [
            ["Bold", () => editor.chain().focus().toggleBold().run()],
            ["Italic", () => editor.chain().focus().toggleItalic().run()],
            ["H2", () => editor.chain().focus().toggleHeading({ level: 2 }).run()],
            ["H3", () => editor.chain().focus().toggleHeading({ level: 3 }).run()],
            ["List", () => editor.chain().focus().toggleBulletList().run()],
            ["Quote", () => editor.chain().focus().toggleBlockquote().run()],
          ] as const
        ).map(([label, action]) => (
          <button key={label} type="button" className={btnSecondary + " !px-2 !py-1"} onClick={action}>
            {label}
          </button>
        ))}
      </div>
      <EditorContent editor={editor} />
    </div>
  );
}
