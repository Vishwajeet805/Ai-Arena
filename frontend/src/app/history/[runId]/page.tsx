import RunDetailInspector from "@/components/runs/run-detail-inspector";

export default async function RunDetailPage({ params }: { params: Promise<{ runId: string }> }) {
  const { runId } = await params;
  return <RunDetailInspector runId={runId} />;
}
