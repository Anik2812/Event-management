const API_BASE_URL = 'http://localhost:8000/api';

const eventList = document.getElementById('eventList');
const createEvent = document.getElementById('createEvent');
const eventDetails = document.getElementById('eventDetails');
const showEventsBtn = document.getElementById('showEventsBtn');
const showCreateEventBtn = document.getElementById('showCreateEventBtn');
const eventsContainer = document.getElementById('events');
const createEventForm = document.getElementById('createEventForm');
const notification = document.getElementById('notification');
const searchInput = document.getElementById('searchInput');
const categoryFilter = document.getElementById('categoryFilter');
const registrationForm = document.getElementById('registrationForm');
const backToEventsBtn = document.getElementById('backToEvents');
const loadingIndicator = document.getElementById('loading');

let allEvents = [];

function showNotification(message, isError = false) {
    notification.textContent = message;
    notification.style.backgroundColor = isError ? '#e74c3c' : '#2ecc71';
    notification.classList.remove('hidden');
    setTimeout(() => {
        notification.classList.add('hidden');
    }, 3000);
}

function showSection(section) {
    eventList.classList.add('hidden');
    createEvent.classList.add('hidden');
    eventDetails.classList.add('hidden');
    section.classList.remove('hidden');
}

function showLoading() {
    loadingIndicator.classList.remove('hidden');
}

function hideLoading() {
    loadingIndicator.classList.add('hidden');
}

showEventsBtn.addEventListener('click', () => {
    showSection(eventList);
    fetchEvents();
});

showCreateEventBtn.addEventListener('click', () => {
    showSection(createEvent);
});

backToEventsBtn.addEventListener('click', () => {
    showSection(eventList);
});

createEventForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const formData = new FormData(createEventForm);
    const eventData = Object.fromEntries(formData.entries());
    
    eventData.date = new Date(eventData.date).toISOString();
    
    showLoading();
    fetch(`${API_BASE_URL}/events`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(eventData),
    })
    .then(response => {
        if (!response.ok) {
            throw new Error('Network response was not ok');
        }
        return response.json();
    })
    .then(data => {
        showNotification(data.message);
        createEventForm.reset();
        showEventsBtn.click();
    })
    .catch(error => {
        console.error('Error:', error);
        showNotification('Error creating event: ' + error.message, true);
    })
    .finally(() => {
        hideLoading();
    });
});

function fetchEvents() {
    showLoading();
    eventsContainer.innerHTML = '<p>Loading events...</p>';
    fetch(`${API_BASE_URL}/events`)
        .then(response => {
            if (!response.ok) {
                throw new Error('Network response was not ok');
            }
            return response.json();
        })
        .then(events => {
            allEvents = events;
            updateCategoryFilter(events);
            renderEvents(events);
        })
        .catch(error => {
            console.error('Error:', error);
            eventsContainer.innerHTML = `
                <p>Error loading events. Please try again later.</p>
                <button onclick="fetchEvents()">Retry</button>
            `;
            showNotification('Failed to load events. Please check your internet connection and try again.', true);
        })
        .finally(() => {
            hideLoading();
        });
}

function renderEvents(events) {
    if (events.length === 0) {
        eventsContainer.innerHTML = '<p>No events found. Create a new event!</p>';
    } else {
        eventsContainer.innerHTML = '';
        events.forEach((event, index) => {
            const eventCard = createEventCard(event);
            eventCard.style.animationDelay = `${index * 0.1}s`;
            eventsContainer.appendChild(eventCard);
        });
    }
}

function createEventCard(event) {
    const card = document.createElement('div');
    card.className = 'event-card';
    card.innerHTML = `
        
        <h3>${event.title}</h3>
        <p>${event.description.substring(0, 100)}${event.description.length > 100 ? '...' : ''}</p>
        <p><i class="fas fa-calendar-alt"></i> ${new Date(event.date).toLocaleString()}</p>
        <p><i class="fas fa-map-marker-alt"></i> ${event.location}</p>
        <p><i class="fas fa-ticket-alt"></i> Available Tickets: ${event.available_tickets}</p>
        <p><i class="fas fa-tag"></i> ${event.category}</p>
        <button onclick="showEventDetails(${event.id})">View Details</button>
    `;
    return card;
}

