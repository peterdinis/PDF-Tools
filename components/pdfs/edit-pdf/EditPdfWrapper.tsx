"use client";

import { FC, useState, useRef } from "react";
import {
  Edit,
  Download,
  Loader2,
  Plus,
  Trash2,
  Type,
  Image,
  Square,
  Circle,
  Minus,
  RotateCcw,
  ZoomIn,
  ZoomOut,
  Eye,
  EyeOff,
  Move,
  Undo,
  Redo,
  Layers,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { PDFDocument, rgb, StandardFonts } from "pdf-lib";
import ToolLayout from "@/components/tools/ToolLayout";

type ElementType = "text" | "image" | "rectangle" | "circle" | "line";
type TextAlignment = "left" | "center" | "right";
type FontWeight = "normal" | "bold" | "italic";
type ToolMode =
  | "select"
  | "move"
  | "text"
  | "image"
  | "rectangle"
  | "circle"
  | "line";

interface BaseElement {
  id: string;
  type: ElementType;
  x: number;
  y: number;
  rotation: number;
  opacity: number;
  visible: boolean;
  layer: number;
}

interface TextElement extends BaseElement {
  type: "text";
  content: string;
  fontSize: number;
  font: string;
  fontWeight: FontWeight;
  color: string;
  alignment: TextAlignment;
  backgroundColor: string;
  padding: number;
}

interface ImageElement extends BaseElement {
  type: "image";
  file: File;
  width: number;
  height: number;
  maintainAspectRatio: boolean;
}

interface RectangleElement extends BaseElement {
  type: "rectangle";
  width: number;
  height: number;
  color: string;
  borderColor: string;
  borderWidth: number;
  borderRadius: number;
}

interface CircleElement extends BaseElement {
  type: "circle";
  radius: number;
  color: string;
  borderColor: string;
  borderWidth: number;
}

interface LineElement extends BaseElement {
  type: "line";
  endX: number;
  endY: number;
  color: string;
  thickness: number;
  dashed: boolean;
}

type PdfElement =
  | TextElement
  | ImageElement
  | RectangleElement
  | CircleElement
  | LineElement;

interface EditorHistory {
  elements: PdfElement[];
  timestamp: number;
}

const EditPdfWrapper: FC = () => {
  const [files, setFiles] = useState<File[]>([]);
  const [editing, setEditing] = useState(false);
  const [processedUrl, setProcessedUrl] = useState<string | null>(null);
  const [elements, setElements] = useState<PdfElement[]>([]);
  const [activeTab, setActiveTab] = useState<ElementType>("text");
  const [toolMode, setToolMode] = useState<ToolMode>("select");
  const [selectedElement, setSelectedElement] = useState<string | null>(null);
  const [zoom, setZoom] = useState(100);
  const [history, setHistory] = useState<EditorHistory[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);

  // Text element state
  const [textContent, setTextContent] = useState("");
  const [textX, setTextX] = useState("100");
  const [textY, setTextY] = useState("100");
  const [fontSize, setFontSize] = useState("16");
  const [fontFamily, setFontFamily] = useState("Helvetica");
  const [fontWeight, setFontWeight] = useState<FontWeight>("normal");
  const [textColor, setTextColor] = useState("#000000");
  const [textBackground, setTextBackground] = useState("transparent");
  const [textPadding, setTextPadding] = useState("0");
  const [textAlignment, setTextAlignment] = useState<TextAlignment>("left");

  // Image element state
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imageX, setImageX] = useState("100");
  const [imageY, setImageY] = useState("100");
  const [imageWidth, setImageWidth] = useState("150");
  const [imageHeight, setImageHeight] = useState("150");
  const [maintainAspect, setMaintainAspect] = useState(true);

  // Rectangle element state
  const [rectX, setRectX] = useState("100");
  const [rectY, setRectY] = useState("100");
  const [rectWidth, setRectWidth] = useState("200");
  const [rectHeight, setRectHeight] = useState("100");
  const [rectColor, setRectColor] = useState("#ffffff");
  const [rectBorderColor, setRectBorderColor] = useState("#000000");
  const [rectBorderWidth, setRectBorderWidth] = useState("2");
  const [rectBorderRadius, setRectBorderRadius] = useState("0");

  // Circle element state
  const [circleX, setCircleX] = useState("150");
  const [circleY, setCircleY] = useState("150");
  const [circleRadius, setCircleRadius] = useState("50");
  const [circleColor, setCircleColor] = useState("#ffffff");
  const [circleBorderColor, setCircleBorderColor] = useState("#000000");
  const [circleBorderWidth, setCircleBorderWidth] = useState("2");

  // Line element state
  const [lineStartX, setLineStartX] = useState("100");
  const [lineStartY, setLineStartY] = useState("100");
  const [lineEndX, setLineEndX] = useState("200");
  const [lineEndY, setLineEndY] = useState("200");
  const [lineColor, setLineColor] = useState("#000000");
  const [lineThickness, setLineThickness] = useState("2");
  const [lineDashed, setLineDashed] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const saveToHistory = (newElements: PdfElement[]) => {
    const newHistory = history.slice(0, historyIndex + 1);
    newHistory.push({
      elements: JSON.parse(JSON.stringify(newElements)),
      timestamp: Date.now(),
    });
    setHistory(newHistory);
    setHistoryIndex(newHistory.length - 1);
  };

  const undo = () => {
    if (historyIndex > 0) {
      setHistoryIndex(historyIndex - 1);
      setElements(history[historyIndex - 1].elements);
    }
  };

  const redo = () => {
    if (historyIndex < history.length - 1) {
      setHistoryIndex(historyIndex + 1);
      setElements(history[historyIndex + 1].elements);
    }
  };

  const addTextElement = () => {
    if (!textContent.trim()) return;

    const newElement: TextElement = {
      id: Date.now().toString(),
      type: "text",
      content: textContent,
      x: Number.parseInt(textX),
      y: Number.parseInt(textY),
      fontSize: Number.parseInt(fontSize),
      font: fontFamily,
      fontWeight,
      color: textColor,
      alignment: textAlignment,
      backgroundColor: textBackground,
      padding: Number.parseInt(textPadding),
      rotation: 0,
      opacity: 1,
      visible: true,
      layer: elements.length,
    };

    const newElements = [...elements, newElement];
    setElements(newElements);
    saveToHistory(newElements);
    setTextContent("");
    setSelectedElement(newElement.id);
  };

  const addImageElement = () => {
    if (!imageFile) return;

    const newElement: ImageElement = {
      id: Date.now().toString(),
      type: "image",
      file: imageFile,
      x: Number.parseInt(imageX),
      y: Number.parseInt(imageY),
      width: Number.parseInt(imageWidth),
      height: Number.parseInt(imageHeight),
      maintainAspectRatio: maintainAspect,
      rotation: 0,
      opacity: 1,
      visible: true,
      layer: elements.length,
    };

    const newElements = [...elements, newElement];
    setElements(newElements);
    saveToHistory(newElements);
    setImageFile(null);
    setSelectedElement(newElement.id);
  };

  const addRectangleElement = () => {
    const newElement: RectangleElement = {
      id: Date.now().toString(),
      type: "rectangle",
      x: Number.parseInt(rectX),
      y: Number.parseInt(rectY),
      width: Number.parseInt(rectWidth),
      height: Number.parseInt(rectHeight),
      color: rectColor,
      borderColor: rectBorderColor,
      borderWidth: Number.parseInt(rectBorderWidth),
      borderRadius: Number.parseInt(rectBorderRadius),
      rotation: 0,
      opacity: 1,
      visible: true,
      layer: elements.length,
    };

    const newElements = [...elements, newElement];
    setElements(newElements);
    saveToHistory(newElements);
    setSelectedElement(newElement.id);
  };

  const addCircleElement = () => {
    const newElement: CircleElement = {
      id: Date.now().toString(),
      type: "circle",
      x: Number.parseInt(circleX),
      y: Number.parseInt(circleY),
      radius: Number.parseInt(circleRadius),
      color: circleColor,
      borderColor: circleBorderColor,
      borderWidth: Number.parseInt(circleBorderWidth),
      rotation: 0,
      opacity: 1,
      visible: true,
      layer: elements.length,
    };

    const newElements = [...elements, newElement];
    setElements(newElements);
    saveToHistory(newElements);
    setSelectedElement(newElement.id);
  };

  const addLineElement = () => {
    const newElement: LineElement = {
      id: Date.now().toString(),
      type: "line",
      x: Number.parseInt(lineStartX),
      y: Number.parseInt(lineStartY),
      endX: Number.parseInt(lineEndX),
      endY: Number.parseInt(lineEndY),
      color: lineColor,
      thickness: Number.parseInt(lineThickness),
      dashed: lineDashed,
      rotation: 0,
      opacity: 1,
      visible: true,
      layer: elements.length,
    };

    const newElements = [...elements, newElement];
    setElements(newElements);
    saveToHistory(newElements);
    setSelectedElement(newElement.id);
  };

  const removeElement = (id: string) => {
    const newElements = elements.filter((element) => element.id !== id);
    setElements(newElements);
    saveToHistory(newElements);
    if (selectedElement === id) {
      setSelectedElement(null);
    }
  };

  const updateElement = (id: string, updates: Partial<PdfElement>) => {
    const newElements = elements.map((element) => {
      if (element.id === id) {
        // Type-safe update for each element type
        switch (element.type) {
          case "text":
            return { ...element, ...updates } as TextElement;
          case "image":
            return { ...element, ...updates } as ImageElement;
          case "rectangle":
            return { ...element, ...updates } as RectangleElement;
          case "circle":
            return { ...element, ...updates } as CircleElement;
          case "line":
            return { ...element, ...updates } as LineElement;
          default:
            return element;
        }
      }
      return element;
    });
    setElements(newElements);
    saveToHistory(newElements);
  };

  const moveElement = (id: string, direction: "up" | "down") => {
    const index = elements.findIndex((el) => el.id === id);
    if (index === -1) return;

    const newElements = [...elements];
    if (direction === "up" && index < newElements.length - 1) {
      [newElements[index], newElements[index + 1]] = [
        newElements[index + 1],
        newElements[index],
      ];
    } else if (direction === "down" && index > 0) {
      [newElements[index], newElements[index - 1]] = [
        newElements[index - 1],
        newElements[index],
      ];
    }

    setElements(newElements);
    saveToHistory(newElements);
  };

  const toggleElementVisibility = (id: string) => {
    const element = elements.find((el) => el.id === id);
    if (element) {
      updateElement(id, { visible: !element.visible });
    }
  };

  const hexToRgb = (hex: string) => {
    if (hex === "transparent") return { r: 1, g: 1, b: 1, a: 0 };

    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result
      ? {
          r: Number.parseInt(result[1], 16) / 255,
          g: Number.parseInt(result[2], 16) / 255,
          b: Number.parseInt(result[3], 16) / 255,
        }
      : { r: 0, g: 0, b: 0 };
  };

  const handleEdit = async () => {
    if (files.length === 0 || elements.length === 0) return;

    setEditing(true);
    try {
      const file = files[0];
      const arrayBuffer = await file.arrayBuffer();
      const pdfDoc = await PDFDocument.load(arrayBuffer);

      const pages = pdfDoc.getPages();
      const firstPage = pages[0];
      const { width, height } = firstPage.getSize();

      const helveticaFont = await pdfDoc.embedFont(StandardFonts.Helvetica);
      const helveticaBoldFont = await pdfDoc.embedFont(
        StandardFonts.HelveticaBold,
      );
      const helveticaObliqueFont = await pdfDoc.embedFont(
        StandardFonts.HelveticaOblique,
      );

      // Sort elements by layer for proper rendering order
      const sortedElements = [...elements].sort((a, b) => a.layer - b.layer);

      for (const element of sortedElements) {
        if (!element.visible) continue;

        if (element.type === "text") {
          const font =
            element.fontWeight === "bold"
              ? helveticaBoldFont
              : element.fontWeight === "italic"
                ? helveticaObliqueFont
                : helveticaFont;

          const color = hexToRgb(element.color);

          // Draw background if specified
          if (element.backgroundColor !== "transparent") {
            const bgColor = hexToRgb(element.backgroundColor);
            firstPage.drawRectangle({
              x: element.x - element.padding,
              y: height - element.y - element.fontSize - element.padding,
              width:
                element.content.length * (element.fontSize * 0.6) +
                element.padding * 2,
              height: element.fontSize + element.padding * 2,
              color: rgb(bgColor.r, bgColor.g, bgColor.b),
              opacity: element.opacity,
            });
          }

          firstPage.drawText(element.content, {
            x: element.x,
            y: height - element.y,
            size: element.fontSize,
            font: font,
            color: rgb(color.r, color.g, color.b),
            opacity: element.opacity,
          });
        } else if (element.type === "image") {
          try {
            const imageBytes = await element.file.arrayBuffer();
            let image;

            if (element.file.type === "image/png") {
              image = await pdfDoc.embedPng(new Uint8Array(imageBytes));
            } else {
              image = await pdfDoc.embedJpg(new Uint8Array(imageBytes));
            }

            firstPage.drawImage(image, {
              x: element.x,
              y: height - element.y - element.height,
              width: element.width,
              height: element.height,
              opacity: element.opacity,
            });
          } catch (error) {
            console.warn("Failed to embed image:", error);
          }
        } else if (element.type === "rectangle") {
          const fillColor = hexToRgb(element.color);
          const borderColor = hexToRgb(element.borderColor);

          firstPage.drawRectangle({
            x: element.x,
            y: height - element.y - element.height,
            width: element.width,
            height: element.height,
            color: rgb(fillColor.r, fillColor.g, fillColor.b),
            borderColor: rgb(borderColor.r, borderColor.g, borderColor.b),
            borderWidth: element.borderWidth,
            opacity: element.opacity,
          });
        } else if (element.type === "circle") {
          const fillColor = hexToRgb(element.color);
          const borderColor = hexToRgb(element.borderColor);

          // Draw circle using rectangle with border radius (simplified)
          firstPage.drawRectangle({
            x: element.x - element.radius,
            y: height - element.y - element.radius * 2,
            width: element.radius * 2,
            height: element.radius * 2,
            color: rgb(fillColor.r, fillColor.g, fillColor.b),
            borderColor: rgb(borderColor.r, borderColor.g, borderColor.b),
            borderWidth: element.borderWidth,
            opacity: element.opacity,
          });
        } else if (element.type === "line") {
          const color = hexToRgb(element.color);

          // Draw line using rectangle (simplified)
          const angle = Math.atan2(
            element.endY - element.y,
            element.endX - element.x,
          );
          const length = Math.sqrt(
            Math.pow(element.endX - element.x, 2) +
              Math.pow(element.endY - element.y, 2),
          );

          firstPage.drawRectangle({
            x: element.x,
            y: height - element.y - element.thickness / 2,
            width: length,
            height: element.thickness,
            color: rgb(color.r, color.g, color.b),
            opacity: element.opacity,
          });
        }
      }

      const pdfBytes = await pdfDoc.save();
      const blob = new Blob([pdfBytes as unknown as BlobPart], {
        type: "application/pdf",
      });
      const url = URL.createObjectURL(blob);
      setProcessedUrl(url);
    } catch (error) {
      console.error("Error editing PDF:", error);
      alert("Failed to edit PDF. Please try again.");
    } finally {
      setEditing(false);
    }
  };

  const handleDownload = () => {
    if (!processedUrl) return;
    const link = document.createElement("a");
    link.href = processedUrl;
    link.download = `edited_${Date.now()}.pdf`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && file.type.startsWith("image/")) {
      setImageFile(file);
    }
  };

  const resetAll = () => {
    setFiles([]);
    setProcessedUrl(null);
    setElements([]);
    setTextContent("");
    setImageFile(null);
    setSelectedElement(null);
    setHistory([]);
    setHistoryIndex(-1);
    setZoom(100);
  };

  const selectedElementData = elements.find((el) => el.id === selectedElement);

  return (
    <ToolLayout
      title="Advanced PDF Editor"
      description="Comprehensive PDF editing with text, images, shapes, and advanced formatting"
      icon={<Edit className="w-8 h-8" />}
      files={files}
      onFilesChange={setFiles}
      acceptedFileTypes=".pdf"
      maxFiles={1}
      showUpload={true}
    >
      {files.length > 0 && !processedUrl && (
        <div className="space-y-4">
          {/* Toolbar */}
          <Card>
            <CardContent className="p-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          variant={
                            toolMode === "select" ? "default" : "outline"
                          }
                          size="sm"
                          onClick={() => setToolMode("select")}
                        >
                          <Move className="w-4 h-4" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>Select Tool</TooltipContent>
                    </Tooltip>
                  </TooltipProvider>

                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          variant={toolMode === "text" ? "default" : "outline"}
                          size="sm"
                          onClick={() => setToolMode("text")}
                        >
                          <Type className="w-4 h-4" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>Text Tool</TooltipContent>
                    </Tooltip>
                  </TooltipProvider>

                  <div className="h-6 w-px bg-border mx-1" />

                  <Button
                    variant="outline"
                    size="sm"
                    onClick={undo}
                    disabled={historyIndex <= 0}
                  >
                    <Undo className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={redo}
                    disabled={historyIndex >= history.length - 1}
                  >
                    <Redo className="w-4 h-4" />
                  </Button>

                  <div className="h-6 w-px bg-border mx-1" />

                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setZoom(Math.max(50, zoom - 25))}
                  >
                    <ZoomOut className="w-4 h-4" />
                  </Button>
                  <span className="text-sm px-2">{zoom}%</span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setZoom(Math.min(200, zoom + 25))}
                  >
                    <ZoomIn className="w-4 h-4" />
                  </Button>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-sm text-muted-foreground">
                    {elements.length} element{elements.length !== 1 ? "s" : ""}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Elements Panel */}
            <div className="lg:col-span-1 space-y-4">
              {/* Elements List */}
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="font-semibold flex items-center gap-2">
                      <Layers className="w-4 h-4" />
                      Elements ({elements.length})
                    </h4>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setElements([])}
                      disabled={elements.length === 0}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                  <div className="space-y-2 max-h-60 overflow-y-auto">
                    {elements.map((element) => (
                      <div
                        key={element.id}
                        className={`flex items-center justify-between p-2 border rounded cursor-pointer ${
                          selectedElement === element.id
                            ? "bg-accent border-primary"
                            : ""
                        }`}
                        onClick={() => setSelectedElement(element.id)}
                      >
                        <div className="flex items-center gap-2 flex-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              toggleElementVisibility(element.id);
                            }}
                            className="h-6 w-6 p-0"
                          >
                            {element.visible ? (
                              <Eye className="w-3 h-3" />
                            ) : (
                              <EyeOff className="w-3 h-3" />
                            )}
                          </Button>
                          {element.type === "text" && (
                            <Type className="w-4 h-4" />
                          )}
                          {element.type === "image" && (
                            <Image className="w-4 h-4" />
                          )}
                          {element.type === "rectangle" && (
                            <Square className="w-4 h-4" />
                          )}
                          {element.type === "circle" && (
                            <Circle className="w-4 h-4" />
                          )}
                          {element.type === "line" && (
                            <Minus className="w-4 h-4" />
                          )}
                          <span className="text-sm capitalize truncate flex-1">
                            {element.type}
                            {element.type === "text" &&
                              `: ${element.content.substring(0, 15)}${element.content.length > 15 ? "..." : ""}`}
                          </span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              moveElement(element.id, "down");
                            }}
                            className="h-6 w-6 p-0"
                          >
                            ↑
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              moveElement(element.id, "up");
                            }}
                            className="h-6 w-6 p-0"
                          >
                            ↓
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              removeElement(element.id);
                            }}
                            className="h-6 w-6 p-0 text-red-500"
                          >
                            <Trash2 className="w-3 h-3" />
                          </Button>
                        </div>
                      </div>
                    ))}
                    {elements.length === 0 && (
                      <p className="text-sm text-muted-foreground text-center py-4">
                        No elements added yet
                      </p>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Add Elements Tabs */}
              <Card>
                <CardContent className="p-4">
                  <Tabs
                    value={activeTab}
                    onValueChange={(value) =>
                      setActiveTab(value as ElementType)
                    }
                  >
                    <TabsList className="grid w-full grid-cols-3 mb-4">
                      <TabsTrigger value="text">Text</TabsTrigger>
                      <TabsTrigger value="image">Image</TabsTrigger>
                      <TabsTrigger value="rectangle">Shape</TabsTrigger>
                    </TabsList>

                    {/* Text Tab */}
                    <TabsContent value="text" className="space-y-4">
                      <div className="space-y-2">
                        <Label>Text Content</Label>
                        <Textarea
                          placeholder="Enter text..."
                          value={textContent}
                          onChange={(e) => setTextContent(e.target.value)}
                          className="min-h-20"
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-2">
                          <Label>X Position</Label>
                          <Input
                            type="number"
                            value={textX}
                            onChange={(e) => setTextX(e.target.value)}
                            min="0"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Y Position</Label>
                          <Input
                            type="number"
                            value={textY}
                            onChange={(e) => setTextY(e.target.value)}
                            min="0"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-2">
                          <Label>Font Size</Label>
                          <Input
                            type="number"
                            min="8"
                            max="72"
                            value={fontSize}
                            onChange={(e) => setFontSize(e.target.value)}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Font Weight</Label>
                          <Select
                            value={fontWeight}
                            onValueChange={(value: FontWeight) =>
                              setFontWeight(value)
                            }
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="normal">Normal</SelectItem>
                              <SelectItem value="bold">Bold</SelectItem>
                              <SelectItem value="italic">Italic</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label>Text Color</Label>
                        <Input
                          type="color"
                          value={textColor}
                          onChange={(e) => setTextColor(e.target.value)}
                        />
                      </div>

                      <Button
                        onClick={addTextElement}
                        disabled={!textContent.trim()}
                        className="w-full"
                      >
                        <Plus className="w-4 h-4 mr-2" />
                        Add Text
                      </Button>
                    </TabsContent>

                    {/* Image Tab */}
                    <TabsContent value="image" className="space-y-4">
                      <div className="space-y-2">
                        <Label>Upload Image</Label>
                        <Input
                          type="file"
                          accept="image/*"
                          onChange={handleImageUpload}
                          ref={fileInputRef}
                        />
                        {imageFile && (
                          <p className="text-sm text-muted-foreground">
                            Selected: {imageFile.name}
                          </p>
                        )}
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-2">
                          <Label>X Position</Label>
                          <Input
                            type="number"
                            value={imageX}
                            onChange={(e) => setImageX(e.target.value)}
                            min="0"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Y Position</Label>
                          <Input
                            type="number"
                            value={imageY}
                            onChange={(e) => setImageY(e.target.value)}
                            min="0"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-2">
                          <Label>Width</Label>
                          <Input
                            type="number"
                            value={imageWidth}
                            onChange={(e) => setImageWidth(e.target.value)}
                            min="10"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Height</Label>
                          <Input
                            type="number"
                            value={imageHeight}
                            onChange={(e) => setImageHeight(e.target.value)}
                            min="10"
                          />
                        </div>
                      </div>

                      <div className="flex items-center space-x-2">
                        <Switch
                          checked={maintainAspect}
                          onCheckedChange={setMaintainAspect}
                        />
                        <Label>Maintain Aspect Ratio</Label>
                      </div>

                      <Button
                        onClick={addImageElement}
                        disabled={!imageFile}
                        className="w-full"
                      >
                        <Plus className="w-4 h-4 mr-2" />
                        Add Image
                      </Button>
                    </TabsContent>

                    {/* Shapes Tab */}
                    <TabsContent value="rectangle" className="space-y-4">
                      <TabsList className="grid w-full grid-cols-3">
                        <TabsTrigger value="rect">Rectangle</TabsTrigger>
                        <TabsTrigger value="circle">Circle</TabsTrigger>
                        <TabsTrigger value="line">Line</TabsTrigger>
                      </TabsList>

                      {/* Rectangle Sub-tab */}
                      <TabsContent value="rect" className="space-y-4">
                        <div className="grid grid-cols-2 gap-3">
                          <div className="space-y-2">
                            <Label>X Position</Label>
                            <Input
                              type="number"
                              value={rectX}
                              onChange={(e) => setRectX(e.target.value)}
                              min="0"
                            />
                          </div>
                          <div className="space-y-2">
                            <Label>Y Position</Label>
                            <Input
                              type="number"
                              value={rectY}
                              onChange={(e) => setRectY(e.target.value)}
                              min="0"
                            />
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                          <div className="space-y-2">
                            <Label>Width</Label>
                            <Input
                              type="number"
                              value={rectWidth}
                              onChange={(e) => setRectWidth(e.target.value)}
                              min="10"
                            />
                          </div>
                          <div className="space-y-2">
                            <Label>Height</Label>
                            <Input
                              type="number"
                              value={rectHeight}
                              onChange={(e) => setRectHeight(e.target.value)}
                              min="10"
                            />
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                          <div className="space-y-2">
                            <Label>Fill Color</Label>
                            <Input
                              type="color"
                              value={rectColor}
                              onChange={(e) => setRectColor(e.target.value)}
                            />
                          </div>
                          <div className="space-y-2">
                            <Label>Border Color</Label>
                            <Input
                              type="color"
                              value={rectBorderColor}
                              onChange={(e) =>
                                setRectBorderColor(e.target.value)
                              }
                            />
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                          <div className="space-y-2">
                            <Label>Border Width</Label>
                            <Input
                              type="number"
                              value={rectBorderWidth}
                              onChange={(e) =>
                                setRectBorderWidth(e.target.value)
                              }
                              min="0"
                              max="10"
                            />
                          </div>
                          <div className="space-y-2">
                            <Label>Border Radius</Label>
                            <Input
                              type="number"
                              value={rectBorderRadius}
                              onChange={(e) =>
                                setRectBorderRadius(e.target.value)
                              }
                              min="0"
                              max="50"
                            />
                          </div>
                        </div>

                        <Button
                          onClick={addRectangleElement}
                          className="w-full"
                        >
                          <Plus className="w-4 h-4 mr-2" />
                          Add Rectangle
                        </Button>
                      </TabsContent>

                      {/* Circle Sub-tab */}
                      <TabsContent value="circle" className="space-y-4">
                        <div className="grid grid-cols-2 gap-3">
                          <div className="space-y-2">
                            <Label>X Position</Label>
                            <Input
                              type="number"
                              value={circleX}
                              onChange={(e) => setCircleX(e.target.value)}
                              min="0"
                            />
                          </div>
                          <div className="space-y-2">
                            <Label>Y Position</Label>
                            <Input
                              type="number"
                              value={circleY}
                              onChange={(e) => setCircleY(e.target.value)}
                              min="0"
                            />
                          </div>
                        </div>

                        <div className="space-y-2">
                          <Label>Radius</Label>
                          <Input
                            type="number"
                            value={circleRadius}
                            onChange={(e) => setCircleRadius(e.target.value)}
                            min="10"
                          />
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                          <div className="space-y-2">
                            <Label>Fill Color</Label>
                            <Input
                              type="color"
                              value={circleColor}
                              onChange={(e) => setCircleColor(e.target.value)}
                            />
                          </div>
                          <div className="space-y-2">
                            <Label>Border Color</Label>
                            <Input
                              type="color"
                              value={circleBorderColor}
                              onChange={(e) =>
                                setCircleBorderColor(e.target.value)
                              }
                            />
                          </div>
                        </div>

                        <div className="space-y-2">
                          <Label>Border Width</Label>
                          <Input
                            type="number"
                            value={circleBorderWidth}
                            onChange={(e) =>
                              setCircleBorderWidth(e.target.value)
                            }
                            min="0"
                            max="10"
                          />
                        </div>

                        <Button onClick={addCircleElement} className="w-full">
                          <Plus className="w-4 h-4 mr-2" />
                          Add Circle
                        </Button>
                      </TabsContent>

                      {/* Line Sub-tab */}
                      <TabsContent value="line" className="space-y-4">
                        <div className="grid grid-cols-2 gap-3">
                          <div className="space-y-2">
                            <Label>Start X</Label>
                            <Input
                              type="number"
                              value={lineStartX}
                              onChange={(e) => setLineStartX(e.target.value)}
                              min="0"
                            />
                          </div>
                          <div className="space-y-2">
                            <Label>Start Y</Label>
                            <Input
                              type="number"
                              value={lineStartY}
                              onChange={(e) => setLineStartY(e.target.value)}
                              min="0"
                            />
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                          <div className="space-y-2">
                            <Label>End X</Label>
                            <Input
                              type="number"
                              value={lineEndX}
                              onChange={(e) => setLineEndX(e.target.value)}
                              min="0"
                            />
                          </div>
                          <div className="space-y-2">
                            <Label>End Y</Label>
                            <Input
                              type="number"
                              value={lineEndY}
                              onChange={(e) => setLineEndY(e.target.value)}
                              min="0"
                            />
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                          <div className="space-y-2">
                            <Label>Color</Label>
                            <Input
                              type="color"
                              value={lineColor}
                              onChange={(e) => setLineColor(e.target.value)}
                            />
                          </div>
                          <div className="space-y-2">
                            <Label>Thickness</Label>
                            <Input
                              type="number"
                              value={lineThickness}
                              onChange={(e) => setLineThickness(e.target.value)}
                              min="1"
                              max="10"
                            />
                          </div>
                        </div>

                        <div className="flex items-center space-x-2">
                          <Switch
                            checked={lineDashed}
                            onCheckedChange={setLineDashed}
                          />
                          <Label>Dashed Line</Label>
                        </div>

                        <Button onClick={addLineElement} className="w-full">
                          <Plus className="w-4 h-4 mr-2" />
                          Add Line
                        </Button>
                      </TabsContent>
                    </TabsContent>
                  </Tabs>
                </CardContent>
              </Card>
            </div>

            {/* Preview and Properties Panel */}
            <div className="lg:col-span-2 space-y-4">
              {/* Preview Card */}
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h4 className="font-semibold">Preview</h4>
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-muted-foreground">
                        Zoom: {zoom}%
                      </span>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setZoom(100)}
                      >
                        <RotateCcw className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>

                  <div className="border-2 border-dashed border-muted-foreground/20 rounded-lg h-96 flex items-center justify-center bg-muted/30">
                    <div className="text-center">
                      <Image className="w-12 h-12 mx-auto mb-2 text-muted-foreground" />
                      <p className="text-muted-foreground">PDF Preview</p>
                      <p className="text-sm text-muted-foreground mt-1">
                        {elements.length} element
                        {elements.length !== 1 ? "s" : ""} added
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Element Properties */}
              {selectedElementData && (
                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="font-semibold capitalize">
                        {selectedElementData.type} Properties
                      </h4>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setSelectedElement(null)}
                      >
                        Close
                      </Button>
                    </div>

                    <div className="space-y-4">
                      <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-2">
                          <Label>X Position</Label>
                          <Input
                            type="number"
                            value={selectedElementData.x}
                            onChange={(e) =>
                              updateElement(selectedElementData.id, {
                                x: Number.parseInt(e.target.value),
                              })
                            }
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Y Position</Label>
                          <Input
                            type="number"
                            value={selectedElementData.y}
                            onChange={(e) =>
                              updateElement(selectedElementData.id, {
                                y: Number.parseInt(e.target.value),
                              })
                            }
                          />
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label>Opacity</Label>
                        <Slider
                          value={[selectedElementData.opacity * 100]}
                          onValueChange={([value]) =>
                            updateElement(selectedElementData.id, {
                              opacity: value / 100,
                            })
                          }
                          max={100}
                          step={1}
                        />
                        <div className="flex justify-between text-sm text-muted-foreground">
                          <span>0%</span>
                          <span>
                            {Math.round(selectedElementData.opacity * 100)}%
                          </span>
                          <span>100%</span>
                        </div>
                      </div>

                      <div className="flex items-center space-x-2">
                        <Switch
                          checked={selectedElementData.visible}
                          onCheckedChange={(visible) =>
                            updateElement(selectedElementData.id, { visible })
                          }
                        />
                        <Label>Visible</Label>
                      </div>

                      {selectedElementData.type === "text" && (
                        <>
                          <div className="space-y-2">
                            <Label>Text Content</Label>
                            <Textarea
                              value={selectedElementData.content}
                              onChange={(e) =>
                                updateElement(selectedElementData.id, {
                                  content: e.target.value,
                                })
                              }
                            />
                          </div>
                          <div className="space-y-2">
                            <Label>Text Color</Label>
                            <Input
                              type="color"
                              value={selectedElementData.color}
                              onChange={(e) =>
                                updateElement(selectedElementData.id, {
                                  color: e.target.value,
                                })
                              }
                            />
                          </div>
                        </>
                      )}
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>

          {/* Apply Button */}
          <Button
            onClick={handleEdit}
            disabled={editing || elements.length === 0}
            className="w-full bg-primary hover:bg-primary/90"
            size="lg"
          >
            {editing ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Applying Changes...
              </>
            ) : (
              `Apply ${elements.length} Element${elements.length !== 1 ? "s" : ""} to PDF`
            )}
          </Button>
        </div>
      )}

      {processedUrl && (
        <div className="text-center py-8">
          <div className="w-16 h-16 rounded-full bg-green-500/10 flex items-center justify-center mx-auto mb-4">
            <Download className="w-8 h-8 text-green-500" />
          </div>
          <h3 className="text-xl font-semibold mb-2">
            PDF Edited Successfully!
          </h3>
          <p className="text-muted-foreground mb-6">
            Your edited PDF with {elements.length} element
            {elements.length !== 1 ? "s" : ""} is ready to download.
          </p>
          <div className="flex gap-3 justify-center">
            <Button onClick={handleDownload} size="lg">
              <Download className="w-4 h-4 mr-2" />
              Download Edited PDF
            </Button>
            <Button variant="outline" onClick={resetAll} size="lg">
              Edit Another PDF
            </Button>
          </div>
        </div>
      )}
    </ToolLayout>
  );
};

export default EditPdfWrapper;
