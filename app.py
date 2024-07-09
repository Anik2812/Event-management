from flask import Flask, jsonify
from flask_sqlalchemy import SQLAlchemy

app = Flask(__name__)
app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///events.db'
db = SQLAlchemy(app)

class Event(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    title = db.Column(db.String(80), nullable=False)
    description = db.Column(db.String(200), nullable=False)
    date = db.Column(db.String(20), nullable=False)
    location = db.Column(db.String(120), nullable=False)
    available_tickets = db.Column(db.Integer, nullable=False)
@app.route('/api/events', methods=['GET'])
def get_events():
    try:
        events = Event.query.all()
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

if __name__ == '__main__':
    app.run(debug=True)