function showEventDetails(eventId) {
    const event = allEvents.find(e => e.id === eventId);
    if (event) {
        document.getElementById('eventTitle').textContent = event.title;
        
        document.getElementById('eventDescription').textContent = event.description;
        document.getElementById('eventDateTime').textContent = `Date and Time: ${new Date(event.date).toLocaleString()}`;
        document.getElementById('eventLocation').textContent = `Location: ${event.location}`;
        document.getElementById('eventTickets').textContent = `Available Tickets: ${event.available_tickets}`;
        document.getElementById('eventCategory').textContent = `Category: ${event.category}`;
        registrationForm.onsubmit = (e) => registerForEvent(e, eventId);
        showSection(eventDetails);
    }
}

function registerForEvent(e, eventId) {
    e.preventDefault();
    const name = document.getElementById('attendeeName').value;
    const email = document.getElementById('attendeeEmail').value;

    showLoading();
    fetch(`${API_BASE_URL}/events/${eventId}/register`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ name, email }),
    })
    .then(response => {
        if (!response.ok) {
            throw new Error('Network response was not ok');
        }
        return response.json();
    })
    .then(data => {
        showNotification(data.message);
        registrationForm.reset();
        showEventsBtn.click();
    })
    .catch(error => {
        console.error('Error:', error);
        showNotification('Error registering for event: ' + error.message, true);
    })
    .finally(() => {
        hideLoading();
    });
}

function updateCategoryFilter(events) {
    const categories = [...new Set(events.map(event => event.category))];
    categoryFilter.innerHTML = '<option value="">All Categories</option>';
    categories.forEach(category => {
        const option = document.createElement('option');
        option.value = category;
        option.textContent = category;
        categoryFilter.appendChild(option);
    });
}

function filterEvents() {
    const searchTerm = searchInput.value.toLowerCase();
    const selectedCategory = categoryFilter.value;

    const filteredEvents = allEvents.filter(event => {
        const matchesSearch = event.title.toLowerCase().includes(searchTerm) || 
                              event.description.toLowerCase().includes(searchTerm);
        const matchesCategory = !selectedCategory || event.category === selectedCategory;
        return matchesSearch && matchesCategory;
    });

    renderEvents(filteredEvents);
}

searchInput.addEventListener('input', filterEvents);
categoryFilter.addEventListener('change', filterEvents);

// Add smooth scrolling
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        e.preventDefault();
        document.querySelector(this.getAttribute('href')).scrollIntoView({
            behavior: 'smooth'
        });
    });
});

// Add interactive hover effects
eventsContainer.addEventListener('mouseover', (e) => {
    if (e.target.closest('.event-card')) {
        e.target.closest('.event-card').style.transform = 'scale(1.05)';
    }
});

eventsContainer.addEventListener('mouseout', (e) => {
    if (e.target.closest('.event-card')) {
        e.target.closest('.event-card').style.transform = 'scale(1)';
    }
});

// Add a "scroll to top" button
const scrollToTopBtn = document.createElement('button');
scrollToTopBtn.textContent = '↑';
scrollToTopBtn.style.position = 'fixed';
scrollToTopBtn.style.bottom = '20px';
scrollToTopBtn.style.right = '20px';
scrollToTopBtn.style.display = 'none';
scrollToTopBtn.addEventListener('click', () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
});
document.body.appendChild(scrollToTopBtn);

window.addEventListener('scroll', () => {
    if (window.pageYOffset > 300) {
        scrollToTopBtn.style.display = 'block';
    } else {
        scrollToTopBtn.style.display = 'none';
    }
});

// Initial load
showEventsBtn.click();

// Periodically refresh events
setInterval(fetchEvents, 300000); // Refresh every 5 minutes