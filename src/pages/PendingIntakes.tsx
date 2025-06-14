
import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Mail, FileText, Clock, CheckCircle, XCircle, Eye } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { formatDistanceToNow } from "date-fns";

interface PendingIntake {
  id: string;
  email_from: string;
  email_subject: string;
  email_received_at: string;
  confidence_score: number;
  status: string;
  documents: any[];
  extracted_info: any;
}

interface PendingIntakesProps {
  onNavigate: (page: string, params?: any) => void;
}

export function PendingIntakes({ onNavigate }: PendingIntakesProps) {
  const [pendingIntakes, setPendingIntakes] = useState<PendingIntake[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadPendingIntakes();
  }, []);

  const loadPendingIntakes = async () => {
    try {
      const { data, error } = await supabase
        .from('pending_intakes')
        .select('*')
        .order('email_received_at', { ascending: false });

      if (error) {
        console.error('Error loading pending intakes:', error);
        toast({
          title: "Error",
          description: "Failed to load pending intakes.",
          variant: "destructive",
        });
        return;
      }

      setPendingIntakes(data || []);
    } catch (error) {
      console.error('Error loading pending intakes:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateIntakeStatus = async (id: string, status: string) => {
    try {
      const { error } = await supabase
        .from('pending_intakes')
        .update({ status, updated_at: new Date().toISOString() })
        .eq('id', id);

      if (error) {
        throw error;
      }

      toast({
        title: "Status Updated",
        description: `Intake marked as ${status}.`,
      });

      loadPendingIntakes();
    } catch (error) {
      console.error('Error updating status:', error);
      toast({
        title: "Error",
        description: "Failed to update status.",
        variant: "destructive",
      });
    }
  };

  const processIntake = (intake: PendingIntake) => {
    // Navigate to intake form with pre-populated data
    onNavigate('intake', { pendingIntakeId: intake.id });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-500';
      case 'in_progress': return 'bg-blue-500';
      case 'completed': return 'bg-green-500';
      case 'rejected': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  const getConfidenceColor = (score: number) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  if (loading) {
    return (
      <div className="space-y-6 animate-fade-in">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Pending Intakes</h1>
          <p className="text-muted-foreground">Loading email intakes...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Pending Intakes</h1>
          <p className="text-muted-foreground">
            Process vehicle intakes from email submissions ({pendingIntakes.length} total)
          </p>
        </div>
        <Button onClick={loadPendingIntakes} variant="outline">
          <Mail className="w-4 h-4 mr-2" />
          Refresh
        </Button>
      </div>

      {pendingIntakes.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Mail className="w-12 h-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No Pending Intakes</h3>
            <p className="text-muted-foreground text-center">
              When emails with vehicle documents are received, they'll appear here for processing.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6">
          {pendingIntakes.map((intake) => (
            <Card key={intake.id} className="shadow-business">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2">
                    <Mail className="w-5 h-5" />
                    From: {intake.email_from}
                  </CardTitle>
                  <div className="flex items-center gap-2">
                    <Badge className={getStatusColor(intake.status)}>
                      {intake.status.replace('_', ' ')}
                    </Badge>
                    <Badge variant="outline" className={getConfidenceColor(intake.confidence_score)}>
                      {intake.confidence_score}% confidence
                    </Badge>
                  </div>
                </div>
                {intake.email_subject && (
                  <p className="text-sm text-muted-foreground">
                    Subject: {intake.email_subject}
                  </p>
                )}
                <p className="text-xs text-muted-foreground">
                  <Clock className="w-3 h-3 inline mr-1" />
                  {formatDistanceToNow(new Date(intake.email_received_at), { addSuffix: true })}
                </p>
              </CardHeader>
              <CardContent className="space-y-4">
                {intake.documents && intake.documents.length > 0 && (
                  <div>
                    <h4 className="font-medium mb-2 flex items-center gap-2">
                      <FileText className="w-4 h-4" />
                      Documents ({intake.documents.length})
                    </h4>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                      {intake.documents.map((doc: any, index: number) => (
                        <div key={index} className="p-2 border rounded-lg text-xs">
                          <div className="flex items-center gap-1 mb-1">
                            <FileText className="w-3 h-3" />
                            <span className="truncate">{doc.name}</span>
                          </div>
                          <p className="text-muted-foreground">
                            {(doc.size / 1024 / 1024).toFixed(2)} MB
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {intake.extracted_info && Object.keys(intake.extracted_info).length > 0 && (
                  <div>
                    <h4 className="font-medium mb-2">Extracted Vehicle Info</h4>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-2 text-sm">
                      {Object.entries(intake.extracted_info).map(([key, value]) => (
                        <div key={key} className="p-2 bg-muted rounded">
                          <span className="font-medium capitalize">{key}:</span> {value as string}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div className="flex gap-2 pt-2">
                  {intake.status === 'pending' && (
                    <>
                      <Button onClick={() => processIntake(intake)} className="flex-1">
                        <Eye className="w-4 h-4 mr-2" />
                        Process Intake
                      </Button>
                      <Button
                        onClick={() => updateIntakeStatus(intake.id, 'rejected')}
                        variant="outline"
                        className="text-red-600"
                      >
                        <XCircle className="w-4 h-4 mr-2" />
                        Reject
                      </Button>
                    </>
                  )}
                  {intake.status === 'in_progress' && (
                    <Button onClick={() => processIntake(intake)} variant="outline" className="flex-1">
                      <Eye className="w-4 h-4 mr-2" />
                      Continue Processing
                    </Button>
                  )}
                  {intake.status === 'completed' && (
                    <Badge variant="outline" className="text-green-600">
                      <CheckCircle className="w-4 h-4 mr-1" />
                      Completed
                    </Badge>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
