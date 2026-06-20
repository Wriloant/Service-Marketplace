"""Auth endpoints: register, login (OAuth2 password flow), current user."""
import re

from fastapi import APIRouter, Depends, HTTPException
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session

from ..database import get_db
from ..models import Role, User, VendorProfile
from ..schemas import RegisterIn, Token, UserOut
from ..security import (create_access_token, get_current_user, hash_password,
                        verify_password)

router = APIRouter(prefix="/auth", tags=["auth"])


@router.post("/register", response_model=Token, status_code=201)
def register(data: RegisterIn, db: Session = Depends(get_db)):
    if data.role == Role.admin:
        raise HTTPException(403, "Admin accounts cannot be self-registered")
    if db.query(User).filter(User.email == data.email).first():
        raise HTTPException(409, "Email already registered")

    user = User(name=data.name, email=data.email,
                password_hash=hash_password(data.password), role=data.role)
    db.add(user)
    db.flush()                                  # get user.id before commit

    # A vendor needs a profile to hang services off of.
    if data.role == Role.vendor:
        if not data.business_name:
            raise HTTPException(422, "business_name is required for vendors")
        db.add(VendorProfile(user_id=user.id, business_name=data.business_name,
                             is_approved=True))   # auto-approved for the demo

    db.commit()
    db.refresh(user)
    return Token(access_token=create_access_token(user), role=user.role)


@router.post("/login", response_model=Token)
def login(form: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
    # OAuth2 form uses "username"; we treat it as the email.
    user = db.query(User).filter(User.email == form.username).first()
    if not user or not verify_password(form.password, user.password_hash):
        raise HTTPException(401, "Incorrect email or password")
    return Token(access_token=create_access_token(user), role=user.role)


@router.get("/me", response_model=UserOut)
def me(user: User = Depends(get_current_user)):
    return user
