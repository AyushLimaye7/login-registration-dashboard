from pathlib import Path
import joblib
import numpy as np
from fastapi import APIRouter, Depends, HTTPException
from typing import Dict, List
from auth import get_current_user  # Adjust import based on your auth file location

router = APIRouter()
MMM_MODEL = None
def load_mmm_model():
    """Load the saved MMM model"""
    global MMM_MODEL

    if MMM_MODEL is not None:
        return MMM_MODEL  # ✅ use cached model

    try:
        pkl_path = Path(__file__).parent / "saved_mmm.pkl"
        MMM_MODEL = joblib.load(pkl_path)
        return MMM_MODEL
    except FileNotFoundError:
        raise HTTPException(status_code=404, detail="MMM model file not found")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error loading model: {str(e)}")

@router.get("/api/mmm/contributions")
async def get_contributions(current_user: dict = Depends(get_current_user)):
    if not MMM_MODEL:
        raise HTTPException(status_code=404, detail="MMM model not loaded")
    
    try:
        posterior = MMM_MODEL.inference_data.posterior
        channels = MMM_MODEL.media_channel.values.tolist()
        
        # Total spend per channel across geo and time
        spend_per_channel = MMM_MODEL.total_spend.sum(axis=(0, 1))  # shape = (num_channels,)

        # ROI per channel (mean across chains and draws)
        roi = posterior['roi_m'].mean(dim=['chain', 'draw']).values
        
        # Revenue contribution = ROI * spend
        revenue_per_channel = (roi * spend_per_channel).tolist()
        
        contributions_list = []
        for i, channel in enumerate(channels):
            contributions_list.append({
                "channel": channel,
                "spend": float(spend_per_channel[i]),
                "roi": float(roi[i]),
                "contribution": float(revenue_per_channel[i])
            })
        
        summary = {
            "total_spend": float(spend_per_channel.sum()),
            "total_revenue": float(np.sum(revenue_per_channel)),
            "overall_roi": float(np.sum(revenue_per_channel) / spend_per_channel.sum()),
            "num_channels": len(channels),
            "num_geos": int(MMM_MODEL.n_geos),
            "num_time_periods": int(MMM_MODEL.n_media_times)
        }
        
        return {"data": contributions_list, "summary": summary}
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error: {str(e)}")

@router.get("/api/mmm/response-curves")
async def get_response_curves(current_user: dict = Depends(get_current_user)):
    """Get response curves for each channel"""
    model = load_mmm_model()
    
    try:
        posterior = model.inference_data.posterior
        channels = [f"Channel{i}" for i in range(model.n_media_channels)]
        
        response_curves = {}
        
        for i, channel in enumerate(channels):
            # Get Hill parameters
            ec_m = float(posterior['ec_m'][:, :, i].mean().values)
            slope_m = float(posterior['slope_m'][:, :, i].mean().values)
            
            # Generate spend levels
            max_spend = float(model.total_spend[:, :, i].max())
            spend_levels = np.linspace(0, max_spend, 50)
            
            # Calculate response curve
            curve_data = []
            prev_response = 0
            
            for spend in spend_levels:
                if spend == 0:
                    response = 0
                else:
                    response = spend**slope_m / (ec_m**slope_m + spend**slope_m)
                
                marginal = (response - prev_response) / (spend_levels[1] - spend_levels[0]) if spend > 0 else 0
                
                curve_data.append({
                    "spend": float(spend),
                    "response": float(response),
                    "marginal_response": float(marginal)
                })
                prev_response = response
            
            response_curves[channel] = curve_data
        
        return {"data": response_curves}
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error: {str(e)}")

@router.get("/api/mmm/time-series")
async def get_time_series(current_user: dict = Depends(get_current_user)):
    """Get time series contribution data"""
    model = load_mmm_model()
    
    try:
        posterior = model.inference_data.posterior
        contribution_m = posterior['contribution_m'].mean(dim=['chain', 'draw']).values
        
        # Sum across geos
        time_series_contrib = contribution_m.sum(axis=0)
        
        # Get time coordinates
        time_coords = model.input_data.media_time.values
        
        channels = [f"Channel{i}" for i in range(model.n_media_channels)]
        
        # Aggregate by month
        time_series_data = []
        for t in range(0, len(time_coords), 4):
            if t + 4 <= len(time_coords):
                period_data = {"date": str(time_coords[t])[:7]}
                
                for i, channel in enumerate(channels):
                    period_contrib = float(time_series_contrib[t:t+4, i].sum())
                    period_data[channel] = period_contrib
                
                time_series_data.append(period_data)
        
        return {"data": time_series_data}
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error: {str(e)}")