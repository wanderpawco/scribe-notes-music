import { useState, useRef, useEffect } from "react";
import { FileText, ChevronDown } from "lucide-react";

type PaperSize = "letter" | "a4";

const defaultPaperSize = (): PaperSize =>
  navigator.language?.startsWith("en-US") ? "letter" : "a4";

const paperLabels: Record<PaperSize, string> = {
  letter: "Letter",
  a4: "A4",
};

const paperOptions: { value: PaperSize; label: string }[] = [
  { value: "letter", label: 'US Letter (8.5×11")' },
  { value: "a4", label: "A4 (210×297mm)" },
];

interface Props {
  displayName: string;
  activeInstrumentName: string;
  selectedKey?: string;
  bpm?: number;
}

function buildPrintHtml(
  paperSize: PaperSize,
  displayName: string,
  instrumentName: string,
  selectedKey: string,
  bpm: number,
  svgContent: string
) {
  const pageRule =
    paperSize === "letter"
      ? "@page { margin: 0.5in; size: 8.5in 11in portrait; }"
      : "@page { margin: 12mm; size: A4 portrait; }";

  return `<!DOCTYPE html>
<html><head>
<meta charset="utf-8">
<title>${displayName} - ${instrumentName}</title>
<style>
${pageRule}

* { margin: 0; padding: 0; box-sizing: border-box; }
html, body { margin: 0; padding: 0; background: #fff; width: 100%; font-family: Georgia, 'Times New Roman', serif; }

/* First-page header */
.title-header {
  padding-bottom: 10px;
  margin-bottom: 16px;
  border-bottom: 1px solid #ccc;
}
.title-header h1 {
  font-size: 24px;
  font-weight: 700;
  color: #111;
  margin: 0 0 4px 0;
}
.title-header p {
  font-size: 14px;
  color: #444;
  margin: 0;
}

/* Running header for page 2+ */
.running-header {
  display: none;
  text-align: right;
  font-size: 16px;
  color: #666;
  padding-bottom: 8px;
  margin-bottom: 12px;
  border-bottom: 1px solid #ddd;
  break-before: page;
}

/* SVG layout */
svg {
  max-width: 100%;
  height: auto;
  display: block;
  transform-origin: top left;
  page-break-inside: avoid;
  break-inside: avoid;
}
.systemline, .staffline,
g[class*="system"], g[class*="System"] {
  page-break-inside: avoid;
  break-inside: avoid;
}

/* Page numbers via CSS counter */
body { counter-reset: pagenum; }
.page-footer {
  position: fixed;
  bottom: 0;
  right: 0;
  font-size: 11px;
  color: #999;
}
@media print {
  .page-footer { display: block; }
  .page-footer::after {
    counter-increment: pagenum;
    content: "Page " counter(pagenum);
  }
}
</style>
</head>
<body>

<div class="title-header">
  <h1>${escapeHtml(displayName)}</h1>
  <p>${escapeHtml(instrumentName)}  •  ${escapeHtml(selectedKey)}  •  ${bpm} BPM</p>
</div>

${svgContent}

<div class="page-footer"></div>

</body></html>`;
}

function escapeHtml(str: string) {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

const PdfButtonGroup = ({ displayName, activeInstrumentName, selectedKey = "C Major", bpm = 120 }: Props) => {
  const [paperSize, setPaperSize] = useState<PaperSize>(defaultPaperSize);
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  const handlePrint = () => {
    const container = document.getElementById("osmd-render-container");
    if (!container) return;
    const printWindow = window.open("", "_blank");
    if (!printWindow) {
      alert("Please allow pop-ups for printing.");
      return;
    }
    const html = buildPrintHtml(
      paperSize,
      displayName,
      activeInstrumentName,
      selectedKey,
      bpm,
      container.innerHTML
    );
    printWindow.document.write(html);
    printWindow.document.close();
    printWindow.onload = () => {
      printWindow.print();
      setTimeout(() => printWindow.close(), 2000);
    };
  };

  return (
    <div className="relative" ref={ref}>
      <div
        className="inline-flex items-center rounded-lg overflow-hidden"
        style={{ background: 'linear-gradient(135deg, #c8a96e 0%, #e8c98e 50%, #c8a96e 100%)', height: '40px' }}
      >
        <button
          onClick={handlePrint}
          className="inline-flex items-center gap-2 px-5 py-2 text-[13px] font-bold transition-all hover:brightness-110 h-full"
          style={{ color: '#080810' }}
        >
          <FileText size={14} />
          PDF Sheet Music
        </button>

        <div className="w-px h-5" style={{ background: 'rgba(0,0,0,0.2)' }} />

        <button
          onClick={() => setOpen(!open)}
          className="inline-flex items-center gap-1 px-3 py-2 text-[11px] font-bold transition-all hover:brightness-110 h-full"
          style={{ color: '#080810' }}
        >
          {paperLabels[paperSize]}
          <ChevronDown size={12} className={`transition-transform ${open ? "rotate-180" : ""}`} />
        </button>
      </div>

      {open && (
        <div
          className="absolute z-50 mt-1 left-0 w-52 rounded-xl shadow-lg p-1"
          style={{ background: '#1a1a2e', border: '1px solid rgba(200,169,110,0.3)' }}
        >
          {paperOptions.map((opt) => (
            <button
              key={opt.value}
              onClick={() => { setPaperSize(opt.value); setOpen(false); }}
              className="w-full text-left text-sm px-3 py-2.5 rounded-lg transition-colors"
              style={opt.value === paperSize
                ? { background: 'linear-gradient(135deg, #c8a96e 0%, #e8c98e 50%, #c8a96e 100%)', color: '#080810', fontWeight: 600 }
                : { color: '#e8e8f0' }
              }
              onMouseEnter={e => { if (opt.value !== paperSize) (e.target as HTMLButtonElement).style.background = 'rgba(255,255,255,0.06)'; }}
              onMouseLeave={e => { if (opt.value !== paperSize) (e.target as HTMLButtonElement).style.background = 'transparent'; }}
            >
              {opt.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default PdfButtonGroup;
