import { Briefcase, FileText } from "lucide-react";

import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarHeader,
} from "../components/ui/sidebar";
import Link from "next/link";

const items = [
  {
    title: "Manage Blogs",
    url: "/blogs",
    icon: FileText,
  },
  {
    title: "Manage Careers",
    url: "/careers",
    icon: Briefcase,
  },
];

export default function AppSidebar() {
  return (
    <Sidebar className="w-[var(--sidebar-width)]" variant="floating">
      <SidebarContent>
        <Link href="/" passHref>
          <SidebarHeader className="text-xl font-bold py-2">
            InventIP Admin
          </SidebarHeader>
        </Link>
        <SidebarGroup>
          <SidebarGroupLabel>Edit Options</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {items.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <Link
                      href={item.url}
                      className="flex items-center gap-2 text-sm font-medium hover:bg-blue-200 hover:font-bold rounded p-2"
                    >
                      <item.icon size={18} />
                      <span>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}
