from flask import Flask
from flask_socketio import SocketIO
from my_server.config import Config

app = Flask(__name__)

app.config.from_object(Config)

# Initialize Socket.IO
socketio = SocketIO(app, cors_allowed_origins="*")  # Allow cross-origin requests

from my_server import routes, error


