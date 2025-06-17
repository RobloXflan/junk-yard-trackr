
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";

interface PublicInventoryAuthProps {
  onAuthenticated: () => void;
}

export const PublicInventoryAuth = ({ onAuthenticated }: PublicInventoryAuthProps) => {
  const [accessCode, setAccessCode] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  // Simple access code - can be changed here
  const VALID_ACCESS_CODE = "inventory2024";

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    // Simulate a brief loading state for better UX
    setTimeout(() => {
      if (accessCode === VALID_ACCESS_CODE) {
        toast({
          title: "Access granted",
          description: "Welcome to the vehicle inventory",
        });
        onAuthenticated();
      } else {
        toast({
          title: "Access denied",
          description: "Invalid access code. Please try again.",
          variant: "destructive",
        });
      }
      setIsLoading(false);
    }, 500);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold">Vehicle Inventory Access</CardTitle>
          <CardDescription>
            Enter your access code to view the current vehicle inventory
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="accessCode">Access Code</Label>
              <Input
                id="accessCode"
                type="password"
                placeholder="Enter access code"
                value={accessCode}
                onChange={(e) => setAccessCode(e.target.value)}
                required
              />
            </div>
            <Button 
              type="submit" 
              className="w-full" 
              disabled={isLoading}
            >
              {isLoading ? "Verifying..." : "Access Inventory"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};
