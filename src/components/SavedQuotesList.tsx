
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Trash2, FileText } from "lucide-react";
import { useQuotesStore } from "@/hooks/useQuotesStore";
import { useToast } from "@/hooks/use-toast";

export function SavedQuotesList() {
  const { quotes, removeQuote, clearQuotes } = useQuotesStore();
  const { toast } = useToast();

  const handleRemoveQuote = (id: string, vehicle: string) => {
    removeQuote(id);
    toast({
      title: "Quote Removed",
      description: `Quote for ${vehicle} has been removed.`,
    });
  };

  const handleClearAll = () => {
    clearQuotes();
    toast({
      title: "All Quotes Cleared",
      description: "All saved quotes have been removed.",
    });
  };

  if (quotes.length === 0) {
    return (
      <Card className="border-dashed">
        <CardContent className="text-center py-12">
          <FileText className="w-16 h-16 mx-auto mb-4 text-gray-400" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            No Saved Quotes
          </h3>
          <p className="text-gray-500">
            Use the Vehicle Pricing Tool to create and save quotes.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold">Saved Quotes ({quotes.length})</h2>
        {quotes.length > 0 && (
          <Button variant="outline" size="sm" onClick={handleClearAll}>
            Clear All
          </Button>
        )}
      </div>
      
      <div className="grid gap-4">
        {quotes.map((quote) => {
          const vehicleInfo = `${quote.year} ${quote.make} ${quote.model}`;
          return (
            <Card key={quote.id}>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="font-medium text-lg">{vehicleInfo}</div>
                    <div className="text-sm text-gray-500 mt-1">
                      Saved on {new Date(quote.createdAt).toLocaleDateString()} at{' '}
                      {new Date(quote.createdAt).toLocaleTimeString()}
                    </div>
                    <div className="flex items-center gap-4 mt-2">
                      <div className="text-sm">
                        <span className="text-gray-600">Estimated:</span>{' '}
                        <span className="font-medium">${quote.estimatedPrice.toLocaleString()}</span>
                      </div>
                      <div className="text-sm">
                        <span className="text-gray-600">Your Offer:</span>{' '}
                        <span className="font-medium text-green-600">${quote.adjustedOffer.toLocaleString()}</span>
                      </div>
                      <Badge variant="outline" className={
                        quote.confidence === 'High' ? 'border-green-500 text-green-700' :
                        quote.confidence === 'Medium' ? 'border-yellow-500 text-yellow-700' :
                        'border-red-500 text-red-700'
                      }>
                        {quote.confidence} Confidence
                      </Badge>
                      <div className="text-xs text-gray-500">
                        {quote.dataPoints} data points
                      </div>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleRemoveQuote(quote.id, vehicleInfo)}
                    className="text-red-500 hover:text-red-700"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
