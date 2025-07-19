import React, { useState, useEffect, useCallback, createContext, useContext } from 'react';
import { BrowserRouter as Router, Routes, Route, Link, useParams, useNavigate, Navigate } from 'react-router-dom';
import { TrendingUp, TrendingDown, RefreshCw, Calendar, AlertCircle, ArrowLeft, ArrowRight, Search, Menu, X, BarChart3, ChevronLeft, ChevronRight, Star, Users, Shield, Zap, Eye, TrendingUpIcon, TrendingDownIcon, Activity } from 'lucide-react';
import './App.css';

const API_BASE_URL = process.env.REACT_APP_BACKEND_URL + '/api';

// Auth Context
const AuthContext = createContext();

const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      // Verify token with backend
      fetch(`${API_BASE_URL}/auth/me`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          setUser(data.user);
        } else {
          localStorage.removeItem('token');
        }
      })
      .catch(() => {
        localStorage.removeItem('token');
      })
      .finally(() => {
        setLoading(false);
      });
    } else {
      setLoading(false);
    }
  }, []);

  const login = async (email, password) => {
    try {
      const response = await fetch(`${API_BASE_URL}/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ email, password })
      });
      
      const data = await response.json();
      
      if (data.success) {
        localStorage.setItem('token', data.token);
        setUser(data.user);
        return { success: true };
      } else {
        return { success: false, error: data.detail || 'Login failed' };
      }
    } catch (error) {
      return { success: false, error: 'Network error' };
    }
  };

  const register = async (name, email, password) => {
    try {
      const response = await fetch(`${API_BASE_URL}/auth/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ name, email, password })
      });
      
      const data = await response.json();
      
      if (data.success) {
        localStorage.setItem('token', data.token);
        setUser(data.user);
        return { success: true };
      } else {
        return { success: false, error: data.detail || 'Registration failed' };
      }
    } catch (error) {
      return { success: false, error: 'Network error' };
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};

// Protected Route Component
const ProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth();
  
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <RefreshCw className="h-8 w-8 animate-spin text-blue-600" />
        <span className="ml-2 text-gray-600">Loading...</span>
      </div>
    );
  }
  
  if (!user) {
    return <Navigate to="/login" replace />;
  }
  
  return children;
};

