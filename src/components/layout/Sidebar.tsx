import { SidebarContent } from "./SidebarContent";

export function Sidebar() {
  return (
    <aside className="fixed inset-y-0 left-0 z-50 w-64 bg-primary shadow-lg hidden md:flex flex-col">
      <SidebarContent />
    </aside>
  );
}
