import React, { useState, useEffect } from 'react';
import { ShoppingCart, Package, TrendingUp, DollarSign, Plus, Search, Filter, Download, BarChart3, Users, Calendar, Eye, Edit2, Trash2 } from 'lucide-react';
import { DatabaseService } from '../../lib/supabaseClient';
import { Product, PurchaseTransaction, SaleTransaction } from '../../types';
import { ProductForm } from './ProductForm';
import { PurchaseForm } from './PurchaseForm';
import { SaleForm } from './SaleForm';
import { TransactionHistory } from './TransactionHistory';
import { SalesReports } from './SalesReports';

export function ProductSaleManagement() {
  const [activeTab, setActiveTab] = useState('overview');
  const [products, setProducts] = useState<Product[]>([]);
  const [purchaseTransactions, setPurchaseTransactions] = useState<PurchaseTransaction[]>([]);
  const [saleTransactions, setSaleTransactions] = useState<SaleTransaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [showProductForm, setShowProductForm] = useState(false);
  const [showPurchaseForm, setShowPurchaseForm] = useState(false);
  const [showSaleForm, setShowSaleForm] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      if (!DatabaseService.isConnected()) {
        throw new Error('Database not configured. Please connect to Supabase.');
      }

      const [productsData, purchasesData, salesData] = await Promise.all([
        DatabaseService.getProducts(),
        DatabaseService.getPurchaseTransactions(),
        DatabaseService.getSaleTransactions()
      ]);

      setProducts(productsData.map(mapProduct));
      setPurchaseTransactions(purchasesData.map(mapPurchaseTransaction));
      setSaleTransactions(salesData.map(mapSaleTransaction));
    } catch (err) {
      console.error('Error loading data:', err);
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  const mapProduct = (data: any): Product => ({
    id: data.id,
    name: data.name,
    description: data.description,
    sku: data.sku,
    category: data.category,
    unit: data.unit,
    currentStock: data.current_stock,
    minStock: data.min_stock,
    isActive: data.is_active,
    createdAt: data.created_at,
    updatedAt: data.updated_at
  });

  const mapPurchaseTransaction = (data: any): PurchaseTransaction => ({
    id: data.id,
    productId: data.product_id,
    supplierName: data.supplier_name,
    quantity: data.quantity,
    purchasePrice: data.purchase_price,
    totalCost: data.total_cost,
    purchaseDate: data.purchase_date,
    invoiceNumber: data.invoice_number,
    notes: data.notes,
    createdAt: data.created_at
  });

  const mapSaleTransaction = (data: any): SaleTransaction => ({
    id: data.id,
    productId: data.product_id,
    customerName: data.customer_name,
    customerPhone: data.customer_phone,
    customerEmail: data.customer_email,
    quantity: data.quantity,
    salePrice: data.sale_price,
    totalAmount: data.total_amount,
    profitMargin: data.profit_margin,
    saleDate: data.sale_date,
    paymentMethod: data.payment_method,
    notes: data.notes,
    createdAt: data.created_at
  });

  const handleAddProduct = async (productData: any) => {
    try {
      const dbProduct = {
        name: productData.name,
        description: productData.description,
        sku: productData.sku,
        category: productData.category,
        unit: productData.unit,
        current_stock: 0,
        min_stock: productData.minStock,
        is_active: true
      };

      const data = await DatabaseService.addProduct(dbProduct);
      setProducts(prev => [mapProduct(data), ...prev]);
      setShowProductForm(false);
    } catch (err) {
      console.error('Error adding product:', err);
      alert('Error adding product: ' + (err as Error).message);
    }
  };

  const handleAddPurchase = async (purchaseData: any) => {
    try {
      const dbPurchase = {
        product_id: purchaseData.productId,
        supplier_name: purchaseData.supplierName,
        quantity: purchaseData.quantity,
        purchase_price: purchaseData.purchasePrice,
        total_cost: purchaseData.quantity * purchaseData.purchasePrice,
        purchase_date: purchaseData.purchaseDate,
        invoice_number: purchaseData.invoiceNumber,
        notes: purchaseData.notes
      };

      const data = await DatabaseService.addPurchaseTransaction(dbPurchase);
      setPurchaseTransactions(prev => [mapPurchaseTransaction(data), ...prev]);
      
      // Reload products to get updated stock
      const updatedProducts = await DatabaseService.getProducts();
      setProducts(updatedProducts.map(mapProduct));
      
      setShowPurchaseForm(false);
    } catch (err) {
      console.error('Error adding purchase:', err);
      alert('Error recording purchase: ' + (err as Error).message);
    }
  };

  const handleAddSale = async (saleData: any) => {
    try {
      const dbSale = {
        product_id: saleData.productId,
        customer_name: saleData.customerName,
        customer_phone: saleData.customerPhone,
        customer_email: saleData.customerEmail,
        quantity: saleData.quantity,
        sale_price: saleData.salePrice,
        payment_method: saleData.paymentMethod,
        sale_date: saleData.saleDate,
        notes: saleData.notes
      };

      const data = await DatabaseService.addSaleTransaction(dbSale);
      setSaleTransactions(prev => [mapSaleTransaction(data), ...prev]);
      
      // Reload products to get updated stock
      const updatedProducts = await DatabaseService.getProducts();
      setProducts(updatedProducts.map(mapProduct));
      
      setShowSaleForm(false);
    } catch (err) {
      console.error('Error adding sale:', err);
      alert('Error recording sale: ' + (err as Error).message);
    }
  };

  const handleDeleteProduct = async (product: Product) => {
    if (!confirm(`Are you sure you want to delete "${product.name}"? This will also delete all related transactions.`)) {
      return;
    }

    try {
      await DatabaseService.deleteProduct(product.id);
      setProducts(prev => prev.filter(p => p.id !== product.id));
      setPurchaseTransactions(prev => prev.filter(t => t.productId !== product.id));
      setSaleTransactions(prev => prev.filter(t => t.productId !== product.id));
    } catch (err) {
      console.error('Error deleting product:', err);
      alert('Error deleting product: ' + (err as Error).message);
    }
  };

  const filteredProducts = products.filter(product => {
    const matchesSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         product.sku.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = categoryFilter === 'all' || product.category === categoryFilter;
    return matchesSearch && matchesCategory;
  });

  const categories = ['all', ...new Set(products.map(p => p.category))];

  // Calculate statistics
  const totalProducts = products.length;
  const lowStockProducts = products.filter(p => p.currentStock <= p.minStock).length;
  const totalSalesToday = saleTransactions.filter(sale => {
    const saleDate = new Date(sale.saleDate).toDateString();
    const today = new Date().toDateString();
    return saleDate === today;
  }).reduce((sum, sale) => sum + sale.totalAmount, 0);
  const totalProfitToday = saleTransactions.filter(sale => {
    const saleDate = new Date(sale.saleDate).toDateString();
    const today = new Date().toDateString();
    return saleDate === today;
  }).reduce((sum, sale) => sum + sale.profitMargin, 0);

  const getStockStatus = (product: Product) => {
    if (product.currentStock === 0) return 'out';
    if (product.currentStock <= product.minStock) return 'low';
    return 'normal';
  };

  const getStockColor = (status: string) => {
    switch (status) {
      case 'out': return 'text-red-600 bg-red-50 border-red-200';
      case 'low': return 'text-orange-600 bg-orange-50 border-orange-200';
      default: return 'text-green-600 bg-green-50 border-green-200';
    }
  };

  const exportData = () => {
    try {
      const headers = [
        'Product Name', 'SKU', 'Category', 'Current Stock', 'Unit', 'Min Stock',
        'Total Purchases', 'Total Sales', 'Total Profit', 'Stock Status'
      ];

      const csvRows = [
        headers.join(','),
        ...filteredProducts.map(product => {
          const purchases = purchaseTransactions.filter(p => p.productId === product.id);
          const sales = saleTransactions.filter(s => s.productId === product.id);
          const totalPurchases = purchases.reduce((sum, p) => sum + p.totalCost, 0);
          const totalSales = sales.reduce((sum, s) => sum + s.totalAmount, 0);
          const totalProfit = sales.reduce((sum, s) => sum + s.profitMargin, 0);
          const status = getStockStatus(product);

          return [
            `"${product.name}"`,
            product.sku,
            product.category,
            product.currentStock,
            product.unit,
            product.minStock,
            totalPurchases.toFixed(2),
            totalSales.toFixed(2),
            totalProfit.toFixed(2),
            status
          ].join(',');
        })
      ];

      const csvContent = csvRows.join('\n');
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', `products_sales_report_${new Date().toISOString().split('T')[0]}.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error) {
      console.error('Export error:', error);
      alert('Error exporting data. Please try again.');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading products and sales data...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-6">
        <div className="flex items-center space-x-2">
          <Package className="h-5 w-5 text-red-500" />
          <h3 className="text-lg font-medium text-red-800">Error Loading Data</h3>
        </div>
        <p className="text-red-700 mt-2">{error}</p>
        <button 
          onClick={loadData}
          className="mt-4 bg-red-500 text-white px-4 py-2 rounded-lg hover:bg-red-600 transition-colors"
        >
          Retry
        </button>
      </div>
    );
  }

  const renderOverview = () => (
    <div className="space-y-6">
      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Package className="h-6 w-6 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Total Products</p>
              <p className="text-2xl font-bold text-gray-900">{totalProducts}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-orange-100 rounded-lg">
              <TrendingUp className="h-6 w-6 text-orange-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Low Stock Items</p>
              <p className="text-2xl font-bold text-orange-600">{lowStockProducts}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-green-100 rounded-lg">
              <DollarSign className="h-6 w-6 text-green-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Sales Today</p>
              <p className="text-2xl font-bold text-green-600">₹{totalSalesToday.toLocaleString()}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-purple-100 rounded-lg">
              <BarChart3 className="h-6 w-6 text-purple-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Profit Today</p>
              <p className="text-2xl font-bold text-purple-600">₹{totalProfitToday.toLocaleString()}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <button
            onClick={() => setShowPurchaseForm(true)}
            className="p-4 border-2 border-dashed border-blue-300 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-colors"
          >
            <div className="text-center">
              <Plus className="h-8 w-8 text-blue-500 mx-auto mb-2" />
              <h4 className="font-medium text-gray-900">Record Purchase</h4>
              <p className="text-sm text-gray-600">Add material purchase from supplier</p>
            </div>
          </button>
          
          <button
            onClick={() => setShowSaleForm(true)}
            className="p-4 border-2 border-dashed border-green-300 rounded-lg hover:border-green-500 hover:bg-green-50 transition-colors"
          >
            <div className="text-center">
              <ShoppingCart className="h-8 w-8 text-green-500 mx-auto mb-2" />
              <h4 className="font-medium text-gray-900">Record Sale</h4>
              <p className="text-sm text-gray-600">Add customer sale transaction</p>
            </div>
          </button>
          
          <button
            onClick={() => setShowProductForm(true)}
            className="p-4 border-2 border-dashed border-orange-300 rounded-lg hover:border-orange-500 hover:bg-orange-50 transition-colors"
          >
            <div className="text-center">
              <Package className="h-8 w-8 text-orange-500 mx-auto mb-2" />
              <h4 className="font-medium text-gray-900">Add Product</h4>
              <p className="text-sm text-gray-600">Create new product entry</p>
            </div>
          </button>
        </div>
      </div>

      {/* Products List */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Product Inventory</h3>
            <button
              onClick={exportData}
              className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 transition-colors flex items-center space-x-2"
            >
              <Download className="h-4 w-4" />
              <span>Export</span>
            </button>
          </div>
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search products..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
              />
            </div>
            <div className="relative">
              <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="pl-10 pr-8 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 appearance-none bg-white"
              >
                {categories.map(category => (
                  <option key={category} value={category}>
                    {category === 'all' ? 'All Categories' : category.charAt(0).toUpperCase() + category.slice(1)}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Product</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Category</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Stock</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Sales</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Profit</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredProducts.map((product) => {
                const productSales = saleTransactions.filter(s => s.productId === product.id);
                const totalSales = productSales.reduce((sum, s) => sum + s.totalAmount, 0);
                const totalProfit = productSales.reduce((sum, s) => sum + s.profitMargin, 0);
                const stockStatus = getStockStatus(product);
                
                return (
                  <tr key={product.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-gray-900">{product.name}</div>
                        <div className="text-sm text-gray-500">SKU: {product.sku}</div>
                        <div className="text-xs text-gray-400">{product.description}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="px-2 py-1 text-xs font-medium bg-gray-100 text-gray-800 rounded-full capitalize">
                        {product.category}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">{product.currentStock} {product.unit}</div>
                      <div className="text-xs text-gray-500">Min: {product.minStock}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">₹{totalSales.toLocaleString()}</div>
                      <div className="text-xs text-gray-500">{productSales.length} transactions</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-green-600">₹{totalProfit.toLocaleString()}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 text-xs font-medium rounded-full border ${getStockColor(stockStatus)}`}>
                        {stockStatus === 'out' ? 'Out of Stock' :
                         stockStatus === 'low' ? 'Low Stock' : 'In Stock'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex space-x-2">
                        <button
                          onClick={() => {
                            setEditingProduct(product);
                            setShowProductForm(true);
                          }}
                          className="text-blue-600 hover:text-blue-900 transition-colors"
                          title="Edit Product"
                        >
                          <Edit2 className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteProduct(product)}
                          className="text-red-600 hover:text-red-900 transition-colors"
                          title="Delete Product"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );

  const tabs = [
    { id: 'overview', label: 'Overview', icon: BarChart3 },
    { id: 'transactions', label: 'Transaction History', icon: Calendar },
    { id: 'reports', label: 'Sales Reports', icon: TrendingUp }
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Products & Sales Management</h2>
          <p className="text-gray-600">Track purchases, sales, and profit margins in real-time</p>
        </div>
        <div className="flex space-x-2">
          <button
            onClick={() => setShowPurchaseForm(true)}
            className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 transition-colors flex items-center space-x-2"
          >
            <Plus className="h-4 w-4" />
            <span>Record Purchase</span>
          </button>
          <button
            onClick={() => setShowSaleForm(true)}
            className="bg-green-500 text-white px-4 py-2 rounded-lg hover:bg-green-600 transition-colors flex items-center space-x-2"
          >
            <ShoppingCart className="h-4 w-4" />
            <span>Record Sale</span>
          </button>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="border-b border-gray-200">
          <nav className="flex space-x-8 px-6">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`py-4 px-1 border-b-2 font-medium text-sm flex items-center space-x-2 ${
                    activeTab === tab.id
                      ? 'border-orange-500 text-orange-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </nav>
        </div>

        <div className="p-6">
          {activeTab === 'overview' && renderOverview()}
          {activeTab === 'transactions' && (
            <TransactionHistory
              products={products}
              purchaseTransactions={purchaseTransactions}
              saleTransactions={saleTransactions}
            />
          )}
          {activeTab === 'reports' && (
            <SalesReports
              products={products}
              purchaseTransactions={purchaseTransactions}
              saleTransactions={saleTransactions}
            />
          )}
        </div>
      </div>

      {/* Modals */}
      <ProductForm
        isOpen={showProductForm}
        onClose={() => {
          setShowProductForm(false);
          setEditingProduct(null);
        }}
        onSubmit={handleAddProduct}
        editingProduct={editingProduct}
      />

      <PurchaseForm
        isOpen={showPurchaseForm}
        onClose={() => setShowPurchaseForm(false)}
        onSubmit={handleAddPurchase}
        products={products}
      />

      <SaleForm
        isOpen={showSaleForm}
        onClose={() => setShowSaleForm(false)}
        onSubmit={handleAddSale}
        products={products}
        saleTransactions={saleTransactions}
      />
    </div>
  );
}