from datetime import datetime

class EmissionLog:
    def __init__(self, user_id, industry_name, inputs, **kwargs):
        self.user_id = user_id
        self.industry_name = industry_name
        self.inputs = inputs  # Directly assign inputs as received
        
        # Calculate total emissions
        self.total_emissions = kwargs.get('total_emissions', 
            sum(input_data['emissions'] for input_data in self.inputs.values())
        )
        self.logged_at = kwargs.get('logged_at', datetime.utcnow())

    def to_dict(self):
        return {
            'user_id': self.user_id,
            'industry_name': self.industry_name,
            'inputs': self.inputs,
            'total_emissions': self.total_emissions,
            'logged_at': self.logged_at
        }
