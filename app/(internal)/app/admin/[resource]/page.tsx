import { notFound } from "next/navigation";
import {
  ClassHierarchyWorkspace,
  EnrollmentHierarchyWorkspace,
  ScheduleHierarchyWorkspace
} from "@/components/admin/hierarchy-admin-workspaces";
import { AdminResourceWorkspace } from "@/components/admin/resource-workspace";
import { StudentHierarchyWorkspace } from "@/components/admin/student-hierarchy-workspace";
import { ADMIN_RESOURCES } from "@/lib/config/admin-resources";

export default async function AdminResourcePage({
  params
}: {
  params: Promise<{ resource: string }>;
}) {
  const { resource } = await params;

  if (!ADMIN_RESOURCES[resource]) {
    notFound();
  }

  if (resource === "classes") return <ClassHierarchyWorkspace />;
  if (resource === "students") return <StudentHierarchyWorkspace />;
  if (resource === "enrollments") return <EnrollmentHierarchyWorkspace />;
  if (resource === "schedules") return <ScheduleHierarchyWorkspace />;

  return <AdminResourceWorkspace resourceKey={resource} />;
}
