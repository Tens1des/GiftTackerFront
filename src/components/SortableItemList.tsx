import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core';
import { arrayMove, SortableContext, sortableKeyboardCoordinates, useSortable, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import type { WishlistItem } from '../types';

interface SortableItemListProps {
  items: WishlistItem[];
  isOwner: boolean;
  renderItem: (item: WishlistItem) => React.ReactNode;
  onOrderChange: (itemIds: string[]) => void;
}

function SortableRow({
  id,
  children,
  disabled,
}: {
  id: string;
  children: React.ReactNode;
  disabled: boolean;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id,
    disabled,
  });
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };
  return (
    <div ref={setNodeRef} style={style} className="sortable-row">
      {!disabled && (
        <button
          type="button"
          className="btn-icon sortable-grip"
          aria-label="Переместить"
          {...attributes}
          {...listeners}
        >
          ⋮⋮
        </button>
      )}
      <div style={{ flex: 1, minWidth: 0 }}>{children}</div>
    </div>
  );
}

export function SortableItemList({ items, isOwner, renderItem, onOrderChange }: SortableItemListProps) {
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const oldIndex = items.findIndex((i) => i.id === active.id);
    const newIndex = items.findIndex((i) => i.id === over.id);
    if (oldIndex === -1 || newIndex === -1) return;
    const newOrder = arrayMove(items, oldIndex, newIndex);
    onOrderChange(newOrder.map((i) => i.id));
  };

  if (!isOwner) {
    return <>{items.map((item) => <div key={item.id}>{renderItem(item)}</div>)}</>;
  }

  return (
    <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
      <SortableContext items={items.map((i) => i.id)} strategy={verticalListSortingStrategy}>
        {items.map((item) => (
          <SortableRow key={item.id} id={item.id} disabled={false}>
            {renderItem(item)}
          </SortableRow>
        ))}
      </SortableContext>
      <style>{`
        .sortable-row {
          display: flex;
          align-items: flex-start;
          gap: 8px;
          margin-bottom: 16px;
        }
        .sortable-grip {
          cursor: grab;
          color: var(--text-muted);
          flex-shrink: 0;
        }
        .sortable-grip:active {
          cursor: grabbing;
        }
      `}</style>
    </DndContext>
  );
}
