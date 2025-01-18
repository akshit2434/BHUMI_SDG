from datetime import datetime

class User:
    def __init__(self, email, password, **kwargs):
        self.email = email
        self.password = password
        self.full_name = kwargs.get('full_name', '')
        self.phone = kwargs.get('phone', '')
        self.organization = kwargs.get('organization', '')
        self.role = kwargs.get('role', 'user')
        self.is_details_filled = kwargs.get('is_details_filled', False)
        self.created_at = kwargs.get('created_at', datetime.utcnow())

    def to_dict(self):
        return {
            'email': self.email,
            'password': self.password,
            'full_name': self.full_name,
            'phone': self.phone,
            'organization': self.organization,
            'role': self.role,
            'is_details_filled': self.is_details_filled,
            'created_at': self.created_at
        }
