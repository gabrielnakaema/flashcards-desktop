import { SidebarContent } from "./sidebar-content";

export const Sidebar = () => {
  return (
    <aside style={{ viewTransitionName: "sidebar" }} className="flex h-full w-68 shrink-0 border-r border-white/10 bg-zinc-900 text-zinc-100">
      <SidebarContent />
    </aside>
  );
};
