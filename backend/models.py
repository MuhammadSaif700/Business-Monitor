from sqlalchemy import Column, Integer, String, Float, DateTime, Text, Boolean, ForeignKey
from sqlalchemy.orm import declarative_base, relationship
from datetime import datetime

Base = declarative_base()

class User(Base):
    __tablename__ = 'users'
    
    id = Column(Integer, primary_key=True, autoincrement=True)
    email = Column(String, unique=True, nullable=False)
    username = Column(String, unique=True, nullable=False)
    password_hash = Column(String, nullable=False)
    first_name = Column(String)
    last_name = Column(String)
    company = Column(String)
    role = Column(String, default='user')
    is_active = Column(Boolean, default=True)
    email_verified = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    last_login = Column(DateTime)
    preferences = Column(Text)  # JSON string for user preferences
    
    # Relationships
    activities = relationship("UserActivity", back_populates="user")
    feedback = relationship("UserFeedback", back_populates="user")

class UserActivity(Base):
    __tablename__ = 'user_activities'
    
    id = Column(Integer, primary_key=True, autoincrement=True)
    user_id = Column(Integer, ForeignKey('users.id'))
    activity_type = Column(String)  # login, upload, query, dashboard_create, etc.
    description = Column(Text)
    activity_metadata = Column(Text)  # JSON string for additional data
    timestamp = Column(DateTime, default=datetime.utcnow)
    
    user = relationship("User", back_populates="activities")

class UserFeedback(Base):
    __tablename__ = 'user_feedback'
    
    id = Column(Integer, primary_key=True, autoincrement=True)
    user_id = Column(Integer, ForeignKey('users.id'))
    feedback_type = Column(String)  # bug_report, feature_request, general
    title = Column(String)
    content = Column(Text)
    rating = Column(Integer)  # 1-5 stars
    status = Column(String, default='open')  # open, in_review, resolved
    created_at = Column(DateTime, default=datetime.utcnow)
    
    user = relationship("User", back_populates="feedback")

class Notification(Base):
    __tablename__ = 'notifications'
    
    id = Column(Integer, primary_key=True, autoincrement=True)
    user_id = Column(Integer, ForeignKey('users.id'))
    title = Column(String)
    message = Column(Text)
    notification_type = Column(String)  # info, success, warning, error
    read = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.utcnow)

class Transaction(Base):
    __tablename__ = 'transactions'
    
    id = Column(Integer, primary_key=True, autoincrement=True)
    user_id = Column(Integer, ForeignKey('users.id'), nullable=True)  # Link to user who uploaded
    date = Column(String)
    type = Column(String)
    product = Column(String)
    quantity = Column(Float)
    price = Column(Float)
    customer = Column(String)
    region = Column(String)
    fingerprint = Column(String, unique=True)