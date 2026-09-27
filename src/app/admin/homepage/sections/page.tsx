"use client";

import { useEffect, useState } from "react";
import {
  DndContext,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  arrayMove,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { getDocData, setDocData } from "@/lib/firebase/cms";
import { homepageSectionKeys, type HomepageSection } from "@/lib/firebase/types";
import { PageHeader, FormStatus, btnPrimary } from "@/components/admin/ui";
import { logActivity } from "@/lib/activity";
import { getClientDb } from "@/lib/firebase/client";
import { useAuth } from "@/components/admin/AuthProvider";

function SortableRow({
  item,
  onToggle,
}: {
  item: HomepageSection;
  onToggle: () => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({
    id: item.key,
  });
  return (
    <div
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      className="flex items-center gap-3 rounded-lg border border-slate-200 bg-white px-3 py-3"
    >
      <button type="button" className="cursor-grab text-slate-400" {...attributes} {...listeners}>
        ☰
      </button>
      <span className="flex-1 text-sm font-medium capitalize text-slate-800">{item.key}</span>
      <label className="flex items-center gap-2 text-sm text-slate-600">
        <input type="checkbox" checked={item.enabled} onChange={onToggle} />
        Enabled
      </label>
    </div>
  );
}

export default function HomepageSectionsPage() {
  const { user } = useAuth();
  const [items, setItems] = useState<HomepageSection[]>(
    homepageSectionKeys.map((key, order) => ({ key, enabled: true, order })),
  );
  const [status, setStatus] = useState<"idle" | "saving" | "success" | "error">("idle");
  const sensors = useSensors(useSensor(PointerSensor));

  useEffect(() => {
    void getDocData<{ items: HomepageSection[] }>("homepage/sections").then((data) => {
      if (data?.items?.length) setItems(data.items);
    });
  }, []);

  function onDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    setItems((list) => {
      const oldIndex = list.findIndex((i) => i.key === active.id);
      const newIndex = list.findIndex((i) => i.key === over.id);
      return arrayMove(list, oldIndex, newIndex).map((item, order) => ({ ...item, order }));
    });
  }

  async function save() {
    setStatus("saving");
    try {
      await setDocData("homepage/sections", { items });
      await logActivity(getClientDb(), {
        userId: user?.uid || "",
        userName: user?.displayName || user?.email || "Admin",
        action: "updated",
        resource: "homepage sections",
      });
      setStatus("success");
    } catch {
      setStatus("error");
    }
  }

  return (
    <div>
      <PageHeader
        title="Homepage sections"
        description="Enable, disable, and reorder homepage sections."
      />
      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={onDragEnd}>
        <SortableContext items={items.map((i) => i.key)} strategy={verticalListSortingStrategy}>
          <div className="space-y-2">
            {items.map((item) => (
              <SortableRow
                key={item.key}
                item={item}
                onToggle={() =>
                  setItems((list) =>
                    list.map((i) =>
                      i.key === item.key ? { ...i, enabled: !i.enabled } : i,
                    ),
                  )
                }
              />
            ))}
          </div>
        </SortableContext>
      </DndContext>
      <div className="mt-4 space-y-3">
        <FormStatus status={status} />
        <button type="button" className={btnPrimary} onClick={() => void save()}>
          Save sections
        </button>
      </div>
    </div>
  );
}
