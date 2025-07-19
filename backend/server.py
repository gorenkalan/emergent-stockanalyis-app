from fastapi import FastAPI, APIRouter, HTTPException, Query, Depends
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from dotenv import load_dotenv
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any
import uuid
from datetime import datetime, timedelta
import random
import jwt

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# Create the main app without a prefix
app = FastAPI()

# Create a router with the /api prefix
api_router = APIRouter(prefix="/api")

# JWT settings
JWT_SECRET = "your-secret-key-here"  # In production, use environment variable
JWT_ALGORITHM = "HS256"

# Auth setup
security = HTTPBearer(auto_error=False)

# Auth Models
class LoginRequest(BaseModel):
    email: str
    password: str

class RegisterRequest(BaseModel):
    name: str
    email: str
    password: str

class User(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str
    email: str
    created_at: datetime = Field(default_factory=datetime.utcnow)
    subscription_plan: str = "basic"

# Stock Models
class StockAnalysisRequest(BaseModel):
    start_date: Optional[str] = None
    end_date: Optional[str] = None
    change_periods: List[int] = [1, 5, 10, 15, 20, 30]
    sort_by: str = 'market_cap'
    sort_order: str = 'desc'
    market_cap_min: Optional[float] = None
    market_cap_max: Optional[float] = None
    sector: Optional[str] = None

class DataAvailability(BaseModel):
    success: bool
    start_date: str
    end_date: str
    total_days: int
    last_updated: str

# Sample stock data initialization
sample_stocks_data = [
    {"ticker": "RELIANCE", "company_name": "Reliance Industries Ltd", "market_cap": 1654238.45, "sector": "Oil & Gas", "latest_price": 2456.80},
    {"ticker": "TCS", "company_name": "Tata Consultancy Services", "market_cap": 1298756.23, "sector": "IT Services", "latest_price": 3542.15},
    {"ticker": "HDFCBANK", "company_name": "HDFC Bank Limited", "market_cap": 1187435.67, "sector": "Banking", "latest_price": 1587.90},
    {"ticker": "BHARTIARTL", "company_name": "Bharti Airtel Limited", "market_cap": 698234.12, "sector": "Telecommunications", "latest_price": 1254.75},
    {"ticker": "ICICIBANK", "company_name": "ICICI Bank Limited", "market_cap": 856789.34, "sector": "Banking", "latest_price": 1234.56},
    {"ticker": "INFY", "company_name": "Infosys Limited", "market_cap": 754321.89, "sector": "IT Services", "latest_price": 1789.45},
    {"ticker": "ITC", "company_name": "ITC Limited", "market_cap": 567892.12, "sector": "Consumer Goods", "latest_price": 456.78},
    {"ticker": "HINDUNILVR", "company_name": "Hindustan Unilever Limited", "market_cap": 589234.56, "sector": "Consumer Goods", "latest_price": 2487.63},
    {"ticker": "LT", "company_name": "Larsen & Toubro Limited", "market_cap": 234567.89, "sector": "Engineering", "latest_price": 1678.90},
    {"ticker": "SBIN", "company_name": "State Bank of India", "market_cap": 456789.23, "sector": "Banking", "latest_price": 512.34},
    {"ticker": "AXISBANK", "company_name": "Axis Bank Limited", "market_cap": 345678.91, "sector": "Banking", "latest_price": 1143.27},
    {"ticker": "WIPRO", "company_name": "Wipro Limited", "market_cap": 289456.78, "sector": "IT Services", "latest_price": 456.89},
    {"ticker": "ASIANPAINT", "company_name": "Asian Paints Limited", "market_cap": 298765.43, "sector": "Consumer Goods", "latest_price": 3123.45},
    {"ticker": "MARUTI", "company_name": "Maruti Suzuki India Limited", "market_cap": 267894.56, "sector": "Automobile", "latest_price": 8756.23},
    {"ticker": "SUNPHARMA", "company_name": "Sun Pharmaceutical Industries", "market_cap": 198765.43, "sector": "Pharmaceuticals", "latest_price": 834.56},
    {"ticker": "BAJFINANCE", "company_name": "Bajaj Finance Limited", "market_cap": 423567.89, "sector": "Financial Services", "latest_price": 6894.35},
    {"ticker": "M&M", "company_name": "Mahindra & Mahindra Limited", "market_cap": 156789.12, "sector": "Automobile", "latest_price": 1267.89},
    {"ticker": "TECHM", "company_name": "Tech Mahindra Limited", "market_cap": 134567.89, "sector": "IT Services", "latest_price": 1398.76},
    {"ticker": "NTPC", "company_name": "NTPC Limited", "market_cap": 234567.12, "sector": "Power", "latest_price": 241.56},
    {"ticker": "POWERGRID", "company_name": "Power Grid Corporation", "market_cap": 189234.56, "sector": "Power", "latest_price": 213.45},
]

# Simple user storage (in production, use proper database)
users_db = {}

def create_jwt_token(user_email: str):
    payload = {
        "email": user_email,
        "exp": datetime.utcnow() + timedelta(days=7)
    }
    return jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGORITHM)

