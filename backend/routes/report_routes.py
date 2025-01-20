from flask import Blueprint, request, jsonify, send_file
from flask_jwt_extended import jwt_required, get_jwt_identity
from bson import ObjectId
from datetime import datetime
import google.generativeai as genai
from io import BytesIO
import os
import numpy as np
from reportlab.pdfgen import canvas
from reportlab.lib.pagesizes import letter
from reportlab.lib import colors
from models.report import Report
import json
from db import db

# Configure Google Generative AI
genai.configure(api_key=os.getenv('GOOGLE_API_KEY'))
model = genai.GenerativeModel(os.getenv('LLM_MODEL', 'gemini-2.0-flash-exp'))

report_bp = Blueprint('report', __name__, url_prefix='/api/reports')


# def get_db():
#     from flask import current_app
#     return current_app.config['DATABASE']

def calculate_baseline(user_id):  # Remove db parameter
    try:
        # Get historical emissions
        emissions = list(db.emissions.find({'user_id': user_id}))
        if not emissions:
            return None

        # Sort emissions by date
        emissions.sort(key=lambda x: x['start_date'])
        
        # Calculate rolling average as baseline
        values = []
        dates = []
        
        for emission in emissions:
            values.append(emission['total_emissions'])
            dates.append(emission['start_date'])

        # Calculate 3-month rolling average
        window = min(len(values), 90)  # Use 90 days or available data points
        baseline = np.convolve(values, np.ones(window)/window, mode='valid')

        return {
            'values': [{'date': date, 'value': value} 
                      for date, value in zip(dates[window-1:], baseline)],
            'start_date': dates[window-1],
            'end_date': dates[-1]
        }
    except Exception as e:
        print(f"Error calculating baseline: {str(e)}")
        return None

def get_emission_data(emission_id):
    emission = db.emissions.find_one({'_id': ObjectId(emission_id)})
    if not emission:
        return None

    return {
        'values': [{'date': emission['start_date'], 'value': emission['total_emissions']}],
        'start_date': emission['start_date'],
        'end_date': emission['end_date'],
        'total_emissions': emission['total_emissions']
    }

def generate_ai_suggestions(emission_data, comparison_data=None, comparison_type='baseline'):
    try:
        # Prepare data for AI analysis
        context = {
            'selected_emission': {
                'total': emission_data['total_emissions'],
                'start_date': emission_data['start_date'].strftime('%Y-%m-%d'),
                'end_date': emission_data['end_date'].strftime('%Y-%m-%d')
            }
        }

        if comparison_data:
            if comparison_type == 'baseline':
                context['baseline'] = {
                    'average': np.mean([point['value'] for point in comparison_data['values']])
                }
            else:
                context['comparison_emission'] = {
                    'total': comparison_data['total_emissions'],
                    'start_date': comparison_data['start_date'].strftime('%Y-%m-%d'),
                    'end_date': comparison_data['end_date'].strftime('%Y-%m-%d')
                }

        # Generate prompt based on comparison type
        if comparison_type == 'baseline':
            prompt = f"""
            Provide exactly 3 clear, actionable suggestions to reduce carbon emissions based on this data:
            
            Current Emissions: {context['selected_emission']['total']:.2f} kg CO₂e
            ({context['selected_emission']['start_date']} to {context['selected_emission']['end_date']})
            
            Baseline Average: {context['baseline']['average']:.2f} kg CO₂e

            Each suggestion must:
            - Start with an action verb
            - Be under 80 characters
            - Be specific and measurable
            - Focus on practical implementation
            - You are giving suggestions on behalf of a platform called CarbonTrack
            - Only suggest actions that can be taken by the user, and make sure they aren't too far-fetched
            
            Format: Simple bullet points starting with action verbs
            """
        else:
            prompt = f"""
            Provide exactly 3 clear, actionable suggestions based on comparing these two periods:
            
            Period 1: {context['selected_emission']['total']:.2f} kg CO₂e
            ({context['selected_emission']['start_date']} to {context['selected_emission']['end_date']})
            
            Period 2: {context['comparison_emission']['total']:.2f} kg CO₂e
            ({context['comparison_emission']['start_date']} to {context['comparison_emission']['end_date']})
            
            Each suggestion must:
            - Start with an action verb
            - Be under 80 characters
            - Be specific and measurable
            - Focus on practical implementation
            - You are giving suggestions on behalf of a platform called CarbonTrack
            - Only suggest actions that can be taken by the user, and make sure they aren't too far-fetched
            
            Format: Simple bullet points starting with action verbs
            """

        # Generate AI response
        response = model.generate_content(prompt)
        
        print("Raw AI response:", response.text)  # Debug log
        
        # Process the response
        suggestions = []
        lines = response.text.split('\n')
        current_suggestion = []

        for line in lines:
            line = line.strip()
            if not line:
                continue

            # Remove markdown formatting
            line = line.replace('**', '')
            line = line.replace('*', '')
            line = line.replace('#', '')
            line = line.lstrip('- ').lstrip('• ').strip()

            # Skip headers and formatting instructions
            if any(line.lower().startswith(x) for x in ['each', 'format:', 'must:', 'consider:']):
                continue

            # Check if it's a new suggestion (starts with action verb)
            action_verbs = ['implement', 'set', 'reduce', 'optimize', 'track', 'monitor',
                          'install', 'use', 'switch', 'conduct', 'establish', 'develop',
                          'create', 'maintain', 'review', 'upgrade', 'adopt', 'integrate']

            if any(line.lower().startswith(verb) for verb in action_verbs):
                # Save previous suggestion if exists
                if current_suggestion:
                    full_suggestion = ' '.join(current_suggestion)
                    if 10 <= len(full_suggestion) <= 150:  # Length validation
                        suggestions.append(full_suggestion)
                current_suggestion = [line]
            else:
                # Continue current suggestion if we have one
                if current_suggestion:
                    current_suggestion.append(line)

        # Add the last suggestion
        if current_suggestion:
            full_suggestion = ' '.join(current_suggestion)
            # Add suggestion only if it's complete (ends with proper punctuation)
            if 20 <= len(full_suggestion) <= 150 and any(full_suggestion.endswith(p) for p in ['.', '!', '?']):
                suggestions.append(full_suggestion)
            
        # Validate suggestions quality
        valid_suggestions = []
        for suggestion in suggestions:
            # Check if suggestion is complete and meaningful
            if (len(suggestion.strip()) >= 20 and  # Minimum meaningful length
                any(suggestion.endswith(p) for p in ['.', '!', '?']) and  # Proper ending
                not suggestion.endswith('...')):  # Not truncated
                valid_suggestions.append(suggestion)

        # Use fallback if suggestions aren't valid
        if len(valid_suggestions) < 3:
            valid_suggestions = [
                "Implement real-time emission monitoring system for daily tracking.",
                "Establish monthly reduction targets with performance reviews.",
                "Optimize high-emission processes through systematic analysis."
            ]
        
        # Ensure consistent formatting
        suggestions = valid_suggestions[:3]  # Keep only top 3 suggestions

        return suggestions
    except Exception as e:
        print(f"Error generating AI suggestions: {str(e)}")
        return ["Unable to generate AI suggestions at this time."]

