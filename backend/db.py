from pymongo import MongoClient
from dotenv import load_dotenv
import os

# Load environment variables
load_dotenv()

# MongoDB connection
try:
    client = MongoClient(os.getenv('MONGODB_URI'))
    db = client[os.getenv('DATABASE_NAME')]
    
    # Initialize collections if they don't exist
    collections = ['emissions', 'user_units', 'reports', 'products']
    for collection in collections:
        if collection not in db.list_collection_names():
            db.create_collection(collection)
            
except Exception as e:
    print(f"MongoDB connection error: {str(e)}")
    raise
