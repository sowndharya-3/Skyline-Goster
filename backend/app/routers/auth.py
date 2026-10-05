from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.deps import get_current_user
from app.core.security import create_access_token, verify_password
from app.db.session import get_db
from app.models import User
from app.schemas.auth import LoginRequest, MeResponse, TokenResponse

router = APIRouter(prefix='/api/auth', tags=['auth'])


@router.post('/login', response_model=TokenResponse)
def login(payload: LoginRequest, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == payload.email, User.is_active.is_(True)).one_or_none()
    if not user or not verify_password(payload.password, user.password_hash):
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, 'Incorrect email or password.')
    return TokenResponse(access_token=create_access_token(subject=user.email))


@router.post('/logout')
def logout(current_user: User = Depends(get_current_user)):
    # JWTs are stateless and expire on their own; there is no server-side session to clear.
    # The endpoint exists so the frontend has a symmetric call to discard its stored token against.
    return {'detail': 'Signed out.'}


@router.get('/me', response_model=MeResponse)
def me(current_user: User = Depends(get_current_user)):
    return current_user
