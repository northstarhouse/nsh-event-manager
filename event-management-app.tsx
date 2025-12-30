import React, { useState, useEffect } from 'react';
import { Calendar, Upload, Plus, ChevronRight, AlertCircle, CheckCircle2, Clock } from 'lucide-react';

const EventManagementApp = () => {
  const [events, setEvents] = useState([]);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [showNewEventForm, setShowNewEventForm] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(null);

  const marketingChecklist = [
    { id: 'press-release', label: 'Create Press Release' },
    { id: 'flyer', label: 'Create Flyer' },
    { id: 'website', label: 'Make Event Page on Website' },
    { id: 'email', label: 'Send Email Blast' },
    { id: 'yubanet', label: 'YubaNet (Press Release Only - if worthy)', special: true },
    { id: 'go-nv', label: 'Go Nevada County Calendar' },
    { id: 'arts', label: 'Arts Council Calendar' },
    { id: 'chamber', label: 'Grass Valley Chamber Newsletter (2 weeks prior)', special: true },
    { id: 'kvmr', label: 'KVMR Calendar' },
    { id: 'fb-event', label: 'Facebook Event Page' },
    { id: 'fb-nsh', label: 'NSH Facebook Page' },
    { id: 'ig-nsh', label: 'NSH Instagram Page' },
    { id: 'nv-peeps', label: 'Nevada County Peeps' },
    { id: 'gv-peeps', label: 'Grass Valley Peeps' },
    { id: 'lake-wildwood', label: 'Lake Wildwood Page' },
    { id: 'nextdoor', label: 'NextDoor' },
    { id: 'union-cal', label: 'Union Event Calendar' },
    { id: 'union-ad', label: 'Union Advertisement ($270 - rare)', special: true },
    { id: 'other', label: 'Other' }
  ];

  const [newEvent, setNewEvent] = useState({
    name: '',
    date: '',
    isTBD: false,
    targetAttendance: '',
    currentRSVPs: '',
    flyerImage: null,
    checklist: {},
    notes: '',
    postEventAttendance: '',
    postEventNotes: ''
  });

  const calculateDaysUntil = (dateString) => {
    if (!dateString) return null;
    const eventDate = new Date(dateString);
    const today = new Date();
    const diffTime = eventDate - today;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const getProgressPercentage = (current, target) => {
    if (!target || target === 0) return 0;
    return Math.round((current / target) * 100);
  };

  const getStatusColor = (percentage) => {
    if (percentage >= 90) return 'text-emerald-600';
    if (percentage >= 70) return 'text-rose-600';
    return 'text-rose-700';
  };

  const getStatusLabel = (percentage) => {
    if (percentage >= 90) return 'On track';
    if (percentage >= 70) return 'Slightly behind';
    return 'Needs attention';
  };

  const getChecklistCompletion = (checklist) => {
    const completed = Object.values(checklist).filter(v => v).length;
    return `${completed}/${marketingChecklist.length}`;
  };

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setNewEvent({ ...newEvent, flyerImage: reader.result });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleCreateEvent = () => {
    const event = {
      ...newEvent,
      id: Date.now(),
      createdAt: new Date().toISOString()
    };
    setEvents([...events, event]);
    setShowNewEventForm(false);
    setNewEvent({
      name: '',
      date: '',
      isTBD: false,
      targetAttendance: '',
      currentRSVPs: '',
      flyerImage: null,
      checklist: {},
      notes: '',
      postEventAttendance: '',
      postEventNotes: ''
    });
  };

  const toggleChecklistItem = (eventId, itemId) => {
    setEvents(events.map(event => {
      if (event.id === eventId) {
        return {
          ...event,
          checklist: {
            ...event.checklist,
            [itemId]: !event.checklist[itemId]
          }
        };
      }
      return event;
    }));
    if (selectedEvent && selectedEvent.id === eventId) {
      setSelectedEvent({
        ...selectedEvent,
        checklist: {
          ...selectedEvent.checklist,
          [itemId]: !selectedEvent.checklist[itemId]
        }
      });
    }
  };

  const updateEventField = (eventId, field, value) => {
    setEvents(events.map(event => {
      if (event.id === eventId) {
        return { ...event, [field]: value };
      }
      return event;
    }));
    if (selectedEvent && selectedEvent.id === eventId) {
      setSelectedEvent({ ...selectedEvent, [field]: value });
    }
  };

  const getSuggestions = (level, daysUntil) => {
    const highImpact = [
      'Post a reminder with urgency framing ("2 weeks away")',
      'Share to Stories or reshare the flyer',
      'Send a reminder email or calendar post',
      'Personally invite 5-10 people or partners'
    ];

    const mediumImpact = [
      'Add a FAQ or clarification post',
      'Repost with a different headline or image',
      'Highlight what attendees will experience'
    ];

    const optionalBoost = [
      'Consider adding an incentive (free, bonus, reminder framing)',
      'Review: does the event need clearer positioning?'
    ];

    if (level === 'high') return highImpact;
    if (level === 'medium') return mediumImpact;
    return optionalBoost;
  };

  if (selectedEvent) {
    const daysUntil = calculateDaysUntil(selectedEvent.date);
    const progress = getProgressPercentage(
      parseInt(selectedEvent.currentRSVPs) || 0,
      parseInt(selectedEvent.targetAttendance) || 0
    );
    const statusColor = getStatusColor(progress);
    const statusLabel = getStatusLabel(progress);
    const isPastEvent = daysUntil !== null && daysUntil < 0;

    return (
      <div className="min-h-screen bg-gradient-to-br from-rose-50 via-pink-50 to-amber-50 p-6">
        <div className="max-w-4xl mx-auto">
          <button
            onClick={() => setSelectedEvent(null)}
            className="mb-6 text-amber-600 hover:text-amber-700 font-medium"
          >
            <- Back to Dashboard
          </button>

          <div className="bg-white rounded-lg shadow-lg border border-rose-200 overflow-hidden">
            {selectedEvent.flyerImage && (
              <div className="w-full h-64 bg-gray-100">
                <img
                  src={selectedEvent.flyerImage}
                  alt={selectedEvent.name}
                  className="w-full h-full object-cover"
                />
              </div>
            )}

            <div className="p-8">
              <h1 className="text-3xl font-light text-rose-900 mb-2">{selectedEvent.name}</h1>
              <div className="flex items-center gap-4 text-rose-700 mb-6">
                <div className="flex items-center gap-2">
                  <Calendar size={18} />
                  <span>{selectedEvent.isTBD ? 'TBD' : new Date(selectedEvent.date).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</span>
                </div>
                {daysUntil !== null && !isPastEvent && (
                  <div className="flex items-center gap-2">
                    <Clock size={18} />
                    <span>{daysUntil} days away</span>
                  </div>
                )}
              </div>

              {!isPastEvent && selectedEvent.targetAttendance && (
                <div className="mb-8 p-6 bg-gradient-to-br from-rose-50 to-pink-50 rounded-lg border border-rose-200 shadow-sm">
                  <div className="flex justify-between items-center mb-3">
                    <span className="text-sm font-medium text-rose-900">Attendance Progress</span>
                    <span className={`text-sm font-medium ${statusColor}`}>{statusLabel}</span>
                  </div>
                  <div className="flex items-center gap-4 mb-2">
                    <div className="flex-1 h-3 bg-white rounded-full overflow-hidden shadow-inner">
                      <div
                        className="h-full bg-gradient-to-r from-amber-400 via-rose-400 to-pink-400 transition-all duration-500"
                        style={{ width: `${Math.min(progress, 100)}%` }}
                      />
                    </div>
                    <span className="text-lg font-light text-rose-900">{progress}%</span>
                  </div>
                  <div className="text-sm text-rose-700">
                    {selectedEvent.currentRSVPs || 0} of {selectedEvent.targetAttendance} attendees
                  </div>

                  {progress < 90 && daysUntil <= 30 && (
                    <div className="mt-4 pt-4 border-t border-rose-200">
                      <p className="text-sm text-rose-800 mb-3">
                        You're {daysUntil > 14 ? `${daysUntil} days out` : daysUntil > 7 ? 'two weeks out' : 'one week out'} and currently at {selectedEvent.currentRSVPs || 0} of {selectedEvent.targetAttendance} attendees ({progress}%). Events with similar goals usually see stronger results with additional promotion.
                      </p>
                      <p className="text-sm font-medium text-rose-900 mb-3">What level of action feels right?</p>
                      <div className="flex gap-3">
                        <button
                          onClick={() => setShowSuggestions(showSuggestions === 'high' ? null : 'high')}
                          className="px-4 py-2 bg-gradient-to-r from-amber-500 to-amber-600 text-white rounded-md hover:from-amber-600 hover:to-amber-700 transition-all shadow-sm text-sm font-medium"
                        >
                          High-Impact
                        </button>
                        <button
                          onClick={() => setShowSuggestions(showSuggestions === 'medium' ? null : 'medium')}
                          className="px-4 py-2 bg-gradient-to-r from-rose-400 to-rose-500 text-white rounded-md hover:from-rose-500 hover:to-rose-600 transition-all shadow-sm text-sm font-medium"
                        >
                          Medium-Impact
                        </button>
                        <button
                          onClick={() => setShowSuggestions(showSuggestions === 'optional' ? null : 'optional')}
                          className="px-4 py-2 bg-gradient-to-r from-pink-400 to-pink-500 text-white rounded-md hover:from-pink-500 hover:to-pink-600 transition-all shadow-sm text-sm font-medium"
                        >
                          Optional Boost
                        </button>
                      </div>
                      {showSuggestions && (
                        <ul className="mt-4 space-y-2">
                          {getSuggestions(showSuggestions, daysUntil).map((suggestion, idx) => (
                            <li key={idx} className="flex items-start gap-2 text-sm text-rose-800">
                              <span className="text-amber-500 mt-1">-</span>
                              <span>{suggestion}</span>
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
                  )}
                </div>
              )}

              <div className="mb-8">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl font-light text-rose-900">Marketing Checklist</h2>
                  <span className="text-sm text-rose-600 font-medium">{getChecklistCompletion(selectedEvent.checklist)} complete</span>
                </div>
                <div className="space-y-2">
                  {marketingChecklist.map(item => (
                    <label key={item.id} className="flex items-center gap-3 p-3 hover:bg-rose-50 rounded-md cursor-pointer transition-colors">
                      <input
                        type="checkbox"
                        checked={selectedEvent.checklist[item.id] || false}
                        onChange={() => toggleChecklistItem(selectedEvent.id, item.id)}
                        className="w-5 h-5 text-amber-500 rounded focus:ring-amber-400"
                      />
                      <span className={`flex-1 ${selectedEvent.checklist[item.id] ? 'line-through text-gray-400' : 'text-rose-800'} ${item.special ? 'text-sm italic' : ''}`}>
                        {item.label}
                      </span>
                    </label>
                  ))}
                </div>
              </div>

              <div className="mb-8">
                <label className="block text-sm font-medium text-rose-900 mb-2">Current RSVPs / Tickets</label>
                <input
                  type="number"
                  value={selectedEvent.currentRSVPs}
                  onChange={(e) => updateEventField(selectedEvent.id, 'currentRSVPs', e.target.value)}
                  className="w-full px-4 py-2 border border-rose-200 rounded-md focus:ring-2 focus:ring-amber-400 focus:border-transparent bg-white"
                  placeholder="Update attendance count"
                />
              </div>

              <div className="mb-8">
                <label className="block text-sm font-medium text-rose-900 mb-2">Notes</label>
                <textarea
                  value={selectedEvent.notes}
                  onChange={(e) => updateEventField(selectedEvent.id, 'notes', e.target.value)}
                  rows={4}
                  className="w-full px-4 py-2 border border-rose-200 rounded-md focus:ring-2 focus:ring-amber-400 focus:border-transparent bg-white"
                  placeholder="Ongoing thoughts and planning notes..."
                />
              </div>

              <div className="border-t border-rose-200 pt-8">
                <h2 className="text-xl font-light text-rose-900 mb-4">Post-Event Reflection</h2>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-rose-900 mb-2">Actual Attendance</label>
                    <input
                      type="number"
                      value={selectedEvent.postEventAttendance}
                      onChange={(e) => updateEventField(selectedEvent.id, 'postEventAttendance', e.target.value)}
                      className="w-full px-4 py-2 border border-rose-200 rounded-md focus:ring-2 focus:ring-amber-400 focus:border-transparent bg-white"
                      placeholder="Final attendance count"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-rose-900 mb-2">Reflection Notes</label>
                    <textarea
                      value={selectedEvent.postEventNotes}
                      onChange={(e) => updateEventField(selectedEvent.id, 'postEventNotes', e.target.value)}
                      rows={4}
                      className="w-full px-4 py-2 border border-rose-200 rounded-md focus:ring-2 focus:ring-amber-400 focus:border-transparent bg-white"
                      placeholder="What worked well? What would you change? Key takeaways..."
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-rose-50 via-pink-50 to-amber-50 p-6">
      <div className="max-w-6xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-4xl font-light text-rose-900 mb-2">North Star House</h1>
            <p className="text-rose-700">Event Management</p>
          </div>
          <button
            onClick={() => setShowNewEventForm(true)}
            className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-amber-500 to-rose-500 text-white rounded-md hover:from-amber-600 hover:to-rose-600 transition-all shadow-md"
          >
            <Plus size={20} />
            New Event
          </button>
        </div>

        {showNewEventForm && (
          <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center p-6 z-50">
            <div className="bg-gradient-to-br from-white to-rose-50 rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto p-8 border border-rose-200">
              <h2 className="text-2xl font-light text-rose-900 mb-6">Create New Event</h2>
              
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-rose-900 mb-2">Event Name</label>
                  <input
                    type="text"
                    value={newEvent.name}
                    onChange={(e) => setNewEvent({ ...newEvent, name: e.target.value })}
                    className="w-full px-4 py-2 border border-rose-200 rounded-md focus:ring-2 focus:ring-amber-400 focus:border-transparent bg-white"
                    placeholder="Event name"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-rose-900 mb-2">Date</label>
                  <input
                    type="date"
                    value={newEvent.date}
                    onChange={(e) => setNewEvent({ ...newEvent, date: e.target.value, isTBD: false })}
                    disabled={newEvent.isTBD}
                    className="w-full px-4 py-2 border border-rose-200 rounded-md focus:ring-2 focus:ring-amber-400 focus:border-transparent disabled:bg-gray-100 bg-white"
                  />
                  <label className="flex items-center gap-2 mt-2">
                    <input
                      type="checkbox"
                      checked={newEvent.isTBD}
                      onChange={(e) => setNewEvent({ ...newEvent, isTBD: e.target.checked, date: '' })}
                      className="w-4 h-4 text-amber-500 rounded focus:ring-amber-400"
                    />
                    <span className="text-sm text-rose-700">Date TBD</span>
                  </label>
                </div>

                <div>
                  <label className="block text-sm font-medium text-rose-900 mb-2">Target Attendance</label>
                  <input
                    type="number"
                    value={newEvent.targetAttendance}
                    onChange={(e) => setNewEvent({ ...newEvent, targetAttendance: e.target.value })}
                    className="w-full px-4 py-2 border border-rose-200 rounded-md focus:ring-2 focus:ring-amber-400 focus:border-transparent bg-white"
                    placeholder="Expected number of attendees"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-rose-900 mb-2">Current RSVPs / Tickets</label>
                  <input
                    type="number"
                    value={newEvent.currentRSVPs}
                    onChange={(e) => setNewEvent({ ...newEvent, currentRSVPs: e.target.value })}
                    className="w-full px-4 py-2 border border-rose-200 rounded-md focus:ring-2 focus:ring-amber-400 focus:border-transparent bg-white"
                    placeholder="Current count"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-rose-900 mb-2">Flyer / Event Image</label>
                  <div className="flex items-center gap-4">
                    <label className="flex items-center gap-2 px-4 py-2 border border-rose-200 rounded-md cursor-pointer hover:bg-rose-50 transition-colors">
                      <Upload size={18} className="text-rose-600" />
                      <span className="text-sm text-rose-800">Upload Image</span>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleImageUpload}
                        className="hidden"
                      />
                    </label>
                    {newEvent.flyerImage && (
                      <img src={newEvent.flyerImage} alt="Preview" className="h-16 w-16 object-cover rounded-md border border-rose-200 shadow-sm" />
                    )}
                  </div>
                </div>

                <div className="flex gap-3 pt-4">
                  <button
                    onClick={handleCreateEvent}
                    disabled={!newEvent.name}
                    className="flex-1 px-6 py-3 bg-gradient-to-r from-amber-500 to-rose-500 text-white rounded-md hover:from-amber-600 hover:to-rose-600 disabled:bg-gray-300 disabled:cursor-not-allowed transition-all shadow-md"
                  >
                    Create Event
                  </button>
                  <button
                    onClick={() => setShowNewEventForm(false)}
                    className="px-6 py-3 border border-rose-300 text-rose-800 rounded-md hover:bg-rose-50 transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {events.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-lg border border-rose-200 shadow-sm">
            <Calendar size={48} className="mx-auto text-rose-300 mb-4" />
            <p className="text-rose-700 mb-2">No events yet</p>
            <p className="text-sm text-rose-500">Create your first event to get started</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {events.map(event => {
              const daysUntil = calculateDaysUntil(event.date);
              const progress = getProgressPercentage(
                parseInt(event.currentRSVPs) || 0,
                parseInt(event.targetAttendance) || 0
              );
              const statusColor = getStatusColor(progress);
              const isPastEvent = daysUntil !== null && daysUntil < 0;

              return (
                <div
                  key={event.id}
                  onClick={() => setSelectedEvent(event)}
                  className="bg-white rounded-lg shadow-md border border-rose-200 overflow-hidden cursor-pointer hover:shadow-lg hover:border-amber-300 transition-all"
                >
                  {event.flyerImage && (
                    <div className="w-full h-40 bg-gradient-to-br from-rose-100 to-pink-100">
                      <img
                        src={event.flyerImage}
                        alt={event.name}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  )}
                  <div className="p-5">
                    <h3 className="text-lg font-medium text-rose-900 mb-2">{event.name}</h3>
                    <div className="flex items-center gap-2 text-sm text-rose-700 mb-3">
                      <Calendar size={14} />
                      <span>{event.isTBD ? 'TBD' : new Date(event.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                    </div>

                    {!isPastEvent && event.targetAttendance && (
                      <>
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-xs text-rose-600">Progress</span>
                          <span className={`text-xs font-medium ${statusColor}`}>{progress}%</span>
                        </div>
                        <div className="h-2 bg-rose-100 rounded-full overflow-hidden mb-3 shadow-inner">
                          <div
                            className="h-full bg-gradient-to-r from-amber-400 via-rose-400 to-pink-400 transition-all duration-500"
                            style={{ width: `${Math.min(progress, 100)}%` }}
                          />
                        </div>
                      </>
                    )}

                    <div className="flex items-center justify-between text-xs text-rose-600">
                      <span>{getChecklistCompletion(event.checklist)} tasks</span>
                      {daysUntil !== null && !isPastEvent && (
                        <span className="flex items-center gap-1">
                          <Clock size={12} />
                          {daysUntil} days
                        </span>
                      )}
                      {isPastEvent && (
                        <span className="text-rose-500">Past event</span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        <div className="mt-12 p-6 bg-gradient-to-br from-white to-rose-50 rounded-lg border border-rose-200 shadow-sm">
          <h3 className="text-lg font-medium text-rose-900 mb-2">Google Sheets Integration</h3>
          <p className="text-sm text-rose-700 mb-4">
            All event data automatically syncs to Google Sheets for backup, historical tracking, and benchmarking future events.
          </p>
          <button className="text-sm text-amber-600 hover:text-amber-700 font-medium transition-colors">
            Connect Google Sheets ->
          </button>
        </div>
      </div>
    </div>
  );
};

export default EventManagementApp;