def create_pdf_report(report_data):
    buffer = BytesIO()
    p = canvas.Canvas(buffer, pagesize=letter)
    width, height = letter

    # Title
    p.setFont("Helvetica-Bold", 24)
    p.drawString(100, height - 100, "Carbon Emission Report")

    # Date
    p.setFont("Helvetica", 12)
    p.drawString(100, height - 130, f"Generated on: {datetime.now().strftime('%B %d, %Y')}")

    # Emission Data
    p.setFont("Helvetica-Bold", 14)
    p.drawString(100, height - 180, "Emission Summary")
    
    y_position = height - 210
    p.setFont("Helvetica", 12)

    # Selected Log Data
    if report_data.get('selectedLogData'):
        data = report_data['selectedLogData']
        p.drawString(100, y_position, f"Period: {data['start_date']} to {data['end_date']}")
        y_position -= 20
        p.drawString(100, y_position, f"Total Emissions: {data.get('total_emissions', 0):.2f} kg CO₂e")
        y_position -= 40

    # Comparison Data
    if report_data.get('comparisonData'):
        p.setFont("Helvetica-Bold", 14)
        p.drawString(100, y_position, "Comparison Data")
        y_position -= 30
        p.setFont("Helvetica", 12)
        
        data = report_data['comparisonData']
        comparison_type = report_data.get('comparisonType', 'baseline')
        
        if comparison_type == 'baseline':
            p.drawString(100, y_position, "Baseline Comparison")
        else:
            p.drawString(100, y_position, f"Period: {data['start_date']} to {data['end_date']}")
            y_position -= 20
            p.drawString(100, y_position, f"Total Emissions: {data.get('total_emissions', 0):.2f} kg CO₂e")
        y_position -= 40

    # Summary
    if report_data.get('summary'):
        p.setFont("Helvetica-Bold", 14)
        p.drawString(100, y_position, "Analysis Summary")
        y_position -= 30
        p.setFont("Helvetica", 12)
        
        summary = report_data['summary']
        if 'average' in summary:
            p.drawString(100, y_position, f"Average Emissions: {summary['average']:.2f} kg CO₂e")
            y_position -= 20
        if 'peak' in summary:
            p.drawString(100, y_position, f"Peak Value: {summary['peak']:.2f} kg CO₂e")
            y_position -= 20
        if 'change' in summary:
            p.drawString(100, y_position, f"Change: {summary['change']:+.2f}%")
            y_position -= 40

    # AI Suggestions Section
    if report_data.get('suggestions'):
        p.setFont("Helvetica-Bold", 14)
        p.drawString(100, y_position, "AI-Generated Suggestions")
        y_position -= 30
        
        for idx, suggestion in enumerate(report_data['suggestions'], 1):
            # Check if we need a new page
            if y_position < 100:
                p.showPage()
                y_position = height - 100
                p.setFont("Helvetica", 12)

            # Draw bullet point
            p.setFont("Helvetica-Bold", 12)
            p.drawString(100, y_position, f"{idx}.")
            
            # Draw suggestion text with proper wrapping
            p.setFont("Helvetica", 12)
            words = suggestion.split()
            line = ""
            x_start = 120  # Indented position after bullet point
            
            for word in words:
                test_line = line + " " + word if line else word
                if p.stringWidth(test_line) < width - 220:  # Account for margins and indent
                    line = test_line
                else:
                    p.drawString(x_start, y_position, line.strip())
                    y_position -= 20
                    line = word
                    
            if line:  # Draw the last line
                p.drawString(x_start, y_position, line.strip())
                y_position -= 30  # Extra space between suggestions

    p.save()
    buffer.seek(0)
    return buffer

