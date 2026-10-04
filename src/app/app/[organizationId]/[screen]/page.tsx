import { notFound } from "next/navigation";
import { Shell } from "@/modules/shell/shell";
import { isScreen } from "@/modules/shell/screens";
// No tenant data enters server HTML/RSC. The API authorizes every fresh document independently.
export default async function ShellPage({ params }: { params: Promise<{ organizationId: string; screen: string }> }) {
 const { organizationId, screen } = await params;
 if (!isScreen(screen)) notFound();
 return <Shell organizationId={organizationId} screen={screen} />;
}
