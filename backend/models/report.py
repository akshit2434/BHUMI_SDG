from datetime import datetime
from bson import ObjectId

class Report:
    def __init__(
        self,
        user_id,
        selected_logs,
        comparison_type,
        report_data=None,
        suggestions=None,
        created_at=None,
        _id=None
    ):
        self._id = _id or ObjectId()
        self.user_id = user_id
        self.selected_logs = selected_logs
        self.comparison_type = comparison_type  # 'baseline' or 'comparison'
        self.report_data = report_data or {}
        self.suggestions = suggestions or []
        self.created_at = created_at or datetime.utcnow()

    @property
    def id(self):
        return str(self._id)

    def to_dict(self):
        return {
            '_id': self._id,
            'user_id': self.user_id,
            'selected_logs': self.selected_logs,
            'comparison_type': self.comparison_type,
            'report_data': self.report_data,
            'suggestions': self.suggestions,
            'created_at': self.created_at
        }

    @classmethod
    def from_dict(cls, data):
        return cls(
            _id=data.get('_id'),
            user_id=data.get('user_id'),
            selected_logs=data.get('selected_logs', []),
            comparison_type=data.get('comparison_type'),
            report_data=data.get('report_data', {}),
            suggestions=data.get('suggestions', []),
            created_at=data.get('created_at')
        )