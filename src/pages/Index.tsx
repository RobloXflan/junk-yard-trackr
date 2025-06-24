
import React from 'react';
import { Link } from 'react-router-dom';
import { Car, FileText, BarChart3, Plus, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

const Index = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="container mx-auto px-4 py-16">
        <div className="text-center mb-12">
          <div className="flex items-center justify-center gap-3 mb-6">
            <div className="w-12 h-12 bg-blue-600 rounded-lg flex items-center justify-center">
              <Car className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-4xl font-bold text-gray-900">JunkCar Pro</h1>
          </div>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Complete vehicle inventory management system for junkyard operations
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="w-5 h-5 text-blue-600" />
                Dashboard
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600 mb-4">
                View analytics and key metrics for your inventory
              </p>
              <Link to="/dashboard">
                <Button className="w-full">Go to Dashboard</Button>
              </Link>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-green-600" />
                Documents
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600 mb-4">
                Process PDFs and manage vehicle documentation
              </p>
              <Link to="/documents">
                <Button className="w-full">Process Documents</Button>
              </Link>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Plus className="w-5 h-5 text-purple-600" />
                Vehicle Intake
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600 mb-4">
                Add new vehicles to your inventory
              </p>
              <Link to="/intake">
                <Button className="w-full">Add Vehicle</Button>
              </Link>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Car className="w-5 h-5 text-orange-600" />
                Inventory
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600 mb-4">
                Manage your vehicle inventory
              </p>
              <Link to="/inventory-optimized">
                <Button className="w-full">View Inventory</Button>
              </Link>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="w-5 h-5 text-red-600" />
                Pending Releases
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600 mb-4">
                Review vehicles pending release
              </p>
              <Link to="/pending-releases">
                <Button className="w-full">View Pending</Button>
              </Link>
            </CardContent>
          </Card>
        </div>

        <div className="text-center">
          <p className="text-gray-500">
            © 2024 JunkCar Pro - Vehicle Inventory Management System
          </p>
        </div>
      </div>
    </div>
  );
};

export default Index;
