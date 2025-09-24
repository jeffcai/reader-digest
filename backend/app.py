from flask import Flask
from flask_cors import CORS
from dotenv import load_dotenv
import os
from datetime import timedelta
from database import db, jwt, login_manager

# Load environment variables
load_dotenv()

def create_app():
    app = Flask(__name__)
    
    # Configuration
    app.config['SECRET_KEY'] = os.getenv('SECRET_KEY', 'dev-secret-key')
    app.config['JWT_SECRET_KEY'] = os.getenv('JWT_SECRET_KEY', 'dev-jwt-secret')
    app.config['JWT_ACCESS_TOKEN_EXPIRES'] = timedelta(days=1)  # 1 day expiration
    app.config['SQLALCHEMY_DATABASE_URI'] = os.getenv('DATABASE_URL', 'sqlite:///reader_digest.db')
    app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
    
    # Initialize extensions with app
    db.init_app(app)
    jwt.init_app(app)
    login_manager.init_app(app)
    
    # Enable CORS
    CORS(app, origins=["http://localhost:3000", "http://localhost:3001", "http://106.15.54.73:3000"])  # Allow frontend origins
    
    # Import and register blueprints
    from routes.auth import auth_bp
    from routes.articles import articles_bp
    from routes.digests import digests_bp
    from routes.users import users_bp
    from routes.rss import rss_bp
    from routes.export import export_bp
    
    app.register_blueprint(auth_bp, url_prefix='/api/v1/auth')
    app.register_blueprint(articles_bp, url_prefix='/api/v1/articles')
    app.register_blueprint(digests_bp, url_prefix='/api/v1/digests')
    app.register_blueprint(users_bp, url_prefix='/api/v1/users')
    app.register_blueprint(rss_bp, url_prefix='/rss')
    app.register_blueprint(export_bp, url_prefix='/api/v1')
    
    # Add health check route
    @app.route('/health')
    def health_check():
        return {'status': 'OK', 'message': 'Flask app is running'}
    
    # Import models to ensure they are registered with SQLAlchemy
    from models.models import User, Article, Digest
    
    # Create tables
    with app.app_context():
        db.create_all()
    
    return app

if __name__ == '__main__':
    app = create_app()
    from waitress import serve
    serve(app, host='0.0.0.0', port=5001)
