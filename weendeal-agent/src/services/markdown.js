// Inline markdown for agent replies. Currently only **bold**.
// If the agent later emits italics/links/lists/headings etc, swap this for a real parser:
//   index.html importmap: "marked", "dompurify" from esm.sh
//   import { marked } from "marked"; import DOMPurify from "dompurify";
//   bubble.innerHTML = DOMPurify.sanitize(marked.parse(raw));
export function renderMarkdown(raw) {
  const esc = raw
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
  return esc.replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>");
}
