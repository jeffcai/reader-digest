import json
import gzip
import io
from datetime import datetime
from flask import Blueprint, send_file, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from models.models import Article, Digest, User
from database import db

export_bp = Blueprint('export_bp', __name__)

@export_bp.route('/admin/export', methods=['GET'])
@jwt_required()
def export_user_data():
    """
    Exports all articles and digests for the current user into a compressed JSON file.
    """
    try:
        user_id = get_jwt_identity()
        user = User.query.get(user_id)

        if not user:
            return jsonify({"msg": "User not found"}), 404

        # Fetch all data for the user
        articles = Article.query.filter_by(user_id=user_id).order_by(Article.created_at.desc()).all()
        digests = Digest.query.filter_by(user_id=user_id).order_by(Digest.created_at.desc()).all()

        # Prepare data for serialization
        backup_data = {
            "version": "1.0.0",
            "exported_at": datetime.utcnow().isoformat() + "Z",
            "user": {
                "id": user.id,
                "username": user.username,
                "email": user.email
            },
            "articles": [article.to_dict() for article in articles],
            "digests": [digest.to_dict() for digest in digests]
        }

        # Convert to JSON and compress using gzip
        json_str = json.dumps(backup_data, indent=2)
        json_bytes = json_str.encode('utf-8')

        buffer = io.BytesIO()
        with gzip.GzipFile(fileobj=buffer, mode='wb') as f:
            f.write(json_bytes)
        
        buffer.seek(0)

        # Create a filename
        timestamp = datetime.utcnow().strftime('%Y-%m-%d')
        filename = f"reader-digest-backup-{user.username}-{timestamp}.json.gz"

        return send_file(
            buffer,
            as_attachment=True,
            download_name=filename,
            mimetype='application/gzip'
        )

    except Exception as e:
        # Log the exception e
        return jsonify({"msg": "An error occurred during export."}), 500