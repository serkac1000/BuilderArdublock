import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Copy, ChevronUp, ChevronDown, Code } from 'lucide-react';
import { PseudocodeStep } from '@/types/arduino';
import { useToast } from '@/hooks/use-toast';

interface PseudocodeOutputProps {
  pseudocode: PseudocodeStep[];
  isVisible: boolean;
  onToggle: () => void;
}

export function PseudocodeOutput({ pseudocode, isVisible, onToggle }: PseudocodeOutputProps) {
  const { toast } = useToast();

  const copyToClipboard = async () => {
    const text = pseudocode
      .map(step => `${'  '.repeat(step.level)}${step.text}`)
      .join('\n');
    
    try {
      await navigator.clipboard.writeText(text);
      toast({
        title: "Copied to clipboard",
        description: "Pseudocode has been copied to your clipboard",
      });
    } catch (err) {
      toast({
        title: "Copy failed",
        description: "Unable to copy to clipboard",
        variant: "destructive",
      });
    }
  };

  const getStepColor = (type: string): string => {
    switch (type) {
      case 'structure':
        return 'text-blue-400';
      case 'control':
        return 'text-purple-400';
      case 'action':
        return 'text-green-400';
      default:
        return 'text-slate-300';
    }
  };

  const blockCategories = {
    'Program Structure': ['Program', 'Setup', 'Loop'],
    'Control Flow': ['Repeat', 'If', 'Delay'],
    'Input/Output': ['Set Digital Pin', 'Digital Read', 'Pin Mode'],
    'Specialized': ['Servo Write', 'Ultrasonic Read', 'LCD Print', 'Tone']
  };

  if (pseudocode.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Code className="w-5 h-5 text-primary" />
            <span>Generated Pseudocode</span>
            <Badge variant="secondary" className="text-xs">
              Ready to Generate
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-slate-500">
            <p>No pseudocode generated yet.</p>
            <p className="text-sm">Click "Generate Pseudocode" to see the ArduBlock.ru instructions.</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Code className="w-5 h-5 text-primary" />
            <CardTitle>Generated Pseudocode</CardTitle>
            <Badge variant="secondary" className="text-xs bg-emerald-100 text-emerald-800">
              ArduBlock.ru Compatible
            </Badge>
          </div>
          <div className="flex items-center space-x-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={copyToClipboard}
              className="text-sm"
            >
              <Copy className="w-4 h-4 mr-1" />
              Copy
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={onToggle}
              className="p-2"
            >
              {isVisible ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </Button>
          </div>
        </div>
      </CardHeader>
      
      {isVisible && (
        <CardContent>
          <div className="bg-slate-900 rounded-lg p-6 font-mono text-sm text-slate-300 overflow-x-auto">
            <div className="space-y-2">
              <div className="text-emerald-400">// Generated ArduBlock.ru 3.0 Pseudocode</div>
              <div className="text-slate-500">// Compatible with block-based programming</div>
              <div></div>
              
              {pseudocode.map((step, index) => (
                <div 
                  key={index}
                  className={`${getStepColor(step.type)}`}
                  style={{ paddingLeft: `${step.level * 16}px` }}
                >
                  {index + 1}. {step.text}
                </div>
              ))}
              
              <div></div>
              <div className="text-slate-500">// End of pseudocode</div>
              <div className="text-slate-500">// Total blocks required: ~{pseudocode.length}</div>
            </div>
          </div>
          
          {/* Block Mapping Reference */}
          <div className="mt-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {Object.entries(blockCategories).map(([category, blocks]) => (
              <div key={category} className="p-4 bg-slate-50 rounded-lg border border-slate-200">
                <h4 className="font-medium text-slate-900 mb-2">{category}</h4>
                <ul className="text-sm text-slate-600 space-y-1">
                  {blocks.map((block) => (
                    <li key={block}>• {block}</li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </CardContent>
      )}
    </Card>
  );
}
