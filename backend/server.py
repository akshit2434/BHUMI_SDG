from flask import Flask, request, jsonify
from flask_cors import CORS
from flask_jwt_extended import JWTManager, create_access_token, jwt_required, get_jwt_identity
from flask_bcrypt import Bcrypt
from datetime import timedelta, datetime
from pymongo import MongoClient
from dotenv import load_dotenv
import os
from models.user import User
from models.user_units import UserUnits

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
        "methods": ["GET", "POST", "PUT", "DELETE", "OPTIONS"],  # Added DELETE
        "allow_headers": ["Content-Type", "Authorization"],
        "expose_headers": ["Authorization"],
        "max_age": 3600,
        "supports_credentials": True
    }
})

# MongoDB connection
try:
    client = MongoClient(os.getenv('MONGODB_URI'))
    db = client[os.getenv('DATABASE_NAME')]
    users_collection = db['users']
    
    # Initialize collections if they don't exist
    if 'emissions' not in db.list_collection_names():
        db.create_collection('emissions')
    
    if 'user_units' not in db.list_collection_names():
        db.create_collection('user_units')
        
except Exception as e:
    print(f"MongoDB connection error: {str(e)}")
    raise

# Make db available to routes
app.config['DATABASE'] = db

from routes.emission_routes import emission_bp
from routes.goal_routes import goal_bp

# Add blueprint registration after CORS setup
app.register_blueprint(emission_bp)
app.register_blueprint(goal_bp)

# Add before jwt_required endpoints
@app.before_request
def handle_preflight():
    if request.method == "OPTIONS":
        res = app.make_default_options_response()
        
        # Add CORS headers to response
        headers = {
            'Access-Control-Allow-Origin': os.getenv('FRONTEND_URL'),
            'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',  # Added DELETE
            'Access-Control-Allow-Headers': 'Content-Type, Authorization',
            'Access-Control-Allow-Credentials': 'true',
            'Access-Control-Max-Age': '3600'
        }
        
        res.headers.extend(headers)
        return res

@app.route('/api/auth/check', methods=['POST'])
def check_account():
    data = request.get_json()
    email = data.get('email')
    
    if not email:
        return jsonify({"error": "Email is required"}), 400
        
    user = users_collection.find_one({'email': email})
    return jsonify({"exists": user is not None}), 200

@app.route('/api/auth/register', methods=['POST'])
def register():
    data = request.get_json()
    email = data.get('email')
    
    if not email:
        return jsonify({"error": "Email is required"}), 400
        
    if users_collection.find_one({'email': email}):
        return jsonify({"error": "Account already exists"}), 409
        
    try:
        # Create a temporary token for registration
        temp_token = create_access_token(
            identity=email,
            additional_claims={"registration": True},
            expires_delta=timedelta(minutes=30)
        )
        return jsonify(
            temp_token=temp_token,
            message="Please complete your registration"
        ), 200
    except Exception as e:
        return jsonify({"error": "Error initiating registration"}), 500

@app.route('/api/auth/complete-registration', methods=['POST'])
@jwt_required()
def complete_registration():
    current_user = get_jwt_identity()
    data = request.get_json()
    
    # Add debug logging
    print("Received registration data:", data)
    print("Current user from token:", current_user)
    
    # Verify required fields
    required_fields = ['email', 'password', 'full_name', 'phone', 'organization', 'industry']
    missing_fields = [field for field in required_fields if field not in data]
    if missing_fields:
        return jsonify({
            "error": f"Missing rr required fields: {', '.join(missing_fields)}"
        }), 400
    
    # Double-check email matches token
    if current_user != data['email']:
        return jsonify({
            "error": f"Email mismatch. Token: {current_user}, Request: {data['email']}"
        }), 400
    
    # Verify no account exists
    if users_collection.find_one({'email': data['email']}):
        return jsonify({"error": "Account already exists"}), 409
    
    # Validate industry type
    valid_industries = ['Manufacturing', 'Agriculture', 'Textile', 'Other']
    if data['industry'] not in valid_industries:
        return jsonify({"error": "Invalid industry type"}), 400
        
    try:
        # Create new user with all details
        new_user = User(
            email=data['email'],
            password=bcrypt.generate_password_hash(data['password']).decode('utf-8'),
            full_name=data['full_name'],
            phone=data['phone'],
            organization=data['organization'],
            industry=data['industry'],
            is_details_filled=True
        )
        
        # Insert the complete user document
        result = users_collection.insert_one(new_user.to_dict())
        user_id = str(result.inserted_id)
        
        try:
            # Create and insert default units for the user
            user_units = UserUnits(user_id=user_id, industry=data['industry'])
            db.user_units.insert_one(user_units.to_dict())
        except Exception as e:
            # Rollback user creation if units creation fails
            users_collection.delete_one({'_id': result.inserted_id})
            raise Exception(f"Failed to create user units: {str(e)}")
        
        # Create final access token
        access_token = create_access_token(
            identity=data['email'],
            additional_claims={"role": "user"}
        )
        
        return jsonify(
            access_token=access_token,
            message="Registration completed successfully"
        ), 201
        
    except Exception as e:
        print(f"Registration error: {str(e)}")
        return jsonify({"error": str(e)}), 500

