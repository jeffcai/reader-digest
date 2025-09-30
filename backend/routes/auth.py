from flask import Blueprint, request, jsonify
from flask_jwt_extended import create_access_token, jwt_required, get_jwt_identity
from models.models import User
from database import db
from werkzeug.security import check_password_hash
from utils.validators import validate_password, validate_email, validate_username
import requests
import os
import re

auth_bp = Blueprint('auth', __name__)

@auth_bp.route('/register', methods=['POST'])
def register():
    """Register a new user with comprehensive validation"""
    try:
        data = request.get_json()
        
        # Validate required fields
        if not data.get('username') or not data.get('email') or not data.get('password'):
            return jsonify({'error': 'Username, email, and password are required'}), 400
        
        # Validate username
        username_valid, username_errors = validate_username(data['username'])
        if not username_valid:
            return jsonify({'error': 'Invalid username', 'details': username_errors}), 400
        
        # Validate email
        if not validate_email(data['email']):
            return jsonify({'error': 'Invalid email format'}), 400
        
        # Validate password complexity
        password_valid, password_errors = validate_password(data['password'])
        if not password_valid:
            return jsonify({'error': 'Password does not meet complexity requirements', 'details': password_errors}), 400
        
        # Check if user already exists
        if User.query.filter_by(username=data['username']).first():
            return jsonify({'error': 'Username already exists'}), 400
        
        if User.query.filter_by(email=data['email']).first():
            return jsonify({'error': 'Email already exists'}), 400
        
        # Create new user
        user = User()
        user.username = data['username']
        user.email = data['email']
        user.first_name = data.get('first_name', '')
        user.last_name = data.get('last_name', '')
        user.set_password(data['password'])
        
        db.session.add(user)
        db.session.commit()
        
        # Create access token
        access_token = create_access_token(identity=str(user.id))
        
        return jsonify({
            'message': 'User registered successfully',
            'access_token': access_token,
            'user': user.to_dict()
        }), 201
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@auth_bp.route('/login', methods=['POST'])
def login():
    """Login with username/email and password"""
    try:
        data = request.get_json()
        
        # Validate required fields
        if not data.get('login') or not data.get('password'):
            return jsonify({'error': 'Login and password are required'}), 400
        
        # Find user by username or email
        user = User.query.filter(
            (User.username == data['login']) | (User.email == data['login'])
        ).first()
        
        if not user or not user.check_password(data['password']):
            return jsonify({'error': 'Invalid credentials'}), 401
        
        if not user.is_active:
            return jsonify({'error': 'Account is disabled'}), 401
        
        # Create access token
        access_token = create_access_token(identity=str(user.id))
        
        return jsonify({
            'message': 'Login successful',
            'access_token': access_token,
            'user': user.to_dict()
        }), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@auth_bp.route('/oauth/google', methods=['POST'])
def google_oauth():
    """Google OAuth login"""
    try:
        data = request.get_json()
        token = data.get('token')
        
        if not token:
            return jsonify({'error': 'Token is required'}), 400
        
        # Verify token with Google
        google_response = requests.get(
            f'https://www.googleapis.com/oauth2/v1/userinfo?access_token={token}'
        )
        
        if google_response.status_code != 200:
            return jsonify({'error': 'Invalid Google token'}), 401
        
        google_data = google_response.json()
        
        # Check if user exists
        user = User.query.filter_by(email=google_data['email']).first()
        
        if not user:
            # Create new user
            user = User()
            user.username = google_data.get('email', '').split('@')[0]
            user.email = google_data['email']
            user.first_name = google_data.get('given_name', '')
            user.last_name = google_data.get('family_name', '')
            user.oauth_provider = 'google'
            user.oauth_id = google_data['id']
            db.session.add(user)
            db.session.commit()
        
        # Create access token
        access_token = create_access_token(identity=user.id)
        
        return jsonify({
            'message': 'Google OAuth login successful',
            'access_token': access_token,
            'user': user.to_dict()
        }), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500


def _generate_unique_username(base_username: str) -> str:
    """Generate a unique username based on preferred base."""
    base = re.sub(r'[^a-zA-Z0-9_]', '_', base_username.strip()) or 'reader'
    candidate = base.lower()
    suffix = 1

    while User.query.filter_by(username=candidate).first() is not None:
        candidate = f"{base.lower()}_{suffix}"
        suffix += 1

    return candidate