@report_bp.route('/generate', methods=['POST'])
@jwt_required()
def generate_report():
    try:
        current_user = get_jwt_identity()
        user = db.users.find_one({'email': current_user})
        if not user:
            return jsonify({"error": "User not found"}), 404

        data = request.get_json()
        selected_logs = data.get('logs', [])
        
        if not selected_logs or not (1 <= len(selected_logs) <= 2):
            return jsonify({"error": "Select one or two emission logs"}), 400

        user_id = str(user['_id'])
        
        # Get primary emission data
        primary_emission = get_emission_data(selected_logs[0])
        if not primary_emission:
            return jsonify({"error": "Primary emission log not found"}), 404

        # Initialize report data
        report_data = {
            'selectedLogData': primary_emission,
            'comparisonType': 'baseline' if len(selected_logs) == 1 else 'comparison'
        }

        # Get comparison data
        if len(selected_logs) == 1:
            comparison_data = calculate_baseline(user_id)
            if comparison_data:
                report_data['comparisonData'] = comparison_data
        else:
            comparison_data = get_emission_data(selected_logs[1])
            if comparison_data:
                report_data['comparisonData'] = comparison_data

        # Check if report already exists for these logs
        existing_report = None
        if len(selected_logs) == 1:
            existing_report = db.reports.find_one({
                'user_id': user_id,
                'selected_logs': selected_logs,
                'comparison_type': 'baseline'
            })
        else:
            # For two logs, check both orders
            existing_report = db.reports.find_one({
                'user_id': user_id,
                'selected_logs': {'$all': selected_logs},
                'comparison_type': 'comparison'
            })

        if existing_report:
            print(f"Using cached report: {str(existing_report['_id'])}")
            return jsonify({
                "reportId": str(existing_report['_id']),
                "reportData": existing_report['report_data']
            }), 200

        # Calculate summary statistics
        if comparison_data:
            primary_value = primary_emission['total_emissions']
            if report_data['comparisonType'] == 'baseline':
                comparison_value = np.mean([point['value'] for point in comparison_data['values']])
            else:
                comparison_value = comparison_data['total_emissions']

            # Calculate percentage change with bounds
            if comparison_value != 0:
                change_percentage = ((primary_value - comparison_value) / comparison_value) * 100
                # Limit to reasonable range (-100% to +1000%)
                change_percentage = max(-100, min(1000, change_percentage))
            else:
                change_percentage = 0  # Avoid division by zero

            report_data['summary'] = {
                'average': primary_value,
                'peak': max(primary_value, comparison_value),
                'change': round(change_percentage, 2)  # Round to 2 decimal places
            }

        # Generate AI suggestions
        suggestions = generate_ai_suggestions(
            primary_emission,
            comparison_data,
            report_data['comparisonType']
        )
        report_data['suggestions'] = suggestions

        # Create and save report
        report = Report(
            user_id=user_id,
            selected_logs=selected_logs,
            comparison_type=report_data['comparisonType'],
            report_data=report_data,
            suggestions=suggestions
        )
        
        result = db.reports.insert_one(report.to_dict())
        report_id = str(result.inserted_id)

        return jsonify({
            "reportId": report_id,
            "reportData": report_data
        }), 200

    except Exception as e:
        print(f"Error generating report: {str(e)}")
        return jsonify({"error": "Failed to generate report"}), 500

@report_bp.route('/download/<report_id>', methods=['GET'])
@jwt_required()
def download_report(report_id):
    try:
        current_user = get_jwt_identity()
        user = db.users.find_one({'email': current_user})
        if not user:
            return jsonify({"error": "User not found"}), 404

        # Verify report belongs to user
        report = db.reports.find_one({
            '_id': ObjectId(report_id),
            'user_id': str(user['_id'])
        })
        
        if not report:
            return jsonify({"error": "Report not found"}), 404

        # Generate PDF
        pdf_buffer = create_pdf_report(report['report_data'])
        
        return send_file(
            pdf_buffer,
            mimetype='application/pdf',
            as_attachment=True,
            download_name=f'emission-report-{report_id}.pdf'
        )

    except Exception as e:
        print(f"Error downloading report: {str(e)}")
        return jsonify({"error": "Failed to download report"}), 500
