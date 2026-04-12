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
  { value: "letter", label: "US Letter (8.5×11\")" },
  { value: "a4", label: "A4 (210×297mm)" },
];

const pageStyles: Record<PaperSize, string> = {
  letter: "@page{margin:0.5in;size:8.5in 11in portrait;}",
  a4: "@page{margin:12mm;size:A4 portrait;}",
};

interface Props {
  displayName: string;
  activeInstrumentName: string;
}

const PdfButtonGroup = ({ displayName, activeInstrumentName }: Props) => {
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
    if (!printWindow) { alert("Please allow pop-ups for printing."); return; }
    printWindow.document.write(
      `<html><head><title>${displayName} - ${activeInstrumentName}</title><style>${pageStyles[paperSize]}*{margin:0;padding:0;box-sizing:border-box;}html,body{margin:0;padding:0;background:#fff;width:100%;}svg{max-width:100%;height:auto;display:block;transform-origin:top left;page-break-inside:avoid;break-inside:avoid;}.systemline,.staffline,g[class*="system"],g[class*="System"]{page-break-inside:avoid;break-inside:avoid;}</style></head><body>${container.innerHTML}</body></html>`
    );
    printWindow.document.close();
    printWindow.onload = () => { printWindow.print(); setTimeout(() => printWindow.close(), 1000); };
  };

  return (
    <div className="relative" ref={ref}>
      <div
        className="inline-flex items-center rounded-lg overflow-hidden"
        style={{ background: 'linear-gradient(135deg, #c8a96e 0%, #e8c98e 50%, #c8a96e 100%)', height: '40px' }}
      >
        {/* Main print button */}
        <button
          onClick={handlePrint}
          className="inline-flex items-center gap-2 px-5 py-2 text-[13px] font-bold transition-all hover:brightness-110 h-full"
          style={{ color: '#080810' }}
        >
          <FileText size={14} />
          PDF Sheet Music
        </button>

        {/* Divider */}
        <div className="w-px h-5" style={{ background: 'rgba(0,0,0,0.2)' }} />

        {/* Dropdown toggle */}
        <button
          onClick={() => setOpen(!open)}
          className="inline-flex items-center gap-1 px-3 py-2 text-[11px] font-bold transition-all hover:brightness-110 h-full"
          style={{ color: '#080810' }}
        >
          {paperLabels[paperSize]}
          <ChevronDown size={12} className={`transition-transform ${open ? "rotate-180" : ""}`} />
        </button>
      </div>

      {/* Dropdown menu */}
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