@auth_bp.route('/logto/exchange', methods=['POST'])
def logto_exchange():
    """Exchange a Logto session for a Reader Digest JWT, creating user if needed."""
    secret_header = request.headers.get('X-Logto-Exchange-Secret')
    expected_secret = os.getenv('LOGTO_EXCHANGE_SECRET')

    if not expected_secret:
        return jsonify({'error': 'Server misconfiguration: LOGTO_EXCHANGE_SECRET not set'}), 500

    if secret_header != expected_secret:
        return jsonify({'error': 'Unauthorized'}), 401

    data = request.get_json(silent=True) or {}
    logto_id = data.get('logto_id')
    email = data.get('email')
    display_name = data.get('display_name')
    first_name = data.get('first_name')
    last_name = data.get('last_name')

    if not logto_id or not email:
        return jsonify({'error': 'logto_id and email are required'}), 400

    try:
        user = User.query.filter_by(oauth_provider='logto', oauth_id=logto_id).first()

        if not user:
            user = User.query.filter_by(email=email).first()

        if not user:
            preferred_username = data.get('username') or (email.split('@')[0] if '@' in email else display_name)
            username = _generate_unique_username(preferred_username or 'reader')

            user = User()
            user.username = username
            user.email = email
            user.first_name = first_name or ''
            user.last_name = last_name or ''
            user.oauth_provider = 'logto'
            user.oauth_id = logto_id
            db.session.add(user)
            db.session.commit()
        else:
            # Update existing user details if necessary
            updated = False
            if not user.oauth_provider:
                user.oauth_provider = 'logto'
                user.oauth_id = logto_id
                updated = True
            if first_name and user.first_name != first_name:
                user.first_name = first_name
                updated = True
            if last_name and user.last_name != last_name:
                user.last_name = last_name
                updated = True
            if display_name and not user.first_name and not user.last_name:
                parts = display_name.split(' ', 1)
                user.first_name = parts[0]
                if len(parts) > 1:
                    user.last_name = parts[1]
                updated = True

            if updated:
                db.session.commit()

        if not user.is_active:
            return jsonify({'error': 'Account is disabled'}), 403

        access_token = create_access_token(identity=str(user.id))

        return jsonify({
            'access_token': access_token,
            'user': user.to_dict()
        }), 200

    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@auth_bp.route('/me', methods=['GET'])
@jwt_required()
def get_current_user():
    """Get current user information"""
    try:
        user_id = get_jwt_identity()
        user = User.query.get(user_id)
        
        if not user:
            return jsonify({'error': 'User not found'}), 404
        
        return jsonify({'user': user.to_dict()}), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@auth_bp.route('/logout', methods=['POST'])
@jwt_required()
def logout():
    """Logout user (client-side token removal)"""
    return jsonify({'message': 'Logout successful'}), 200

@auth_bp.route('/check-availability', methods=['POST'])
def check_availability():
    """Check if username or email is available"""
    try:
        data = request.get_json()
        
        if not data:
            return jsonify({'error': 'Request data is required'}), 400
        
        field = data.get('field')
        value = data.get('value')
        
        if not field or not value:
            return jsonify({'error': 'Both field and value are required'}), 400
        
        if field == 'username':
            username_exists = User.query.filter_by(username=value).first() is not None
            available = not username_exists
            
            # Also validate username format
            username_valid, username_errors = validate_username(value)
            
            return jsonify({
                'available': available,
                'valid': username_valid,
                'errors': username_errors if not username_valid else []
            }), 200
            
        elif field == 'email':
            email_exists = User.query.filter_by(email=value).first() is not None
            available = not email_exists
            
            # Also validate email format
            email_valid = validate_email(value)
            
            return jsonify({
                'available': available,
                'valid': email_valid,
                'errors': ['Invalid email format'] if not email_valid else []
            }), 200
        
        else:
            return jsonify({'error': 'Field must be either "username" or "email"'}), 400
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@auth_bp.route('/validate-password', methods=['POST'])
def validate_password_endpoint():
    """Validate password complexity"""
    try:
        data = request.get_json()
        
        if not data or not data.get('password'):
            return jsonify({'error': 'Password is required'}), 400
        
        is_valid, errors = validate_password(data['password'])
        
        return jsonify({
            'valid': is_valid,
            'errors': errors if not is_valid else []
        }), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500
