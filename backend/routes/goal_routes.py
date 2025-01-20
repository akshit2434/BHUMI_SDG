from flask import Blueprint, request, jsonify, current_app
from flask_jwt_extended import jwt_required, get_jwt_identity
from bson import ObjectId, json_util
import json
from models.goal import Goal
from datetime import datetime
from db import db

goal_bp = Blueprint('goals', __name__)

def serialize_mongodb_obj(obj):
    """Helper function to serialize MongoDB objects including ObjectId"""
    return json.loads(json_util.dumps(obj))

@goal_bp.route('/api/goals', methods=['GET'])
@jwt_required()
def get_goals():
    try:
        current_user = get_jwt_identity()
        user = db.users.find_one({'email': current_user})
        
        if not user:
            return jsonify({"error": "User not found"}), 404

        goals = list(db.goals.find({'user_id': str(user['_id'])}))
        
        # Enhanced date formatting and validation
        for goal in goals:
            goal['_id'] = str(goal['_id'])
            
            # Format dates with validation
            date_fields = ['start_date', 'end_date', 'baseline_start_date', 'baseline_end_date', 'created_at', 'updated_at']
            for field in date_fields:
                if field in goal:
                    try:
                        if isinstance(goal[field], datetime):
                            goal[field] = goal[field].strftime('%Y-%m-%d')
                        elif isinstance(goal[field], str):
                            # Validate and format string dates
                            parsed_date = datetime.strptime(goal[field].split('T')[0], '%Y-%m-%d')
                            goal[field] = parsed_date.strftime('%Y-%m-%d')
                    except (ValueError, AttributeError):
                        goal[field] = None

            # Ensure numeric fields are valid
            try:
                goal['target_reduction'] = float(goal['target_reduction'])
            except (ValueError, TypeError, KeyError):
                goal['target_reduction'] = 0.0

            try:
                goal['baseline'] = float(goal['baseline'])
            except (ValueError, TypeError, KeyError):
                goal['baseline'] = 0.0

        return jsonify({"goals": goals}), 200

    except Exception as e:
        print(f"Error fetching goals: {str(e)}")
        return jsonify({"error": str(e)}), 500

@goal_bp.route('/api/goals', methods=['POST'])
@jwt_required()
def create_goal():
    try:
        current_user = get_jwt_identity()
        user = db.users.find_one({'email': current_user})
        
        if not user:
            return jsonify({"error": "User not found"}), 404

        data = request.get_json()
        print("Received goal data:", data)  # Debug log

        required_fields = [
            'title', 
            'targetReduction', 
            'startDate', 
            'endDate',
            'baseline',
            'baselineStartDate',
            'baselineEndDate'
        ]
        
        missing_fields = [field for field in required_fields if field not in data]
        if missing_fields:
            return jsonify({
                "error": "Missing required fields",
                "missing_fields": missing_fields
            }), 400

        try: 
            goal = Goal(
                user_id=str(user['_id']),
                title=data['title'],
                target_reduction=float(data['targetReduction']),
                start_date=datetime.fromisoformat(data['startDate'].split('T')[0]),
                end_date=datetime.fromisoformat(data['endDate'].split('T')[0]),
                baseline=float(data['baseline']),
                baseline_start_date=datetime.fromisoformat(data['baselineStartDate'].split('T')[0]),
                baseline_end_date=datetime.fromisoformat(data['baselineEndDate'].split('T')[0]),
                description=data.get('description', '')
            )

            goal_dict = goal.to_dict()
            print("Processed goal data:", goal_dict)  # Debug log
            
            result = db.goals.insert_one(goal_dict)
            created_goal = {
                **goal_dict,
                "_id": str(result.inserted_id)
            }
            
            return jsonify({
                "message": "Goal created successfully",
                "goal_id": str(result.inserted_id),
                "goal": serialize_mongodb_obj(created_goal)
            }), 201

        except ValueError as ve:
            return jsonify({"error": f"Invalid data format: {str(ve)}"}), 400

    except Exception as e:
        print(f"Unexpected error: {str(e)}")  # Debug log
        return jsonify({"error": str(e)}), 500

@goal_bp.route('/api/goals/<goal_id>', methods=['PUT'])
@jwt_required()
def update_goal(goal_id):
    try:
        current_user = get_jwt_identity()
        user = db.users.find_one({'email': current_user})
        
        if not user:
            return jsonify({"error": "User not found"}), 404

        data = request.get_json()
        print("Update goal data received:", data)  # Debug log
        
        goal = db.goals.find_one({'_id': ObjectId(goal_id), 'user_id': str(user['_id'])})
        if not goal:
            return jsonify({"error": "Goal not found"}), 404

        # Update to match new field structure
        updates = {
            'title': data.get('title', goal['title']),
            'target_reduction': float(data.get('targetReduction', goal['target_reduction'])),
            'start_date': datetime.fromisoformat(data['startDate'].split('T')[0]) if 'startDate' in data else goal['start_date'],
            'end_date': datetime.fromisoformat(data['endDate'].split('T')[0]) if 'endDate' in data else goal['end_date'],
            'baseline': float(data.get('baseline', goal['baseline'])),
            'baseline_start_date': datetime.fromisoformat(data['baselineStartDate'].split('T')[0]) if 'baselineStartDate' in data else goal['baseline_start_date'],
            'baseline_end_date': datetime.fromisoformat(data['baselineEndDate'].split('T')[0]) if 'baselineEndDate' in data else goal['baseline_end_date'],
            'description': data.get('description', goal['description']),
            'updated_at': datetime.utcnow()
        }

        print("Processed updates:", updates)  # Debug log

        result = db.goals.update_one(
            {'_id': ObjectId(goal_id)},
            {'$set': updates}
        )

        if result.modified_count > 0:
            return jsonify({"message": "Goal updated successfully"}), 200
        else:
            return jsonify({"error": "No changes made"}), 400

    except ValueError as e:
        print(f"Value error in update: {str(e)}")  # Debug log
        return jsonify({"error": f"Invalid data format: {str(e)}"}), 400
    except Exception as e:
        print(f"Error updating goal: {str(e)}")  # Debug log
        return jsonify({"error": str(e)}), 500

@goal_bp.route('/api/goals/<goal_id>', methods=['DELETE'])
@jwt_required()
def delete_goal(goal_id):
    try:
        current_user = get_jwt_identity()
        user = db.users.find_one({'email': current_user})
        
        if not user:
            return jsonify({"error": "User not found"}), 404

        result = db.goals.delete_one({
            '_id': ObjectId(goal_id),
            'user_id': str(user['_id'])
        })

        if result.deleted_count == 0:
            return jsonify({"error": "Goal not found"}), 404

        return jsonify({"message": "Goal deleted successfully"}), 200

    except Exception as e:
        return jsonify({"error": str(e)}), 500
