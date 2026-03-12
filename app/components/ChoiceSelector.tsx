'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import type { Choice } from '@/lib/types';

interface ChoiceSelectorProps {
  choices: Choice[];
  onSelect: (selectedIds: string[]) => void;
  disabled?: boolean;
}

export default function ChoiceSelector({ choices, onSelect, disabled }: ChoiceSelectorProps) {
  const [selected, setSelected] = useState<Set<string>>(new Set());

  const toggle = (id: string) => {
    const next = new Set(selected);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelected(next);
  };

  return (
    <div className="flex flex-col gap-2 my-2">
      <div className="flex flex-wrap gap-2">
        {choices.map(choice => (
          <Button
            key={choice.id}
            variant={selected.has(choice.id) ? 'default' : 'outline'}
            size="sm"
            onClick={() => toggle(choice.id)}
            disabled={disabled}
            className="text-left"
          >
            <div>
              <div>{choice.label}</div>
              {choice.description && (
                <div className="text-xs opacity-70">{choice.description}</div>
              )}
            </div>
          </Button>
        ))}
      </div>
      {selected.size > 0 && (
        <Button
          size="sm"
          onClick={() => onSelect(Array.from(selected))}
          disabled={disabled}
          className="self-end"
        >
          選択を送信
        </Button>
      )}
    </div>
  );
}
