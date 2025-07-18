import React, { useState, useRef, useCallback, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Mic, MicOff, Volume2, VolumeX } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { AudioRecorder, encodeAudioForAPI } from '@/utils/AudioRecorder';
import { supabase } from '@/integrations/supabase/client';

interface ExtractedData {
  field_name: string;
  extracted_value: string;
  confidence_score: number;
  ai_reasoning: string;
}

interface VoiceAssistantProps {
  appointmentNoteId?: string;
  onDataExtracted?: (data: ExtractedData[]) => void;
}

const VoiceAssistant: React.FC<VoiceAssistantProps> = ({ 
  appointmentNoteId, 
  onDataExtracted 
}) => {
  const { toast } = useToast();
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [extractedData, setExtractedData] = useState<ExtractedData[]>([]);
  const [audioLevel, setAudioLevel] = useState(0);
  
  const audioRecorderRef = useRef<AudioRecorder | null>(null);
  const audioChunksRef = useRef<Float32Array[]>([]);
  const processingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const handleAudioData = useCallback((audioData: Float32Array) => {
    // Calculate audio level for visual feedback
    const sum = audioData.reduce((acc, val) => acc + Math.abs(val), 0);
    const avgLevel = sum / audioData.length;
    setAudioLevel(avgLevel * 100);
    
    // Store audio chunks
    audioChunksRef.current.push(new Float32Array(audioData));
    
    // Clear existing timeout and set new one
    if (processingTimeoutRef.current) {
      clearTimeout(processingTimeoutRef.current);
    }
    
    // Process audio after 3 seconds of continuous speech
    processingTimeoutRef.current = setTimeout(() => {
      processAudioChunks();
    }, 3000);
  }, []);

  const processAudioChunks = useCallback(async () => {
    if (audioChunksRef.current.length === 0 || isProcessing) return;
    
    setIsProcessing(true);
    
    try {
      // Combine all audio chunks
      const totalLength = audioChunksRef.current.reduce((acc, chunk) => acc + chunk.length, 0);
      const combinedAudio = new Float32Array(totalLength);
      let offset = 0;
      
      for (const chunk of audioChunksRef.current) {
        combinedAudio.set(chunk, offset);
        offset += chunk.length;
      }
      
      // Clear processed chunks
      audioChunksRef.current = [];
      
      // Encode audio for API
      const encodedAudio = encodeAudioForAPI(combinedAudio);
      
      console.log('Sending audio for transcription...');
      
      // Send to transcription API
      const { data, error } = await supabase.functions.invoke('ai-transcription', {
        body: {
          audio: encodedAudio,
          appointmentNoteId: appointmentNoteId
        }
      });

      if (error) throw error;
      
      if (data.text && data.text.trim()) {
        setTranscript(prev => prev + ' ' + data.text);
        
        // Get extracted data
        if (data.transcriptId) {
          const { data: extractedData, error: extractError } = await supabase
            .from('extracted_data_log')
            .select('*')
            .eq('transcript_id', data.transcriptId)
            .order('confidence_score', { ascending: false });
            
          if (!extractError && extractedData) {
            setExtractedData(prev => [...prev, ...extractedData]);
            onDataExtracted?.(extractedData);
          }
        }
        
        toast({
          title: "Speech recognized",
          description: `"${data.text.substring(0, 50)}${data.text.length > 50 ? '...' : ''}"`,
        });
      }
    } catch (error) {
      console.error('Error processing audio:', error);
      toast({
        title: "Processing error",
        description: error instanceof Error ? error.message : 'Failed to process audio',
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  }, [appointmentNoteId, onDataExtracted, isProcessing, toast]);

  const startRecording = async () => {
    try {
      audioRecorderRef.current = new AudioRecorder(handleAudioData);
      await audioRecorderRef.current.start();
      setIsRecording(true);
      setTranscript('');
      setExtractedData([]);
      audioChunksRef.current = [];
      
      toast({
        title: "Recording started",
        description: "Speak naturally - I'll extract the information automatically",
      });
    } catch (error) {
      console.error('Error starting recording:', error);
      toast({
        title: "Recording error",
        description: error instanceof Error ? error.message : 'Failed to start recording',
        variant: "destructive",
      });
    }
  };

  const stopRecording = async () => {
    if (audioRecorderRef.current) {
      audioRecorderRef.current.stop();
      audioRecorderRef.current = null;
    }
    
    if (processingTimeoutRef.current) {
      clearTimeout(processingTimeoutRef.current);
      processingTimeoutRef.current = null;
    }
    
    setIsRecording(false);
    setAudioLevel(0);
    
    // Process any remaining audio chunks
    if (audioChunksRef.current.length > 0) {
      await processAudioChunks();
    }
    
    toast({
      title: "Recording stopped",
      description: "Processing final audio...",
    });
  };

  useEffect(() => {
    return () => {
      if (processingTimeoutRef.current) {
        clearTimeout(processingTimeoutRef.current);
      }
      if (audioRecorderRef.current) {
        audioRecorderRef.current.stop();
      }
    };
  }, []);

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 0.8) return "bg-green-100 text-green-800";
    if (confidence >= 0.6) return "bg-yellow-100 text-yellow-800";
    return "bg-orange-100 text-orange-800";
  };

  return (
    <div className="space-y-4">
      {/* Recording Controls */}
      <div className="flex items-center gap-4">
        <Button
          onClick={isRecording ? stopRecording : startRecording}
          disabled={isProcessing}
          className={`flex items-center gap-2 ${
            isRecording 
              ? 'bg-red-600 hover:bg-red-700 text-white' 
              : 'bg-primary hover:bg-primary/90'
          }`}
        >
          {isRecording ? (
            <>
              <MicOff className="w-4 h-4" />
              Stop Recording
            </>
          ) : (
            <>
              <Mic className="w-4 h-4" />
              Start Voice Assistant
            </>
          )}
        </Button>
        
        {isRecording && (
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1">
              <Volume2 className="w-4 h-4 text-green-600" />
              <div className="w-20 h-2 bg-gray-200 rounded">
                <div 
                  className="h-full bg-green-500 rounded transition-all duration-150"
                  style={{ width: `${Math.min(audioLevel * 5, 100)}%` }}
                />
              </div>
            </div>
            {isProcessing && (
              <Badge variant="secondary">Processing...</Badge>
            )}
          </div>
        )}
      </div>

      {/* Live Transcript */}
      {transcript && (
        <div className="p-4 bg-gray-50 rounded-lg">
          <h3 className="font-medium mb-2">Conversation Transcript:</h3>
          <p className="text-sm text-gray-700">{transcript}</p>
        </div>
      )}

      {/* Extracted Data */}
      {extractedData.length > 0 && (
        <div className="space-y-2">
          <h3 className="font-medium">Extracted Information:</h3>
          <div className="grid gap-2">
            {extractedData.map((item, index) => (
              <div key={index} className="flex items-center justify-between p-2 bg-white border rounded">
                <div className="flex items-center gap-2">
                  <span className="font-medium text-sm">{item.field_name.replace(/_/g, ' ')}:</span>
                  <span className="text-sm">{item.extracted_value}</span>
                </div>
                <Badge className={getConfidenceColor(item.confidence_score)}>
                  {Math.round(item.confidence_score * 100)}%
                </Badge>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default VoiceAssistant;