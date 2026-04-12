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
            drawTitle: false,
            drawComposer: false,
            drawCredits: false,
            drawLyricist: false,
            drawPartNames: false,
            drawMeasureNumbers: true,
            drawTimeSignatures: true,
            drawKeySignatures: true,
            followCursor: false,
            defaultColorStem: "#1a1a2e",
            defaultColorNotehead: "#1a1a2e",
            defaultColorRest: "#1a1a2e",
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
    <div ref={containerRef} className="w-full min-h-[200px] bg-white rounded-lg overflow-x-auto" />
  );
};

export default SheetMusicRenderer;
