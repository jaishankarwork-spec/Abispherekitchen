import React, { useState } from 'react';
import { X, ShoppingCart, User, Phone, Mail, Calendar, DollarSign, Package, FileText, CreditCard } from 'lucide-react';
import { Product, SaleTransaction } from '../../types';

interface SaleFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (saleData: any) => void;
  products: Product[];
  saleTransactions: SaleTransaction[];
}

export function SaleForm({ isOpen, onClose, onSubmit, products, saleTransactions }: SaleFormProps) {
  const [formData, setFormData] = useState({
    productId: '',
    customerName: '',
    customerPhone: '',
    customerEmail: '',
    quantity: 0,
    salePrice: 0,
    saleDate: new Date().toISOString().split('T')[0],
    paymentMethod: 'cash' as 'cash' | 'card' | 'online' | 'credit',
    notes: ''
  });

  if (!isOpen) return null;

  const selectedProduct = products.find(p => p.id === formData.productId);
  const totalAmount = formData.quantity * formData.salePrice;

  // Get recent customers for autocomplete
  const recentCustomers = Array.from(
    new Map(
      saleTransactions
        .slice(0, 20)
        .map(sale => [sale.customerPhone, {
          name: sale.customerName,
          phone: sale.customerPhone,
          email: sale.customerEmail
        }])
    ).values()
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.productId) {
      alert('Please select a product');
      return;
    }
    
    if (formData.quantity <= 0) {
      alert('Quantity must be greater than 0');
      return;
    }
    
    if (formData.salePrice <= 0) {
      alert('Sale price must be greater than 0');
      return;
    }
    
    if (!formData.customerName.trim()) {
      alert('Customer name is required');
      return;
    }
    
    if (!formData.customerPhone.trim()) {
      alert('Customer phone is required');
      return;
    }

    // Check if enough stock is available
    if (selectedProduct && formData.quantity > selectedProduct.currentStock) {
      if (!confirm(`Warning: Only ${selectedProduct.currentStock} ${selectedProduct.unit} available in stock. You're trying to sell ${formData.quantity} ${selectedProduct.unit}. Continue anyway?`)) {
        return;
      }
    }

    onSubmit(formData);
    
    // Reset form
    setFormData({
      productId: '',
      customerName: '',
      customerPhone: '',
      customerEmail: '',
      quantity: 0,
      salePrice: 0,
      saleDate: new Date().toISOString().split('T')[0],
      paymentMethod: 'cash',
      notes: ''
    });
  };

  const handleCustomerSelect = (customerPhone: string) => {
    const customer = recentCustomers.find(c => c.phone === customerPhone);
    if (customer) {
      setFormData(prev => ({
        ...prev,
        customerName: customer.name,
        customerPhone: customer.phone,
        customerEmail: customer.email || ''
      }));
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            <ShoppingCart className="h-6 w-6 text-green-500" />
            <h3 className="text-lg font-semibold text-gray-900">Record Sale Transaction</h3>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="h-5 w-5 text-gray-500" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Product Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Select Product <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <Package className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <select
                value={formData.productId}
                onChange={(e) => setFormData(prev => ({ ...prev, productId: e.target.value }))}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 appearance-none bg-white"
                required
              >
                <option value="">Choose a product</option>
                {products.filter(p => p.isActive).map(product => (
                  <option key={product.id} value={product.id}>
                    {product.name} ({product.sku}) - Stock: {product.currentStock} {product.unit}
                  </option>
                ))}
              </select>
            </div>
            {selectedProduct && (
              <div className="mt-2 p-3 bg-green-50 border border-green-200 rounded-lg">
                <div className="text-sm text-green-700">
                  <div><strong>Category:</strong> {selectedProduct.category}</div>
                  <div><strong>Available Stock:</strong> {selectedProduct.currentStock} {selectedProduct.unit}</div>
                  <div><strong>Min Stock:</strong> {selectedProduct.minStock} {selectedProduct.unit}</div>
                  {selectedProduct.currentStock <= selectedProduct.minStock && (
                    <div className="text-orange-600 font-medium mt-1">⚠️ Low stock warning</div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Customer Information */}
          <div className="space-y-4">
            <h4 className="font-medium text-gray-900">Customer Information</h4>
            
            {/* Customer Selection */}
            {recentCustomers.length > 0 && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Select Recent Customer (Optional)
                </label>
                <select
                  value={formData.customerPhone}
                  onChange={(e) => handleCustomerSelect(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                >
                  <option value="">Select customer or enter new</option>
                  {recentCustomers.map((customer, index) => (
                    <option key={index} value={customer.phone}>
                      {customer.name} - {customer.phone}
                    </option>
                  ))}
                </select>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Customer Name <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <input
                    type="text"
                    value={formData.customerName}
                    onChange={(e) => setFormData(prev => ({ ...prev, customerName: e.target.value }))}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                    placeholder="Enter customer name"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Phone Number <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <input
                    type="tel"
                    value={formData.customerPhone}
                    onChange={(e) => setFormData(prev => ({ ...prev, customerPhone: e.target.value }))}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                    placeholder="+91 9876543210"
                    required
                  />
                </div>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Email (Optional)</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  type="email"
                  value={formData.customerEmail}
                  onChange={(e) => setFormData(prev => ({ ...prev, customerEmail: e.target.value }))}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                  placeholder="customer@example.com"
                />
              </div>
            </div>
          </div>

          {/* Sale Details */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Quantity <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                step="0.01"
                value={formData.quantity}
                onChange={(e) => setFormData(prev => ({ ...prev, quantity: parseFloat(e.target.value) || 0 }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                min="0.01"
                placeholder="0"
                required
              />
              {selectedProduct && (
                <p className="text-xs text-gray-500 mt-1">
                  Unit: {selectedProduct.unit} | Available: {selectedProduct.currentStock}
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Sale Price per Unit (₹) <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  type="number"
                  step="0.01"
                  value={formData.salePrice}
                  onChange={(e) => setFormData(prev => ({ ...prev, salePrice: parseFloat(e.target.value) || 0 }))}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                  min="0.01"
                  placeholder="0.00"
                  required
                />
              </div>
            </div>
          </div>

          {/* Total Amount Display */}
          {formData.quantity > 0 && formData.salePrice > 0 && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <div className="flex justify-between items-center">
                <span className="font-medium text-green-800">Total Sale Amount:</span>
                <span className="text-xl font-bold text-green-600">₹{totalAmount.toFixed(2)}</span>
              </div>
              {selectedProduct && (
                <div className="text-sm text-green-700 mt-2">
                  Remaining stock: {selectedProduct.currentStock - formData.quantity} {selectedProduct.unit}
                </div>
              )}
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Sale Date</label>
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  type="date"
                  value={formData.saleDate}
                  onChange={(e) => setFormData(prev => ({ ...prev, saleDate: e.target.value }))}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                  max={new Date().toISOString().split('T')[0]}
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Payment Method</label>
              <div className="relative">
                <CreditCard className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                <select
                  value={formData.paymentMethod}
                  onChange={(e) => setFormData(prev => ({ ...prev, paymentMethod: e.target.value as any }))}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 appearance-none bg-white"
                >
                  <option value="cash">Cash</option>
                  <option value="card">Card</option>
                  <option value="online">Online Payment</option>
                  <option value="credit">Credit</option>
                </select>
              </div>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Notes</label>
            <div className="relative">
              <FileText className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
              <textarea
                value={formData.notes}
                onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                rows={3}
                placeholder="Additional notes about this sale..."
              />
            </div>
          </div>

          <div className="flex justify-end space-x-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors"
            >
              Record Sale
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}