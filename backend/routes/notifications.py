from fastapi import APIRouter, HTTPException, Query
from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime
from backend.database.db import SessionLocal
from backend.models.notification import Notification

router = APIRouter()


class NotificationCreate(BaseModel):
    type: str
    title: str
    message: Optional[str] = None
    severity: Optional[str] = "LOW"
    related_id: Optional[int] = None


class NotificationResponse(BaseModel):
    id: int
    type: str
    title: str
    message: Optional[str]
    severity: str
    is_read: bool
    timestamp: datetime
    related_id: Optional[int]

    class Config:
        from_attributes = True


@router.post("/notifications", response_model=NotificationResponse)
def create_notification(notification: NotificationCreate):
    """Create a new notification."""
    db = SessionLocal()
    try:
        db_notification = Notification(
            type=notification.type,
            title=notification.title,
            message=notification.message,
            severity=notification.severity,
            related_id=notification.related_id,
        )
        db.add(db_notification)
        db.commit()
        db.refresh(db_notification)
        return db_notification
    finally:
        db.close()


@router.get("/notifications", response_model=List[NotificationResponse])
def get_notifications(
    limit: int = Query(4, ge=1, le=100),
    skip: int = Query(0, ge=0),
    type: Optional[str] = None,
    severity: Optional[str] = None,
    is_read: Optional[bool] = None,
):
    """Get notifications with optional filters."""
    db = SessionLocal()
    try:
        query = db.query(Notification)
        
        if type:
            query = query.filter(Notification.type == type)
        if severity:
            query = query.filter(Notification.severity == severity)
        if is_read is not None:
            query = query.filter(Notification.is_read == is_read)
        
        notifications = (
            query.order_by(Notification.timestamp.desc())
            .offset(skip)
            .limit(limit)
            .all()
        )
        return notifications
    finally:
        db.close()


@router.get("/notifications/count", response_model=dict)
def get_unread_count():
    """Get count of unread notifications."""
    db = SessionLocal()
    try:
        count = db.query(Notification).filter(Notification.is_read == False).count()
        return {"unread_count": count}
    finally:
        db.close()


@router.put("/notifications/{notification_id}/read", response_model=NotificationResponse)
def mark_as_read(notification_id: int):
    """Mark a single notification as read."""
    db = SessionLocal()
    try:
        notification = db.query(Notification).filter(Notification.id == notification_id).first()
        if not notification:
            raise HTTPException(status_code=404, detail="Notification not found")
        
        notification.is_read = True
        db.commit()
        db.refresh(notification)
        return notification
    finally:
        db.close()


@router.put("/notifications/read-all", response_model=dict)
def mark_all_as_read():
    """Mark all notifications as read."""
    db = SessionLocal()
    try:
        db.query(Notification).filter(Notification.is_read == False).update(
            {"is_read": True}
        )
        db.commit()
        return {"message": "All notifications marked as read"}
    finally:
        db.close()


@router.delete("/notifications/{notification_id}", response_model=dict)
def delete_notification(notification_id: int):
    """Delete a single notification."""
    db = SessionLocal()
    try:
        notification = db.query(Notification).filter(Notification.id == notification_id).first()
        if not notification:
            raise HTTPException(status_code=404, detail="Notification not found")
        
        db.delete(notification)
        db.commit()
        return {"message": "Notification deleted"}
    finally:
        db.close()


@router.delete("/notifications", response_model=dict)
def delete_all_notifications():
    """Delete all notifications."""
    db = SessionLocal()
    try:
        db.query(Notification).delete()
        db.commit()
        return {"message": "All notifications deleted"}
    finally:
        db.close()
