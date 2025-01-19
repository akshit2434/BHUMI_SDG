from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from models.emission import EmissionLog  # Now correctly importing EmissionLog
from models.user_units import UserUnits
from datetime import datetime, timedelta

# Change the blueprint registration to include url_prefix
emission_bp = Blueprint('emission', __name__, url_prefix='/api')

def get_db():
    from flask import current_app
    return current_app.config['DATABASE'] 

# Helper functions
def get_day_before(date):
    return date - timedelta(days=1)

def get_day_after(date):
    return date + timedelta(days=1)

def is_contiguous(existing_ranges, new_start, new_end):
    if not existing_ranges:
        return True

    # Sort existing ranges by start_date
    sorted_ranges = sorted(existing_ranges, key=lambda x: x['start_date'])

    # Check adjacency before the earliest range
    earliest_start = sorted_ranges[0]['start_date']
    if get_day_before(earliest_start) == new_end:
        return True

    # Check adjacency after the latest range
    latest_end = sorted_ranges[-1]['end_date']
    if get_day_after(latest_end) == new_start:
        return True

    # Check if the new range fills an exact gap between two ranges
    for i in range(len(sorted_ranges) - 1):
        current_end = sorted_ranges[i]['end_date']
        next_start = sorted_ranges[i + 1]['start_date']
        if get_day_after(current_end) == new_start and get_day_before(next_start) == new_end:
            return True

    return False

@emission_bp.route('/emissions/log', methods=['POST'])  # Remove /api prefix
@jwt_required()
def log_emission():
    try:
        data = request.get_json()
        print("Received emission data:", data)  # Debug log
        
        required_fields = ['inputs', 'start_date', 'end_date']
        missing_fields = [field for field in required_fields if field not in data]
        if missing_fields:
            print("Missing fields:", missing_fields)  # Debug log
            return jsonify({
                'error': f'Missing required fields: {", ".join(missing_fields)}'
            }), 400

        email = get_jwt_identity()
        
        db = get_db()
        user = db.users.find_one({'email': email})
        if not user:
            return jsonify({'error': 'User not found'}), 404

        user_id = str(user['_id'])
        inputs = data['inputs']
        
        # Validate dates
        try:
            start_date = datetime.fromisoformat(data['start_date'])
            end_date = datetime.fromisoformat(data['end_date'])
            if end_date <= start_date:
                return jsonify({'error': 'End date must be after start date'}), 400
        except ValueError:
            return jsonify({'error': 'Invalid date format'}), 400

        # Fetch existing emission ranges for contiguity check
        existing_emissions = list(db.emissions.find(
            {'user_id': user_id},
            {'start_date': 1, 'end_date': 1, '_id': 0}
        ))
        existing_ranges = [{
            'start_date': emission['start_date'],
            'end_date': emission['end_date']
        } for emission in existing_emissions]

        # Check for contiguity
        if not is_contiguous(existing_ranges, start_date, end_date):
            return jsonify({'error': 'Emission period must be contiguous with existing logs'}), 400

        # Calculate total emissions
        total_emissions = sum(
            float(input_data['value']) * float(input_data['emission_factor'])
            for input_data in inputs.values()
        )

        # Create and save emission log
        emission = EmissionLog(
            user_id=user_id,
            inputs=inputs,
            total_emissions=total_emissions,
            start_date=start_date,
            end_date=end_date
        )

        result = db.emissions.insert_one(emission.to_dict())
        
        return jsonify({
            'message': 'Emission logged successfully',
            'id': str(result.inserted_id),
            'total_emissions': total_emissions
        }), 201

    except Exception as e:
        print(f"Error logging emission: {str(e)}")
        return jsonify({'error': str(e)}), 500