def verify_jwt_token(token: str):
    try:
        payload = jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
        return payload.get("email")
    except jwt.ExpiredSignatureError:
        return None
    except jwt.InvalidTokenError:
        return None

def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)):
    if not credentials:
        return None
    
    email = verify_jwt_token(credentials.credentials)
    if email and email in users_db:
        return users_db[email]
    return None

def generate_price_changes():
    """Generate random price changes for different periods"""
    changes = {}
    for period in [1, 5, 10, 15, 20, 30]:
        changes[f"{period}D_change_%"] = round(random.uniform(-15.0, 15.0), 2)
    return changes

def add_stock_analysis_data(stock):
    """Add analysis data to stock object"""
    price_changes = generate_price_changes()
    stock.update(price_changes)
    stock["latest_price_date"] = (datetime.now() - timedelta(days=random.randint(0, 2))).strftime("%Y-%m-%d")
    stock["data_completeness_%"] = round(random.uniform(75.0, 100.0), 1)
    stock["days_with_price"] = random.randint(25, 30)
    stock["total_days"] = 30
    return stock

# Auth endpoints
@api_router.post("/auth/register")
async def register_user(request: RegisterRequest):
    """Register a new user"""
    try:
        if request.email in users_db:
            raise HTTPException(status_code=400, detail="User already exists")
        
        user = User(
            name=request.name,
            email=request.email
        )
        
        users_db[request.email] = user.dict()
        users_db[request.email]["password"] = request.password  # In production, hash the password
        
        token = create_jwt_token(request.email)
        
        return {
            "success": True,
            "message": "User registered successfully",
            "token": token,
            "user": {
                "name": user.name,
                "email": user.email,
                "subscription_plan": user.subscription_plan
            }
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@api_router.post("/auth/login")
async def login_user(request: LoginRequest):
    """Login user"""
    try:
        if request.email not in users_db:
            raise HTTPException(status_code=401, detail="Invalid credentials")
        
        user_data = users_db[request.email]
        if user_data["password"] != request.password:  # In production, verify hashed password
            raise HTTPException(status_code=401, detail="Invalid credentials")
        
        token = create_jwt_token(request.email)
        
        return {
            "success": True,
            "message": "Login successful",
            "token": token,
            "user": {
                "name": user_data["name"],
                "email": user_data["email"],
                "subscription_plan": user_data.get("subscription_plan", "basic")
            }
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@api_router.get("/auth/me")
async def get_current_user_info(user = Depends(get_current_user)):
    """Get current user information"""
    if not user:
        raise HTTPException(status_code=401, detail="Not authenticated")
    
    return {
        "success": True,
        "user": {
            "name": user["name"],
            "email": user["email"],
            "subscription_plan": user.get("subscription_plan", "basic")
        }
    }

# Public endpoints for home page preview
@api_router.get("/public/top-movers-preview")
async def get_top_movers_preview(limit: int = Query(3, description="Number of stocks to return")):
    """Get top movers preview for homepage (limited data)"""
    try:
        # Add analysis data to stocks
        analyzed_stocks = [add_stock_analysis_data(stock.copy()) for stock in sample_stocks_data]
        
        # Get top 3 gainers and losers for preview
        gainers = [stock for stock in analyzed_stocks if stock.get("1D_change_%", 0) > 0]
        gainers.sort(key=lambda x: x.get("1D_change_%", 0), reverse=True)
        gainers = gainers[:limit]
        
        losers = [stock for stock in analyzed_stocks if stock.get("1D_change_%", 0) < 0]
        losers.sort(key=lambda x: x.get("1D_change_%", 0))
        losers = losers[:limit]
        
        return {
            "success": True,
            "gainers": gainers,
            "losers": losers
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@api_router.get("/public/market-overview")
async def get_market_overview():
    """Get market overview stats for homepage"""
    try:
        analyzed_stocks = [add_stock_analysis_data(stock.copy()) for stock in sample_stocks_data]
        
        total_stocks = len(analyzed_stocks)
        gainers_count = len([s for s in analyzed_stocks if s.get("1D_change_%", 0) > 0])
        losers_count = len([s for s in analyzed_stocks if s.get("1D_change_%", 0) < 0])
        
        sectors = list(set([stock["sector"] for stock in analyzed_stocks]))
        
        return {
            "success": True,
            "stats": {
                "total_stocks": total_stocks,
                "gainers_count": gainers_count,
                "losers_count": losers_count,
                "neutral_count": total_stocks - gainers_count - losers_count,
                "sectors_count": len(sectors),
                "avg_market_cap": sum([s["market_cap"] for s in analyzed_stocks]) / total_stocks
            },
            "sectors": sectors[:8]  # Show first 8 sectors
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# Protected endpoints (require authentication)
@api_router.get("/data/availability")
async def get_data_availability(user = Depends(get_current_user)):
    """Get data availability information (protected)"""
    if not user:
        raise HTTPException(status_code=401, detail="Authentication required")
    
    end_date = datetime.now()
    start_date = end_date - timedelta(days=365)
    
    return {
        "success": True,
        "start_date": start_date.strftime("%Y-%m-%d"),
        "end_date": end_date.strftime("%Y-%m-%d"),
        "total_days": 365,
        "last_updated": datetime.now().strftime("%Y-%m-%d")
    }

@api_router.get("/stocks/sectors")
async def get_sectors(user = Depends(get_current_user)):
    """Get all available sectors (protected)"""
    if not user:
        raise HTTPException(status_code=401, detail="Authentication required")
    
    sectors = list(set([stock["sector"] for stock in sample_stocks_data]))
    return {"success": True, "sectors": sorted(sectors)}

@api_router.get("/stocks/top-movers")
async def get_top_movers(
    period: int = Query(1, description="Period in days"), 
    limit: int = Query(10, description="Number of stocks to return"),
    user = Depends(get_current_user)
):
    """Get top gainers and losers (protected)"""
    if not user:
        raise HTTPException(status_code=401, detail="Authentication required")
    
    try:
        # Add analysis data to stocks
        analyzed_stocks = [add_stock_analysis_data(stock.copy()) for stock in sample_stocks_data]
        
        # Sort by the specified period change
        change_key = f"{period}D_change_%"
        
        # Get gainers (positive changes, sorted descending)
        gainers = [stock for stock in analyzed_stocks if stock.get(change_key, 0) > 0]
        gainers.sort(key=lambda x: x.get(change_key, 0), reverse=True)
        gainers = gainers[:limit]
        
        # Get losers (negative changes, sorted ascending - most negative first)
        losers = [stock for stock in analyzed_stocks if stock.get(change_key, 0) < 0]
        losers.sort(key=lambda x: x.get(change_key, 0))
        losers = losers[:limit]
        
        return {
            "success": True,
            "gainers": gainers,
            "losers": losers
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@api_router.post("/stocks/analysis")
async def get_stock_analysis(request: StockAnalysisRequest, user = Depends(get_current_user)):
    """Get stock analysis with filtering and sorting (protected)"""
    if not user:
        raise HTTPException(status_code=401, detail="Authentication required")
    
    try:
        # Add analysis data to stocks
        analyzed_stocks = [add_stock_analysis_data(stock.copy()) for stock in sample_stocks_data]
        
        # Apply filters
        filtered_stocks = analyzed_stocks
        
        if request.sector:
            filtered_stocks = [stock for stock in filtered_stocks if stock["sector"] == request.sector]
        
        if request.market_cap_min:
            filtered_stocks = [stock for stock in filtered_stocks if stock["market_cap"] >= request.market_cap_min]
        
        if request.market_cap_max:
            filtered_stocks = [stock for stock in filtered_stocks if stock["market_cap"] <= request.market_cap_max]
        
        # Apply sorting
        if request.sort_by in filtered_stocks[0] if filtered_stocks else False:
            reverse_sort = request.sort_order == 'desc'
            filtered_stocks.sort(key=lambda x: x.get(request.sort_by, 0), reverse=reverse_sort)
        
        # Calculate summary statistics
        total_stocks = len(filtered_stocks)
        stocks_with_full_data = len([s for s in filtered_stocks if s["data_completeness_%"] >= 95])
        stocks_with_partial_data = total_stocks - stocks_with_full_data
        avg_data_completeness = sum([s["data_completeness_%"] for s in filtered_stocks]) / total_stocks if total_stocks > 0 else 0
        
        summary = {
            "total_stocks": total_stocks,
            "stocks_with_full_data": stocks_with_full_data,
            "stocks_with_partial_data": stocks_with_partial_data,
            "avg_data_completeness": round(avg_data_completeness, 1)
        }
        
        return {
            "success": True,
            "data": filtered_stocks,
            "summary": summary
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@api_router.get("/stocks/{ticker}")
async def get_stock_details(ticker: str, user = Depends(get_current_user)):
    """Get detailed information for a specific stock (protected)"""
    if not user:
        raise HTTPException(status_code=401, detail="Authentication required")
    
    try:
        # Find stock in sample data
        stock_data = next((stock for stock in sample_stocks_data if stock["ticker"] == ticker), None)
        if not stock_data:
            raise HTTPException(status_code=404, detail="Stock not found")
        
        # Add analysis data
        detailed_stock = add_stock_analysis_data(stock_data.copy())
        
        # Add additional details for individual stock page
        detailed_stock.update({
            "description": f"{detailed_stock['company_name']} is a leading company in the {detailed_stock['sector']} sector.",
            "products": ["Product A", "Product B", "Product C"],
            "promoters": ["Promoter 1", "Promoter 2"],
            "promoter_share": round(random.uniform(40.0, 75.0), 2),
            "debt": round(random.uniform(1000.0, 50000.0), 2),
            "employees": random.randint(1000, 100000),
            "founded": random.randint(1950, 2000)
        })
        
        return {"success": True, "data": detailed_stock}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# Original routes
@api_router.get("/")
async def root():
    return {"message": "Stock Market Analysis API"}

# Include the router in the main app
app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()