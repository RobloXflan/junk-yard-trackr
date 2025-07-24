import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { Car, Lock, Eye, EyeOff } from "lucide-react";

interface SiteAuthProps {
  onAuthenticated: (userType: 'admin' | 'viewer') => void;
}

export const SiteAuth = ({ onAuthenticated }: SiteAuthProps) => {
  const [credentials, setCredentials] = useState({
    username: "",
    password: "",
  });
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const { toast } = useToast();

  // Define user credentials from environment variables
  const validUsers: Record<string, { password: string; type: 'admin' | 'viewer' }> = {
    [import.meta.env.VITE_ADMIN_USERNAME || "America Main"]: { 
      password: import.meta.env.VITE_ADMIN_PASSWORD || "Americas12", 
      type: "admin" as const 
    },
    [import.meta.env.VITE_VIEWER_USERNAME || "ChocoXflan"]: { 
      password: import.meta.env.VITE_VIEWER_PASSWORD || "view123", 
      type: "viewer" as const 
    },
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    // Simulate a brief loading state for better UX
    setTimeout(() => {
      const user = validUsers[credentials.username];
      
      if (user && user.password === credentials.password) {
        // Save login state if remember me is checked
        if (rememberMe) {
          localStorage.setItem('rememberedUser', JSON.stringify({
            username: credentials.username,
            userType: user.type,
            timestamp: Date.now()
          }));
        }

        toast({
          title: "Login successful",
          description: `Welcome, ${credentials.username}!`,
        });
        onAuthenticated(user.type);
      } else {
        toast({
          title: "Login failed",
          description: "Invalid username or password. Please try again.",
          variant: "destructive",
        });
      }
      setIsLoading(false);
    }, 500);
  };

  // Check for remembered user on component mount
  useState(() => {
    const rememberedUser = localStorage.getItem('rememberedUser');
    if (rememberedUser) {
      try {
        const userData = JSON.parse(rememberedUser);
        // Auto-login the remembered user
        setTimeout(() => {
          onAuthenticated(userData.userType);
        }, 100);
      } catch (error) {
        // Remove invalid data
        localStorage.removeItem('rememberedUser');
      }
    }
  });

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/10 to-accent/10 p-4">
      <Card className="w-full max-w-md shadow-lg">
        <CardHeader className="text-center">
          <div className="w-16 h-16 bg-primary rounded-full flex items-center justify-center mx-auto mb-4">
            <Car className="w-8 h-8 text-primary-foreground" />
          </div>
          <CardTitle className="text-2xl font-bold">JunkCar Pro</CardTitle>
          <CardDescription>
            Please sign in to access the system
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="username">Username</Label>
              <Input
                id="username"
                type="text"
                placeholder="Enter username"
                value={credentials.username}
                onChange={(e) => setCredentials(prev => ({ ...prev, username: e.target.value }))}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Enter password"
                  value={credentials.password}
                  onChange={(e) => setCredentials(prev => ({ ...prev, password: e.target.value }))}
                  required
                  className="pr-10"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? (
                    <EyeOff className="w-4 h-4" />
                  ) : (
                    <Eye className="w-4 h-4" />
                  )}
                </Button>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox
                id="remember"
                checked={rememberMe}
                onCheckedChange={(checked) => setRememberMe(checked === true)}
              />
              <Label htmlFor="remember" className="text-sm font-normal">
                Remember me
              </Label>
            </div>
            <Button 
              type="submit" 
              className="w-full" 
              disabled={isLoading}
            >
              <Lock className="w-4 h-4 mr-2" />
              {isLoading ? "Signing in..." : "Sign In"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};