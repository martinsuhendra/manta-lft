import { Pencil, Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { DrawerClose, DrawerFooter } from "@/components/ui/drawer";

interface DrawerFooterButtonsProps {
  mode: "view" | "edit" | "add";
  canDelete: boolean;
  isPending: boolean;
  onEdit: () => void;
  onDelete: () => void;
}

export function DrawerFooterButtons({ mode, canDelete, isPending, onEdit, onDelete }: DrawerFooterButtonsProps) {
  if (mode === "view") {
    return (
      <DrawerFooter key="drawer-footer-view" className="gap-2">
        <Button
          type="button"
          variant="outline"
          onClick={(event) => {
            event.preventDefault();
            onEdit();
          }}
          className="w-full"
        >
          <Pencil className="mr-2 h-4 w-4" />
          Edit User
        </Button>
        <Button
          type="button"
          variant="destructive"
          onClick={(event) => {
            event.preventDefault();
            onDelete();
          }}
          disabled={!canDelete}
          className="w-full"
        >
          <Trash2 className="mr-2 h-4 w-4" />
          Delete User
        </Button>
      </DrawerFooter>
    );
  }

  const buttonText = mode === "add" ? "Create User" : "Update User";

  return (
    <DrawerFooter key="drawer-footer-form" className="gap-2">
      <Button type="submit" form="member-form" disabled={isPending} className="flex-1">
        {buttonText}
      </Button>
      <DrawerClose asChild>
        <Button type="button" variant="outline" disabled={isPending}>
          Cancel
        </Button>
      </DrawerClose>
    </DrawerFooter>
  );
}
