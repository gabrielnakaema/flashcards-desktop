import { SidebarContent } from "./sidebar-content";

export const Sidebar = () => {
  return (
    <aside className="flex h-full w-68 shrink-0 border-r border-sidebar-border bg-sidebar text-sidebar-foreground">
      <SidebarContent />
    </aside>
  );
};
