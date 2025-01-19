from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from models.emission import EmissionLog
from models.user_units import UserUnits
from datetime import datetime

# Change the blueprint registration to include url_prefix
emission_bp = Blueprint('emission', __name__, url_prefix='/api')

def get_db():
    from flask import current_app
    return current_app.config['DATABASE']

@emission_bp.route('/emissions/log', methods=['POST'])
@jwt_required()
def log_emission():
    try:
        data = request.get_json()
        email = get_jwt_identity()
        
        if not data or 'inputs' not in data:
            return jsonify({'error': 'Missing inputs data'}), 400

        # Get user ID from email
        db = get_db()
        user = db.users.find_one({'email': email})
        if not user:
            return jsonify({'error': 'User not found'}), 404
        user_id = str(user['_id'])

        # Validate inputs structure
        inputs = data['inputs']
        if not isinstance(inputs, dict):
            return jsonify({'error': 'Inputs must be a dictionary'}), 400

        for source, input_data in inputs.items():
            if not isinstance(input_data, dict):
                return jsonify({'error': f'Invalid input data for {source}'}), 400
            if not all(key in input_data for key in ['value', 'unit', 'emission_factor']):
                return jsonify({'error': f'Missing required fields for {source}'}), 400
            try:
                input_data['value'] = float(input_data['value'])
                input_data['emission_factor'] = float(input_data['emission_factor'])
            except (ValueError, TypeError):
                return jsonify({'error': f'Invalid numeric values for {source}'}), 400

        # Calculate total emissions
        total_emissions = sum(
            float(input_data['value']) * float(input_data['emission_factor'])
            for input_data in inputs.values()
        )

        # Create emission log document
        emission_doc = {
            'user_id': user_id,
            'industry_name': data.get('industry_name', 'default'),
            'inputs': inputs,
            'total_emissions': total_emissions,
            'logged_at': datetime.utcnow()
        }
        
        result = db.emissions.insert_one(emission_doc)
        
        return jsonify({
            'message': 'Emission logged successfully',
            'id': str(result.inserted_id),
            'total_emissions': total_emissions
        }), 201
        
    except Exception as e:
        print(f"Error logging emission: {str(e)}")
        return jsonify({'error': 'Failed to log emission', 'details': str(e)}), 500

@emission_bp.route('/emissions/history', methods=['GET', 'OPTIONS'])
@jwt_required()
def get_emission_history():
    if request.method == 'OPTIONS':
        return jsonify({}), 200
    
    try:
        db = get_db()
        email = get_jwt_identity()
        
        # Get user ID from email
        user = db.users.find_one({'email': email})
        if not user:
            return jsonify({'error': 'User not found'}), 404
        user_id = str(user['_id'])
        
        page = int(request.args.get('page', 1))
        limit = int(request.args.get('limit', 10))
        
        # Get total count of user's emissions
        total = db.emissions.count_documents({'user_id': user_id})
        
        # Get paginated emissions for the user
        emissions = list(db.emissions.find(
            {'user_id': user_id},
            {
                '_id': 1,
                'inputs': 1,
                'total_emissions': 1,
                'logged_at': 1,
                'industry_name': 1
            }
        ).sort('logged_at', -1).skip((page - 1) * limit).limit(limit))
        
        # Process each emission record
        for emission in emissions:
            emission['_id'] = str(emission['_id'])
            # Convert datetime to string for JSON serialization
            emission['logged_at'] = emission['logged_at'].isoformat()
            
            # Process inputs
            processed_inputs = {}
            for source, data in emission['inputs'].items():
                processed_inputs[source] = {
                    'value': float(data['value']),
                    'unit': data['unit'],
                    'emission_factor': float(data['emission_factor'])
                }
            emission['inputs'] = processed_inputs
        
        return jsonify({
            'emissions': emissions,
            'total': total,
            'pages': (total + limit - 1) // limit
        }), 200
        
    except Exception as e:
        print(f"Error fetching emission history: {str(e)}")
        return jsonify({'error': str(e)}), 500

@emission_bp.route('/units', methods=['GET', 'OPTIONS'])
@jwt_required()
def get_user_units():
    if request.method == 'OPTIONS':
        return jsonify({}), 200
    try:
        db = get_db()
        email = get_jwt_identity()
        
        user = db.users.find_one({'email': email})
        if not user:
            return jsonify({"error": "User not found"}), 404

        user_id = str(user['_id'])
        user_units = db.user_units.find_one({'user_id': user_id})
        
        if not user_units:
            user_units = UserUnits(user_id=user_id, industry=user.get('industry', 'Manufacturing'))
            db.user_units.insert_one(user_units.to_dict())
            user_units = user_units.to_dict()

        # Transform the data structure
        metrics_list = []
        if 'metrics' in user_units:
            for metric_name, metric_data in user_units['metrics'].items():
                metrics_list.append({
                    'name': metric_name,
                    'units': metric_data['units']
                })
        
        return jsonify({
            'metrics': metrics_list
        }), 200
        
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@emission_bp.route('/units', methods=['PUT', 'OPTIONS'])
@jwt_required()
def update_user_units():
    if request.method == 'OPTIONS':
        return jsonify({}), 200
    try:
        db = get_db()
        email = get_jwt_identity()
        data = request.get_json()
        
        # Get user first
        user = db.users.find_one({'email': email})
        if not user:
            return jsonify({"error": "User not found"}), 404
        user_id = str(user['_id'])
        
        if not data or 'units' not in data:
            return jsonify({'error': 'No units data provided'}), 400

        # Get user units document
        user_units = db.user_units.find_one({'user_id': user_id})
        if not user_units:
            return jsonify({'error': 'User units not found'}), 404

        # Update the metrics
        metrics = user_units.get('metrics', {})
        for metric_name, metric_data in data['units'].items():
            if metric_name in metrics:
                if 'units' in metric_data:
                    metrics[metric_name]['units'] = metric_data['units']

        # Update document
        result = db.user_units.update_one(
            {'user_id': user_id},
            {
                '$set': {
                    'metrics': metrics,
                    'updated_at': datetime.utcnow()
                }
            }
        )

        if result.modified_count == 0:
            return jsonify({'error': 'No changes made'}), 400

        return jsonify({
            'message': 'Units updated successfully',
            'metrics': metrics
        }), 200
        
    except Exception as e:
        print(f"Error updating units: {str(e)}")
        return jsonify({'error': str(e)}), 500

