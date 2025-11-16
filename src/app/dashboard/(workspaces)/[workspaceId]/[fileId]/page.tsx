import { redirect } from "next/navigation";
import { getFileById } from "@/lib/db/queries";
import { FileEditor } from "@/components/editor/file-editor";

export default async function FilePage({
  params,
}: {
  params: Promise<{ workspaceId: string; fileId: string }>;
}) {
  const { workspaceId, fileId } = await params;

  const file = await getFileById(fileId);

  if (!file) {
    redirect(`/dashboard/${workspaceId}`);
  }

  return <FileEditor file={file} workspaceId={workspaceId} />;
}
