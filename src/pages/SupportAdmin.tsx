import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { MessageSquare, Clock, CheckCircle2 } from "lucide-react";
import { format } from "date-fns";

interface SupportMessage {
  id: string;
  user_name: string;
  category: string;
  message: string;
  status: string;
  created_at: string;
  updated_at: string;
}

export default function SupportAdmin() {
  const [messages, setMessages] = useState<SupportMessage[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchMessages = async () => {
    try {
      const { data, error } = await supabase
        .from("support_messages")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;

      setMessages(data || []);
    } catch (error) {
      console.error("Error fetching support messages:", error);
      toast({
        title: "Error",
        description: "Failed to load support messages.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const updateStatus = async (id: string, newStatus: string) => {
    try {
      const { error } = await supabase
        .from("support_messages")
        .update({ status: newStatus })
        .eq("id", id);

      if (error) throw error;

      toast({
        title: "Status Updated",
        description: "Message status has been updated.",
      });

      fetchMessages();
    } catch (error) {
      console.error("Error updating status:", error);
      toast({
        title: "Error",
        description: "Failed to update status.",
        variant: "destructive",
      });
    }
  };

  useEffect(() => {
    fetchMessages();

    // Subscribe to real-time updates
    const channel = supabase
      .channel("support_messages_changes")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "support_messages",
        },
        () => {
          fetchMessages();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const getCategoryColor = (category: string) => {
    const colors: Record<string, string> = {
      general: "bg-slate-100 text-slate-800",
      feature: "bg-blue-100 text-blue-800",
      bug: "bg-red-100 text-red-800",
      help: "bg-yellow-100 text-yellow-800",
      improvement: "bg-green-100 text-green-800",
    };
    return colors[category] || colors.general;
  };

  if (loading) {
    return (
      <div className="container mx-auto p-4 sm:p-6">
        <div className="flex items-center justify-center h-64">
          <p className="text-muted-foreground">Loading messages...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4 sm:p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-slate-800 flex items-center gap-2">
          <MessageSquare className="w-8 h-8" />
          Support Messages
        </h1>
        <p className="text-slate-600 mt-2">
          Review and manage user feedback and support requests
        </p>
      </div>

      <div className="grid gap-4">
        {messages.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <MessageSquare className="w-12 h-12 mx-auto text-slate-300 mb-4" />
              <p className="text-slate-500">No support messages yet</p>
            </CardContent>
          </Card>
        ) : (
          messages.map((msg) => (
            <Card key={msg.id}>
              <CardHeader>
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <CardTitle className="text-lg font-semibold text-slate-800 mb-2">
                      {msg.user_name}
                    </CardTitle>
                    <div className="flex flex-wrap gap-2 items-center">
                      <Badge className={getCategoryColor(msg.category)}>
                        {msg.category}
                      </Badge>
                      <Badge
                        variant={msg.status === "open" ? "default" : "secondary"}
                        className="flex items-center gap-1"
                      >
                        {msg.status === "open" ? (
                          <Clock className="w-3 h-3" />
                        ) : (
                          <CheckCircle2 className="w-3 h-3" />
                        )}
                        {msg.status}
                      </Badge>
                      <span className="text-xs text-slate-500">
                        {format(new Date(msg.created_at), "MMM dd, yyyy 'at' h:mm a")}
                      </span>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    {msg.status === "open" ? (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => updateStatus(msg.id, "resolved")}
                      >
                        Mark Resolved
                      </Button>
                    ) : (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => updateStatus(msg.id, "open")}
                      >
                        Reopen
                      </Button>
                    )}
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-slate-700 whitespace-pre-wrap">{msg.message}</p>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
