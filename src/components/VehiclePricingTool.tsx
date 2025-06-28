import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Search, DollarSign, Save } from "lucide-react";
import { useVehicleStore } from "@/hooks/useVehicleStore";
import { useQuotesStore } from "@/hooks/useQuotesStore";
import { useToast } from "@/hooks/use-toast";

interface PriceEstimate {
  estimatedPrice: number;
  confidence: string;
  dataPoints: number;
  removedOutliers?: number;
}

interface SimilarVehicle {
  id: string;
  year: string;
  make: string;
  model: string;
  purchasePrice?: string;
  matchType: 'exact' | 'model' | 'make_year';
  purchaseDate?: string;
  source: 'inventory' | 'saved_quote';
}

export function VehiclePricingTool() {
  const { vehicles } = useVehicleStore();
  const { quotes, addQuote } = useQuotesStore();
  const { toast } = useToast();
  
  const [searchYear, setSearchYear] = useState('');
  const [searchMake, setSearchMake] = useState('');
  const [searchModel, setSearchModel] = useState('');
  const [similarVehicles, setSimilarVehicles] = useState<SimilarVehicle[]>([]);
  const [priceEstimate, setPriceEstimate] = useState<PriceEstimate | null>(null);
  const [manualOffer, setManualOffer] = useState('');
  const [showResults, setShowResults] = useState(false);

  const filterOutliers = (vehicles: SimilarVehicle[]) => {
    if (vehicles.length < 4) {
      // Don't filter if we have too few data points
      return { filteredVehicles: vehicles, removedCount: 0 };
    }

    const prices = vehicles.map(v => parseFloat(v.purchasePrice || '0')).filter(p => p > 0);
    
    if (prices.length < 4) {
      return { filteredVehicles: vehicles, removedCount: 0 };
    }

    // Sort prices to calculate median
    const sortedPrices = [...prices].sort((a, b) => a - b);
    const medianIndex = Math.floor(sortedPrices.length / 2);
    const median = sortedPrices.length % 2 === 0 
      ? (sortedPrices[medianIndex - 1] + sortedPrices[medianIndex]) / 2
      : sortedPrices[medianIndex];
    
    // Define outlier bounds using 40% above and below median
    const lowerBound = median * 0.6; // 40% below median
    const upperBound = median * 1.4; // 40% above median
    
    console.log('Outlier detection:', { median, lowerBound, upperBound });

    // Filter out outliers, but prioritize exact matches
    const filteredVehicles = vehicles.filter(vehicle => {
      const price = parseFloat(vehicle.purchasePrice || '0');
      if (price <= 0) return false;
      
      // Keep exact matches even if they're outliers (unless extremely unreasonable)
      if (vehicle.matchType === 'exact') {
        // Only remove exact matches if they're more than 60% above or below median
        return price >= median * 0.4 && price <= median * 1.6;
      }
      
      // For non-exact matches, apply 40% outlier filtering
      return price >= lowerBound && price <= upperBound;
    });

    // Ensure we don't remove too many data points
    if (filteredVehicles.length < 2) {
      console.log('Too few vehicles after filtering, keeping original data');
      return { filteredVehicles: vehicles, removedCount: 0 };
    }

    const removedCount = vehicles.length - filteredVehicles.length;
    console.log(`Filtered out ${removedCount} outliers, keeping ${filteredVehicles.length} vehicles`);
    
    return { filteredVehicles, removedCount };
  };

  const saveQuote = () => {
    if (!priceEstimate || !searchYear || !searchMake || !searchModel) {
      toast({
        title: "Cannot Save Quote",
        description: "Please complete a price search first.",
        variant: "destructive",
      });
      return;
    }

    const adjustedOffer = parseFloat(manualOffer) || priceEstimate.estimatedPrice;
    
    addQuote({
      year: searchYear,
      make: searchMake,
      model: searchModel,
      estimatedPrice: priceEstimate.estimatedPrice,
      adjustedOffer: adjustedOffer,
      confidence: priceEstimate.confidence,
      dataPoints: priceEstimate.dataPoints,
    });

    toast({
      title: "Quote Saved",
      description: `Quote for ${searchYear} ${searchMake} ${searchModel} has been saved.`,
    });
  };

  const searchSimilarVehicles = () => {
    if (!searchYear.trim() || !searchMake.trim() || !searchModel.trim()) {
      return;
    }

    console.log('Searching vehicles with:', { searchYear, searchMake, searchModel });
    console.log('Available vehicles:', vehicles.length);
    console.log('Available saved quotes:', quotes.length);

    // Filter vehicles that have purchase prices
    const vehiclesWithPurchasePrice = vehicles.filter(v => 
      v.purchasePrice && parseFloat(v.purchasePrice) > 0
    );

    // Convert saved quotes to similar vehicle format
    const quotesAsSimilarVehicles = quotes.map(quote => ({
      id: quote.id,
      year: quote.year,
      make: quote.make,
      model: quote.model,
      purchasePrice: quote.adjustedOffer.toString(),
      purchaseDate: quote.createdAt,
      source: 'saved_quote' as const
    }));

    console.log('Vehicles with purchase price:', vehiclesWithPurchasePrice.length);
    console.log('Quotes as similar vehicles:', quotesAsSimilarVehicles.length);

    // Find exact matches from vehicles (add $100 to purchase price for display)
    const exactMatchesFromVehicles = vehiclesWithPurchasePrice.filter(v =>
      v.make.toLowerCase() === searchMake.toLowerCase() &&
      v.model.toLowerCase() === searchModel.toLowerCase() &&
      Math.abs(parseInt(v.year) - parseInt(searchYear)) <= 3
    ).map(v => ({ 
      ...v, 
      matchType: 'exact' as const, 
      source: 'inventory' as const,
      purchasePrice: (parseFloat(v.purchasePrice || '0') + 100).toString()
    }));

    // Find exact matches from saved quotes (no price adjustment)
    const exactMatchesFromQuotes = quotesAsSimilarVehicles.filter(v =>
      v.make.toLowerCase() === searchMake.toLowerCase() &&
      v.model.toLowerCase() === searchModel.toLowerCase() &&
      Math.abs(parseInt(v.year) - parseInt(searchYear)) <= 3
    ).map(v => ({ ...v, matchType: 'exact' as const }));

    // Find model matches from vehicles (add $100 to purchase price for display)
    const modelMatchesFromVehicles = vehiclesWithPurchasePrice.filter(v =>
      v.model.toLowerCase() === searchModel.toLowerCase() &&
      v.make.toLowerCase() !== searchMake.toLowerCase() &&
      Math.abs(parseInt(v.year) - parseInt(searchYear)) <= 5
    ).map(v => ({ 
      ...v, 
      matchType: 'model' as const, 
      source: 'inventory' as const,
      purchasePrice: (parseFloat(v.purchasePrice || '0') + 100).toString()
    }));

    // Find model matches from saved quotes (no price adjustment)
    const modelMatchesFromQuotes = quotesAsSimilarVehicles.filter(v =>
      v.model.toLowerCase() === searchModel.toLowerCase() &&
      v.make.toLowerCase() !== searchMake.toLowerCase() &&
      Math.abs(parseInt(v.year) - parseInt(searchYear)) <= 5
    ).map(v => ({ ...v, matchType: 'model' as const }));

    // Find make/year matches from vehicles (add $100 to purchase price for display)
    const makeYearMatchesFromVehicles = vehiclesWithPurchasePrice.filter(v =>
      v.make.toLowerCase() === searchMake.toLowerCase() &&
      v.model.toLowerCase() !== searchModel.toLowerCase() &&
      Math.abs(parseInt(v.year) - parseInt(searchYear)) <= 2
    ).map(v => ({ 
      ...v, 
      matchType: 'make_year' as const, 
      source: 'inventory' as const,
      purchasePrice: (parseFloat(v.purchasePrice || '0') + 100).toString()
    }));

    // Find make/year matches from saved quotes (no price adjustment)
    const makeYearMatchesFromQuotes = quotesAsSimilarVehicles.filter(v =>
      v.make.toLowerCase() === searchMake.toLowerCase() &&
      v.model.toLowerCase() !== searchModel.toLowerCase() &&
      Math.abs(parseInt(v.year) - parseInt(searchYear)) <= 2
    ).map(v => ({ ...v, matchType: 'make_year' as const }));

    const results: SimilarVehicle[] = [
      ...exactMatchesFromVehicles,
      ...exactMatchesFromQuotes,
      ...modelMatchesFromVehicles,
      ...modelMatchesFromQuotes,
      ...makeYearMatchesFromVehicles,
      ...makeYearMatchesFromQuotes
    ];

    // Sort by relevance (exact matches first, then by year proximity)
    results.sort((a, b) => {
      if (a.matchType !== b.matchType) {
        const order = { exact: 0, model: 1, make_year: 2 };
        return order[a.matchType] - order[b.matchType];
      }
      return Math.abs(parseInt(a.year) - parseInt(searchYear)) - 
             Math.abs(parseInt(b.year) - parseInt(searchYear));
    });

    // Apply outlier detection
    const { filteredVehicles, removedCount } = filterOutliers(results.slice(0, 20));
    const limitedResults = filteredVehicles.slice(0, 10);
    
    setSimilarVehicles(limitedResults);

    console.log('Search results found:', limitedResults.length);
    if (removedCount > 0) {
      console.log(`Filtered out ${removedCount} outliers for better accuracy`);
    }

    // Calculate price estimate
    if (limitedResults.length > 0) {
      const prices = limitedResults.map(v => parseFloat(v.purchasePrice || '0')).filter(p => p > 0);
      
      if (prices.length > 0) {
        // Weight exact matches more heavily, and saved quotes slightly less than inventory
        const weightedPrices = limitedResults.map(v => {
          const price = parseFloat(v.purchasePrice || '0');
          let weight = v.matchType === 'exact' ? 3 : v.matchType === 'model' ? 2 : 1;
          // Slightly reduce weight for saved quotes vs inventory
          if (v.source === 'saved_quote') {
            weight = weight * 0.8;
          }
          return { price, weight };
        }).filter(p => p.price > 0);

        const totalWeight = weightedPrices.reduce((sum, p) => sum + p.weight, 0);
        const weightedAverage = weightedPrices.reduce((sum, p) => sum + (p.price * p.weight), 0) / totalWeight;

        const exactMatches = limitedResults.filter(v => v.matchType === 'exact');
        let confidence = exactMatches.length > 0 ? 'High' : 
                        limitedResults.filter(v => v.matchType === 'model').length > 0 ? 'Medium' : 'Low';
        
        // Adjust confidence based on data consistency and outlier removal
        if (removedCount > 0 && limitedResults.length >= 3) {
          // If we had to remove outliers but still have good data, maintain confidence
        } else if (removedCount > 0 && limitedResults.length < 3) {
          // If we removed outliers and have few data points left, reduce confidence
          confidence = confidence === 'High' ? 'Medium' : 'Low';
        }

        setPriceEstimate({
          estimatedPrice: Math.round(weightedAverage),
          confidence,
          dataPoints: prices.length,
          removedOutliers: removedCount
        });

        setManualOffer(Math.round(weightedAverage).toString());
      }
    } else {
      setPriceEstimate(null);
      setManualOffer('');
    }

    setShowResults(true);
  };

  const getMatchTypeLabel = (matchType: string) => {
    switch (matchType) {
      case 'exact': return 'Exact Match';
      case 'model': return 'Same Model';
      case 'make_year': return 'Same Make/Year';
      default: return 'Similar';
    }
  };

  const getMatchTypeColor = (matchType: string) => {
    switch (matchType) {
      case 'exact': return 'bg-green-100 text-green-800';
      case 'model': return 'bg-blue-100 text-blue-800';
      case 'make_year': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getSourceLabel = (source: string) => {
    return source === 'inventory' ? 'Inventory' : 'Saved Quote';
  };

  const getSourceColor = (source: string) => {
    return source === 'inventory' ? 'bg-purple-100 text-purple-800' : 'bg-orange-100 text-orange-800';
  };

  const resetSearch = () => {
    setSearchYear('');
    setSearchMake('');
    setSearchModel('');
    setSimilarVehicles([]);
    setPriceEstimate(null);
    setManualOffer('');
    setShowResults(false);
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Search className="w-5 h-5" />
            Vehicle Price Lookup
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label htmlFor="year">Year</Label>
              <Input
                id="year"
                placeholder="e.g. 2003"
                value={searchYear}
                onChange={(e) => setSearchYear(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && searchSimilarVehicles()}
              />
            </div>
            <div>
              <Label htmlFor="make">Make</Label>
              <Input
                id="make"
                placeholder="e.g. Toyota"
                value={searchMake}
                onChange={(e) => setSearchMake(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && searchSimilarVehicles()}
              />
            </div>
            <div>
              <Label htmlFor="model">Model</Label>
              <Input
                id="model"
                placeholder="e.g. Matrix"
                value={searchModel}
                onChange={(e) => setSearchModel(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && searchSimilarVehicles()}
              />
            </div>
          </div>
          
          <div className="flex gap-2">
            <Button onClick={searchSimilarVehicles} className="flex items-center gap-2">
              <Search className="w-4 h-4" />
              Search Similar Vehicles
            </Button>
            {showResults && (
              <Button variant="outline" onClick={resetSearch}>
                Clear Search
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {showResults && (
        <>
          {priceEstimate && (
            <Card className="border-green-200 bg-green-50">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-green-800">
                  <DollarSign className="w-5 h-5" />
                  Estimated Offer
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="text-center">
                    <div className="text-3xl font-bold text-green-700">
                      ${priceEstimate.estimatedPrice.toLocaleString()}
                    </div>
                    <div className="text-sm text-green-600">
                      Based on {priceEstimate.dataPoints} similar vehicle{priceEstimate.dataPoints !== 1 ? 's' : ''} from inventory and saved quotes
                      {priceEstimate.removedOutliers > 0 && (
                        <div className="text-xs text-blue-600 mt-1">
                          Filtered out {priceEstimate.removedOutliers} extreme value{priceEstimate.removedOutliers !== 1 ? 's' : ''} for better accuracy
                        </div>
                      )}
                    </div>
                    <Badge variant="outline" className={`mt-2 ${
                      priceEstimate.confidence === 'High' ? 'border-green-500 text-green-700' :
                      priceEstimate.confidence === 'Medium' ? 'border-yellow-500 text-yellow-700' :
                      'border-red-500 text-red-700'
                    }`}>
                      {priceEstimate.confidence} Confidence
                    </Badge>
                  </div>
                  
                  <Separator />
                  
                  <div>
                    <Label htmlFor="manual-offer">Adjust Your Offer</Label>
                    <div className="flex gap-2 mt-1">
                      <div className="relative flex-1">
                        <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">$</span>
                        <Input
                          id="manual-offer"
                          type="number"
                          placeholder="Enter your offer"
                          value={manualOffer}
                          onChange={(e) => setManualOffer(e.target.value)}
                          className="pl-8"
                        />
                      </div>
                      <Button onClick={saveQuote} variant="outline" className="flex items-center gap-2">
                        <Save className="w-4 h-4" />
                        Save Quote
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          <Card>
            <CardHeader>
              <CardTitle>Similar Vehicles Found ({similarVehicles.length})</CardTitle>
            </CardHeader>
            <CardContent>
              {similarVehicles.length > 0 ? (
                <div className="space-y-3">
                  {similarVehicles.map((vehicle) => (
                    <div
                      key={`${vehicle.source}-${vehicle.id}`}
                      className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50"
                    >
                      <div className="flex-1">
                        <div className="font-medium">
                          {vehicle.year} {vehicle.make} {vehicle.model}
                        </div>
                        {vehicle.purchaseDate && (
                          <div className="text-sm text-gray-500">
                            {vehicle.source === 'inventory' ? 'Purchased' : 'Quote saved'}: {new Date(vehicle.purchaseDate).toLocaleDateString()}
                          </div>
                        )}
                      </div>
                      
                      <div className="flex items-center gap-3">
                        <Badge className={getSourceColor(vehicle.source)}>
                          {getSourceLabel(vehicle.source)}
                        </Badge>
                        <Badge className={getMatchTypeColor(vehicle.matchType)}>
                          {getMatchTypeLabel(vehicle.matchType)}
                        </Badge>
                        <div className="font-bold text-green-600">
                          ${parseFloat(vehicle.purchasePrice || '0').toLocaleString()}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <Search className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>No similar vehicles found in your inventory or saved quotes.</p>
                  <p className="text-sm mt-1">
                    Try searching with different criteria or add more vehicle data to improve future searches.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </>
      )}

      {!showResults && (
        <Card className="border-dashed">
          <CardContent className="text-center py-12">
            <Search className="w-16 h-16 mx-auto mb-4 text-gray-400" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              Smart Vehicle Pricing Tool
            </h3>
            <p className="text-gray-500 mb-4">
              Enter a vehicle's year, make, and model to find similar vehicles from your inventory and saved quotes
              to get a suggested offer price.
            </p>
            <p className="text-sm text-gray-400">
              The more vehicles and quotes you have, the smarter this tool becomes.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
