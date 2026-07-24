import sys
import os

# Add the backend directory to the Python path so imports like 'from app.main' work
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', 'backend'))

from app.main import app
