from flask import Flask, request, jsonify
from flask_sqlalchemy import SQLAlchemy
from flask_cors import CORS
from datetime import datetime
import os

app = Flask(__name__)
CORS(app)
app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///events.db'
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
db = SQLAlchemy(app)

class Event(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    title = db.Column(db.String(100), nullable=False)
    description = db.Column(db.Text, nullable=False)
    date = db.Column(db.DateTime, nullable=False)
    location = db.Column(db.String(100), nullable=False)
    available_tickets = db.Column(db.Integer, nullable=False)
    image_url = db.Column(db.String(200))
    category = db.Column(db.String(50))

class Registration(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    event_id = db.Column(db.Integer, db.ForeignKey('event.id'), nullable=False)
    attendee_name = db.Column(db.String(100), nullable=False)
    attendee_email = db.Column(db.String(100), nullable=False)

@app.route('/api/events', methods=['GET', 'POST'])
def events():
    if request.method == 'GET':
        events = Event.query.all()
        return jsonify([{
            'id': e.id,
            'title': e.title,
            'description': e.description,
            'date': e.date.isoformat(),
            'location': e.location,
            'available_tickets': e.available_tickets,
            'image_url': e.image_url,
            'category': e.category
        } for e in events])
    elif request.method == 'POST':
        data = request.json
        new_event = Event(
            title=data['title'],
            description=data['description'],
            date=datetime.fromisoformat(data['date']),
            location=data['location'],
            available_tickets=int(data['available_tickets']),
            image_url=data.get('image_url', ''),
            category=data.get('category', 'Uncategorized')
        )
        db.session.add(new_event)
        db.session.commit()
        return jsonify({'message': 'Event created successfully'}), 201

@app.route('/api/events/<int:event_id>/register', methods=['POST'])
def register_event(event_id):
    event = Event.query.get_or_404(event_id)
    data = request.json
    if event.available_tickets > 0:
        registration = Registration(
            event_id=event_id,
            attendee_name=data['name'],
            attendee_email=data['email']
        )
        event.available_tickets -= 1
        db.session.add(registration)
        db.session.commit()
        return jsonify({'message': 'Registration successful'}), 200
    else:
        return jsonify({'message': 'No available tickets'}), 400

@app.route('/api/events/<int:event_id>', methods=['GET', 'PUT', 'DELETE'])
def event(event_id):
    event = Event.query.get_or_404(event_id)
    if request.method == 'GET':
        return jsonify({
            'id': event.id,
            'title': event.title,
            'description': event.description,
            'date': event.date.isoformat(),
            'location': event.location,
            'available_tickets': event.available_tickets,
            'image_url': event.image_url,
            'category': event.category
        })
    elif request.method == 'PUT':
        data = request.json
        event.title = data.get('title', event.title)
        event.description = data.get('description', event.description)
        event.date = datetime.fromisoformat(data.get('date', event.date.isoformat()))
        event.location = data.get('location', event.location)
        event.available_tickets = int(data.get('available_tickets', event.available_tickets))
        event.image_url = data.get('image_url', event.image_url)
        event.category = data.get('category', event.category)
        db.session.commit()
        return jsonify({'message': 'Event updated successfully'})
    elif request.method == 'DELETE':
        db.session.delete(event)
        db.session.commit()
        return jsonify({'message': 'Event deleted successfully'})

if __name__ == '__main__':
    with app.app_context():
        db.create_all()
    app.run(debug=True, port=8000)