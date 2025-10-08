"use client";

import { FC, useState } from "react";
import { Edit, Download, Loader2, Plus, Trash2, Type, Image, Square } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PDFDocument, rgb, StandardFonts } from "pdf-lib";
import ToolLayout from "@/components/tools/ToolLayout";

type ElementType = 'text' | 'image' | 'rectangle';
type TextAlignment = 'left' | 'center' | 'right';

interface TextElement {
  id: string;
  type: 'text';
  content: string;
  x: number;
  y: number;
  fontSize: number;
  font: string;
  color: string;
  alignment: TextAlignment;
}

interface ImageElement {
  id: string;
  type: 'image';
  file: File;
  x: number;
  y: number;
  width: number;
  height: number;
}

interface RectangleElement {
  id: string;
  type: 'rectangle';
  x: number;
  y: number;
  width: number;
  height: number;
  color: string;
  borderColor: string;
  borderWidth: number;
}

type PdfElement = TextElement | ImageElement | RectangleElement;

const EditPdfWrapper: FC = () => {
  const [files, setFiles] = useState<File[]>([]);
  const [editing, setEditing] = useState(false);
  const [processedUrl, setProcessedUrl] = useState<string | null>(null);
  const [elements, setElements] = useState<PdfElement[]>([]);
  const [activeTab, setActiveTab] = useState<ElementType>('text');
  
  // Text element state
  const [textContent, setTextContent] = useState("");
  const [textX, setTextX] = useState("50");
  const [textY, setTextY] = useState("50");
  const [fontSize, setFontSize] = useState("14");
  const [fontFamily, setFontFamily] = useState("Helvetica");
  const [textColor, setTextColor] = useState("#000000");
  const [textAlignment, setTextAlignment] = useState<TextAlignment>("left");
  
  // Image element state
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imageX, setImageX] = useState("50");
  const [imageY, setImageY] = useState("50");
  const [imageWidth, setImageWidth] = useState("100");
  const [imageHeight, setImageHeight] = useState("100");
  
  // Rectangle element state
  const [rectX, setRectX] = useState("50");
  const [rectY, setRectY] = useState("50");
  const [rectWidth, setRectWidth] = useState("100");
  const [rectHeight, setRectHeight] = useState("50");
  const [rectColor, setRectColor] = useState("#ffffff");
  const [rectBorderColor, setRectBorderColor] = useState("#000000");
  const [rectBorderWidth, setRectBorderWidth] = useState("1");

  const addTextElement = () => {
    if (!textContent.trim()) return;
    
    const newElement: TextElement = {
      id: Date.now().toString(),
      type: 'text',
      content: textContent,
      x: Number.parseInt(textX),
      y: Number.parseInt(textY),
      fontSize: Number.parseInt(fontSize),
      font: fontFamily,
      color: textColor,
      alignment: textAlignment,
    };
    
    setElements(prev => [...prev, newElement]);
    setTextContent("");
  };

  const addImageElement = () => {
    if (!imageFile) return;
    
    const newElement: ImageElement = {
      id: Date.now().toString(),
      type: 'image',
      file: imageFile,
      x: Number.parseInt(imageX),
      y: Number.parseInt(imageY),
      width: Number.parseInt(imageWidth),
      height: Number.parseInt(imageHeight),
    };
    
    setElements(prev => [...prev, newElement]);
    setImageFile(null);
  };

  const addRectangleElement = () => {
    const newElement: RectangleElement = {
      id: Date.now().toString(),
      type: 'rectangle',
      x: Number.parseInt(rectX),
      y: Number.parseInt(rectY),
      width: Number.parseInt(rectWidth),
      height: Number.parseInt(rectHeight),
      color: rectColor,
      borderColor: rectBorderColor,
      borderWidth: Number.parseInt(rectBorderWidth),
    };
    
    setElements(prev => [...prev, newElement]);
  };

  const removeElement = (id: string) => {
    setElements(prev => prev.filter(element => element.id !== id));
  };

  const hexToRgb = (hex: string) => {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? {
      r: Number.parseInt(result[1], 16) / 255,
      g: Number.parseInt(result[2], 16) / 255,
      b: Number.parseInt(result[3], 16) / 255,
    } : { r: 0, g: 0, b: 0 };
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

      // Embed fonts
      const helveticaFont = await pdfDoc.embedFont(StandardFonts.Helvetica);
      const helveticaBoldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
      const helveticaObliqueFont = await pdfDoc.embedFont(StandardFonts.HelveticaOblique);

      for (const element of elements) {
        if (element.type === 'text') {
          const font = element.font === 'Helvetica-Bold' ? helveticaBoldFont :
                      element.font === 'Helvetica-Oblique' ? helveticaObliqueFont :
                      helveticaFont;
          
          const color = hexToRgb(element.color);
          
          firstPage.drawText(element.content, {
            x: element.x,
            y: height - element.y, // PDF coordinate system starts from bottom
            size: element.fontSize,
            font: font,
            color: rgb(color.r, color.g, color.b),
          });
        } else if (element.type === 'image') {
          try {
            const imageBytes = await element.file.arrayBuffer();
            let image;
            
            if (element.file.type === 'image/png') {
              image = await pdfDoc.embedPng(new Uint8Array(imageBytes));
            } else {
              image = await pdfDoc.embedJpg(new Uint8Array(imageBytes));
            }
            
            firstPage.drawImage(image, {
              x: element.x,
              y: height - element.y - element.height, // Adjust for PDF coordinate system
              width: element.width,
              height: element.height,
            });
          } catch (error) {
            console.warn('Failed to embed image:', error);
          }
        } else if (element.type === 'rectangle') {
          const fillColor = hexToRgb(element.color);
          const borderColor = hexToRgb(element.borderColor);
          
          firstPage.drawRectangle({
            x: element.x,
            y: height - element.y - element.height, // Adjust for PDF coordinate system
            width: element.width,
            height: element.height,
            color: rgb(fillColor.r, fillColor.g, fillColor.b),
            borderColor: rgb(borderColor.r, borderColor.g, borderColor.b),
            borderWidth: element.borderWidth,
          });
        }
      }

      const pdfBytes = await pdfDoc.save();
      const blob = new Blob([pdfBytes as unknown as BlobPart], { type: "application/pdf" });
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
    link.download = "edited.pdf";
    link.click();
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && file.type.startsWith('image/')) {
      setImageFile(file);
    }
  };

  const resetAll = () => {
    setFiles([]);
    setProcessedUrl(null);
    setElements([]);
    setTextContent("");
    setImageFile(null);
  };

  return (
    <ToolLayout
      title="Edit PDF"
      description="Add text, images, and shapes to your PDF document"
      icon={<Edit className="w-8 h-8" />}
      files={files}
      onFilesChange={setFiles}
      acceptedFileTypes=".pdf"
      maxFiles={1}
      showUpload={true}
    >
      {files.length > 0 && !processedUrl && (
        <div className="space-y-6">
          {/* Elements List */}
          {elements.length > 0 && (
            <Card>
              <CardContent className="p-4">
                <h4 className="font-semibold mb-3">Added Elements ({elements.length})</h4>
                <div className="space-y-2 max-h-40 overflow-y-auto">
                  {elements.map((element) => (
                    <div key={element.id} className="flex items-center justify-between p-2 border rounded">
                      <div className="flex items-center gap-2">
                        {element.type === 'text' && <Type className="w-4 h-4" />}
                        {element.type === 'image' && <Image className="w-4 h-4" />}
                        {element.type === 'rectangle' && <Square className="w-4 h-4" />}
                        <span className="text-sm capitalize">
                          {element.type} {element.type === 'text' && `: ${element.content.substring(0, 20)}...`}
                        </span>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => removeElement(element.id)}
                        className="h-8 w-8 p-0 text-red-500"
                      >
                        <Trash2 className="w-3 h-3" />
                      </Button>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Add Elements Tabs */}
          <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as ElementType)}>
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="text">Text</TabsTrigger>
              <TabsTrigger value="image">Image</TabsTrigger>
              <TabsTrigger value="rectangle">Shape</TabsTrigger>
            </TabsList>

            {/* Text Tab */}
            <TabsContent value="text" className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="textX">X Position</Label>
                  <Input
                    id="textX"
                    type="number"
                    value={textX}
                    onChange={(e) => setTextX(e.target.value)}
                    min="0"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="textY">Y Position</Label>
                  <Input
                    id="textY"
                    type="number"
                    value={textY}
                    onChange={(e) => setTextY(e.target.value)}
                    min="0"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="textContent">Text Content</Label>
                <Textarea
                  id="textContent"
                  placeholder="Enter text to add..."
                  value={textContent}
                  onChange={(e) => setTextContent(e.target.value)}
                  className="min-h-20"
                />
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="fontSize">Font Size</Label>
                  <Input
                    id="fontSize"
                    type="number"
                    min="8"
                    max="72"
                    value={fontSize}
                    onChange={(e) => setFontSize(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="fontFamily">Font</Label>
                  <Select value={fontFamily} onValueChange={setFontFamily}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Helvetica">Helvetica</SelectItem>
                      <SelectItem value="Helvetica-Bold">Helvetica Bold</SelectItem>
                      <SelectItem value="Helvetica-Oblique">Helvetica Italic</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="textColor">Color</Label>
                  <div className="flex gap-2">
                    <Input
                      id="textColor"
                      type="color"
                      value={textColor}
                      onChange={(e) => setTextColor(e.target.value)}
                      className="w-full"
                    />
                  </div>
                </div>
              </div>

              <Button onClick={addTextElement} disabled={!textContent.trim()} className="w-full">
                <Plus className="w-4 h-4 mr-2" />
                Add Text
              </Button>
            </TabsContent>

            {/* Image Tab */}
            <TabsContent value="image" className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="imageUpload">Upload Image</Label>
                <Input
                  id="imageUpload"
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                />
                {imageFile && (
                  <p className="text-sm text-muted-foreground">
                    Selected: {imageFile.name}
                  </p>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="imageX">X Position</Label>
                  <Input
                    id="imageX"
                    type="number"
                    value={imageX}
                    onChange={(e) => setImageX(e.target.value)}
                    min="0"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="imageY">Y Position</Label>
                  <Input
                    id="imageY"
                    type="number"
                    value={imageY}
                    onChange={(e) => setImageY(e.target.value)}
                    min="0"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="imageWidth">Width</Label>
                  <Input
                    id="imageWidth"
                    type="number"
                    value={imageWidth}
                    onChange={(e) => setImageWidth(e.target.value)}
                    min="10"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="imageHeight">Height</Label>
                  <Input
                    id="imageHeight"
                    type="number"
                    value={imageHeight}
                    onChange={(e) => setImageHeight(e.target.value)}
                    min="10"
                  />
                </div>
              </div>

              <Button onClick={addImageElement} disabled={!imageFile} className="w-full">
                <Plus className="w-4 h-4 mr-2" />
                Add Image
              </Button>
            </TabsContent>

            {/* Rectangle Tab */}
            <TabsContent value="rectangle" className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="rectX">X Position</Label>
                  <Input
                    id="rectX"
                    type="number"
                    value={rectX}
                    onChange={(e) => setRectX(e.target.value)}
                    min="0"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="rectY">Y Position</Label>
                  <Input
                    id="rectY"
                    type="number"
                    value={rectY}
                    onChange={(e) => setRectY(e.target.value)}
                    min="0"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="rectWidth">Width</Label>
                  <Input
                    id="rectWidth"
                    type="number"
                    value={rectWidth}
                    onChange={(e) => setRectWidth(e.target.value)}
                    min="10"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="rectHeight">Height</Label>
                  <Input
                    id="rectHeight"
                    type="number"
                    value={rectHeight}
                    onChange={(e) => setRectHeight(e.target.value)}
                    min="10"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="rectColor">Fill Color</Label>
                  <Input
                    id="rectColor"
                    type="color"
                    value={rectColor}
                    onChange={(e) => setRectColor(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="rectBorderColor">Border Color</Label>
                  <Input
                    id="rectBorderColor"
                    type="color"
                    value={rectBorderColor}
                    onChange={(e) => setRectBorderColor(e.target.value)}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="rectBorderWidth">Border Width</Label>
                <Input
                  id="rectBorderWidth"
                  type="number"
                  value={rectBorderWidth}
                  onChange={(e) => setRectBorderWidth(e.target.value)}
                  min="0"
                  max="10"
                />
              </div>

              <Button onClick={addRectangleElement} className="w-full">
                <Plus className="w-4 h-4 mr-2" />
                Add Rectangle
              </Button>
            </TabsContent>
          </Tabs>

          {/* Apply All Changes */}
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
              `Apply ${elements.length} Element${elements.length !== 1 ? 's' : ''} to PDF`
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
            Your edited PDF with {elements.length} element{elements.length !== 1 ? 's' : ''} is ready to download.
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