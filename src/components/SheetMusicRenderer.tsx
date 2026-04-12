import { useEffect, useRef } from "react";
import { OpenSheetMusicDisplay, TransposeCalculator } from "opensheetmusicdisplay";

interface SheetMusicRendererProps {
  musicXmlBase64: string | null;
  instrument: string;
  transposeSemitones?: number;
}

const SheetMusicRenderer = ({ musicXmlBase64, instrument, transposeSemitones = 0 }: SheetMusicRendererProps) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const osmdRef = useRef<OpenSheetMusicDisplay | null>(null);
  const loadedXmlRef = useRef<string | null>(null);

  useEffect(() => {
    if (!containerRef.current || !musicXmlBase64) return;

    osmdRef.current = null;
    containerRef.current.innerHTML = "";
    loadedXmlRef.current = null;

    const renderScore = async () => {
      try {
        const xmlString = atob(musicXmlBase64);

        const osmd = new OpenSheetMusicDisplay(containerRef.current!, {
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
          drawingParameters: "compact",
          pageFormat: "Endless",
          pageBackgroundColor: "#ffffff",
          renderSingleHorizontalStaffline: false,
          fitLastSystemFillScreen: false,
        } as any);

        osmd.TransposeCalculator = new TransposeCalculator();
        osmdRef.current = osmd;

        await osmd.load(xmlString);
        loadedXmlRef.current = musicXmlBase64;

        if (transposeSemitones !== 0) {
          osmd.Sheet.Transpose = transposeSemitones;
          osmd.updateGraphic();
        }

        osmd.render();
      } catch (err) {
        console.error("OSMD render error:", err);
      }
    };

    renderScore();

    return () => {
      osmdRef.current = null;
    };
  }, [musicXmlBase64]);

  // Handle transpose changes without reloading
  useEffect(() => {
    const osmd = osmdRef.current;
    if (!osmd || !loadedXmlRef.current) return;

    try {
      osmd.Sheet.Transpose = transposeSemitones;
      osmd.updateGraphic();
      osmd.render();
    } catch (err) {
      console.error("OSMD transpose error:", err);
    }
  }, [transposeSemitones]);

  if (!musicXmlBase64) {
    return (
      <div className="flex items-center justify-center h-48 bg-paper border border-border rounded-lg">
        <span className="text-sm text-muted-foreground">No notation available</span>
      </div>
    );
  }

  return (
    <div ref={containerRef} className="w-full min-h-[300px] bg-white rounded-2xl border border-border px-10 py-6 shadow-sm" style={{ overflow: "hidden", width: "100%" }} />
  );
};

export default SheetMusicRenderer;
