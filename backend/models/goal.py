from datetime import datetime
from bson import ObjectId

class Goal:
    def __init__(self, user_id, title, target_reduction, 
                 start_date, end_date, baseline, 
                 baseline_start_date, baseline_end_date, 
                 description='', created_at=None, updated_at=None):
        self.user_id = user_id
        self.title = title
        self.target_reduction = target_reduction
        self.start_date = start_date
        self.end_date = end_date
        self.baseline = baseline
        self.baseline_start_date = baseline_start_date
        self.baseline_end_date = baseline_end_date
        self.description = description
        self.created_at = created_at or datetime.utcnow()
        self.updated_at = updated_at or datetime.utcnow()

    def to_dict(self):
        return {
            'user_id': self.user_id,
            'title': self.title,
            'target_reduction': float(self.target_reduction),  # Ensure numeric type
            'start_date': self.start_date,
            'end_date': self.end_date,
            'baseline': float(self.baseline),  # Ensure numeric type
            'baseline_start_date': self.baseline_start_date,
            'baseline_end_date': self.baseline_end_date,
            'description': self.description,
            'created_at': self.created_at,
            'updated_at': self.updated_at
        }

    @staticmethod
    def from_dict(data):
        return Goal(
            user_id=data.get('user_id'),
            title=data.get('title'),
            target_reduction=data.get('target_reduction'),
            start_date=data.get('start_date'),
            end_date=data.get('end_date'),
            baseline=data.get('baseline'),
            baseline_start_date=data.get('baseline_start_date'),
            baseline_end_date=data.get('baseline_end_date'),
            description=data.get('description', ''),
            created_at=data.get('created_at'),
            updated_at=data.get('updated_at')
        )
