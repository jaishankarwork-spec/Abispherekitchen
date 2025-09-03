import React, { useState } from 'react';
import { X, ShoppingBag, User, Hash, Calendar, DollarSign, Package, FileText } from 'lucide-react';
import { Product } from '../../types';

interface PurchaseFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (purchaseData: any) => void;
  products: Product[];
}

export function PurchaseForm({ isOpen, onClose, onSubmit, products }: PurchaseFormProps) {
  const [formData, setFormData] = useState({
    productId: '',
    supplierName: '',
    quantity: 0,
    purchasePrice: 0,
    purchaseDate: new Date().toISOString().split('T')[0],
    invoiceNumber: '',
    notes: ''
  });

  if (!isOpen) return null;

  const selectedProduct = products.find(p => p.id === formData.productId);
  const totalCost = formData.quantity * formData.purchasePrice;

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
    
    if (formData.purchasePrice <= 0) {
      alert('Purchase price must be greater than 0');
      return;
    }
    
    if (!formData.supplierName.trim()) {
      alert('Supplier name is required');
      return;
    }

    onSubmit(formData);
    
    // Reset form
    setFormData({
      productId: '',
      supplierName: '',
      quantity: 0,
      purchasePrice: 0,
      purchaseDate: new Date().toISOString().split('T')[0],
      invoiceNumber: '',
      notes: ''
    });
  };

  const commonSuppliers = [
    'Tamil Nadu Rice Mills',
    'Fresh Meat Co.',
    'Hosur Vegetable Market',
    'Spice World',
    'Local Supplier',
    'Wholesale Market',
    'Direct Farmer'
  ];

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            <ShoppingBag className="h-6 w-6 text-blue-500" />
            <h3 className="text-lg font-semibold text-gray-900">Record Purchase Transaction</h3>
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
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 appearance-none bg-white"
                required
              >
                <option value="">Choose a product</option>
                {products.filter(p => p.isActive).map(product => (
                  <option key={product.id} value={product.id}>
                    {product.name} ({product.sku}) - Current: {product.currentStock} {product.unit}
                  </option>
                ))}
              </select>
            </div>
            {selectedProduct && (
              <div className="mt-2 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <div className="text-sm text-blue-700">
                  <div><strong>Category:</strong> {selectedProduct.category}</div>
                  <div><strong>Current Stock:</strong> {selectedProduct.currentStock} {selectedProduct.unit}</div>
                  <div><strong>Min Stock:</strong> {selectedProduct.minStock} {selectedProduct.unit}</div>
                </div>
              </div>
            )}
          </div>

          {/* Supplier Information */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Supplier Name <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="text"
                list="suppliers"
                value={formData.supplierName}
                onChange={(e) => setFormData(prev => ({ ...prev, supplierName: e.target.value }))}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Enter or select supplier"
                required
              />
              <datalist id="suppliers">
                {commonSuppliers.map(supplier => (
                  <option key={supplier} value={supplier} />
                ))}
              </datalist>
            </div>
          </div>

          {/* Purchase Details */}
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
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                min="0.01"
                placeholder="0"
                required
              />
              {selectedProduct && (
                <p className="text-xs text-gray-500 mt-1">Unit: {selectedProduct.unit}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Purchase Price per Unit (₹) <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  type="number"
                  step="0.01"
                  value={formData.purchasePrice}
                  onChange={(e) => setFormData(prev => ({ ...prev, purchasePrice: parseFloat(e.target.value) || 0 }))}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  min="0.01"
                  placeholder="0.00"
                  required
                />
              </div>
            </div>
          </div>

          {/* Total Cost Display */}
          {formData.quantity > 0 && formData.purchasePrice > 0 && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex justify-between items-center">
                <span className="font-medium text-blue-800">Total Purchase Cost:</span>
                <span className="text-xl font-bold text-blue-600">₹{totalCost.toFixed(2)}</span>
              </div>
              {selectedProduct && (
                <div className="text-sm text-blue-700 mt-2">
                  New stock level: {selectedProduct.currentStock + formData.quantity} {selectedProduct.unit}
                </div>
              )}
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Purchase Date</label>
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  type="date"
                  value={formData.purchaseDate}
                  onChange={(e) => setFormData(prev => ({ ...prev, purchaseDate: e.target.value }))}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  max={new Date().toISOString().split('T')[0]}
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Invoice Number</label>
              <div className="relative">
                <Hash className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  type="text"
                  value={formData.invoiceNumber}
                  onChange={(e) => setFormData(prev => ({ ...prev, invoiceNumber: e.target.value }))}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="INV-001"
                />
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
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                rows={3}
                placeholder="Additional notes about this purchase..."
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
              className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
            >
              Record Purchase
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}