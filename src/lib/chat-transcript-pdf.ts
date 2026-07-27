import type { UIMessage } from "ai";

/** Plain text of a UI message (text parts only). */
function messageText(message: UIMessage): string {
  return message.parts
    .map((part) => (part.type === "text" ? part.text : ""))
    .join("")
    .trim();
}

function stripMarkdown(text: string): string {
  return text
    .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")
    .replace(/[*_`#>]/g, "")
    .trim();
}

/**
 * Render the full chat transcript to a PDF and trigger a download.
 * Browser-only: jsPDF is imported lazily so it never enters the SSR bundle.
 */
export async function downloadChatTranscriptPdf(
  messages: UIMessage[],
  fileName = "digital-platform-chat.pdf",
): Promise<void> {
  const { jsPDF } = await import("jspdf");
  const doc = new jsPDF({ unit: "pt", format: "a4" });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 48;
  const maxWidth = pageWidth - margin * 2;
  let y = margin;

  const nextPageIfNeeded = (needed: number) => {
    if (y + needed <= pageHeight - margin) return;
    doc.addPage();
    y = margin;
  };

  const writeBlock = (label: string, body: string, accent: [number, number, number]) => {
    const lines = doc.splitTextToSize(body, maxWidth - 12) as string[];
    nextPageIfNeeded(34);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(10);
    doc.setTextColor(...accent);
    doc.text(label, margin, y);
    y += 14;

    doc.setFont("helvetica", "normal");
    doc.setFontSize(11);
    doc.setTextColor(30, 30, 30);
    for (const line of lines) {
      nextPageIfNeeded(16);
      doc.text(line, margin + 12, y);
      y += 15;
    }
    y += 10;
  };

  // Header
  doc.setFont("helvetica", "bold");
  doc.setFontSize(18);
  doc.setTextColor(20, 20, 20);
  doc.text("Digital Platform — AI chat transcript", margin, y);
  y += 20;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.setTextColor(120, 120, 120);
  doc.text(new Date().toLocaleString(), margin, y);
  y += 10;
  doc.setDrawColor(200, 200, 200);
  doc.line(margin, y, pageWidth - margin, y);
  y += 24;

  for (const message of messages) {
    const body = stripMarkdown(messageText(message));
    if (!body) continue;
    if (message.role === "user") writeBlock("You", body, [140, 100, 10]);
    else if (message.role === "assistant") writeBlock("Assistant", body, [60, 60, 60]);
  }

  doc.save(fileName);
}
