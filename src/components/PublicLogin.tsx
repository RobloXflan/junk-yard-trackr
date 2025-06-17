
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Car, Lock } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface PublicLoginProps {
  onLogin: () => void;
}

export function PublicLogin({ onLogin }: PublicLoginProps) {
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  // Simple password - you can change this to whatever you want
  const INVENTORY_PASSWORD = "inventory2024";

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    // Simulate a brief loading time
    setTimeout(() => {
      if (password === INVENTORY_PASSWORD) {
        onLogin();
      } else {
        setError("Incorrect password. Please try again.");
      }
      setIsLoading(false);
    }, 500);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="w-16 h-16 bg-blue-500 rounded-full flex items-center justify-center mx-auto mb-4">
            <Car className="w-8 h-8 text-white" />
          </div>
          <CardTitle className="text-2xl">Vehicle Inventory Access</CardTitle>
          <p className="text-gray-600">Enter password to view inventory</p>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                placeholder="Enter access password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
            
            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <Button type="submit" className="w-full" disabled={isLoading}>
              <Lock className="w-4 h-4 mr-2" />
              {isLoading ? "Checking..." : "Access Inventory"}
            </Button>
            
            <div className="text-center text-sm text-gray-500">
              Contact administrator for access
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
