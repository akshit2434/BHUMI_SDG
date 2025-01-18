from flask import Flask, request, jsonify
from flask_cors import CORS
from flask_jwt_extended import JWTManager, create_access_token, jwt_required, get_jwt_identity
from flask_bcrypt import Bcrypt
from datetime import timedelta, datetime
from pymongo import MongoClient
from dotenv import load_dotenv
import os
from models.user import User

# Load environment variables
load_dotenv()

app = Flask(__name__)
app.config['JWT_SECRET_KEY'] = os.getenv('JWT_SECRET_KEY')
app.config['JWT_ACCESS_TOKEN_EXPIRES'] = timedelta(hours=1)
jwt = JWTManager(app)
bcrypt = Bcrypt(app)

# Configure CORS
CORS(app, supports_credentials=True, resources={
    r"/*": {
        "origins": os.getenv('FRONTEND_URL'),
        "methods": ["GET", "POST", "OPTIONS"],
        "allow_headers": ["Content-Type", "Authorization"],
        "expose_headers": ["Authorization"]
    }
})

# MongoDB connection
try:
    client = MongoClient(os.getenv('MONGODB_URI'))
    db = client[os.getenv('DATABASE_NAME')]
    users_collection = db['users']
except Exception as e:
    print(f"MongoDB connection error: {str(e)}")
    raise

@app.route('/api/auth/login', methods=['POST'])
def login():
    data = request.get_json()
    email = data.get('email')
    password = data.get('password')
    
    if not email or not password:
        return jsonify({"error": "Email and password are required"}), 400
    
    user = users_collection.find_one({'email': email})
    
    if user and bcrypt.check_password_hash(user['password'], password):
        access_token = create_access_token(
            identity=email,
            additional_claims={"role": user.get('role', 'user')}
        )
        return jsonify(
            access_token=access_token, 
            message="Login successful",
            needs_details=not user.get('is_details_filled', False)
        ), 200
        
    if not user:
        try:
            new_user = User(
                email=email,
                password=bcrypt.generate_password_hash(password).decode('utf-8')
            )
            users_collection.insert_one(new_user.to_dict())
            access_token = create_access_token(
                identity=email,
                additional_claims={"role": "user"}
            )
            return jsonify(
                access_token=access_token, 
                message="Account created",
                needs_details=True
            ), 201
        except Exception as e:
            return jsonify({"error": "Error creating account"}), 500
            
    return jsonify({"error": "Invalid credentials"}), 401

@app.route('/api/user/details', methods=['POST'])
@jwt_required()
def update_user_details():
    current_user = get_jwt_identity()
    data = request.get_json()
    
    required_fields = ['full_name', 'phone', 'organization']
    if not all(field in data for field in required_fields):
        return jsonify({"error": "Missing required fields"}), 400
        
    try:
        users_collection.update_one(
            {'email': current_user},
            {'$set': {
                'full_name': data['full_name'],
                'phone': data['phone'],
                'organization': data['organization'],
                'is_details_filled': True
            }}
        )
        return jsonify({"message": "User details updated successfully"}), 200
    except Exception as e:
        return jsonify({"error": "Error updating user details"}), 500

# Add error handlers
@jwt.invalid_token_loader
def invalid_token_callback(error):
    return jsonify({"error": "Invalid token"}), 401

@jwt.expired_token_loader
def expired_token_callback(jwt_header, jwt_data):
    return jsonify({"error": "Token has expired"}), 401

@app.route('/api/protected')
@jwt_required()
def protected():
    current_user = get_jwt_identity()
    return jsonify(logged_in_as=current_user), 200

@app.route('/')
def home():
    return {'message': 'Welcome to the Flask Server'}

@app.route('/api/test')
def test():
    return {'message': 'API test yoyo!'}

if __name__ == '__main__':
    app.run(debug=True, port=5000)