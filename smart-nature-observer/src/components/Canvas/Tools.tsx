import React from 'react';
import {
  Pencil,
  Eraser,
  MousePointer,
  Lasso,
  Type,
  Tag,
} from 'lucide-react';

export type ToolType = 'select' | 'draw' | 'erase' | 'lasso' | 'text' | 'label';

interface ToolsProps {
  selectedTool: ToolType;
  onToolSelect: (tool: ToolType) => void;
}

export const Tools: React.FC<ToolsProps> = ({ selectedTool, onToolSelect }) => {
  const tools = [
    { id: 'select', icon: MousePointer, label: 'Select' },
    { id: 'draw', icon: Pencil, label: 'Draw' },
    { id: 'erase', icon: Eraser, label: 'Erase' },
    { id: 'lasso', icon: Lasso, label: 'Lasso' },
    { id: 'text', icon: Type, label: 'Text' },
    { id: 'label', icon: Tag, label: 'Label' },
  ] as const;

  return (
    <div className="flex flex-col space-y-2 bg-white rounded-lg shadow-sm p-2">
      {tools.map(({ id, icon: Icon, label }) => (
        <button
          key={id}
          onClick={() => onToolSelect(id as ToolType)}
          className={`p-2 rounded-lg transition-colors ${
            selectedTool === id
              ? 'bg-blue-100 text-blue-600'
              : 'hover:bg-gray-100 text-gray-600'
          }`}
          title={label}
        >
          <Icon className="w-5 h-5" />
        </button>
      ))}
    </div>
  );
};
