from flask import Flask, jsonify
from flask_sqlalchemy import SQLAlchemy
from flask_cors import CORS
import os

app = Flask(__name__)
CORS(app, resources={r"/*": {"origins": "http://localhost:8000"}})

# Use an absolute path for the database URI
db_path = os.path.join(os.path.abspath(os.path.dirname(__file__)), 'instance', 'events.db')
app.config['SQLALCHEMY_DATABASE_URI'] = f'sqlite:///{db_path}'
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
db = SQLAlchemy(app)

class Event(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    title = db.Column(db.String(80), nullable=False)
    description = db.Column(db.String(200), nullable=False)
    date = db.Column(db.String(20), nullable=False)
    location = db.Column(db.String(120), nullable=False)
    available_tickets = db.Column(db.Integer, nullable=False)

# Initialize database
with app.app_context():
    db.create_all()

@app.route('/ping', methods=['GET'])
def ping():
    return "pong", 200

@app.route('/api/events', methods=['GET'])
def get_events():
    try:
        events = Event.query.all()
        if not events:
            app.logger.warning("No events found in the database.")
            return jsonify({'message': 'No events found'}), 404

        event_list = []
        for event in events:
            event_data = {
                'id': event.id,
                'title': event.title,
                'description': event.description,
                'date': event.date,
                'location': event.location,
                'available_tickets': event.available_tickets
            }
            event_list.append(event_data)
        return jsonify(event_list)
    except Exception as e:
        app.logger.error(f"Error fetching events: {str(e)}")
        return jsonify({'error': 'An error occurred while fetching events'}), 500

@app.route('/api/events/add_sample', methods=['POST'])
def add_sample_events():
    try:
        sample_events = [
            {
                'title': 'Sample Event 1',
                'description': 'This is a sample event 1',
                'date': '2024-08-01',
                'location': 'Location 1',
                'available_tickets': 100
            },
            {
                'title': 'Sample Event 2',
                'description': 'This is a sample event 2',
                'date': '2024-08-02',
                'location': 'Location 2',
                'available_tickets': 150
            }
        ]
        for sample_event in sample_events:
            event = Event(
                title=sample_event['title'],
                description=sample_event['description'],
                date=sample_event['date'],
                location=sample_event['location'],
                available_tickets=sample_event['available_tickets']
            )
            db.session.add(event)
        db.session.commit()
        return jsonify({'message': 'Sample events added successfully!'}), 201
    except Exception as e:
        app.logger.error(f"Error adding sample events: {str(e)}")
        return jsonify({'error': 'An error occurred while adding sample events'}), 500

if __name__ == '__main__':
    app.run(debug=True, port=5000)
