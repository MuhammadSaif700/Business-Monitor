"""
Enhanced authentication service with user management, password hashing, and session handling.
"""
import os
import bcrypt
import jwt
from datetime import datetime, timedelta
from typing import Optional, Dict, Any
from sqlalchemy.orm import sessionmaker
from sqlalchemy import create_engine
from models import Base, User, UserActivity, Notification
import json

# Database setup
DATABASE_URL = f"sqlite:///{os.path.join(os.path.dirname(__file__), 'business.db')}"
engine = create_engine(DATABASE_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# JWT Settings
SECRET_KEY = os.getenv('JWT_SECRET_KEY', 'your-secret-key-change-in-production')
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = int(os.getenv('ACCESS_TOKEN_EXPIRE_MINUTES', '720'))  # 12 hours

class AuthService:
    @staticmethod
    def hash_password(password: str) -> str:
        """Hash a password using bcrypt"""
        return bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')
    
    @staticmethod
    def verify_password(password: str, hashed: str) -> bool:
        """Verify a password against its hash"""
        return bcrypt.checkpw(password.encode('utf-8'), hashed.encode('utf-8'))
    
    @staticmethod
    def create_access_token(data: Dict[str, Any]) -> str:
        """Create a JWT access token"""
        to_encode = data.copy()
        expire = datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
        to_encode.update({"exp": expire})
        return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    
    @staticmethod
    def verify_token(token: str) -> Optional[Dict[str, Any]]:
        """Verify and decode a JWT token"""
        try:
            payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
            return payload
        except jwt.PyJWTError:
            return None

class UserService:
    @staticmethod
    def create_user(email: str, username: str, password: str, **kwargs) -> User:
        """Create a new user"""
        db = SessionLocal()
        try:
            # Check if user exists
            existing_user = db.query(User).filter(
                (User.email == email) | (User.username == username)
            ).first()
            
            if existing_user:
                raise ValueError("User with this email or username already exists")
            
            hashed_password = AuthService.hash_password(password)
            user = User(
                email=email,
                username=username,
                password_hash=hashed_password,
                **kwargs
            )
            
            db.add(user)
            db.commit()
            db.refresh(user)
            
            # Log registration activity
            UserService.log_activity(user.id, "registration", "User account created")
            
            # Create welcome notification
            UserService.create_notification(
                user.id, 
                "Welcome to Business Monitor!", 
                "Your account has been created successfully. Start by uploading your first dataset.",
                "success"
            )
            
            return user
        finally:
            db.close()
    
    @staticmethod
    def authenticate_user(email_or_username: str, password: str) -> Optional[User]:
        """Authenticate a user and return user object if valid"""
        db = SessionLocal()
        try:
            user = db.query(User).filter(
                (User.email == email_or_username) | (User.username == email_or_username)
            ).first()
            
            if user and AuthService.verify_password(password, user.password_hash):
                # Update last login
                user.last_login = datetime.utcnow()
                db.commit()
                
                # Log login activity
                UserService.log_activity(user.id, "login", "User logged in")
                
                return user
            return None
        finally:
            db.close()
    
    @staticmethod
    def get_user_by_id(user_id: int) -> Optional[User]:
        """Get user by ID"""
        db = SessionLocal()
        try:
            return db.query(User).filter(User.id == user_id).first()
        finally:
            db.close()
    
    @staticmethod
    def update_user_preferences(user_id: int, preferences: Dict[str, Any]):
        """Update user preferences"""
        db = SessionLocal()
        try:
            user = db.query(User).filter(User.id == user_id).first()
            if user:
                user.preferences = json.dumps(preferences)
                db.commit()
        finally:
            db.close()
    
    @staticmethod
    def log_activity(user_id: int, activity_type: str, description: str, metadata: Dict[str, Any] = None):
        """Log user activity"""
        db = SessionLocal()
        try:
            activity = UserActivity(
                user_id=user_id,
                activity_type=activity_type,
                description=description,
                activity_metadata=json.dumps(metadata) if metadata else None
            )
            db.add(activity)
            db.commit()
        finally:
            db.close()
    
    @staticmethod
    def get_user_activities(user_id: int, limit: int = 50):
        """Get user activities"""
        db = SessionLocal()
        try:
            return db.query(UserActivity).filter(
                UserActivity.user_id == user_id
            ).order_by(UserActivity.timestamp.desc()).limit(limit).all()
        finally:
            db.close()
    
    @staticmethod
    def create_notification(user_id: int, title: str, message: str, notification_type: str = "info"):
        """Create a notification for a user"""
        db = SessionLocal()
        try:
            notification = Notification(
                user_id=user_id,
                title=title,
                message=message,
                notification_type=notification_type
            )
            db.add(notification)
            db.commit()
        finally:
            db.close()
    
    @staticmethod
    def get_user_notifications(user_id: int, unread_only: bool = False):
        """Get user notifications"""
        db = SessionLocal()
        try:
            query = db.query(Notification).filter(Notification.user_id == user_id)
            if unread_only:
                query = query.filter(Notification.read == False)
            return query.order_by(Notification.created_at.desc()).all()
        finally:
            db.close()
    
    @staticmethod
    def mark_notification_read(notification_id: int):
        """Mark a notification as read"""
        db = SessionLocal()
        try:
            notification = db.query(Notification).filter(Notification.id == notification_id).first()
            if notification:
                notification.read = True
                db.commit()
        finally:
            db.close()

def init_enhanced_db():
    """Initialize the enhanced database with all tables"""
    Base.metadata.create_all(bind=engine)