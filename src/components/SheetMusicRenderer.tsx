import { useEffect, useRef } from "react";
import { OpenSheetMusicDisplay } from "opensheetmusicdisplay";

interface SheetMusicRendererProps {
  musicXmlBase64: string | null;
  instrument: string;
}

const SheetMusicRenderer = ({ musicXmlBase64, instrument }: SheetMusicRendererProps) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const osmdRef = useRef<OpenSheetMusicDisplay | null>(null);

  useEffect(() => {
    if (!containerRef.current || !musicXmlBase64) return;

    const renderScore = async () => {
      try {
        const xmlString = atob(musicXmlBase64);

        if (!osmdRef.current) {
          osmdRef.current = new OpenSheetMusicDisplay(containerRef.current!, {
            autoResize: true,
            backend: "svg",
            drawTitle: true,
            drawComposer: false,
            drawCredits: false,
            drawLyricist: false,
            drawPartNames: true,
            drawMeasureNumbers: true,
            drawTimeSignatures: true,
            followCursor: false,
            defaultColorStem: "#1a1a2e",
            defaultColorNotehead: "#1a1a2e",
            defaultColorRest: "#1a1a2e",
            pageFormat: "A4 P",
            pageBackgroundColor: "#ffffff",
            renderSingleHorizontalStaffline: false,
            } as any);
          });
        }

        await osmdRef.current.load(xmlString);
        osmdRef.current.render();
      } catch (err) {
        console.error("OSMD render error:", err);
      }
    };

    renderScore();

    return () => {
      if (osmdRef.current) {
        osmdRef.current = null;
      }
    };
  }, [musicXmlBase64]);

  if (!musicXmlBase64) {
    return (
      <div className="flex items-center justify-center h-48 bg-paper border border-border rounded-lg">
        <span className="text-sm text-muted-foreground">No notation available</span>
      </div>
    );
  }

  return (
    <div ref={containerRef} className="w-full min-h-[300px] bg-white rounded-2xl border border-border p-6 shadow-sm" style={{ overflow: "hidden", width: "100%" }} />
  );
};

export default SheetMusicRenderer;
