import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { AlertCircle, CheckCircle, AlertTriangle, Info } from 'lucide-react';
import { DebugReport } from '@/types/arduino';

interface DebugPanelProps {
  debugReport: DebugReport;
}

export function DebugPanel({ debugReport }: DebugPanelProps) {
  const getStatusIcon = () => {
    switch (debugReport.status) {
      case 'success':
        return <CheckCircle className="w-5 h-5 text-emerald-600" />;
      case 'warning':
        return <AlertTriangle className="w-5 h-5 text-yellow-600" />;
      case 'error':
        return <AlertCircle className="w-5 h-5 text-red-600" />;
      default:
        return <Info className="w-5 h-5 text-blue-600" />;
    }
  };

  const getStatusColor = () => {
    switch (debugReport.status) {
      case 'success':
        return 'text-emerald-700 bg-emerald-50 border-emerald-200';
      case 'warning':
        return 'text-yellow-700 bg-yellow-50 border-yellow-200';
      case 'error':
        return 'text-red-700 bg-red-50 border-red-200';
      default:
        return 'text-blue-700 bg-blue-50 border-blue-200';
    }
  };

  const getIssueIcon = (type: string) => {
    switch (type) {
      case 'error':
        return <AlertCircle className="w-4 h-4 text-red-500" />;
      case 'warning':
        return <AlertTriangle className="w-4 h-4 text-yellow-500" />;
      default:
        return <Info className="w-4 h-4 text-blue-500" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Debug Report */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            {getStatusIcon()}
            <span>Debug Report</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {debugReport.issues.length === 0 ? (
            <div className="space-y-3">
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 bg-emerald-500 rounded-full"></div>
                <span className="text-sm text-emerald-700 font-medium">All components validated</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 bg-emerald-500 rounded-full"></div>
                <span className="text-sm text-emerald-700 font-medium">Pin assignments valid</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 bg-emerald-500 rounded-full"></div>
                <span className="text-sm text-emerald-700 font-medium">ArduBlock.ru compatible</span>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              {debugReport.issues.map((issue, index) => (
                <div key={index} className="flex items-start space-x-2">
                  {getIssueIcon(issue.type)}
                  <div className="flex-1">
                    <p className="text-sm font-medium text-slate-900">{issue.message}</p>
                    {issue.suggestion && (
                      <p className="text-xs text-slate-600 mt-1">{issue.suggestion}</p>
                    )}
                    {issue.component && (
                      <Badge variant="outline" className="text-xs mt-1">
                        {issue.component}
                      </Badge>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
          
          <div className={`mt-4 p-3 rounded-lg border ${getStatusColor()}`}>
            <p className="text-sm flex items-center">
              {getStatusIcon()}
              <span className="ml-2">
                {debugReport.status === 'success'
                  ? 'Ready to generate pseudocode'
                  : debugReport.status === 'warning'
                  ? 'Minor issues detected, but can proceed'
                  : 'Critical issues must be resolved'
                }
              </span>
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Quick Reference */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Info className="w-5 h-5 text-slate-600" />
            <span>Quick Reference</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 text-sm">
          <div>
            <h4 className="font-medium text-slate-900 mb-2">Supported Actions:</h4>
            <ul className="space-y-1 text-slate-600">
              <li>• "blink LED"</li>
              <li>• "turn on/off"</li>
              <li>• "set servo to X degrees"</li>
              <li>• "read sensor"</li>
              <li>• "print on LCD"</li>
              <li>• "if button pressed"</li>
              <li>• "repeat X times"</li>
            </ul>
          </div>
          
          <div>
            <h4 className="font-medium text-slate-900 mb-2">ArduBlock.ru Blocks:</h4>
            <ul className="space-y-1 text-slate-600">
              <li>• Set Digital Pin</li>
              <li>• Servo Write</li>
              <li>• Ultrasonic Read</li>
              <li>• LCD Print</li>
              <li>• Digital Read</li>
              <li>• Repeat Block</li>
              <li>• If/Else Block</li>
            </ul>
          </div>
        </CardContent>
      </Card>

      {/* Project Stats */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Info className="w-5 h-5 text-slate-600" />
            <span>Project Stats</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex justify-between items-center">
            <span className="text-sm text-slate-600">Components:</span>
            <span className="text-sm font-medium text-slate-900">{debugReport.componentCount}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-sm text-slate-600">Digital Pins Used:</span>
            <span className="text-sm font-medium text-slate-900">{debugReport.digitalPinsUsed}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-sm text-slate-600">Analog Pins Used:</span>
            <span className="text-sm font-medium text-slate-900">{debugReport.analogPinsUsed}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-sm text-slate-600">Estimated Blocks:</span>
            <span className="text-sm font-medium text-slate-900">{debugReport.estimatedBlocks}</span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
