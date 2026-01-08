import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { CheckCircle2, Loader2, AlertCircle, ExternalLink, Copy, Check, Terminal, Maximize2, Minimize2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useState } from 'react';
import { ChatMessage as ChatMessageType } from '@/types/websocket';

interface DeploymentProgressProps {
  messages: ChatMessageType[];
  isTyping: boolean;
  deploymentUrl?: string;
}

export const DeploymentProgress = ({ messages, isTyping, deploymentUrl }: DeploymentProgressProps) => {
  const [showMatrix, setShowMatrix] = useState(false);
  const [copiedUrl, setCopiedUrl] = useState(false);

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedUrl(true);
    setTimeout(() => setCopiedUrl(false), 2000);
  };

  // Find deployment progress message (Get LAST one to ensure we have latest state)
  const progressMessage = [...messages].reverse().find(m => m.metadata?.type === 'deployment_progress');
  const progress = progressMessage?.metadata?.progress || 0;
  const stage = progressMessage?.metadata?.stage || 'Initializing';
  const logs = progressMessage?.metadata?.logs || [];

  // Find analysis message
  const analysisMessage = messages.find(m => m.content.includes('Analysis Complete'));

  // Check if deployment is complete
  const isComplete = messages.some(m => m.content.includes('Deployment Successful'));
  const hasError = messages.some(m => m.content.includes('Error'));

  return (
    <div className="space-y-4">
      {/* Analysis Results */}
      {analysisMessage && (
        <Card className="border-primary/20 bg-primary/5">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-green-500" />
              Repository Analyzed
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[150px] w-full rounded-md border border-border/50 p-4">
              <pre className="text-xs text-muted-foreground whitespace-pre-wrap font-mono">
                {analysisMessage.content}
              </pre>
            </ScrollArea>
          </CardContent>
        </Card>
      )}

      {/* Deployment Progress */}
      {(progressMessage || isTyping) && !isComplete && !hasError && (
        <Card className="border-border/50 bg-background/50 backdrop-blur">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-lg flex items-center gap-2">
              <Loader2 className="w-5 h-5 animate-spin text-primary" />
              Deploying to Cloud Run
            </CardTitle>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowMatrix(!showMatrix)}
              className={showMatrix ? "bg-primary/10 text-primary" : "text-muted-foreground"}
            >
              <Terminal className="w-4 h-4 mr-2" />
              {showMatrix ? 'Matrix Mode On' : 'Logs'}
            </Button>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="font-medium">{stage}</span>
                <Badge variant="secondary">{progress}%</Badge>
              </div>
              <Progress value={progress} className="h-2" />
            </div>

            {(showMatrix || logs.length > 0) && (
              <div className={showMatrix ? "fixed inset-0 z-50 bg-black/95 p-6 flex flex-col" : ""}>
                <div className="flex items-center justify-between mb-2">
                  <p className={`text-sm font-medium ${showMatrix ? "text-green-500 font-mono" : ""}`}>
                    {showMatrix ? "> SYSTEM_LOGS_ACTIVE // MATRIX_MODE" : "Recent Logs:"}
                  </p>
                  {showMatrix && (
                    <Button variant="ghost" size="sm" onClick={() => setShowMatrix(false)} className="text-green-500 hover:text-green-400 hover:bg-green-500/10">
                      <Minimize2 className="w-4 h-4 mr-2" />
                      Minimize
                    </Button>
                  )}
                </div>

                <ScrollArea className={`${showMatrix ? "flex-1 border-green-500/30" : "h-[200px]"} w-full rounded-md border border-border/50 ${showMatrix ? "bg-black" : "bg-muted/30"} p-3`}>
                  <div className={`space-y-1 font-mono text-xs ${showMatrix ? "text-green-500" : ""}`}>
                    {logs.map((log: string, idx: number) => (
                      <div key={idx} className={showMatrix ? "border-l-2 border-green-900/50 pl-2" : "text-muted-foreground"}>
                        {showMatrix && <span className="opacity-50 mr-2">{new Date().toLocaleTimeString()} &gt;</span>}
                        {log}
                      </div>
                    ))}
                    {logs.length === 0 && (
                      <div className="text-muted-foreground italic opacity-50">Waiting for logs...</div>
                    )}
                  </div>
                </ScrollArea>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Deployment Success */}
      {isComplete && deploymentUrl && (
        <Card className="border-green-500/20 bg-green-500/5">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-green-500" />
              Deployment Successful! 🎉
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Alert className="border-green-500/20 bg-green-500/5">
              <AlertDescription>
                Your application has been successfully deployed and is now live!
              </AlertDescription>
            </Alert>

            <div className="space-y-2">
              <p className="text-sm font-medium">Service URL:</p>
              <div className="flex items-center gap-2">
                <code className="flex-1 px-3 py-2 bg-muted border border-border rounded-lg text-sm font-mono break-all">
                  {deploymentUrl}
                </code>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => copyToClipboard(deploymentUrl)}
                >
                  {copiedUrl ? (
                    <Check className="w-4 h-4 text-green-500" />
                  ) : (
                    <Copy className="w-4 h-4" />
                  )}
                </Button>
                <Button
                  size="sm"
                  onClick={() => window.open(deploymentUrl, '_blank')}
                  className="gap-2"
                >
                  <ExternalLink className="w-4 h-4" />
                  Visit
                </Button>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="p-3 bg-muted/50 rounded-lg">
                <p className="text-muted-foreground mb-1">✅ Auto HTTPS</p>
                <p className="font-medium">Enabled</p>
              </div>
              <div className="p-3 bg-muted/50 rounded-lg">
                <p className="text-muted-foreground mb-1">✅ Auto-scaling</p>
                <p className="font-medium">Configured</p>
              </div>
              <div className="p-3 bg-muted/50 rounded-lg">
                <p className="text-muted-foreground mb-1">✅ Health checks</p>
                <p className="font-medium">Active</p>
              </div>
              <div className="p-3 bg-muted/50 rounded-lg">
                <p className="text-muted-foreground mb-1">✅ Monitoring</p>
                <p className="font-medium">Enabled</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Error State */}
      {hasError && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            An error occurred during deployment. Please check the logs above and try again.
          </AlertDescription>
        </Alert>
      )}

      {/* All Messages */}
      {messages.length > 0 && (
        <Card className="border-border/50 bg-background/50 backdrop-blur">
          <CardHeader>
            <CardTitle className="text-lg">Deployment Log</CardTitle>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[300px] w-full">
              <div className="space-y-4 pr-4">
                {messages.map((message) => (
                  <div
                    key={message.id}
                    className={`p-3 rounded-lg border ${message.role === 'user'
                        ? 'bg-primary/5 border-primary/20 ml-8'
                        : 'bg-muted/50 border-border/50 mr-8'
                      }`}
                  >
                    <div className="flex items-start gap-2">
                      <Badge variant={message.role === 'user' ? 'default' : 'secondary'} className="text-xs">
                        {message.role === 'user' ? 'You' : 'AI'}
                      </Badge>
                      <div className="flex-1 text-sm whitespace-pre-wrap">
                        {message.content}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>
      )}
    </div>
  );
};
