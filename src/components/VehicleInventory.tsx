import React, { useState, useEffect } from 'react'
import { useVehicleStorePaginated } from '@/hooks/useVehicleStorePaginated'
import { VehicleDetailsDialog } from './VehicleDetailsDialog'
import { VehicleIntakeDialog } from './VehicleIntakeDialog'
import { Input } from './ui/input'
import { Button } from './ui/button'
import { Badge } from './ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from './ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from './ui/dropdown-menu'
import { SoldDialog } from './forms/SoldDialog'
import { Plus, Search, Eye, MoreVertical, Filter } from 'lucide-react'
import { Vehicle } from '@/stores/vehicleStore'
import { toast } from 'sonner'

interface VehicleInventoryProps {
  onNavigate: (page: string) => void;
}

export function VehicleInventory({ onNavigate }: VehicleInventoryProps) {
  const [selectedVehicle, setSelectedVehicle] = useState<Vehicle | null>(null)
  const [showDetailsDialog, setShowDetailsDialog] = useState(false)
  const [showIntakeDialog, setShowIntakeDialog] = useState(false)
  const [showSoldDialog, setShowSoldDialog] = useState(false)
  const [vehicleToSell, setVehicleToSell] = useState<Vehicle | null>(null)
  const [selectedMonth, setSelectedMonth] = useState<string>('all')

  const {
    vehicles,
    totalCount,
    isLoading,
    hasMore,
    searchTerm,
    setSearchTerm,
    loadMore,
    updateVehicleStatus,
    refreshVehicles
  } = useVehicleStorePaginated()

  // Filter vehicles by selected month
  const filteredVehicles = selectedMonth === 'all' 
    ? vehicles 
    : vehicles.filter(vehicle => {
        const vehicleDate = new Date(vehicle.createdAt)
        const vehicleMonth = vehicleDate.getMonth() + 1 // getMonth() returns 0-11, we want 1-12
        return vehicleMonth.toString() === selectedMonth
      })

  const handleViewDetails = (vehicle: Vehicle) => {
    setSelectedVehicle(vehicle)
    setShowDetailsDialog(true)
  }

  const handleSoldClick = (vehicle: Vehicle) => {
    setVehicleToSell(vehicle)
    setShowSoldDialog(true)
  }

  const handleStatusChange = async (vehicle: Vehicle, newStatus: Vehicle['status']) => {
    try {
      await updateVehicleStatus(vehicle.id, newStatus)
      toast.success(`Vehicle status updated to ${newStatus}`)
    } catch (error) {
      console.error('Failed to update vehicle status:', error)
      toast.error('Failed to update vehicle status')
    }
  }

  const handleSoldConfirm = async (soldData: {
    buyerFirstName: string;
    buyerLastName: string;
    salePrice: string;
    saleDate: string;
    buyerAddress?: string;
    buyerCity?: string;
    buyerState?: string;
    buyerZip?: string;
  }) => {
    if (!vehicleToSell) return
    
    try {
      await updateVehicleStatus(vehicleToSell.id, 'sold', soldData)
      toast.success('Vehicle marked as sold')
      setShowSoldDialog(false)
      setVehicleToSell(null)
    } catch (error) {
      console.error('Failed to mark vehicle as sold:', error)
      toast.error('Failed to mark vehicle as sold')
    }
  }

  const handleIntakeSuccess = () => {
    setShowIntakeDialog(false)
    refreshVehicles()
  }

  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case 'sold': return 'bg-green-500 hover:bg-green-600'
      case 'yard': return 'bg-blue-500 hover:bg-blue-600'
      case 'pick-your-part': return 'bg-orange-500 hover:bg-orange-600'
      case 'sa-recycling': return 'bg-purple-500 hover:bg-purple-600'
      default: return 'bg-gray-500 hover:bg-gray-600'
    }
  }

  const formatStatus = (status: string) => {
    return status.split('-').map(word => 
      word.charAt(0).toUpperCase() + word.slice(1)
    ).join(' ')
  }

  const months = [
    { value: 'all', label: 'All Months' },
    { value: '1', label: 'January' },
    { value: '2', label: 'February' },
    { value: '3', label: 'March' },
    { value: '4', label: 'April' },
    { value: '5', label: 'May' },
    { value: '6', label: 'June' },
    { value: '7', label: 'July' },
    { value: '8', label: 'August' },
    { value: '9', label: 'September' },
    { value: '10', label: 'October' },
    { value: '11', label: 'November' },
    { value: '12', label: 'December' }
  ]

  return (
    <div className="space-y-6">
      <Card className="shadow-business">
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span className="text-black font-bold">Vehicle Inventory</span>
            <Button onClick={() => setShowIntakeDialog(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Add Vehicle
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-4 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                placeholder="Search vehicles..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-gray-500" />
              <Select value={selectedMonth} onValueChange={setSelectedMonth}>
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="Filter by month" />
                </SelectTrigger>
                <SelectContent>
                  {months.map((month) => (
                    <SelectItem key={month.value} value={month.value}>
                      {month.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="text-sm text-gray-600 mb-4">
            Showing {filteredVehicles.length} of {totalCount} vehicles
            {selectedMonth !== 'all' && (
              <span className="ml-2 text-blue-600">
                (filtered by {months.find(m => m.value === selectedMonth)?.label})
              </span>
            )}
          </div>

          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Vehicle ID</TableHead>
                  <TableHead>Year</TableHead>
                  <TableHead>Make</TableHead>
                  <TableHead>Model</TableHead>
                  <TableHead>License Plate</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Added Date</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredVehicles.map((vehicle) => (
                  <TableRow key={vehicle.id}>
                    <TableCell className="font-mono">{vehicle.vehicleId}</TableCell>
                    <TableCell>{vehicle.year}</TableCell>
                    <TableCell>{vehicle.make}</TableCell>
                    <TableCell>{vehicle.model}</TableCell>
                    <TableCell className="font-mono">{vehicle.licensePlate || 'N/A'}</TableCell>
                    <TableCell>
                      <Badge className={`${getStatusBadgeColor(vehicle.status)} text-white`}>
                        {formatStatus(vehicle.status)}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {new Date(vehicle.createdAt).toLocaleDateString()}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleViewDetails(vehicle)}
                        >
                          <Eye className="w-4 h-4" />
                        </Button>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="outline" size="sm">
                              <MoreVertical className="w-4 h-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent>
                            <DropdownMenuItem onClick={() => handleSoldClick(vehicle)}>
                              Mark as Sold
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleStatusChange(vehicle, 'yard')}>
                              Move to Yard
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleStatusChange(vehicle, 'pick-your-part')}>
                              Send to Pick Your Part
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleStatusChange(vehicle, 'sa-recycling')}>
                              Send to SA Recycling
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {hasMore && !isLoading && selectedMonth === 'all' && (
            <div className="mt-4 text-center">
              <Button onClick={loadMore} variant="outline">
                Load More Vehicles
              </Button>
            </div>
          )}

          {isLoading && (
            <div className="mt-4 text-center text-gray-500">
              Loading vehicles...
            </div>
          )}
        </CardContent>
      </Card>

      {showDetailsDialog && selectedVehicle && (
        <VehicleDetailsDialog
          vehicle={selectedVehicle}
          isOpen={showDetailsDialog}
          onClose={() => {
            setShowDetailsDialog(false)
            setSelectedVehicle(null)
          }}
          onSave={() => {
            refreshVehicles()
            setShowDetailsDialog(false)
            setSelectedVehicle(null)
          }}
        />
      )}

      {showIntakeDialog && (
        <VehicleIntakeDialog
          isOpen={showIntakeDialog}
          onClose={() => setShowIntakeDialog(false)}
          onSuccess={handleIntakeSuccess}
        />
      )}

      {showSoldDialog && vehicleToSell && (
        <SoldDialog
          isOpen={showSoldDialog}
          onClose={() => {
            setShowSoldDialog(false)
            setVehicleToSell(null)
          }}
          vehicle={vehicleToSell}
          onConfirm={handleSoldConfirm}
        />
      )}
    </div>
  )
}
