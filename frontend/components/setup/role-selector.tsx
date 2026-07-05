"use client";

import { EXPERIENCE_LEVELS } from "@/lib/constants";
import { cn } from "@/lib/utils";

interface RoleSelectorProps {
  selectedRole: string | null;
  onSelectRole: (role: string | null) => void;
}

export function RoleSelector({ selectedRole, onSelectRole }: RoleSelectorProps) {
  const handleClick = (roleId: string) => {
    // toggle off if already selected (deselect)
    onSelectRole(selectedRole === roleId ? null : roleId);
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <h3 className="text-sm font-medium">Experience Level</h3>
        <span className="text-[10px] text-muted-foreground bg-muted/50 px-1.5 py-0.5 rounded">
          Optional
        </span>
      </div>

      <p className="text-xs text-muted-foreground -mt-1">
        Calibrates question depth and evaluation expectations. Click again to deselect.
      </p>

      <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
        {EXPERIENCE_LEVELS.map((level) => {
          const isSelected = selectedRole === level.id;
          return (
            <button
              key={level.id}
              type="button"
              onClick={() => handleClick(level.id)}
              className={cn(
                "flex flex-col items-center gap-1.5 p-3 rounded-lg border text-xs font-medium transition-all",
                isSelected
                  ? "border-purple-500/50 bg-purple-500/10 text-foreground shadow-[0_0_12px_rgba(168,85,247,0.1)]"
                  : "border-border/50 bg-card hover:border-border hover:bg-muted/50 text-muted-foreground"
              )}
            >
              <span className="text-lg">{level.emoji}</span>
              <span>{level.label}</span>
            </button>
          );
        })}
      </div>

      {selectedRole && (
        <p className="text-[11px] text-muted-foreground text-center animate-in fade-in duration-200">
          {EXPERIENCE_LEVELS.find((l) => l.id === selectedRole)?.description}
        </p>
      )}
    </div>
  );
}
