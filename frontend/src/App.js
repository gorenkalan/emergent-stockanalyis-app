import React, { useState, useEffect, useCallback } from 'react';
import { BrowserRouter as Router, Routes, Route, Link, useParams, useNavigate } from 'react-router-dom';
import { TrendingUp, TrendingDown, RefreshCw, Calendar, AlertCircle, ArrowLeft, ArrowRight, Search, Menu, X } from 'lucide-react';
import './App.css';

const API_BASE_URL = process.env.REACT_APP_BACKEND_URL + '/api';

// Data structure comments for reference:
// Stock: { ticker, company_name, market_cap, sector, latest_price, latest_price_date, 'data_completeness_%', days_with_price, total_days, ... }
// TopMovers: { gainers: Stock[], losers: Stock[] }
// DataAvailability: { success, start_date, end_date, total_days, last_updated }
// DataQualitySummary: { total_stocks, stocks_with_full_data, stocks_with_partial_data, avg_data_completeness }

// Navigation Component
const Navigation = ({ onSearch }) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    onSearch(searchQuery);
  };

  return (
    <nav className="bg-white shadow-md sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <Link to="/" className="text-xl font-bold text-gray-900">
            📈 StockTracker
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-8">
            <Link to="/" className="text-gray-700 hover:text-blue-600">Dashboard</Link>
            <Link to="/watchlist" className="text-gray-700 hover:text-blue-600">Watchlist</Link>
            <Link to="/notes" className="text-gray-700 hover:text-blue-600">Notes</Link>
            <Link to="/updates" className="text-gray-700 hover:text-blue-600">Updates</Link>
          </div>

          {/* Search Bar */}
          <form onSubmit={handleSearchSubmit} className="hidden md:flex items-center">
            <div className="relative">
              <input
                type="text"
                placeholder="Search stocks..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
            </div>
          </form>

          {/* Mobile menu button */}
          <button
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className="md:hidden p-2"
          >
            {isMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>

        {/* Mobile Navigation */}
        {isMenuOpen && (
          <div className="md:hidden py-4">
            <div className="flex flex-col space-y-4">
              <Link to="/" className="text-gray-700 hover:text-blue-600">Dashboard</Link>
              <Link to="/watchlist" className="text-gray-700 hover:text-blue-600">Watchlist</Link>
              <Link to="/notes" className="text-gray-700 hover:text-blue-600">Notes</Link>
              <Link to="/updates" className="text-gray-700 hover:text-blue-600">Updates</Link>
              <form onSubmit={handleSearchSubmit} className="flex items-center">
                <div className="relative w-full">
                  <input
                    type="text"
                    placeholder="Search stocks..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
};

// Stock Card Component with Pagination
const StockCard = ({ title, stocks, icon: Icon, type = 'default', onStockClick, itemsPerPage = 10 }) => {
  const [currentPage, setCurrentPage] = useState(1);
  const [displayCount, setDisplayCount] = useState(itemsPerPage);

  const totalPages = Math.ceil(stocks.length / displayCount);
  const startIndex = (currentPage - 1) * displayCount;
  const displayedStocks = stocks.slice(startIndex, startIndex + displayCount);

  const handlePageChange = (page) => {
    setCurrentPage(page);
  };

  const handleDisplayCountChange = (count) => {
    setDisplayCount(count);
    setCurrentPage(1);
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h3 className="font-semibold text-lg flex items-center gap-2 mb-4">
        <Icon className={`h-5 w-5 ${type === 'gainers' ? 'text-green-600' : type === 'losers' ? 'text-red-600' : 'text-blue-600'}`} />
        {title}
      </h3>

      {/* Display count selector */}
      <div className="flex justify-between items-center mb-4">
        <div className="flex items-center gap-2 text-sm">
          <span>Show:</span>
          <select 
            value={displayCount} 
            onChange={(e) => handleDisplayCountChange(Number(e.target.value))}
            className="border rounded px-2 py-1"
          >
            <option value={10}>10</option>
            <option value={20}>20</option>
            <option value={50}>50</option>
          </select>
        </div>
        <span className="text-sm text-gray-500">
          {stocks.length} total stocks
        </span>
      </div>

      {/* Stock List */}
      <div className="space-y-4 min-h-[400px]">
        {displayedStocks.length === 0 ? (
          <p className="text-gray-500 text-center py-8">No data available</p>
        ) : (
          displayedStocks.map((stock) => (
            <div 
              key={stock.ticker} 
              className="flex justify-between items-center p-3 hover:bg-gray-50 rounded-lg cursor-pointer transition-colors"
              onClick={() => onStockClick && onStockClick(stock.ticker)}
            >
              <div className="flex-1 min-w-0">
                <p className="font-medium text-sm truncate">{stock.ticker}</p>
                <p className="text-xs text-gray-500 truncate" title={stock.company_name}>
                  {stock.company_name}
                </p>
                <p className="text-xs text-gray-400">{stock.sector}</p>
              </div>
              <div className="text-right ml-4">
                <p className="font-medium text-sm">₹{formatNumber(stock.latest_price)}</p>
                <p className="text-sm font-semibold">
                  {formatPercentage(stock['1D_change_%'])}
                </p>
                <p className="text-xs text-gray-400">
                  ₹{formatNumber(stock.market_cap / 100)} Cr
                </p>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-center items-center mt-6 space-x-2">
          <button
            onClick={() => handlePageChange(currentPage - 1)}
            disabled={currentPage === 1}
            className="p-2 rounded-lg border disabled:opacity-50"
          >
            <ArrowLeft className="h-4 w-4" />
          </button>
          
          <span className="px-4 py-2 text-sm">
            Page {currentPage} of {totalPages}
          </span>
          
          <button
            onClick={() => handlePageChange(currentPage + 1)}
            disabled={currentPage === totalPages}
            className="p-2 rounded-lg border disabled:opacity-50"
          >
            <ArrowRight className="h-4 w-4" />
          </button>
        </div>
      )}
    </div>
  );
};

// Individual Stock Page Component
const StockDetail = () => {
  const { ticker } = useParams();
  const navigate = useNavigate();
  const [stockData, setStockData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchStockDetail = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/stocks/${ticker}`);
        const data = await response.json();
        if (data.success) {
          setStockData(data.data);
        } else {
          setError('Stock not found');
        }
      } catch (err) {
        setError('Failed to load stock data');
      } finally {
        setLoading(false);
      }
    };

    fetchStockDetail();
  }, [ticker]);

  if (loading) return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  if (error) return <div className="min-h-screen flex items-center justify-center text-red-600">{error}</div>;
  if (!stockData) return null;

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-6xl mx-auto p-4">
        {/* Header */}
        <div className="mb-6">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-2 text-blue-600 hover:text-blue-800 mb-4"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Dashboard
          </button>
          
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between">
              <div>
                <h1 className="text-3xl font-bold text-gray-900">{stockData.ticker}</h1>
                <p className="text-lg text-gray-600">{stockData.company_name}</p>
                <p className="text-sm text-gray-500">{stockData.sector}</p>
              </div>
              <div className="mt-4 md:mt-0 text-right">
                <p className="text-2xl font-bold">₹{formatNumber(stockData.latest_price)}</p>
                <p className="text-lg font-semibold">{formatPercentage(stockData['1D_change_%'])}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Key Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          <div className="bg-white rounded-lg shadow-md p-6">
            <h3 className="font-semibold mb-4">Market Information</h3>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-gray-600">Market Cap:</span>
                <span>₹{formatNumber(stockData.market_cap)} Cr</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Latest Price:</span>
                <span>₹{formatNumber(stockData.latest_price)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Data Quality:</span>
                <span className={stockData['data_completeness_%'] >= 90 ? 'text-green-600' : 'text-yellow-600'}>
                  {stockData['data_completeness_%']}%
                </span>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6">
            <h3 className="font-semibold mb-4">Company Info</h3>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-gray-600">Promoter Share:</span>
                <span>{stockData.promoter_share}%</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Founded:</span>
                <span>{stockData.founded}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Employees:</span>
                <span>{formatNumber(stockData.employees)}</span>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6">
            <h3 className="font-semibold mb-4">Financial Info</h3>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-gray-600">Debt:</span>
                <span>₹{formatNumber(stockData.debt)} Cr</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Sector:</span>
                <span>{stockData.sector}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Price Changes */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h3 className="font-semibold mb-4">Price Performance</h3>
          <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
            {[1, 5, 10, 15, 20, 30].map(period => (
              <div key={period} className="text-center p-3 bg-gray-50 rounded">
                <p className="text-sm text-gray-600">{period}D</p>
                <p className="font-semibold">{formatPercentage(stockData[`${period}D_change_%`])}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Company Description */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="font-semibold mb-4">About Company</h3>
          <p className="text-gray-700 mb-4">{stockData.description}</p>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h4 className="font-medium mb-2">Key Products</h4>
              <ul className="space-y-1">
                {stockData.products?.map((product, index) => (
                  <li key={index} className="text-gray-600">• {product}</li>
                ))}
              </ul>
            </div>
            <div>
              <h4 className="font-medium mb-2">Promoters</h4>
              <ul className="space-y-1">
                {stockData.promoters?.map((promoter, index) => (
                  <li key={index} className="text-gray-600">• {promoter}</li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// Main Dashboard Component
const StockAnalysisDashboard = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [stockData, setStockData] = useState([]);
  const [topMovers, setTopMovers] = useState({ gainers: [], losers: [] });
  const [sectors, setSectors] = useState([]);
  const [dataAvailability, setDataAvailability] = useState(null);
  const [dataQuality, setDataQuality] = useState(null);
  
  const [selectedSector, setSelectedSector] = useState('');
  const [marketCapRange, setMarketCapRange] = useState({ min: '', max: '' });
  const [changePeriods, setChangePeriods] = useState([1, 5, 10, 15, 20, 30]);
  const [dateRange, setDateRange] = useState({ start: '', end: '' });
  const [sortBy, setSortBy] = useState('market_cap');
  const [sortOrder, setSortOrder] = useState('desc');

  const handleStockClick = (ticker) => {
    navigate(`/stock/${ticker}`);
  };

  const handleSearch = (query) => {
    if (query.trim()) {
      const found = [...topMovers.gainers, ...topMovers.losers, ...stockData]
        .find(stock => stock.ticker.toLowerCase().includes(query.toLowerCase()) || 
                     stock.company_name.toLowerCase().includes(query.toLowerCase()));
      if (found) {
        navigate(`/stock/${found.ticker}`);
      } else {
        alert('Stock not found');
      }
    }
  };

  const fetchStockAnalysis = useCallback(async () => {
    if (!dataAvailability) return;
    try {
      setLoading(true);
      setError(null);
      const requestBody = {
        start_date: dateRange.start, 
        end_date: dateRange.end, 
        change_periods: changePeriods,
        sort_by: sortBy, 
        sort_order: sortOrder,
        ...(marketCapRange.min && { market_cap_min: parseFloat(marketCapRange.min) }),
        ...(marketCapRange.max && { market_cap_max: parseFloat(marketCapRange.max) }),
        ...(selectedSector && { sector: selectedSector })
      };
      const response = await fetch(`${API_BASE_URL}/stocks/analysis`, { 
        method: 'POST', 
        headers: { 'Content-Type': 'application/json' }, 
        body: JSON.stringify(requestBody) 
      });
      const data = await response.json();
      if (data.success) {
        setStockData(data.data);
        setDataQuality(data.summary);
      } else {
        setError(data.error || 'Failed to fetch analysis');
      }
    } catch (err) {
      setError('Network error: ' + err.message);
    } finally {
      setLoading(false);
    }
  }, [dataAvailability, dateRange, changePeriods, marketCapRange, selectedSector, sortBy, sortOrder]);

  useEffect(() => {
    if (dataAvailability) {
      fetchStockAnalysis();
    }
  }, [fetchStockAnalysis, dataAvailability]);
  
  const fetchSectors = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/stocks/sectors`);
      const data = await response.json();
      if (data.success) setSectors(data.sectors);
    } catch (err) { 
      console.error('Error fetching sectors:', err); 
    }
  };

  const fetchTopMovers = async (period = 1) => {
    try {
      const response = await fetch(`${API_BASE_URL}/stocks/top-movers?period=${period}&limit=10`);
      if (!response.ok) throw new Error(`HTTP error! Status: ${response.status}`);
      const data = await response.json();
      if (data.success) {
        setTopMovers({ gainers: data.gainers || [], losers: data.losers || [] });
      }
    } catch (err) { 
      console.error('Error fetching top movers:', err); 
    }
  };
  
  const loadInitialData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const availabilityResponse = await fetch(`${API_BASE_URL}/data/availability`);
      if (!availabilityResponse.ok) throw new Error(`HTTP error! Status: ${availabilityResponse.status}`);
      const availabilityData = await availabilityResponse.json();
      if (availabilityData.success) {
        setDataAvailability(availabilityData);
        setDateRange({ start: availabilityData.start_date, end: availabilityData.end_date });
        await Promise.all([ fetchSectors(), fetchTopMovers() ]);
      } else {
        throw new Error(availabilityData.message || "Failed to get data availability.");
      }
    } catch (err) {
      setError('Failed to load initial data. Error: ' + err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadInitialData();
  }, [loadInitialData]);
  
  const reloadData = async () => { 
    await loadInitialData(); 
  };

  const sortOptions = [ 
    { value: 'market_cap', label: 'Market Cap' }, 
    { value: 'company_name', label: 'Company Name' }, 
    { value: 'sector', label: 'Sector' }, 
    { value: 'latest_price', label: 'Latest Price' }, 
    ...changePeriods.map(p => ({ value: `${p}D_change_%`, label: `${p}D Change %` })) 
  ];

  if (loading && !dataAvailability) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navigation onSearch={handleSearch} />
        <div className="flex items-center justify-center h-64">
          <RefreshCw className="h-8 w-8 animate-spin text-blue-600" />
          <span className="ml-2 text-gray-600">Loading dashboard...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation onSearch={handleSearch} />
      
      <div className="max-w-7xl mx-auto p-4">
        <div className="mb-8">
          <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-2">Stock Market Analysis Dashboard</h1>
          <p className="text-gray-600">Analysis based on pre-loaded NSE/BSE stock data</p>
        </div>

        {dataAvailability && (
          <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg shadow-sm">
            <div className="flex items-start gap-3">
              <Calendar className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
              <div className="flex-1">
                <h3 className="font-semibold text-blue-900">Data Available</h3>
                <p className="text-sm text-blue-700">
                  From {formatDate(dataAvailability.start_date)} to {formatDate(dataAvailability.end_date)} ({dataAvailability.total_days} trading days)
                </p>
                <p className="text-xs text-blue-600 mt-1">
                  Last updated: {formatDate(dataAvailability.last_updated)}
                </p>
              </div>
              <button 
                onClick={reloadData} 
                disabled={loading} 
                className="p-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
              >
                <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
              </button>
            </div>
          </div>
        )}
        
        {/* Top Movers Cards */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          <StockCard
            title="Top Gainers (1 Day)"
            stocks={topMovers.gainers}
            icon={TrendingUp}
            type="gainers"
            onStockClick={handleStockClick}
          />
          <StockCard
            title="Top Losers (1 Day)"
            stocks={topMovers.losers}
            icon={TrendingDown}
            type="losers"
            onStockClick={handleStockClick}
          />
        </div>

        {/* Analysis Filters */}
        <div className="mb-8 bg-white p-6 rounded-lg shadow-md">
          <h3 className="font-semibold text-lg mb-4">Analysis Filters</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium mb-1">Date Range</label>
              <div className="flex gap-2">
                <input 
                  type="date" 
                  className="flex-1 px-3 py-2 border rounded-md" 
                  value={dateRange.start} 
                  min={dataAvailability?.start_date} 
                  max={dataAvailability?.end_date} 
                  onChange={(e) => setDateRange({ ...dateRange, start: e.target.value })}
                />
                <input 
                  type="date" 
                  className="flex-1 px-3 py-2 border rounded-md" 
                  value={dateRange.end} 
                  min={dataAvailability?.start_date} 
                  max={dataAvailability?.end_date} 
                  onChange={(e) => setDateRange({ ...dateRange, end: e.target.value })}
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Market Cap (Crores)</label>
              <div className="flex gap-2">
                <input 
                  type="number" 
                  placeholder="Min" 
                  className="flex-1 px-3 py-2 border rounded-md" 
                  value={marketCapRange.min} 
                  onChange={(e) => setMarketCapRange({ ...marketCapRange, min: e.target.value })}
                />
                <input 
                  type="number" 
                  placeholder="Max" 
                  className="flex-1 px-3 py-2 border rounded-md" 
                  value={marketCapRange.max} 
                  onChange={(e) => setMarketCapRange({ ...marketCapRange, max: e.target.value })}
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Sector</label>
              <select 
                className="w-full px-3 py-2 border rounded-md" 
                value={selectedSector} 
                onChange={(e) => setSelectedSector(e.target.value)}
              >
                <option value="">All Sectors</option>
                {sectors.map(sector => (
                  <option key={sector} value={sector}>{sector}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Sort By</label>
              <select 
                className="w-full px-3 py-2 border rounded-md" 
                value={sortBy} 
                onChange={(e) => setSortBy(e.target.value)}
              >
                {sortOptions.map(opt => 
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                )}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Order</label>
              <select 
                className="w-full px-3 py-2 border rounded-md" 
                value={sortOrder} 
                onChange={(e) => setSortOrder(e.target.value)}
              >
                <option value="desc">Descending</option>
                <option value="asc">Ascending</option>
              </select>
            </div>
            <div className="flex items-end">
              <button 
                onClick={fetchStockAnalysis} 
                disabled={loading || !dataAvailability} 
                className="px-4 py-2 w-full bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {loading && <RefreshCw className="h-4 w-4 animate-spin" />} 
                Refresh
              </button>
            </div>
          </div>
          <hr className="my-4"/>
          <div>
            <label className="block text-sm font-medium mb-2">Price Change Periods (Days)</label>
            <div className="flex flex-wrap gap-x-4 gap-y-2">
              {[1, 5, 10, 15, 20, 30].map(period => (
                <label key={period} className="flex items-center cursor-pointer">
                  <input 
                    type="checkbox" 
                    className="mr-1 h-4 w-4" 
                    checked={changePeriods.includes(period)} 
                    onChange={(e) => { 
                      const newPeriods = e.target.checked 
                        ? [...changePeriods, period] 
                        : changePeriods.filter(p => p !== period); 
                      setChangePeriods(newPeriods.sort((a, b) => a - b)); 
                    }}
                  />
                  {period}D
                </label>
              ))}
            </div>
          </div>
        </div>
        
        {/* Data Quality Summary */}
        {dataQuality && stockData.length > 0 && (
          <div className="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg shadow-sm">
            <div className="flex items-start gap-2">
              <AlertCircle className="h-5 w-5 text-yellow-600 mt-0.5" />
              <div className="flex-1">
                <h3 className="font-semibold text-yellow-900">Data Quality Summary</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mt-2 text-sm text-yellow-700">
                  <div>Total Stocks: {dataQuality.total_stocks}</div>
                  <div>Complete Data: {dataQuality.stocks_with_full_data}</div>
                  <div>Partial Data: {dataQuality.stocks_with_partial_data}</div>
                  <div>Avg Completeness: {dataQuality.avg_data_completeness?.toFixed(1)}%</div>
                </div>
              </div>
            </div>
          </div>
        )}

        {error && (
          <div className="mb-4 p-4 bg-red-50 border border-red-200 text-red-800 rounded-lg shadow-sm">
            <p>{error}</p>
          </div>
        )}

        {/* Analysis Results */}
        {stockData.length > 0 && (
          <StockCard
            title={`Analysis Results (${stockData.length} stocks)`}
            stocks={stockData}
            icon={AlertCircle}
            type="analysis"
            onStockClick={handleStockClick}
            itemsPerPage={20}
          />
        )}

        {!loading && !dataAvailability && (
          <div className="text-center py-12 bg-white rounded-lg shadow-md">
            <AlertCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-700 mb-2">No Data Available</h3>
            <p className="text-gray-600 mb-4">Please ensure the backend server is running and data files are present.</p>
          </div>
        )}
      </div>
    </div>
  );
};

// Utility functions
const formatNumber = (num) => { 
  if (num === null || num === undefined) return '-'; 
  return new Intl.NumberFormat('en-IN').format(num); 
};

const formatPercentage = (num) => { 
  if (num === null || num === undefined) return '0.00%'; 
  const formatted = num.toFixed(2); 
  const className = num > 0 ? 'text-green-600' : num < 0 ? 'text-red-600' : ''; 
  return <span className={className}>{num > 0 ? '+' : ''}{formatted}%</span>; 
};

const formatDate = (dateStr) => { 
  if (!dateStr) return '-'; 
  const date = new Date(dateStr); 
  return date.toLocaleDateString('en-IN', { 
    day: '2-digit', 
    month: 'short', 
    year: 'numeric' 
  }); 
};

// Placeholder components for other pages
const WatchlistPage = () => (
  <div className="min-h-screen bg-gray-50">
    <Navigation onSearch={() => {}} />
    <div className="max-w-4xl mx-auto p-4">
      <h1 className="text-3xl font-bold mb-4">My Watchlists</h1>
      <div className="bg-white rounded-lg shadow-md p-6 text-center">
        <p className="text-gray-600">Watchlist feature coming soon...</p>
      </div>
    </div>
  </div>
);

const NotesPage = () => (
  <div className="min-h-screen bg-gray-50">
    <Navigation onSearch={() => {}} />
    <div className="max-w-4xl mx-auto p-4">
      <h1 className="text-3xl font-bold mb-4">My Notes</h1>
      <div className="bg-white rounded-lg shadow-md p-6 text-center">
        <p className="text-gray-600">Notes feature coming soon...</p>
      </div>
    </div>
  </div>
);

const UpdatesPage = () => (
  <div className="min-h-screen bg-gray-50">
    <Navigation onSearch={() => {}} />
    <div className="max-w-4xl mx-auto p-4">
      <h1 className="text-3xl font-bold mb-4">Market Updates</h1>
      <div className="bg-white rounded-lg shadow-md p-6 text-center">
        <p className="text-gray-600">Updates feature coming soon...</p>
      </div>
    </div>
  </div>
);

// Main App Component
function App() {
  return (
    <Router>
      <div className="App">
        <Routes>
          <Route path="/" element={<StockAnalysisDashboard />} />
          <Route path="/stock/:ticker" element={<StockDetail />} />
          <Route path="/watchlist" element={<WatchlistPage />} />
          <Route path="/notes" element={<NotesPage />} />
          <Route path="/updates" element={<UpdatesPage />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;