// Header Component for Public Pages
const PublicHeader = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const { user, logout } = useAuth();

  return (
    <nav className="bg-white border-b border-gray-200 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <Link to="/" className="text-xl font-bold text-gray-900">
            📈 StockTracker
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-8">
            <Link to="/" className="text-gray-700 hover:text-blue-600">Home</Link>
            <Link to="/updates" className="text-gray-700 hover:text-blue-600">Updates</Link>
            {user ? (
              <>
                <Link to="/dashboard" className="text-blue-600 font-medium">Dashboard</Link>
                <button
                  onClick={logout}
                  className="text-gray-700 hover:text-red-600"
                >
                  Logout
                </button>
              </>
            ) : (
              <>
                <Link to="/login" className="text-gray-700 hover:text-blue-600">Login</Link>
                <Link to="/register" className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700">
                  Get Started
                </Link>
              </>
            )}
          </div>

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
              <Link to="/" className="text-gray-700 hover:text-blue-600">Home</Link>
              <Link to="/updates" className="text-gray-700 hover:text-blue-600">Updates</Link>
              {user ? (
                <>
                  <Link to="/dashboard" className="text-blue-600 font-medium">Dashboard</Link>
                  <button
                    onClick={logout}
                    className="text-left text-gray-700 hover:text-red-600"
                  >
                    Logout
                  </button>
                </>
              ) : (
                <>
                  <Link to="/login" className="text-gray-700 hover:text-blue-600">Login</Link>
                  <Link to="/register" className="text-blue-600 font-medium">Register</Link>
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </nav>
  );
};

// Header Component for Protected Pages  
const ProtectedHeader = ({ showSearch = false, onSearch, searchQuery, setSearchQuery }) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const { user, logout } = useAuth();

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    onSearch && onSearch(searchQuery);
  };

  return (
    <nav className="bg-white border-b border-gray-200 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex justify-between items-center h-16">
          <Link to="/" className="text-xl font-bold text-gray-900">
            📈 StockTracker
          </Link>

          <div className="hidden md:flex items-center space-x-8">
            <Link to="/dashboard" className="text-gray-700 hover:text-blue-600">Dashboard</Link>
            <Link to="/watchlist" className="text-gray-700 hover:text-blue-600">Watchlist</Link>
            <Link to="/notes" className="text-gray-700 hover:text-blue-600">Notes</Link>
            <Link to="/updates" className="text-gray-700 hover:text-blue-600">Updates</Link>
            <span className="text-gray-500">Welcome, {user?.name}</span>
            <button
              onClick={logout}
              className="text-gray-700 hover:text-red-600"
            >
              Logout
            </button>
          </div>

          {showSearch && (
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
          )}

          <button
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className="md:hidden p-2"
          >
            {isMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>

        {isMenuOpen && (
          <div className="md:hidden py-4">
            <div className="flex flex-col space-y-4">
              <Link to="/dashboard" className="text-gray-700 hover:text-blue-600">Dashboard</Link>
              <Link to="/watchlist" className="text-gray-700 hover:text-blue-600">Watchlist</Link>
              <Link to="/notes" className="text-gray-700 hover:text-blue-600">Notes</Link>
              <Link to="/updates" className="text-gray-700 hover:text-blue-600">Updates</Link>
              {showSearch && (
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
              )}
              <span className="text-gray-500">Welcome, {user?.name}</span>
              <button
                onClick={logout}
                className="text-left text-gray-700 hover:text-red-600"
              >
                Logout
              </button>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
};

// Animated Ticker Component
const MarketTicker = ({ stocks }) => {
  const [currentTime, setCurrentTime] = useState(new Date());
  
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="bg-black text-green-400 py-2 overflow-hidden border-t-2 border-green-400">
      <div className="whitespace-nowrap animate-scroll">
        <span className="inline-block px-8 text-sm font-mono">
          LIVE MARKET DATA • {currentTime.toLocaleTimeString()} • 
        </span>
        {stocks.slice(0, 10).map((stock, idx) => (
          <span key={idx} className="inline-block px-8 text-sm font-mono">
            {stock.ticker}: ₹{formatNumber(stock.latest_price)} 
            <span className={stock['1D_change_%'] > 0 ? 'text-green-400' : 'text-red-400'}>
              ({stock['1D_change_%'] > 0 ? '+' : ''}{stock['1D_change_%']?.toFixed(2)}%)
            </span> •
          </span>
        ))}
      </div>
    </div>
  );
};

// Terminal-style Command Component
const TerminalCommand = ({ command, output, delay = 0 }) => {
  const [show, setShow] = useState(false);
  
  useEffect(() => {
    const timer = setTimeout(() => setShow(true), delay);
    return () => clearTimeout(timer);
  }, [delay]);

  if (!show) return null;

  return (
    <div className="font-mono text-sm">
      <div className="text-green-400">
        <span className="text-gray-400">trader@stocktracker:~$ </span>
        <span className="animate-typing">{command}</span>
      </div>
      <div className="text-gray-300 mt-1 pl-4">{output}</div>
    </div>
  );
};

// New Unique Stock Market Homepage
const HomePage = () => {
  const [topMoversPreview, setTopMoversPreview] = useState({ gainers: [], losers: [] });
  const [marketOverview, setMarketOverview] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('GAINERS');
  const [terminalVisible, setTerminalVisible] = useState(false);

  useEffect(() => {
    const fetchPreviewData = async () => {
      try {
        const [moversResponse, overviewResponse] = await Promise.all([
          fetch(`${API_BASE_URL}/public/top-movers-preview?limit=8`),
          fetch(`${API_BASE_URL}/public/market-overview`)
        ]);
        
        const moversData = await moversResponse.json();
        const overviewData = await overviewResponse.json();
        
        if (moversData.success) {
          setTopMoversPreview(moversData);
        }
        
        if (overviewData.success) {
          setMarketOverview(overviewData);
        }
      } catch (error) {
        console.error('Error fetching preview data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchPreviewData();
    
    // Show terminal after a delay
    const timer = setTimeout(() => setTerminalVisible(true), 1000);
    return () => clearTimeout(timer);
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-black text-green-400 flex items-center justify-center font-mono">
        <div className="text-center">
          <div className="animate-spin text-4xl mb-4">⟳</div>
          <div className="animate-pulse">LOADING MARKET DATA...</div>
        </div>
      </div>
    );
  }

  const allStocks = [...topMoversPreview.gainers, ...topMoversPreview.losers];

  return (
    <div className="min-h-screen bg-black text-gray-100">
      <PublicHeader />
      
      {/* Live Market Ticker */}
      <MarketTicker stocks={allStocks} />
      
      {/* Main Dashboard-style Layout */}
      <div className="max-w-7xl mx-auto p-4">
        
        {/* Terminal Header */}
        <div className="bg-gray-900 border border-green-400 rounded-t-lg mt-8">
          <div className="bg-gray-800 px-4 py-2 rounded-t-lg flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 bg-red-500 rounded-full"></div>
              <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
              <div className="w-3 h-3 bg-green-500 rounded-full"></div>
            </div>
            <span className="text-gray-400 font-mono text-sm">StockTracker Terminal v2.1.0</span>
          </div>
          
          <div className="p-6 bg-black border-t border-green-400">
            {terminalVisible && (
              <div className="space-y-4">
                <TerminalCommand 
                  command="./stocktracker --init"
                  output="Initializing stock market analysis platform..."
                  delay={0}
                />
                <TerminalCommand 
                  command="fetch --market-overview"
                  output={marketOverview ? `✓ Loaded ${marketOverview.stats.total_stocks} stocks across ${marketOverview.stats.sectors_count} sectors` : ""}
                  delay={800}
                />
                <TerminalCommand 
                  command="analyze --top-movers --today"
                  output={`✓ Found ${topMoversPreview.gainers.length} gainers, ${topMoversPreview.losers.length} losers`}
                  delay={1600}
                />
                <div className="border-t border-gray-700 pt-4 mt-4">
                  <div className="text-green-400 font-mono">
                    <span className="text-gray-400">trader@stocktracker:~$ </span>
                    <span className="animate-pulse">Ready for advanced analysis</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Live Dashboard Grid */}
        <div className="bg-gray-900 border-x border-b border-green-400 rounded-b-lg">
          
          {/* Market Status Bar */}
          <div className="bg-gray-800 px-6 py-3 border-b border-gray-700">
            <div className="flex flex-wrap items-center justify-between text-sm">
              <div className="flex items-center space-x-6">
                <div className="flex items-center">
                  <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse mr-2"></div>
                  <span className="text-green-400 font-mono">MARKETS OPEN</span>
                </div>
                <div className="text-gray-400">
                  NSE: <span className="text-white">ACTIVE</span>
                </div>
                <div className="text-gray-400">
                  BSE: <span className="text-white">ACTIVE</span>
                </div>
              </div>
              <div className="text-gray-400 font-mono">
                {new Date().toLocaleString('en-IN', { 
                  timeZone: 'Asia/Kolkata',
                  hour12: false 
                })} IST
              </div>
            </div>
          </div>

          {/* Main Content Grid */}
          <div className="p-6">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              
              {/* Left Panel - Market Overview */}
              <div className="lg:col-span-4">
                <div className="bg-gray-800 border border-gray-600 rounded-lg p-4">
                  <h3 className="text-green-400 font-mono text-lg mb-4">MARKET_OVERVIEW.json</h3>
                  
                  {marketOverview && (
                    <div className="space-y-3 font-mono text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-400">"total_stocks":</span>
                        <span className="text-white">{marketOverview.stats.total_stocks}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-400">"gainers":</span>
                        <span className="text-green-400">{marketOverview.stats.gainers_count}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-400">"losers":</span>
                        <span className="text-red-400">{marketOverview.stats.losers_count}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-400">"neutral":</span>
                        <span className="text-yellow-400">{marketOverview.stats.neutral_count}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-400">"sectors":</span>
                        <span className="text-blue-400">{marketOverview.stats.sectors_count}</span>
                      </div>
                    </div>
                  )}
                  
                  <div className="mt-6 pt-4 border-t border-gray-600">
                    <div className="flex space-x-2">
                      <Link
                        to="/register"
                        className="bg-green-600 hover:bg-green-700 text-black px-4 py-2 rounded font-mono text-sm transition-colors"
                      >
                        ACCESS_FULL_DATA()
                      </Link>
                    </div>
                  </div>
                </div>
              </div>

              {/* Center Panel - Live Data */}
              <div className="lg:col-span-8">
                <div className="bg-gray-800 border border-gray-600 rounded-lg">
                  
                  {/* Tab Headers */}
                  <div className="bg-gray-700 flex">
                    <button
                      onClick={() => setActiveTab('GAINERS')}
                      className={`px-4 py-2 font-mono text-sm border-r border-gray-600 transition-colors ${
                        activeTab === 'GAINERS' 
                          ? 'bg-green-900 text-green-400 border-b-2 border-green-400' 
                          : 'text-gray-400 hover:text-white'
                      }`}
                    >
                      TOP_GAINERS.csv
                    </button>
                    <button
                      onClick={() => setActiveTab('LOSERS')}
                      className={`px-4 py-2 font-mono text-sm border-r border-gray-600 transition-colors ${
                        activeTab === 'LOSERS' 
                          ? 'bg-red-900 text-red-400 border-b-2 border-red-400' 
                          : 'text-gray-400 hover:text-white'
                      }`}
                    >
                      TOP_LOSERS.csv
                    </button>
                  </div>

                  {/* Data Table */}
                  <div className="p-4">
                    <div className="overflow-x-auto">
                      <table className="w-full font-mono text-sm">
                        <thead>
                          <tr className="text-gray-400 border-b border-gray-600">
                            <th className="text-left py-2">SYMBOL</th>
                            <th className="text-left py-2">NAME</th>
                            <th className="text-right py-2">PRICE</th>
                            <th className="text-right py-2">CHANGE_%</th>
                            <th className="text-right py-2">VOLUME</th>
                          </tr>
                        </thead>
                        <tbody>
                          {(activeTab === 'GAINERS' ? topMoversPreview.gainers : topMoversPreview.losers)
                            .slice(0, 6)
                            .map((stock, idx) => (
                              <tr key={stock.ticker} className="border-b border-gray-700 hover:bg-gray-700 transition-colors">
                                <td className="py-2 text-white font-bold">{stock.ticker}</td>
                                <td className="py-2 text-gray-300 truncate max-w-xs">{stock.company_name}</td>
                                <td className="py-2 text-right text-white">₹{formatNumber(stock.latest_price)}</td>
                                <td className={`py-2 text-right font-bold ${
                                  stock['1D_change_%'] > 0 ? 'text-green-400' : 'text-red-400'
                                }`}>
                                  {stock['1D_change_%'] > 0 ? '+' : ''}{stock['1D_change_%']?.toFixed(2)}%
                                </td>
                                <td className="py-2 text-right text-gray-400">
                                  {formatNumber(Math.floor(Math.random() * 1000000))}
                                </td>
                              </tr>
                            ))}
                        </tbody>
                      </table>
                    </div>
                    
                    <div className="mt-4 text-center">
                      <Link
                        to="/register"
                        className="text-green-400 hover:text-green-300 font-mono text-sm underline"
                      >
                        → LOAD_MORE_DATA() // Requires Authentication
                      </Link>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Bottom Action Bar */}
            <div className="mt-8 bg-gray-800 border border-gray-600 rounded-lg p-4">
              <div className="flex flex-col md:flex-row items-center justify-between">
                <div className="text-gray-400 font-mono text-sm mb-4 md:mb-0">
                  <span className="text-green-400">READY:</span> Advanced analysis tools available for registered users
                </div>
                
                <div className="flex space-x-4">
                  <Link
                    to="/login"
                    className="bg-gray-700 hover:bg-gray-600 text-gray-300 px-4 py-2 rounded font-mono text-sm border border-gray-500 transition-colors"
                  >
                    LOGIN
                  </Link>
                  <Link
                    to="/register"
                    className="bg-green-600 hover:bg-green-700 text-black px-6 py-2 rounded font-mono text-sm font-bold transition-colors"
                  >
                    START_ANALYSIS()
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Command Help */}
        <div className="mt-8 bg-gray-900 border border-gray-600 rounded-lg p-6">
          <h3 className="text-blue-400 font-mono text-lg mb-4">AVAILABLE_COMMANDS:</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 font-mono text-sm">
            <div className="text-gray-400">
              <span className="text-green-400">./analyze</span> --filters --sectors --cap
            </div>
            <div className="text-gray-400">
              <span className="text-green-400">./watchlist</span> --add --remove --monitor
            </div>
            <div className="text-gray-400">
              <span className="text-green-400">./alerts</span> --price --volume --news
            </div>
            <div className="text-gray-400">
              <span className="text-green-400">./portfolio</span> --track --optimize
            </div>
            <div className="text-gray-400">
              <span className="text-green-400">./research</span> --company --financials
            </div>
            <div className="text-gray-400">
              <span className="text-green-400">./export</span> --csv --json --pdf
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// Login Page
const LoginPage = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    const result = await login(email, password);
    
    if (result.success) {
      navigate('/dashboard');
    } else {
      setError(result.error);
    }
    
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <PublicHeader />
      
      <div className="flex items-center justify-center py-12 px-4">
        <div className="max-w-md w-full bg-white rounded-lg shadow-sm border border-gray-200 p-8">
          <h2 className="text-2xl font-bold text-center mb-8">Sign In</h2>
          
          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded text-red-800 text-sm">
              {error}
            </div>
          )}
          
          <form onSubmit={handleSubmit}>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Email Address
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Enter your email"
              />
            </div>
            
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Password
              </label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Enter your password"
              />
            </div>
            
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center justify-center"
            >
              {loading && <RefreshCw className="h-4 w-4 animate-spin mr-2" />}
              Sign In
            </button>
          </form>
          
          <div className="mt-6 text-center">
            <p className="text-gray-600">
              Don't have an account?{' '}
              <Link to="/register" className="text-blue-600 hover:text-blue-800 font-medium">
                Sign up here
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

// Register Page
const RegisterPage = () => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { register } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    const result = await register(name, email, password);
    
    if (result.success) {
      navigate('/dashboard');
    } else {
      setError(result.error);
    }
    
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <PublicHeader />
      
      <div className="flex items-center justify-center py-12 px-4">
        <div className="max-w-md w-full bg-white rounded-lg shadow-sm border border-gray-200 p-8">
          <h2 className="text-2xl font-bold text-center mb-8">Create Account</h2>
          
          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded text-red-800 text-sm">
              {error}
            </div>
          )}
          
          <form onSubmit={handleSubmit}>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Full Name
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Enter your full name"
              />
            </div>
            
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Email Address
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Enter your email"
              />
            </div>
            
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Password
              </label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Create a password"
                minLength={6}
              />
            </div>
            
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center justify-center"
            >
              {loading && <RefreshCw className="h-4 w-4 animate-spin mr-2" />}
              Create Account
            </button>
          </form>
          
          <div className="mt-6 text-center">
            <p className="text-gray-600">
              Already have an account?{' '}
              <Link to="/login" className="text-blue-600 hover:text-blue-800 font-medium">
                Sign in here
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

// Protected API call helper
const protectedFetch = (url, options = {}) => {
  const token = localStorage.getItem('token');
  return fetch(url, {
    ...options,
    headers: {
      ...options.headers,
      'Authorization': `Bearer ${token}`
    }
  });
};

// Filter Bar Component for dashboard cards (same as before but using protected API)
const FilterBar = ({ 
  showAnalysisFilters = false, 
  selectedSector, 
  setSelectedSector, 
  sectors, 
  marketCapRange, 
  setMarketCapRange,
  dateRange,
  setDateRange,
  dataAvailability,
  changePeriods,
  setChangePeriods,
  sortBy,
  setSortBy,
  sortOrder,
  setSortOrder,
  onRefresh,
  loading
}) => {
  const sortOptions = [ 
    { value: 'market_cap', label: 'Market Cap' }, 
    { value: 'company_name', label: 'Company Name' }, 
    { value: 'sector', label: 'Sector' }, 
    { value: 'latest_price', label: 'Latest Price' }, 
    ...(changePeriods ? changePeriods.map(p => ({ value: `${p}D_change_%`, label: `${p}D Change %` })) : [])
  ];

  if (!showAnalysisFilters) {
    return (
      <div className="bg-white border border-gray-200 rounded-lg p-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1 text-gray-700">Market Cap</label>
            <select className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500">
              <option>All</option>
              <option>Large Cap</option>
              <option>Mid Cap</option>
              <option>Small Cap</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1 text-gray-700">Sector</label>
            <select 
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={selectedSector}
              onChange={(e) => setSelectedSector && setSelectedSector(e.target.value)}
            >
              <option value="">All Sectors</option>
              {sectors && sectors.map(sector => (
                <option key={sector} value={sector}>{sector}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1 text-gray-700">Period</label>
            <select className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500">
              <option>Today</option>
              <option>1 Week</option>
              <option>1 Month</option>
              <option>3 Months</option>
            </select>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-4 space-y-4">
      <h3 className="font-semibold text-lg text-gray-900">Analysis Filters</h3>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <div>
          <label className="block text-sm font-medium mb-1 text-gray-700">Date Range</label>
          <div className="flex gap-2">
            <input 
              type="date" 
              className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500" 
              value={dateRange?.start} 
              min={dataAvailability?.start_date} 
              max={dataAvailability?.end_date} 
              onChange={(e) => setDateRange && setDateRange({ ...dateRange, start: e.target.value })}
            />
            <input 
              type="date" 
              className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500" 
              value={dateRange?.end} 
              min={dataAvailability?.start_date} 
              max={dataAvailability?.end_date} 
              onChange={(e) => setDateRange && setDateRange({ ...dateRange, end: e.target.value })}
            />
          </div>
        </div>
        
        <div>
          <label className="block text-sm font-medium mb-1 text-gray-700">Market Cap (Crores)</label>
          <div className="flex gap-2">
            <input 
              type="number" 
              placeholder="Min" 
              className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500" 
              value={marketCapRange?.min} 
              onChange={(e) => setMarketCapRange && setMarketCapRange({ ...marketCapRange, min: e.target.value })}
            />
            <input 
              type="number" 
              placeholder="Max" 
              className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500" 
              value={marketCapRange?.max} 
              onChange={(e) => setMarketCapRange && setMarketCapRange({ ...marketCapRange, max: e.target.value })}
            />
          </div>
        </div>
        
        <div>
          <label className="block text-sm font-medium mb-1 text-gray-700">Sector</label>
          <select 
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500" 
            value={selectedSector} 
            onChange={(e) => setSelectedSector(e.target.value)}
          >
            <option value="">All Sectors</option>
            {sectors && sectors.map(sector => (
              <option key={sector} value={sector}>{sector}</option>
            ))}
          </select>
        </div>
        
        <div>
          <label className="block text-sm font-medium mb-1 text-gray-700">Sort By</label>
          <select 
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500" 
            value={sortBy} 
            onChange={(e) => setSortBy(e.target.value)}
          >
            {sortOptions.map(opt => 
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            )}
          </select>
        </div>
        
        <div>
          <label className="block text-sm font-medium mb-1 text-gray-700">Order</label>
          <select 
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500" 
            value={sortOrder} 
            onChange={(e) => setSortOrder(e.target.value)}
          >
            <option value="desc">Descending</option>
            <option value="asc">Ascending</option>
          </select>
        </div>
        
        <div className="flex items-end">
          <button 
            onClick={onRefresh} 
            disabled={loading} 
            className="px-4 py-2 w-full bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {loading && <RefreshCw className="h-4 w-4 animate-spin" />} 
            Refresh
          </button>
        </div>
      </div>
      
      <div>
        <label className="block text-sm font-medium mb-2 text-gray-700">Price Change Periods (Days)</label>
        <div className="flex flex-wrap gap-x-4 gap-y-2">
          {[1, 5, 10, 15, 20, 30].map(period => (
            <label key={period} className="flex items-center cursor-pointer">
              <input 
                type="checkbox" 
                className="mr-1 h-4 w-4" 
                checked={changePeriods && changePeriods.includes(period)} 
                onChange={(e) => { 
                  if (!changePeriods || !setChangePeriods) return;
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
  );
};

// Dashboard Card Component (same as before)
const DashboardCard = ({ 
  title, 
  icon, 
  children, 
  currentPage = 1, 
  totalPages = 1, 
  itemsPerPage = 10, 
  totalItems = 0, 
  onPageChange, 
  onItemsPerPageChange 
}) => {
  return (
    <div className="bg-white border border-gray-200 rounded-lg shadow-sm">
      {/* Card Header */}
      <div className="flex flex-row items-center justify-between p-6 border-b border-gray-200">
        <div className="flex items-center space-x-2">
          {icon}
          <h3 className="text-xl font-semibold text-gray-900">{title}</h3>
        </div>
        
        {/* Items per page selector */}
        <div className="flex items-center space-x-2">
          <span className="text-sm text-gray-500 hidden sm:inline">Show:</span>
          <select 
            value={itemsPerPage} 
            onChange={(e) => onItemsPerPageChange && onItemsPerPageChange(Number(e.target.value))}
            className="px-2 py-1 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value={10}>10</option>
            <option value={20}>20</option>
            <option value={50}>50</option>
          </select>
        </div>
      </div>
      
      {/* Card Content with Fixed Height and Scrolling */}
      <div className="p-6">
        <div className="min-h-[500px] max-h-[600px] overflow-y-auto">
          {children}
        </div>
        
        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between border-t pt-4 mt-4">
            <div className="text-sm text-gray-500">
              Showing {((currentPage - 1) * itemsPerPage) + 1} to{" "}
              {Math.min(currentPage * itemsPerPage, totalItems)} of {totalItems} results
            </div>
            
            <div className="flex items-center space-x-2">
              <button
                onClick={() => onPageChange && onPageChange(currentPage - 1)}
                disabled={currentPage <= 1}
                className="px-3 py-1 text-sm border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50 flex items-center"
              >
                <ChevronLeft className="h-4 w-4" />
                <span className="hidden sm:inline ml-1">Previous</span>
              </button>
              
              <div className="flex items-center space-x-1">
                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                  const pageNum = Math.max(1, Math.min(totalPages - 4, currentPage - 2)) + i;
                  return (
                    <button
                      key={pageNum}
                      onClick={() => onPageChange && onPageChange(pageNum)}
                      className={`w-8 h-8 text-sm rounded ${
                        pageNum === currentPage 
                          ? 'bg-blue-600 text-white' 
                          : 'border border-gray-300 hover:bg-gray-50'
                      }`}
                    >
                      {pageNum}
                    </button>
                  );
                })}
              </div>
              
              <button
                onClick={() => onPageChange && onPageChange(currentPage + 1)}
                disabled={currentPage >= totalPages}
                className="px-3 py-1 text-sm border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50 flex items-center"
              >
                <span className="hidden sm:inline mr-1">Next</span>
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

// Stock Card Component (same as before)
const StockCard = ({ stock, type = 'default', onStockClick }) => {
  const getChangeColor = (change) => {
    if (change > 0) return 'text-green-600';
    if (change < 0) return 'text-red-600';
    return 'text-gray-600';
  };

  return (
    <div 
      className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer transition-colors"
      onClick={() => onStockClick && onStockClick(stock.ticker)}
    >
      <div className="flex justify-between items-center">
        <div className="flex-1 min-w-0">
          <div className="flex items-center space-x-2">
            <p className="font-semibold text-gray-900">{stock.ticker}</p>
            <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">
              {stock.sector}
            </span>
          </div>
          <p className="text-sm text-gray-600 truncate mt-1" title={stock.company_name}>
            {stock.company_name}
          </p>
          <p className="text-xs text-gray-500 mt-1">
            ₹{formatNumber(stock.market_cap / 100)} Cr
          </p>
        </div>
        
        <div className="text-right ml-4">
          <p className="font-semibold text-gray-900">₹{formatNumber(stock.latest_price)}</p>
          <p className={`text-sm font-semibold ${getChangeColor(stock['1D_change_%'])}`}>
            {formatPercentage(stock['1D_change_%'])}
          </p>
        </div>
      </div>
    </div>
  );
};

// Protected Dashboard Component (moved from previous main dashboard)
const Dashboard = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [stockData, setStockData] = useState([]);
  const [topMovers, setTopMovers] = useState({ gainers: [], losers: [] });
  const [sectors, setSectors] = useState([]);
  const [dataAvailability, setDataAvailability] = useState(null);
  const [dataQuality, setDataQuality] = useState(null);
  
  // Filter states
  const [selectedSector, setSelectedSector] = useState('');
  const [marketCapRange, setMarketCapRange] = useState({ min: '', max: '' });
  const [changePeriods, setChangePeriods] = useState([1, 5, 10, 15, 20, 30]);
  const [dateRange, setDateRange] = useState({ start: '', end: '' });
  const [sortBy, setSortBy] = useState('market_cap');
  const [sortOrder, setSortOrder] = useState('desc');

  // Pagination states for each card
  const [gainersPage, setGainersPage] = useState(1);
  const [losersPage, setLosersPage] = useState(1);
  const [analysisPage, setAnalysisPage] = useState(1);
  const [gainersPerPage, setGainersPerPage] = useState(10);
  const [losersPerPage, setLosersPerPage] = useState(10);
  const [analysisPerPage, setAnalysisPerPage] = useState(20);

  const handleStockClick = (ticker) => {
    navigate(`/stock/${ticker}`);
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
      const response = await protectedFetch(`${API_BASE_URL}/stocks/analysis`, { 
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
      const response = await protectedFetch(`${API_BASE_URL}/stocks/sectors`);
      const data = await response.json();
      if (data.success) setSectors(data.sectors);
    } catch (err) { 
      console.error('Error fetching sectors:', err); 
    }
  };

  const fetchTopMovers = async (period = 1) => {
    try {
      const response = await protectedFetch(`${API_BASE_URL}/stocks/top-movers?period=${period}&limit=20`);
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
      const availabilityResponse = await protectedFetch(`${API_BASE_URL}/data/availability`);
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

  if (loading && !dataAvailability) {
    return (
      <div className="min-h-screen bg-gray-50">
        <ProtectedHeader showSearch={false} />
        <div className="flex items-center justify-center h-64">
          <RefreshCw className="h-8 w-8 animate-spin text-blue-600" />
          <span className="ml-2 text-gray-600">Loading dashboard...</span>
        </div>
      </div>
    );
  }

  // Calculate pagination for each card
  const gainersTotal = Math.ceil(topMovers.gainers.length / gainersPerPage);
  const losersTotal = Math.ceil(topMovers.losers.length / losersPerPage);
  const analysisTotal = Math.ceil(stockData.length / analysisPerPage);

  const displayedGainers = topMovers.gainers.slice((gainersPage - 1) * gainersPerPage, gainersPage * gainersPerPage);
  const displayedLosers = topMovers.losers.slice((losersPage - 1) * losersPerPage, losersPage * losersPerPage);
  const displayedAnalysis = stockData.slice((analysisPage - 1) * analysisPerPage, analysisPage * analysisPerPage);

  return (
    <div className="min-h-screen bg-gray-50">
      <ProtectedHeader showSearch={false} />
      
      <div className="max-w-7xl mx-auto p-4">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-2">Stock Market Analysis Dashboard</h1>
          <p className="text-gray-600">Analysis based on pre-loaded NSE/BSE stock data</p>
        </div>

        {/* Data Availability Info */}
        {dataAvailability && (
          <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
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
            </div>
          </div>
        )}

        <div className="space-y-6">
          {/* Cards 1 & 2 side by side */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Top Gainers Card */}
            <div className="space-y-4">
              <FilterBar 
                selectedSector={selectedSector}
                setSelectedSector={setSelectedSector}
                sectors={sectors}
              />
              
              <DashboardCard
                title="Top Gainers"
                icon={<TrendingUp className="h-5 w-5 text-green-600" />}
                currentPage={gainersPage}
                totalPages={gainersTotal}
                itemsPerPage={gainersPerPage}
                totalItems={topMovers.gainers.length}
                onPageChange={setGainersPage}
                onItemsPerPageChange={setGainersPerPage}
              >
                <div className="space-y-3">
                  {displayedGainers.map((stock) => (
                    <StockCard 
                      key={stock.ticker} 
                      stock={stock} 
                      type="gainer" 
                      onStockClick={handleStockClick}
                    />
                  ))}
                  {displayedGainers.length === 0 && (
                    <p className="text-gray-500 text-center py-8">No gainers data available</p>
                  )}
                </div>
              </DashboardCard>
            </div>

            {/* Top Losers Card */}
            <div className="space-y-4">
              <FilterBar 
                selectedSector={selectedSector}
                setSelectedSector={setSelectedSector}
                sectors={sectors}
              />
              
              <DashboardCard
                title="Top Losers"
                icon={<TrendingDown className="h-5 w-5 text-red-600" />}
                currentPage={losersPage}
                totalPages={losersTotal}
                itemsPerPage={losersPerPage}
                totalItems={topMovers.losers.length}
                onPageChange={setLosersPage}
                onItemsPerPageChange={setLosersPerPage}
              >
                <div className="space-y-3">
                  {displayedLosers.map((stock) => (
                    <StockCard 
                      key={stock.ticker} 
                      stock={stock} 
                      type="loser" 
                      onStockClick={handleStockClick}
                    />
                  ))}
                  {displayedLosers.length === 0 && (
                    <p className="text-gray-500 text-center py-8">No losers data available</p>
                  )}
                </div>
              </DashboardCard>
            </div>
          </div>

          {/* Card 3 - Analysis Results */}
          <div className="space-y-4">
            <FilterBar 
              showAnalysisFilters={true}
              selectedSector={selectedSector}
              setSelectedSector={setSelectedSector}
              sectors={sectors}
              marketCapRange={marketCapRange}
              setMarketCapRange={setMarketCapRange}
              dateRange={dateRange}
              setDateRange={setDateRange}
              dataAvailability={dataAvailability}
              changePeriods={changePeriods}
              setChangePeriods={setChangePeriods}
              sortBy={sortBy}
              setSortBy={setSortBy}
              sortOrder={sortOrder}
              setSortOrder={setSortOrder}
              onRefresh={fetchStockAnalysis}
              loading={loading}
            />

            {/* Data Quality Summary */}
            {dataQuality && stockData.length > 0 && (
              <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
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

            <DashboardCard
              title={`Analysis Results (${stockData.length} stocks)`}
              icon={<BarChart3 className="h-5 w-5 text-blue-600" />}
              currentPage={analysisPage}
              totalPages={analysisTotal}
              itemsPerPage={analysisPerPage}
              totalItems={stockData.length}
              onPageChange={setAnalysisPage}
              onItemsPerPageChange={setAnalysisPerPage}
            >
              <div className="space-y-3">
                {displayedAnalysis.map((stock) => (
                  <StockCard 
                    key={stock.ticker} 
                    stock={stock} 
                    type="analysis" 
                    onStockClick={handleStockClick}
                  />
                ))}
                {displayedAnalysis.length === 0 && !loading && (
                  <p className="text-gray-500 text-center py-8">No analysis data available</p>
                )}
                {loading && (
                  <div className="text-center py-8">
                    <RefreshCw className="h-6 w-6 animate-spin text-blue-600 mx-auto" />
                    <p className="text-gray-500 mt-2">Loading analysis data...</p>
                  </div>
                )}
              </div>
            </DashboardCard>
          </div>
        </div>

        {error && (
          <div className="mt-4 p-4 bg-red-50 border border-red-200 text-red-800 rounded-lg">
            <p>{error}</p>
          </div>
        )}
      </div>
    </div>
  );
};

// Individual Stock Page Component with Search (Protected)
const StockDetail = () => {
  const { ticker } = useParams();
  const navigate = useNavigate();
  const [stockData, setStockData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');

  const handleSearch = async (query) => {
    if (query.trim()) {
      navigate(`/stock/${query.toUpperCase()}`);
    }
  };

  useEffect(() => {
    const fetchStockDetail = async () => {
      try {
        const response = await protectedFetch(`${API_BASE_URL}/stocks/${ticker}`);
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

  if (loading) return (
    <div className="min-h-screen bg-gray-50">
      <ProtectedHeader showSearch={true} onSearch={handleSearch} searchQuery={searchQuery} setSearchQuery={setSearchQuery} />
      <div className="flex items-center justify-center h-64">
        <RefreshCw className="h-8 w-8 animate-spin text-blue-600" />
        <span className="ml-2 text-gray-600">Loading...</span>
      </div>
    </div>
  );
  
  if (error) return (
    <div className="min-h-screen bg-gray-50">
      <ProtectedHeader showSearch={true} onSearch={handleSearch} searchQuery={searchQuery} setSearchQuery={setSearchQuery} />
      <div className="flex items-center justify-center h-64 text-red-600">{error}</div>
    </div>
  );
  
  if (!stockData) return null;

  return (
    <div className="min-h-screen bg-gray-50">
      <ProtectedHeader showSearch={true} onSearch={handleSearch} searchQuery={searchQuery} setSearchQuery={setSearchQuery} />
      
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
          
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
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
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
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

          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
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

          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
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
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
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
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
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

// Placeholder components for protected pages
const WatchlistPage = () => (
  <div className="min-h-screen bg-gray-50">
    <ProtectedHeader showSearch={false} />
    <div className="max-w-4xl mx-auto p-4">
      <h1 className="text-3xl font-bold mb-4">My Watchlists</h1>
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 text-center">
        <p className="text-gray-600">Watchlist feature coming soon...</p>
      </div>
    </div>
  </div>
);

const NotesPage = () => (
  <div className="min-h-screen bg-gray-50">
    <ProtectedHeader showSearch={false} />
    <div className="max-w-4xl mx-auto p-4">
      <h1 className="text-3xl font-bold mb-4">My Notes</h1>
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 text-center">
        <p className="text-gray-600">Notes feature coming soon...</p>
      </div>
    </div>
  </div>
);

const UpdatesPage = () => (
  <div className="min-h-screen bg-gray-50">
    <PublicHeader />
    <div className="max-w-4xl mx-auto p-4">
      <h1 className="text-3xl font-bold mb-4">Market Updates</h1>
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 text-center">
        <p className="text-gray-600">Updates feature coming soon...</p>
      </div>
    </div>
  </div>
);

// Main App Component
function App() {
  return (
    <AuthProvider>
      <Router>
        <div className="App">
          <Routes>
            {/* Public Routes */}
            <Route path="/" element={<HomePage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
            <Route path="/updates" element={<UpdatesPage />} />
            
            {/* Protected Routes */}
            <Route path="/dashboard" element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            } />
            <Route path="/stock/:ticker" element={
              <ProtectedRoute>
                <StockDetail />
              </ProtectedRoute>
            } />
            <Route path="/watchlist" element={
              <ProtectedRoute>
                <WatchlistPage />
              </ProtectedRoute>
            } />
            <Route path="/notes" element={
              <ProtectedRoute>
                <NotesPage />
              </ProtectedRoute>
            } />
          </Routes>
        </div>
      </Router>
    </AuthProvider>
  );
}

export default App;