@emission_bp.route('/emissions/metrics', methods=['PUT', 'DELETE', 'OPTIONS'])
@jwt_required()
def manage_metrics():
    if request.method == 'OPTIONS':
        return jsonify({}), 200
    db = get_db()
    email = get_jwt_identity()
    
    # Get user first
    user = db.users.find_one({'email': email})
    if not user:
        return jsonify({"error": "User not found"}), 404
    user_id = str(user['_id'])
    
    if request.method == 'PUT':
        try:
            data = request.get_json()
            original_name = data.get('originalName')
            new_name = data.get('newName')
            
            if not original_name or not new_name:
                return jsonify({'error': 'Original name and new name are required'}), 400
            
            # First get the user units document
            user_units = db.user_units.find_one({'user_id': user_id})
            if not user_units:
                return jsonify({'error': 'No metrics found for user'}), 404

            # Update in metrics
            if 'metrics' in user_units and original_name in user_units['metrics']:
                updated_metrics = user_units['metrics'].copy()
                updated_metrics[new_name] = updated_metrics.pop(original_name)
                
                # Update the document
                result = db.user_units.update_one(
                    {'user_id': user_id},
                    {'$set': {'metrics': updated_metrics}}
                )
                
                if result.modified_count > 0:
                    return jsonify({'message': 'Metric name updated successfully'}), 200
                else:
                    return jsonify({'error': 'No changes made'}), 400
            else:
                return jsonify({'error': 'Metric not found'}), 404
                
        except Exception as e:
            print(f"Error updating metric name: {str(e)}")
            return jsonify({'error': str(e)}), 500
    
    elif request.method == 'DELETE':
        data = request.get_json()
        name = data.get('name')
        
        if not name:
            return jsonify({'error': 'Metric name is required'}), 400
        
        try:
            # Get user units first
            user_units = db.user_units.find_one({'user_id': user_id})
            if not user_units or 'metrics' not in user_units:
                return jsonify({'error': 'No metrics found'}), 404

            # Check if metric exists
            if name not in user_units['metrics']:
                return jsonify({'error': 'Metric not found'}), 404

            # Remove the metric
            updated_metrics = user_units['metrics'].copy()
            del updated_metrics[name]

            # Update the document with new metrics
            result = db.user_units.update_one(
                {'user_id': user_id},
                {'$set': {'metrics': updated_metrics}}
            )

            if result.modified_count > 0:
                return jsonify({'message': 'Metric deleted successfully'}), 200
            else:
                return jsonify({'error': 'Failed to delete metric'}), 500

        except Exception as e:
            print(f"Error deleting metric: {str(e)}")
            return jsonify({'error': str(e)}), 500

# ...existing code...

@emission_bp.route('/metrics/add', methods=['POST'])
@jwt_required()
def add_custom_metric():
    try:
        db = get_db()
        email = get_jwt_identity()
        data = request.get_json()

        # Validate request data
        required_fields = ['metric_name', 'unit_name', 'emission_factor']
        if not all(field in data for field in required_fields):
            return jsonify({'error': 'Missing required fields'}), 400

        # Get user
        user = db.users.find_one({'email': email})
        if not user:
            return jsonify({'error': 'User not found'}), 404
        user_id = str(user['_id'])

        # Get user units document
        user_units = db.user_units.find_one({'user_id': user_id})
        if not user_units:
            return jsonify({'error': 'User units not found'}), 404

        # Create new metric structure
        new_metric = {
            'units': [{
                'name': data['unit_name'],
                'emission_factor': float(data['emission_factor'])
            }]
        }

        # Update metrics
        metrics = user_units.get('metrics', {})
        metrics[data['metric_name']] = new_metric

        # Update document
        result = db.user_units.update_one(
            {'user_id': user_id},
            {
                '$set': {
                    'metrics': metrics,
                    'updated_at': datetime.utcnow()
                }
            }
        )

        return jsonify({
            'message': 'Custom metric added successfully',
            'metric': {
                'name': data['metric_name'],
                'units': new_metric['units']
            }
        }), 201

    except Exception as e:
        print(f"Error adding custom metric: {str(e)}")
        return jsonify({'error': str(e)}), 500

# ...existing code...

from models.user_units import UserUnits

# Example route where UserUnits is instantiated
@emission_bp.route('/some-route', methods=['POST'])  # Changed from @app.route to @emission_bp.route
@jwt_required()
def some_route():
    # ...existing code...
    
    user_units = UserUnits(user_id=user_id, industry=user_industry)
    db.user_units.insert_one(user_units.to_dict())
    
    # ...existing code...
