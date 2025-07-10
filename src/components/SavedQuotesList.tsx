
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Trash2, FileText, Plus, Save } from "lucide-react";
import { useQuotesStore } from "@/hooks/useQuotesStore";
import { useToast } from "@/hooks/use-toast";

export function SavedQuotesList() {
  const { quotes, addQuote, removeQuote, clearQuotes } = useQuotesStore();
  const { toast } = useToast();
  const [showNewQuoteForm, setShowNewQuoteForm] = useState(false);
  const [newQuote, setNewQuote] = useState({
    year: '',
    make: '',
    model: '',
    offer: ''
  });

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

  const handleSaveNewQuote = () => {
    if (!newQuote.year || !newQuote.make || !newQuote.model || !newQuote.offer) {
      toast({
        title: "Incomplete Information",
        description: "Please fill in all fields to save the quote.",
        variant: "destructive",
      });
      return;
    }

    const offerAmount = parseFloat(newQuote.offer);
    if (!offerAmount || offerAmount <= 0) {
      toast({
        title: "Invalid Offer",
        description: "Please enter a valid offer amount.",
        variant: "destructive",
      });
      return;
    }

    addQuote({
      year: newQuote.year,
      make: newQuote.make,
      model: newQuote.model,
      estimatedPrice: offerAmount,
      adjustedOffer: offerAmount,
      confidence: 'Manual',
      dataPoints: 0,
    });

    toast({
      title: "Quote Saved",
      description: `Quote for ${newQuote.year} ${newQuote.make} ${newQuote.model} has been saved.`,
    });

    // Reset form
    setNewQuote({ year: '', make: '', model: '', offer: '' });
    setShowNewQuoteForm(false);
  };

  const handleCancelNewQuote = () => {
    setNewQuote({ year: '', make: '', model: '', offer: '' });
    setShowNewQuoteForm(false);
  };

  if (quotes.length === 0 && !showNewQuoteForm) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold">Saved Quotes (0)</h2>
          <Button onClick={() => setShowNewQuoteForm(true)} className="flex items-center gap-2">
            <Plus className="w-4 h-4" />
            Create New Quote
          </Button>
        </div>
        
        <Card className="border-dashed">
          <CardContent className="text-center py-12">
            <FileText className="w-16 h-16 mx-auto mb-4 text-gray-400" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              No Saved Quotes
            </h3>
            <p className="text-gray-500 mb-4">
              Create quotes to build your database for better pricing estimates.
            </p>
            <Button onClick={() => setShowNewQuoteForm(true)} className="flex items-center gap-2">
              <Plus className="w-4 h-4" />
              Create Your First Quote
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold">Saved Quotes ({quotes.length})</h2>
        <div className="flex gap-2">
          <Button onClick={() => setShowNewQuoteForm(true)} className="flex items-center gap-2">
            <Plus className="w-4 h-4" />
            Create New Quote
          </Button>
          {quotes.length > 0 && (
            <Button variant="outline" size="sm" onClick={handleClearAll}>
              Clear All
            </Button>
          )}
        </div>
      </div>

      {showNewQuoteForm && (
        <Card className="border-blue-200 bg-blue-50">
          <CardHeader>
            <CardTitle className="text-blue-800">Create New Quote</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label htmlFor="new-year">Year</Label>
                <Input
                  id="new-year"
                  placeholder="e.g. 2008"
                  value={newQuote.year}
                  onChange={(e) => setNewQuote(prev => ({ ...prev, year: e.target.value }))}
                />
              </div>
              <div>
                <Label htmlFor="new-make">Make</Label>
                <Input
                  id="new-make"
                  placeholder="e.g. Nissan"
                  value={newQuote.make}
                  onChange={(e) => setNewQuote(prev => ({ ...prev, make: e.target.value }))}
                />
              </div>
              <div>
                <Label htmlFor="new-model">Model</Label>
                <Input
                  id="new-model"
                  placeholder="e.g. Titan"
                  value={newQuote.model}
                  onChange={(e) => setNewQuote(prev => ({ ...prev, model: e.target.value }))}
                />
              </div>
            </div>
            
            <div>
              <Label htmlFor="new-offer">Your Offer Amount</Label>
              <Input
                id="new-offer"
                type="number"
                placeholder="Enter your offer"
                value={newQuote.offer}
                onChange={(e) => setNewQuote(prev => ({ ...prev, offer: e.target.value }))}
                className="w-full"
              />
            </div>

            <div className="flex gap-2">
              <Button onClick={handleSaveNewQuote} className="flex items-center gap-2">
                <Save className="w-4 h-4" />
                Save Quote
              </Button>
              <Button variant="outline" onClick={handleCancelNewQuote}>
                Cancel
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
      
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
