from fastapi import FastAPI, HTTPException, Depends, status
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from datetime import datetime, timedelta

from config import settings
from database import engine, get_db, Base
from models import User
from schemas import (
    UserRegister, UserLogin, Token, UserResponse, 
    DashboardResponse, DashboardStats
)
from auth import (
    verify_password, get_password_hash, 
    create_access_token, get_current_user
)



import joblib
import numpy as np
from pathlib import Path

# Create database tables
Base.metadata.create_all(bind=engine)

# Initialize FastAPI app
app = FastAPI(
    title="Authentication API",
    description="User authentication and dashboard API",
    version="1.0.0"
)

import mmm_analysis  # or just import mmm_analysis if in same directory

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# In your existing FastAPI app, add:
#app.include_router(mmm_analysis.router)

@app.on_event("startup")
async def startup_event():
    global mmm_model
    mmm_model = mmm_analysis.load_mmm_model()
    print("MMM model preloaded.")

# Root endpoint
@app.get("/")
def read_root():
    """Root endpoint - API health check."""
    return {
        "message": "Authentication API",
        "version": "1.0.0",
        "status": "running"
    }

# Health check
@app.get("/health")
def health_check():
    """Health check endpoint."""
    return {"status": "healthy"}

# Registration endpoint
@app.post("/api/auth/register", response_model=Token, status_code=status.HTTP_201_CREATED)
def register(user_data: UserRegister, db: Session = Depends(get_db)):
    """
    Register a new user.
    
    - **email**: User's email address (must be unique)
    - **username**: User's username (must be unique)
    - **password**: User's password (will be hashed)
    
    Returns a JWT access token upon successful registration.
    """
    # Check if user already exists
    existing_user = db.query(User).filter(
        (User.email == user_data.email) | (User.username == user_data.username)
    ).first()
    
    if existing_user:
        if existing_user.email == user_data.email:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Email already registered"
            )
        else:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Username already taken"
            )
    
    # Create new user
    hashed_password = get_password_hash(user_data.password)
    new_user = User(
        email=user_data.email,
        username=user_data.username,
        hashed_password=hashed_password
    )
    
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    
    # Create access token
    access_token_expires = timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": new_user.id}, 
        expires_delta=access_token_expires
    )
    
    return {"access_token": access_token, "token_type": "bearer"}

# Login endpoint
@app.post("/api/auth/login", response_model=Token)
def login(credentials: UserLogin, db: Session = Depends(get_db)):
    """
    Authenticate a user and return a JWT token.
    
    - **email**: User's email address
    - **password**: User's password
    
    Returns a JWT access token upon successful authentication.
    """
    # Find user by email
    user = db.query(User).filter(User.email == credentials.email).first()
    
    # Verify user exists and password is correct
    if not user or not verify_password(credentials.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    # Create access token
    access_token_expires = timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": user.id}, 
        expires_delta=access_token_expires
    )
    
    return {"access_token": access_token, "token_type": "bearer"}

# Get current user endpoint
@app.get("/api/auth/me", response_model=UserResponse)
def get_me(current_user: User = Depends(get_current_user)):
    """
    Get the current authenticated user's information.
    
    Requires a valid JWT token in the Authorization header.
    """
    return current_user

# Dashboard endpoint
@app.get("/api/dashboard", response_model=DashboardResponse)
def get_dashboard(current_user: User = Depends(get_current_user)):
    """
    Get dashboard data for the authenticated user.
    
    Requires a valid JWT token in the Authorization header.
    """
    # Calculate account age in days
    account_age = (datetime.utcnow() - current_user.created_at).days
    
    # Prepare dashboard data
    dashboard_data = {
        "message": f"Welcome to your dashboard, {current_user.username}!",
        "user": {
            "id": current_user.id,
            "email": current_user.email,
            "username": current_user.username,
            "created_at": current_user.created_at
        },
        "stats": {
            "last_login": datetime.utcnow(),
            "account_age_days": account_age
        }
    }
    
    return dashboard_data

# Add this endpoint after the dashboard endpoint
@app.get("/api/mmm-data")
def get_mmm_data(current_user: User = Depends(get_current_user)):
    """
    Get Marketing Mix Model data for the authenticated user.
    
    Requires a valid JWT token in the Authorization header.
    """
    try:
        # Load the pickle file using joblib
        pkl_path = Path(__file__).parent / "saved_mmm.pkl"
        
        model = joblib.load(pkl_path)
        
        # Extract data
        inference_data = model.inference_data
        posterior = inference_data.posterior
        
        # ROI by channel
        roi_m = posterior['roi_m'].mean(dim=['chain', 'draw']).values.tolist()
        
        # Media channel names
        media_channels = model.input_data.media_channel.values.tolist()
        
        # Total spend per channel
        total_spend = np.array(model.total_spend)
        spend_per_channel = total_spend.sum(axis=(0, 1)).tolist()
        
        # Effectiveness
        effectiveness = posterior['ec_m'].mean(dim=['chain', 'draw']).values.tolist()
        
        # Revenue generated per channel
        revenue_per_channel = (np.array(roi_m) * np.array(spend_per_channel)).tolist()
        
        # Total KPI
        kpi_total = float(np.array(model.kpi).sum())
        
        # Build response
        channels_data = []
        for i, channel in enumerate(media_channels):
            channels_data.append({
                "name": channel,
                "roi": round(roi_m[i], 2),
                "spend": round(spend_per_channel[i], 2),
                "revenue": round(revenue_per_channel[i], 2),
                "effectiveness": round(effectiveness[i], 4)
            })
        
        # Calculate totals
        total_spend_sum = sum(spend_per_channel)
        total_revenue_sum = sum(revenue_per_channel)
        overall_roi = total_revenue_sum / total_spend_sum if total_spend_sum > 0 else 0
        
        return {
            "success": True,
            "user": current_user.username,
            "summary": {
                "total_spend": round(total_spend_sum, 2),
                "total_revenue": round(total_revenue_sum, 2),
                "overall_roi": round(overall_roi, 2),
                "total_kpi": round(kpi_total, 2),
                "num_channels": len(media_channels),
                "num_geos": int(model.n_geos),
                "num_time_periods": int(model.n_times)
            },
            "channels": channels_data
        }
        
    except FileNotFoundError:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="MMM data file not found"
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error loading MMM data: {str(e)}"
        )

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000, reload=True)