from datetime import datetime

class UserUnits:
    INDUSTRY_DEFAULTS = {
        'Manufacturing': {
            'electricity': {
                'units': [
                    {'name': 'kWh', 'emission_factor': 0.233},
                    {'name': 'MWh', 'emission_factor': 233}
                ]
            },
            'gas': {
                'units': [
                    {'name': 'm³', 'emission_factor': 2.02},
                    {'name': 'ft³', 'emission_factor': 0.057}
                ]
            },
            'fuel': {
                'units': [
                    {'name': 'L', 'emission_factor': 2.31},
                    {'name': 'gal', 'emission_factor': 8.74}
                ]
            },
            'waste': {
                'units': [
                    {'name': 'kg', 'emission_factor': 2.86},
                    {'name': 'ton', 'emission_factor': 2860}
                ]
            },
            'water': {
                'units': [
                    {'name': 'm³', 'emission_factor': 0.344}
                ]
            }
        },
        'Agriculture': {
            'electricity': {
                'units': [
                    {'name': 'kWh', 'emission_factor': 0.233},
                    {'name': 'MWh', 'emission_factor': 233}
                ]
            },
            'irrigation': {
                'units': [
                    {'name': 'm³', 'emission_factor': 0.344},
                    {'name': 'L', 'emission_factor': 0.000344}
                ]
            },
            'fertilizer': {
                'units': [
                    {'name': 'kg', 'emission_factor': 4.95},
                    {'name': 'ton', 'emission_factor': 4950}
                ]
            },
            'pesticides': {
                'units': [
                    {'name': 'L', 'emission_factor': 25.5},
                    {'name': 'gal', 'emission_factor': 96.5}
                ]
            },
            'fuel': {
                'units': [
                    {'name': 'L', 'emission_factor': 2.31},
                    {'name': 'gal', 'emission_factor': 8.74}
                ]
            }
        },
        'Textile': {
            'electricity': {
                'units': [
                    {'name': 'kWh', 'emission_factor': 0.233},
                    {'name': 'MWh', 'emission_factor': 233}
                ]
            },
            'water': {
                'units': [
                    {'name': 'm³', 'emission_factor': 0.344},
                    {'name': 'L', 'emission_factor': 0.000344}
                ]
            },
            'dyes': {
                'units': [
                    {'name': 'kg', 'emission_factor': 12.5},
                    {'name': 'ton', 'emission_factor': 12500}
                ]
            },
            'chemicals': {
                'units': [
                    {'name': 'kg', 'emission_factor': 8.2},
                    {'name': 'ton', 'emission_factor': 8200}
                ]
            },
            'waste': {
                'units': [
                    {'name': 'kg', 'emission_factor': 2.86},
                    {'name': 'ton', 'emission_factor': 2860}
                ]
            }
        }
    }

    def __init__(self, user_id, industry, **kwargs):
        if not user_id:
            raise ValueError("user_id is required")
        if not industry:
            raise ValueError("industry is required")
            
        if industry not in self.INDUSTRY_DEFAULTS:
            industry = 'Manufacturing'
            
        self.user_id = user_id
        self.industry = industry
        self.metrics = self.INDUSTRY_DEFAULTS[self.industry].copy()
        self.created_at = kwargs.get('created_at', datetime.utcnow())
        self.updated_at = kwargs.get('updated_at', datetime.utcnow())
        
    def to_dict(self):
        return {
            'user_id': self.user_id,
            'industry': self.industry,
            'metrics': self.metrics,
            'created_at': self.created_at,
            'updated_at': self.updated_at
        }

    @staticmethod
    def get_default_units(industry):
        return UserUnits.INDUSTRY_DEFAULTS.get(industry, UserUnits.INDUSTRY_DEFAULTS['Manufacturing'])

    def update_metric_name(self, original_name, new_name):
        if original_name in self.metrics:
            self.metrics[new_name] = self.metrics.pop(original_name)

    def delete_metric(self, name):
        if name in self.metrics:
            del self.metrics[name]
