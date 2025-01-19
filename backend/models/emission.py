from datetime import datetime

class EmissionLog:
    def __init__(self, user_id, inputs, total_emissions, start_date, end_date, logged_at=None):
        self.user_id = user_id
        self.inputs = inputs
        self.total_emissions = total_emissions
        self.start_date = start_date
        self.end_date = end_date
        self.logged_at = logged_at or datetime.utcnow()

    def to_dict(self):
        return {
            'user_id': self.user_id,
            'inputs': self.inputs,
            'total_emissions': self.total_emissions,
            'start_date': self.start_date,
            'end_date': self.end_date,
            'logged_at': self.logged_at
        }
