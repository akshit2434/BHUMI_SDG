from datetime import datetime

class Product:
    def __init__(self, title, description, price_per_unit, unit, contact, available_units=None, user_name=None, user_id=None, created_at=None, updated_at=None, _id=None):
        self._id = _id
        self.title = title
        self.description = description
        self.price_per_unit = price_per_unit
        self.unit = unit
        self.contact = contact
        self.available_units = available_units or 0
        self.user_name = user_name or "Unknown"
        self.user_id = user_id
        # Handle both string and datetime inputs for dates
        self.created_at = created_at if isinstance(created_at, str) else datetime.utcnow().isoformat()
        self.updated_at = updated_at if isinstance(updated_at, str) else datetime.utcnow().isoformat()

    def to_dict(self):
        product_dict = {
            'title': self.title,
            'description': self.description,
            'price_per_unit': self.price_per_unit,
            'unit': self.unit,
            'contact': self.contact,
            'available_units': self.available_units,
            'user_name': self.user_name,
            'user_id': self.user_id,
            'created_at': self.created_at,
            'updated_at': self.updated_at
        }
        if self._id:
            product_dict['_id'] = str(self._id)
        return product_dict