# Remove the duplicate route and keep only this version

@app.route('/api/auth/login', methods=['POST'])
def login():
    data = request.get_json()
    email = data.get('email')
    password = data.get('password')
    
    if not email or not password:
        return jsonify({"error": "Email and password are required"}), 400
    
    user = users_collection.find_one({'email': email})
    
    if not user:
        return jsonify({"error": "Account not found"}), 404
        
    if bcrypt.check_password_hash(user['password'], password):
        access_token = create_access_token(
            identity=email,
            additional_claims={"role": user.get('role', 'user')}
        )
        return jsonify(
            access_token=access_token, 
            message="Login successful",
            needs_details=not user.get('is_details_filled', False)
        ), 200
    
    return jsonify({"error": "Invalid credentials"}), 401

@app.route('/api/user/details', methods=['POST'])
@jwt_required()
def update_user_details():
    current_user = get_jwt_identity()
    data = request.get_json()
    
    required_fields = ['full_name', 'phone', 'organization', 'industry', 'password']
    if not all(field in data for field in required_fields):
        return jsonify({"error": "Missing rar required fields"}), 400
    
    # Validate industry type
    valid_industries = ['Manufacturing', 'Agriculture', 'Textile', 'Other']
    if data['industry'] not in valid_industries:
        return jsonify({"error": "Invalid industry type"}), 400
        
    try:
        # Hash the new password
        hashed_password = bcrypt.generate_password_hash(data['password']).decode('utf-8')
        
        users_collection.update_one(
            {'email': current_user},
            {'$set': {
                'full_name': data['full_name'],
                'phone': data['phone'],
                'organization': data['organization'],
                'industry': data['industry'],
                'password': hashed_password,
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
    try:
        current_user = get_jwt_identity()
        
        # Check if user exists
        user = users_collection.find_one({'email': current_user})
        if not user:
            return jsonify({"error": "User not found"}), 401
            
        return jsonify({
            "status": "valid",
            "user": {
                "email": user['email'],
                "role": user.get('role', 'user')
            }
        }), 200
    except Exception as e:
        return jsonify({"error": "Authentication failed"}), 401

@app.route('/')
def home():
    return {'message': 'Welcome to the Flask Server'}

@app.route('/api/test')
def test():
    return {'message': 'API test yoyo!'}

@app.route('/api/units/update', methods=['POST'])
@jwt_required()
def update_user_units():
    try:
        current_user = get_jwt_identity()
        user = users_collection.find_one({'email': current_user})
        if not user:
            return jsonify({"error": "User not found"}), 404

        data = request.get_json()
        user_id = str(user['_id'])
        
        # Update units while preserving emission factors
        current_units = db.user_units.find_one({'user_id': user_id})
        if not current_units:
            return jsonify({"error": "User units not found"}), 404

        # Update only the unit values while keeping emission factors
        updated_units = current_units['units']
        for metric, new_value in data['units'].items():
            if metric in updated_units:
                updated_units[metric]['unit'] = new_value

        db.user_units.update_one(
            {'user_id': user_id},
            {
                '$set': {
                    'units': updated_units,
                    'updated_at': datetime.utcnow()
                }
            }
        )
        
        return jsonify({"message": "Units updated successfully"}), 200
        
    except Exception as e:
        print(f"Error updating units: {str(e)}")
        return jsonify({"error": "Error updating user units"}), 500

if __name__ == '__main__':
    app.run(debug=True, port=5000)