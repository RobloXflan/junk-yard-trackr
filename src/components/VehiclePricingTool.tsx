
import React, { useState, useEffect } from 'react';
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

interface VehicleData {
  year: string;
  make: string;
  model: string;
}

interface VehiclePricingToolProps {
  vehicleData?: VehicleData;
  onVehicleDataChange?: (data: VehicleData) => void;
}

export function VehiclePricingTool({ vehicleData, onVehicleDataChange }: VehiclePricingToolProps) {
  const { vehicles } = useVehicleStore();
  const { quotes, addQuote } = useQuotesStore();
  const { toast } = useToast();
  
  const [searchYear, setSearchYear] = useState(vehicleData?.year || '');
  const [searchMake, setSearchMake] = useState(vehicleData?.make || '');
  const [searchModel, setSearchModel] = useState(vehicleData?.model || '');
  const [similarVehicles, setSimilarVehicles] = useState<SimilarVehicle[]>([]);
  const [priceEstimate, setPriceEstimate] = useState<PriceEstimate | null>(null);
  const [manualOffer, setManualOffer] = useState('');
  const [showResults, setShowResults] = useState(false);

  // Sync with external vehicle data changes
  useEffect(() => {
    if (vehicleData) {
      setSearchYear(vehicleData.year);
      setSearchMake(vehicleData.make);
      setSearchModel(vehicleData.model);
    }
  }, [vehicleData]);

  // Auto-search when all fields are filled
  useEffect(() => {
    if (searchYear && searchMake && searchModel) {
      searchSimilarVehicles();
    }
  }, [searchYear, searchMake, searchModel]);

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

    // Filter out outliers, but NEVER remove exact matches or saved quotes
    const filteredVehicles = vehicles.filter(vehicle => {
      const price = parseFloat(vehicle.purchasePrice || '0');
      if (price <= 0) return false;
      
      // ALWAYS keep exact matches (same make and model regardless of year)
      if (vehicle.matchType === 'exact') {
        return true;
      }
      
      // ALWAYS keep saved quotes
      if (vehicle.source === 'saved_quote') {
        return true;
      }
      
      // For other matches (model only, make_year only), apply outlier filtering
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
    if (!searchYear || !searchMake || !searchModel) {
      toast({
        title: "Cannot Save Quote",
        description: "Please enter year, make, and model first.",
        variant: "destructive",
      });
      return;
    }

    const offerAmount = parseFloat(manualOffer);
    if (!offerAmount || offerAmount <= 0) {
      toast({
        title: "Cannot Save Quote",
        description: "Please enter a valid offer amount.",
        variant: "destructive",
      });
      return;
    }

    // If we have a price estimate, use it; otherwise create a manual quote
    const estimatedPrice = priceEstimate?.estimatedPrice || offerAmount;
    const confidence = priceEstimate?.confidence || 'Manual';
    const dataPoints = priceEstimate?.dataPoints || 0;
    
    addQuote({
      year: searchYear,
      make: searchMake,
      model: searchModel,
      estimatedPrice: estimatedPrice,
      adjustedOffer: offerAmount,
      confidence: confidence,
      dataPoints: dataPoints,
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
      case 'model': return 'bg-primary/10 text-primary';
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
                onChange={(e) => {
                  const newValue = e.target.value;
                  setSearchYear(newValue);
                  onVehicleDataChange?.({
                    year: newValue,
                    make: searchMake,
                    model: searchModel
                  });
                }}
                onKeyDown={(e) => e.key === 'Enter' && searchSimilarVehicles()}
              />
            </div>
            <div>
              <Label htmlFor="make">Make</Label>
              <Input
                id="make"
                placeholder="e.g. Toyota"
                value={searchMake}
                onChange={(e) => {
                  const newValue = e.target.value;
                  setSearchMake(newValue);
                  onVehicleDataChange?.({
                    year: searchYear,
                    make: newValue,
                    model: searchModel
                  });
                }}
                onKeyDown={(e) => e.key === 'Enter' && searchSimilarVehicles()}
              />
            </div>
            <div>
              <Label htmlFor="model">Model</Label>
              <Input
                id="model"
                placeholder="e.g. Matrix"
                value={searchModel}
                onChange={(e) => {
                  const newValue = e.target.value;
                  setSearchModel(newValue);
                  onVehicleDataChange?.({
                    year: searchYear,
                    make: searchMake,
                    model: newValue
                  });
                }}
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

          {/* Manual Quote Section - Always visible when vehicle info is entered */}
          {(searchYear || searchMake || searchModel) && (
            <>
              <Separator />
              <div className="space-y-3">
                <h3 className="text-lg font-medium">Create Manual Quote</h3>
                <div>
                  <Label htmlFor="manual-offer-standalone">Your Offer Amount</Label>
                  <div className="flex gap-2 mt-1">
                    <Input
                      id="manual-offer-standalone"
                      type="number"
                      placeholder="Enter your offer"
                      value={manualOffer}
                      onChange={(e) => setManualOffer(e.target.value)}
                      className="flex-1"
                    />
                    <Button onClick={saveQuote} variant="outline" className="flex items-center gap-2">
                      <Save className="w-4 h-4" />
                      Save Quote
                    </Button>
                  </div>
                  <p className="text-sm text-gray-500 mt-1">
                    Save a quote even if no similar vehicles are found
                  </p>
                </div>
              </div>
            </>
          )}
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
                        <div className="text-xs text-primary mt-1">
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
                      <Input
                        id="manual-offer"
                        type="number"
                        placeholder="Enter your offer"
                        value={manualOffer}
                        onChange={(e) => setManualOffer(e.target.value)}
                        className="flex-1"
                      />
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
                    You can still save a quote above to help with future searches.
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
