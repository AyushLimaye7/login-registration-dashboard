from pydantic import BaseModel, EmailStr
from datetime import datetime

# Request schemas
class UserRegister(BaseModel):
    email: EmailStr
    username: str
    password: str

class UserLogin(BaseModel):
    email: EmailStr
    password: str

# Response schemas
class Token(BaseModel):
    access_token: str
    token_type: str

class UserResponse(BaseModel):
    id: int
    email: str
    username: str
    created_at: datetime
    
    class Config:
        from_attributes = True

class DashboardStats(BaseModel):
    total_logins: int
    last_login: datetime
    account_age_days: int

class DashboardResponse(BaseModel):
    message: str
    user: UserResponse
    stats: DashboardStats