@emission_bp.route('/emissions/history', methods=['GET', 'OPTIONS'])  # Remove /api prefix
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
        
        # Get pagination parameters
        page = int(request.args.get('page', 1))
        limit = int(request.args.get('limit', 10))
        
        # Get total count of user's emissions
        total = db.emissions.count_documents({'user_id': user_id})
        
        # Get paginated emissions for the user
        emissions_cursor = db.emissions.find(
            {'user_id': user_id},
            {
                '_id': 1,
                'inputs': 1,
                'total_emissions': 1,
                'logged_at': 1,
                'start_date': 1,
                'end_date': 1,
                'industry_name': 1
            }
        ).sort('logged_at', -1).skip((page - 1) * limit).limit(limit)
        
        # Convert cursor to list and process each emission record
        emissions = []
        for emission in emissions_cursor:
            emission['_id'] = str(emission['_id'])
            if 'logged_at' in emission:
                emission['logged_at'] = emission['logged_at'].isoformat()
            if 'start_date' in emission:
                emission['start_date'] = emission['start_date'].isoformat()
            if 'end_date' in emission:
                emission['end_date'] = emission['end_date'].isoformat()
            
            # Process inputs
            if 'inputs' in emission:
                processed_inputs = {}
                for source, data in emission['inputs'].items():
                    processed_inputs[source] = {
                        'value': float(data['value']),
                        'unit': data['unit'],
                        'emission_factor': float(data['emission_factor'])
                    }
                emission['inputs'] = processed_inputs
            
            emissions.append(emission)
        
        return jsonify({
            'emissions': emissions,
            'total': total,
            'pages': (total + limit - 1) // limit
        }), 200
        
    except Exception as e:
        print(f"Error fetching emission history: {str(e)}")
        return jsonify({'error': str(e)}), 500

@emission_bp.route('/units', methods=['GET', 'OPTIONS'])  # Remove /api prefix
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

@emission_bp.route('/units', methods=['PUT', 'OPTIONS'])  # Remove /api prefix
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

@emission_bp.route('/emissions/metrics', methods=['PUT', 'DELETE', 'OPTIONS'])  # Remove /api prefix
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

@emission_bp.route('/metrics/add', methods=['POST'])  # Remove /api prefix
@jwt_required()
def add_custom_metric():
    try:
        db = get_db()
        email = get_jwt_identity()
        data = request.get_json()

        # Validate request data
        required_fields = ['metric_name', 'unit_name', 'emission_factor']
        if not all(field in data for field in required_fields):
            return jsonify({'error': 'Missing brbr required fields'}), 400 

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

@emission_bp.route('/emissions/period', methods=['GET'])
@jwt_required()
def get_emissions_for_period():
    try:
        start_date = request.args.get('start')
        end_date = request.args.get('end')

        if not start_date or not end_date:
            return jsonify({
                'error': 'Both start and end dates are required'
            }), 400

        try:
            start = datetime.fromisoformat(start_date.replace('Z', '+00:00'))
            end = datetime.fromisoformat(end_date.replace('Z', '+00:00'))
        except ValueError:
            return jsonify({
                'error': 'Invalid date format. Use ISO format.'
            }), 400

        db = get_db()
        email = get_jwt_identity()
        user = db.users.find_one({'email': email})
        
        if not user:
            return jsonify({'error': 'User not found'}), 404

        # Find emissions within the date range
        emissions = list(db.emissions.find({
            'user_id': str(user['_id']),
            'start_date': {'$gte': start},
            'end_date': {'$lte': end}
        }).sort('start_date', 1))

        # Format the response
        formatted_emissions = []
        for emission in emissions:
            emission['_id'] = str(emission['_id'])
            emission['start_date'] = emission['start_date'].isoformat()
            emission['end_date'] = emission['end_date'].isoformat()
            if 'logged_at' in emission:
                emission['logged_at'] = emission['logged_at'].isoformat()
            formatted_emissions.append(emission)

        return jsonify({
            'data': formatted_emissions,
            'count': len(formatted_emissions)
        }), 200

    except Exception as e:
        print(f"Error fetching emissions for period: {str(e)}")
        return jsonify({'error': str(e)}), 500

@emission_bp.route('/emissions/ranges', methods=['GET'])
@jwt_required()
def get_emission_ranges():
    try:
        db = get_db()
        email = get_jwt_identity()
        user = db.users.find_one({'email': email})
        
        if not user:
            return jsonify({'error': 'User not found'}), 404

        # Get all emission date ranges for the user
        ranges = list(db.emissions.find(
            {'user_id': str(user['_id'])},
            {'start_date': 1, 'end_date': 1, '_id': 0}
        ))

        # Format dates to ISO string
        formatted_ranges = [
            {
                'start': range['start_date'].isoformat(),
                'end': range['end_date'].isoformat()
            }
            for range in ranges
        ]

        return jsonify({
            'ranges': formatted_ranges
        }), 200

    except Exception as e:
        print(f"Error fetching emission ranges: {str(e)}")
        return jsonify({'error': str(e)}), 500