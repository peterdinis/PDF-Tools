"use client"

import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { 
  AlertTriangle, 
  FileX, 
  RefreshCw, 
  Upload, 
  Download, 
  FileText, 
  ShieldAlert,
  HardDrive,
  Network,
  Lock
} from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

export type ErrorType = 
  | 'corrupted' 
  | 'encrypted' 
  | 'size_exceeded' 
  | 'unsupported' 
  | 'network' 
  | 'permission' 
  | 'parsing' 
  | 'unknown';

interface ErrorProps {
  errorType: ErrorType;
  fileName?: string;
  fileSize?: number;
  errorCode?: string;
  errorMessage?: string;
  suggestions?: string[];
  onRetry?: () => void;
  onUploadNew?: () => void;
  onDownload?: () => void;
  metadata?: {
    pages?: number;
    version?: string;
    created?: string;
    modified?: string;
  };
  debugInfo?: {
    browser?: string;
    os?: string;
    timestamp?: string;
  };
}

const Error: React.FC<ErrorProps> = ({
  errorType,
  fileName = 'document.pdf',
  fileSize,
  errorCode,
  errorMessage,
  suggestions = [],
  onRetry,
  onUploadNew,
  onDownload,
  metadata,
  debugInfo,
}) => {
  const errorConfig = {
    corrupted: {
      title: 'Poškodený PDF súbor',
      description: 'Súbor je poškodený alebo nekompletný.',
      icon: <FileX className="h-8 w-8" />,
      color: 'destructive',
      suggestions: [
        'Skontrolujte, či bol súbor správne stiahnutý',
        'Otvorte súbor v inom PDF čítačke',
        'Skúste znova stiahnuť pôvodný súbor',
      ],
    },
    encrypted: {
      title: 'Zašifrovaný PDF',
      description: 'Tento PDF súbor je chránený hesľom.',
      icon: <Lock className="h-8 w-8" />,
      color: 'warning',
      suggestions: [
        'Získajte prístupové heslo od vlastníka súboru',
        'Použite PDF súbor bez ochrany',
        'Kontaktujte správcu dokumentu',
      ],
    },
    size_exceeded: {
      title: 'Príliš veľký súbor',
      description: 'Veľkosť súboru prekračuje povolený limit.',
      icon: <HardDrive className="h-8 w-8" />,
      color: 'warning',
      suggestions: [
        'Zmenšite veľkosť PDF súboru',
        'Rozdeľte súbor na menšie časti',
        'Použite komprimovanú verziu',
      ],
    },
    unsupported: {
      title: 'Nepodporovaný formát',
      description: 'Tento typ PDF nie je podporovaný.',
      icon: <FileText className="h-8 w-8" />,
      color: 'warning',
      suggestions: [
        'Skontrolujte verziu PDF súboru',
        'Konvertujte súbor na štandardný PDF 1.4+',
        'Použite originálny tvorcovský softvér',
      ],
    },
    network: {
      title: 'Chyba sieťového pripojenia',
      description: 'Nepodarilo sa načítať súbor zo siete.',
      icon: <Network className="h-8 w-8" />,
      color: 'secondary',
      suggestions: [
        'Skontrolujte internetové pripojenie',
        'Skúste načítať súbor znova',
        'Použite lokálnu kópiu súboru',
      ],
    },
    permission: {
      title: 'Problém s oprávneniami',
      description: 'Nemáte potrebné oprávnenia na prístup k súboru.',
      icon: <ShieldAlert className="h-8 w-8" />,
      color: 'destructive',
      suggestions: [
        'Skontrolujte prístupové práva',
        'Kontaktujte administrátora systému',
        'Použite alternatívny účet',
      ],
    },
    parsing: {
      title: 'Chyba pri spracovaní',
      description: 'Nepodarilo sa analyzovať štruktúru PDF.',
      icon: <AlertTriangle className="h-8 w-8" />,
      color: 'destructive',
      suggestions: [
        'Skontrolujte integritu súboru',
        'Otvorte súbor v inej aplikácii',
        'Vytvorte nový export z pôvodného zdroja',
      ],
    },
    unknown: {
      title: 'Neočakávaná chyba',
      description: 'Nastala neznáma chyba pri spracovaní.',
      icon: <AlertTriangle className="h-8 w-8" />,
      color: 'destructive',
      suggestions: [
        'Skúste akciu opakovať',
        'Kontaktujte technickú podporu',
        'Poskytnite podrobnosti o chybe',
      ],
    },
  };

  const config = errorConfig[errorType];
  const formattedSize = fileSize ? `${(fileSize / (1024 * 1024)).toFixed(2)} MB` : 'Neznáma veľkosť';

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-background">
      <Card className="w-full max-w-4xl border-2 border-destructive/20 shadow-lg">
        <CardHeader className="bg-destructive/5 border-b">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className={`p-3 rounded-lg bg-${config.color}/10`}>
                {config.icon}
              </div>
              <div>
                <CardTitle className="text-2xl flex items-center gap-2">
                  {config.title}
                  <Badge className="text-xs">
                    {errorType}
                  </Badge>
                </CardTitle>
                <CardDescription className="text-base">
                  {config.description}
                </CardDescription>
              </div>
            </div>
            {errorCode && (
              <Badge variant="outline" className="font-mono">
                Code: {errorCode}
              </Badge>
            )}
          </div>
        </CardHeader>

        <Tabs defaultValue="overview" className="w-full">
          <TabsList className="grid grid-cols-3 w-full">
            <TabsTrigger value="overview">Prehľad</TabsTrigger>
            <TabsTrigger value="suggestions">Riešenia</TabsTrigger>
            <TabsTrigger value="details">Podrobnosti</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            <CardContent className="pt-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Informácie o súbore */}
                <div className="space-y-4">
                  <h3 className="font-semibold text-lg">Informácie o súbore</h3>
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Názov:</span>
                      <span className="font-medium truncate max-w-50" title={fileName}>
                        {fileName}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Veľkosť:</span>
                      <span className="font-medium">{formattedSize}</span>
                    </div>
                    {metadata?.pages && (
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Počet strán:</span>
                        <span className="font-medium">{metadata.pages}</span>
                      </div>
                    )}
                    {metadata?.version && (
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">PDF verzia:</span>
                        <span className="font-medium">{metadata.version}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Detaily chyby */}
                <div className="space-y-4">
                  <h3 className="font-semibold text-lg">Detaily chyby</h3>
                  <Alert>
                    <AlertTriangle className="h-4 w-4" />
                    <AlertTitle>Chybová správa</AlertTitle>
                    <AlertDescription className="font-mono text-sm bg-background/50 p-2 rounded mt-2">
                      {errorMessage || config.description}
                    </AlertDescription>
                  </Alert>
                </div>
              </div>
            </CardContent>
          </TabsContent>

          <TabsContent value="suggestions">
            <CardContent className="pt-6">
              <div className="space-y-6">
                <h3 className="font-semibold text-lg">Možné riešenia</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {[...config.suggestions, ...suggestions].map((suggestion, index) => (
                    <div
                      key={index}
                      className="p-4 border rounded-lg hover:border-primary/50 transition-colors"
                    >
                      <div className="flex items-start gap-3">
                        <div className="p-2 rounded-full bg-primary/10 mt-1">
                          <span className="text-primary font-bold">{index + 1}</span>
                        </div>
                        <p className="text-sm">{suggestion}</p>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Rýchle akcie */}
                <div className="mt-8">
                  <h4 className="font-semibold text-lg mb-4">Rýchle akcie</h4>
                  <div className="flex flex-wrap gap-3">
                    {onRetry && (
                      <Button onClick={onRetry} size="lg" className="gap-2">
                        <RefreshCw className="h-4 w-4" />
                        Skúsiť znova
                      </Button>
                    )}
                    {onUploadNew && (
                      <Button onClick={onUploadNew} variant="outline" size="lg" className="gap-2">
                        <Upload className="h-4 w-4" />
                        Nahrať nový súbor
                      </Button>
                    )}
                    {onDownload && (
                      <Button onClick={onDownload} variant="secondary" size="lg" className="gap-2">
                        <Download className="h-4 w-4" />
                        Stiahnuť pôvodný súbor
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            </CardContent>
          </TabsContent>

          <TabsContent value="details">
            <CardContent className="pt-6">
              <div className="space-y-6">
                {/* Technické detaily */}
                <div className="space-y-4">
                  <h3 className="font-semibold text-lg">Technické detaily</h3>
                  <div className="bg-muted/30 p-4 rounded-lg font-mono text-sm space-y-2">
                    {errorCode && (
                      <div>
                        <span className="text-muted-foreground">Error Code:</span> {errorCode}
                      </div>
                    )}
                    {errorType && (
                      <div>
                        <span className="text-muted-foreground">Error Type:</span> {errorType}
                      </div>
                    )}
                    {debugInfo?.timestamp && (
                      <div>
                        <span className="text-muted-foreground">Timestamp:</span> {debugInfo.timestamp}
                      </div>
                    )}
                    {debugInfo?.browser && (
                      <div>
                        <span className="text-muted-foreground">Browser:</span> {debugInfo.browser}
                      </div>
                    )}
                    {debugInfo?.os && (
                      <div>
                        <span className="text-muted-foreground">OS:</span> {debugInfo.os}
                      </div>
                    )}
                  </div>
                </div>

                {/* Metadata */}
                {metadata && (
                  <>
                    <Separator />
                    <div className="space-y-4">
                      <h3 className="font-semibold text-lg">PDF Metadata</h3>
                      <div className="grid grid-cols-2 gap-4">
                        {metadata.pages && (
                          <div className="p-3 border rounded">
                            <div className="text-sm text-muted-foreground">Strán</div>
                            <div className="text-xl font-bold">{metadata.pages}</div>
                          </div>
                        )}
                        {metadata.version && (
                          <div className="p-3 border rounded">
                            <div className="text-sm text-muted-foreground">Verzia</div>
                            <div className="text-xl font-bold">PDF {metadata.version}</div>
                          </div>
                        )}
                        {metadata.created && (
                          <div className="p-3 border rounded">
                            <div className="text-sm text-muted-foreground">Vytvorené</div>
                            <div className="text-sm">{metadata.created}</div>
                          </div>
                        )}
                        {metadata.modified && (
                          <div className="p-3 border rounded">
                            <div className="text-sm text-muted-foreground">Upravené</div>
                            <div className="text-sm">{metadata.modified}</div>
                          </div>
                        )}
                      </div>
                    </div>
                  </>
                )}
              </div>
            </CardContent>
          </TabsContent>
        </Tabs>

        <CardFooter className="flex flex-col gap-4 border-t pt-6">
          <div className="flex justify-between items-center w-full">
            <div className="text-sm text-muted-foreground">
              Ak problém pretrváva, kontaktujte technickú podporu.
            </div>
            <div className="flex gap-2">
              <Button variant="ghost" size="sm">
                Nahlásiť problém
              </Button>
              <Button variant="ghost" size="sm">
                Kontaktovať podporu
              </Button>
            </div>
          </div>
          <Alert className="bg-muted/30 border-dashed">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription className="text-sm">
              Bezpečnostná poznámka: Nikdy neposkytujte prístupové heslá alebo citlivé údaje prostredníctvom e-mailu.
            </AlertDescription>
          </Alert>
        </CardFooter>
      </Card>
    </div>
  );
};

export default Error;