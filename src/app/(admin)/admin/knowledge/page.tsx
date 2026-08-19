import { redirect } from "next/navigation";

export default function LegacyAdminKnowledgeRedirect() {
  redirect("/console/knowledge");
}
