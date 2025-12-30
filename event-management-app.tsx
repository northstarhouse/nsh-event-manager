import React, { useState, useEffect, useRef } from 'react';
import { Calendar, Upload, Plus, ChevronRight, AlertCircle, CheckCircle2, Clock } from 'lucide-react';

const EventManagementApp = () => {
  const [events, setEvents] = useState([]);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [showNewEventForm, setShowNewEventForm] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(null);
  const [activeTab, setActiveTab] = useState('marketing');
  const touchStartX = useRef(null);
  const SHEETS_API_URL = 'https://script.google.com/macros/s/AKfycbzcuMhZ1h15zP7IgYhyCBChgkx_mbe23G6756V2_lHNT1grfgKR-AuZxbHt3t806h8-/exec';
  const STORAGE_KEY = 'nsh-events-cache-v1';
  const FLYER_KEY = 'nsh-event-flyers-v1';

  const marketingChecklist = [
    { id: 'press-release', label: 'Create Press Release' },
    { id: 'flyer', label: 'Create Flyer' },
    { id: 'website', label: 'Make Event Page on Website' },
    { id: 'email', label: 'Send Email Blast' },
    { id: 'yubanet', label: 'YubaNet (Press Release Only - if worthy)', special: true, optional: true },
    { id: 'go-nv', label: 'Go Nevada County Calendar' },
    { id: 'arts', label: 'Arts Council Calendar' },
    { id: 'chamber', label: 'Grass Valley Chamber Newsletter (2 weeks prior)', special: true, optional: true },
    { id: 'kvmr', label: 'KVMR Calendar' },
    { id: 'fb-event', label: 'Facebook Event Page' },
    { id: 'fb-nsh', label: 'NSH Facebook Page' },
    { id: 'ig-nsh', label: 'NSH Instagram Page' },
    { id: 'nv-peeps', label: 'Nevada County Peeps' },
    { id: 'gv-peeps', label: 'Grass Valley Peeps' },
    { id: 'lake-wildwood', label: 'Lake Wildwood Page' },
    { id: 'nextdoor', label: 'NextDoor' },
    { id: 'union-cal', label: 'Union Event Calendar' },
    { id: 'union-ad', label: 'Union Advertisement ($270 - rare)', special: true, optional: true },
    { id: 'other', label: 'Other', optional: true }
  ];

  const planningChecklist = [
    { id: 'event-type', label: 'Event type' },
    { id: 'budget-confirmed', label: 'Budget confirmed' },
    { id: 'layout-finalized', label: 'Layout finalized' },
    { id: 'av-needs', label: 'AV needs' },
    { id: 'power-checked', label: 'Power checked' },
    { id: 'rentals-ordered', label: 'Rentals ordered' },
    { id: 'food-plan', label: 'Food plan' },
    { id: 'alcohol-license', label: 'Alcohol license (if applicable)' },
    { id: 'volunteer-roles', label: 'Volunteer roles assigned' },
    { id: 'staff-lead', label: 'Staff lead assigned' },
    { id: 'checkin-ready', label: 'Check-in system ready' },
    { id: 'program-ready', label: 'Program / agenda printed or shared' },
    { id: 'signage-ready', label: 'Signage ready' }
  ];

  const [newEvent, setNewEvent] = useState({
    name: '',
    date: '',
    time: '',
    isTBD: false,
    goals: '',
    outcomes: '',
    advertising: '',
    totalSpent: '',
    totalEarned: '',
    volunteers: '',
    targetAttendance: '',
    currentRSVPs: '',
    flyerImage: null,
    checklist: {},
    planningChecklist: {},
    planningNotes: '',
    notes: '',
    postEventAttendance: '',
    postEventNotes: ''
  });

  const loadEvents = async () => {
    if (!SHEETS_API_URL) return;
    try {
      const response = await fetch(`${SHEETS_API_URL}?action=list`);
      if (!response.ok) {
        throw new Error(`Sheets load failed: ${response.status}`);
      }
      const data = await response.json();
      const loadedEvents = Array.isArray(data.events) ? data.events : [];
      const storedFlyers = JSON.parse(localStorage.getItem(FLYER_KEY) || '{}');
      const cached = localStorage.getItem(STORAGE_KEY);
      const cachedEvents = cached ? JSON.parse(cached) : [];
      const cachedMap = Array.isArray(cachedEvents)
        ? cachedEvents.reduce((acc, event) => {
            if (event && event.id) acc[event.id] = event;
            return acc;
          }, {})
        : {};
      const normalizedEvents = loadedEvents.map(event => {
        const cachedEvent = cachedMap[event.id];
        const parsedChecklist = typeof event.checklist === 'string'
          ? JSON.parse(event.checklist || '{}')
          : (event.checklist || {});
        const parsedPlanning = typeof event.planningChecklist === 'string'
          ? JSON.parse(event.planningChecklist || '{}')
          : (event.planningChecklist || {});
        const cachedPlanning = cachedEvent && cachedEvent.planningChecklist ? cachedEvent.planningChecklist : null;
        const planningChecklist = Object.keys(parsedPlanning || {}).length === 0 && cachedPlanning
          ? cachedPlanning
          : parsedPlanning;
        const planningNotes = event.planningNotes || (cachedEvent ? cachedEvent.planningNotes || '' : '');
        const mergedEvent = {
          ...event,
          date: normalizeDateForInput(event.date),
          time: normalizeTimeForInput(event.time),
          checklist: parsedChecklist,
          planningChecklist,
          planningNotes,
          flyerImage: storedFlyers[event.id] || null
        };
        if (cachedPlanning && Object.keys(parsedPlanning || {}).length === 0) {
          saveEvent(mergedEvent);
        }
        return mergedEvent;
      });
      setEvents(normalizedEvents);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(normalizedEvents));
    } catch (error) {
      console.error('Failed to load events from Sheets', error);
      const cached = localStorage.getItem(STORAGE_KEY);
      if (cached) {
        try {
          const cachedEvents = JSON.parse(cached);
          if (Array.isArray(cachedEvents)) {
            setEvents(cachedEvents);
          }
        } catch (parseError) {
          console.error('Failed to parse cached events', parseError);
        }
      }
    }
  };

  const persistEvents = (nextEvents) => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(nextEvents));
  };

  const persistFlyerImage = (eventId, flyerImage) => {
    if (!eventId || !flyerImage) return;
    const stored = JSON.parse(localStorage.getItem(FLYER_KEY) || '{}');
    stored[eventId] = flyerImage;
    localStorage.setItem(FLYER_KEY, JSON.stringify(stored));
  };

  const removeFlyerImage = (eventId) => {
    const stored = JSON.parse(localStorage.getItem(FLYER_KEY) || '{}');
    if (stored[eventId]) {
      delete stored[eventId];
      localStorage.setItem(FLYER_KEY, JSON.stringify(stored));
    }
  };

  const saveEvent = async (event) => {
    if (!SHEETS_API_URL) return;
    const payloadEvent = {
      ...event,
      checklist: typeof event.checklist === 'string' ? event.checklist : JSON.stringify(event.checklist || {}),
      planningChecklist: typeof event.planningChecklist === 'string'
        ? event.planningChecklist
        : JSON.stringify(event.planningChecklist || {}),
      planningNotes: event.planningNotes || ''
    };
    try {
      await fetch(SHEETS_API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body: JSON.stringify({ action: 'upsert', event: payloadEvent })
      });
    } catch (error) {
      console.error('Failed to save event to Sheets', error);
    }
  };

  const deleteEvent = async (eventId) => {
    const nextEvents = events.filter(event => event.id !== eventId);
    setEvents(nextEvents);
    persistEvents(nextEvents);
    setSelectedEvent(null);
    removeFlyerImage(eventId);
    if (!SHEETS_API_URL) return;
    try {
      await fetch(SHEETS_API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body: JSON.stringify({ action: 'delete', id: eventId })
      });
    } catch (error) {
      console.error('Failed to delete event from Sheets', error);
    }
  };

  useEffect(() => {
    loadEvents();
  }, []);

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

  const getChecklistProgress = (checklist) => {
    const requiredItems = marketingChecklist.filter(item => !item.optional);
    if (!requiredItems.length) return 0;
    const completed = requiredItems.filter(item => checklist?.[item.id]).length;
    return Math.round((completed / requiredItems.length) * 100);
  };

  const getPlanningProgress = (planning) => {
    const completed = Object.values(planning || {}).filter(item => item && item.done).length;
    if (!planningChecklist.length) return 0;
    return Math.round((completed / planningChecklist.length) * 100);
  };

  const getStatusColor = (percentage) => {
    if (percentage >= 90) return 'text-emerald-600';
    if (percentage >= 70) return 'text-stone-600';
    return 'text-stone-700';
  };

  const getStatusLabel = (percentage) => {
    if (percentage >= 90) return 'On track';
    if (percentage >= 70) return 'Slightly behind';
    return 'Needs attention';
  };

  const getChecklistCompletion = (checklist) => {
    const requiredItems = marketingChecklist.filter(item => !item.optional);
    const completed = requiredItems.filter(item => checklist?.[item.id]).length;
    return `${completed}/${requiredItems.length}`;
  };

  const getPlanningCompletion = (planning) => {
    const completed = Object.values(planning || {}).filter(item => item && item.done).length;
    return `${completed}/${planningChecklist.length}`;
  };

  const normalizeDateForInput = (value) => {
    if (!value) return '';
    if (/^\d{4}-\d{2}-\d{2}$/.test(value)) return value;
    const parsed = new Date(value);
    if (Number.isNaN(parsed.getTime())) return '';
    return parsed.toISOString().slice(0, 10);
  };

  const normalizeTimeForInput = (value) => {
    if (!value) return '';
    if (/^\d{2}:\d{2}$/.test(value)) return value;
    const hhmmss = value.match(/^(\d{1,2}):(\d{2}):\d{2}$/);
    if (hhmmss) {
      return `${hhmmss[1].padStart(2, '0')}:${hhmmss[2]}`;
    }
    const ampm = value.match(/^(\d{1,2}):(\d{2})\s*([AaPp][Mm])$/);
    if (ampm) {
      let hours = parseInt(ampm[1], 10);
      const minutes = ampm[2];
      const isPm = ampm[3].toLowerCase() === 'pm';
      if (isPm && hours < 12) hours += 12;
      if (!isPm && hours === 12) hours = 0;
      return `${String(hours).padStart(2, '0')}:${minutes}`;
    }
    return '';
  };

  const formatTimeDisplay = (value) => {
    if (!value) return '';
    const normalized = normalizeTimeForInput(value);
    if (!normalized) return value;
    const [hoursStr, minutes] = normalized.split(':');
    const hours = parseInt(hoursStr, 10);
    const period = hours >= 12 ? 'PM' : 'AM';
    const displayHours = hours % 12 === 0 ? 12 : hours % 12;
    return `${displayHours}:${minutes}${period}`;
  };

  const formatDateDisplay = (value) => {
    if (!value) return '';
    const normalized = normalizeDateForInput(value);
    if (!normalized) return value;
    const [year, month, day] = normalized.split('-').map(Number);
    const localDate = new Date(year, month - 1, day);
    return localDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
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
    const nextEvents = [...events, event];
    setEvents(nextEvents);
    persistEvents(nextEvents);
    if (event.flyerImage) {
      persistFlyerImage(event.id, event.flyerImage);
    }
    saveEvent(event);
    setShowNewEventForm(false);
    setNewEvent({
      name: '',
      date: '',
      time: '',
      isTBD: false,
      goals: '',
      outcomes: '',
      advertising: '',
      totalSpent: '',
      totalEarned: '',
      volunteers: '',
      targetAttendance: '',
      currentRSVPs: '',
      flyerImage: null,
      checklist: {},
      planningChecklist: {},
      planningNotes: '',
      notes: '',
      postEventAttendance: '',
      postEventNotes: ''
    });
  };

  const toggleChecklistItem = (eventId, itemId) => {
    let updatedEvent = null;
    const nextEvents = events.map(event => {
      if (event.id === eventId) {
        updatedEvent = {
          ...event,
          checklist: {
            ...event.checklist,
            [itemId]: !event.checklist[itemId]
          }
        };
        return updatedEvent;
      }
      return event;
    });
    setEvents(nextEvents);
    persistEvents(nextEvents);
    if (selectedEvent && selectedEvent.id === eventId && updatedEvent) {
      setSelectedEvent(updatedEvent);
    }
    if (updatedEvent) {
      saveEvent(updatedEvent);
    }
  };

  const togglePlanningItem = (eventId, itemId) => {
    let updatedEvent = null;
    const nextEvents = events.map(event => {
      if (event.id === eventId) {
        const current = event.planningChecklist || {};
        const entry = current[itemId] || { done: false, note: '' };
        const nextChecklist = {
          ...current,
          [itemId]: { ...entry, done: !entry.done }
        };
        updatedEvent = { ...event, planningChecklist: nextChecklist };
        return updatedEvent;
      }
      return event;
    });
    setEvents(nextEvents);
    persistEvents(nextEvents);
    if (selectedEvent && selectedEvent.id === eventId && updatedEvent) {
      setSelectedEvent(updatedEvent);
    }
    if (updatedEvent) {
      saveEvent(updatedEvent);
    }
  };

  const updatePlanningNote = (eventId, itemId, note) => {
    let updatedEvent = null;
    const nextEvents = events.map(event => {
      if (event.id === eventId) {
        const current = event.planningChecklist || {};
        const entry = current[itemId] || { done: false, note: '' };
        const nextChecklist = {
          ...current,
          [itemId]: { ...entry, note }
        };
        updatedEvent = { ...event, planningChecklist: nextChecklist };
        return updatedEvent;
      }
      return event;
    });
    setEvents(nextEvents);
    persistEvents(nextEvents);
    if (selectedEvent && selectedEvent.id === eventId && updatedEvent) {
      setSelectedEvent(updatedEvent);
    }
    if (updatedEvent) {
      saveEvent(updatedEvent);
    }
  };

  const updateEventField = (eventId, field, value) => {
    let updatedEvent = null;
    const nextEvents = events.map(event => {
      if (event.id === eventId) {
        updatedEvent = { ...event, [field]: value };
        return updatedEvent;
      }
      return event;
    });
    setEvents(nextEvents);
    persistEvents(nextEvents);
    if (selectedEvent && selectedEvent.id === eventId && updatedEvent) {
      setSelectedEvent(updatedEvent);
    }
    if (updatedEvent) {
      saveEvent(updatedEvent);
    }
  };

  if (selectedEvent) {
    const daysUntil = calculateDaysUntil(selectedEvent.date);
    const marketingProgress = getChecklistProgress(selectedEvent.checklist);
    const planningProgress = getPlanningProgress(selectedEvent.planningChecklist);
    const statusColor = getStatusColor(marketingProgress);
    const statusLabel = getStatusLabel(marketingProgress);
    const isPastEvent = daysUntil !== null && daysUntil < 0;
    const handleTouchStart = (e) => {
      touchStartX.current = e.touches[0].clientX;
    };
    const handleTouchEnd = (e) => {
      if (touchStartX.current === null) return;
      const deltaX = e.changedTouches[0].clientX - touchStartX.current;
      if (Math.abs(deltaX) > 60) {
        setActiveTab(deltaX < 0 ? 'planning' : 'marketing');
      }
      touchStartX.current = null;
    };

    return (
      <div className="min-h-screen bg-gradient-to-br from-stone-50 via-stone-100 to-amber-50 p-4 sm:p-6">
        <div className="max-w-4xl mx-auto">
          <button
            onClick={() => setSelectedEvent(null)}
            className="mb-6 text-amber-700 hover:text-amber-800 font-medium"
          >
            &larr; Back to Dashboard
          </button>

          <div
            className="bg-white rounded-lg shadow-lg border border-stone-200 overflow-hidden"
            onTouchStart={handleTouchStart}
            onTouchEnd={handleTouchEnd}
          >
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
              <div className="mb-6 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-stone-900 mb-2">Event Name</label>
                  <input
                    type="text"
                    value={selectedEvent.name}
                    onChange={(e) => updateEventField(selectedEvent.id, 'name', e.target.value)}
                    className="w-full px-4 py-2 border border-stone-200 rounded-md focus:ring-2 focus:ring-amber-400 focus:border-transparent bg-white text-2xl font-light text-stone-900"
                    placeholder="Event name"
                  />
                </div>
                <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4 text-stone-700">
                  <div className="flex items-center gap-2">
                    <Calendar size={18} />
                    {selectedEvent.isTBD ? (
                      <span>TBD</span>
                    ) : (
                      <>
                        <input
                          type="date"
                          value={normalizeDateForInput(selectedEvent.date)}
                          onChange={(e) => updateEventField(selectedEvent.id, 'date', e.target.value)}
                          className="px-3 py-2 border border-stone-200 rounded-md focus:ring-2 focus:ring-amber-400 focus:border-transparent bg-white text-sm"
                        />
                        {selectedEvent.time && (
                          <span className="text-sm text-stone-700">
                            · {formatTimeDisplay(selectedEvent.time)}
                          </span>
                        )}
                      </>
                    )}
                  </div>
                  {daysUntil !== null && !isPastEvent && (
                    <div className="flex items-center gap-2">
                      <Clock size={18} />
                      <span>{daysUntil} days away</span>
                    </div>
                  )}
                </div>
              </div>

              <div className="mb-6 flex w-full rounded-full border border-stone-200 bg-stone-50 p-1 text-xs font-medium">
                <button
                  onClick={() => setActiveTab('marketing')}
                  className={`flex-1 rounded-full px-3 py-2 transition-colors ${activeTab === 'marketing' ? 'bg-white text-stone-900 shadow-sm' : 'text-stone-600'}`}
                >
                  Marketing
                </button>
                <button
                  onClick={() => setActiveTab('planning')}
                  className={`flex-1 rounded-full px-3 py-2 transition-colors ${activeTab === 'planning' ? 'bg-white text-stone-900 shadow-sm' : 'text-stone-600'}`}
                >
                  Event Planning
                </button>
              </div>

              {activeTab === 'marketing' && (
                <>
                  {!isPastEvent && (
                    <div className="mb-8 p-6 bg-gradient-to-br from-stone-50 to-stone-100 rounded-lg border border-stone-200 shadow-sm">
                      <div className="flex justify-between items-center mb-3">
                        <span className="text-sm font-medium text-stone-900">Marketing Progress</span>
                        <span className={`text-sm font-medium ${statusColor}`}>{statusLabel}</span>
                      </div>
                      <div className="flex items-center gap-4 mb-2">
                        <div className="flex-1 h-3 bg-white rounded-full overflow-hidden shadow-inner">
                          <div
                            className="h-full bg-gradient-to-r from-amber-400 via-amber-500 to-amber-400 transition-all duration-500"
                            style={{ width: `${Math.min(marketingProgress, 100)}%` }}
                          />
                        </div>
                        <span className="text-lg font-light text-stone-900">{marketingProgress}%</span>
                      </div>
                      <div className="text-sm text-stone-700">
                        {getChecklistCompletion(selectedEvent.checklist)} marketing tasks
                      </div>
                      <div className="mt-4 pt-4 border-t border-stone-200">
                        <p className="text-sm text-stone-800 mb-3">
                          You're {daysUntil > 14 ? `${daysUntil} days out` : daysUntil > 7 ? 'two weeks out' : 'one week out'} and have completed {getChecklistCompletion(selectedEvent.checklist)} marketing tasks ({marketingProgress}%). Attendance is {selectedEvent.currentRSVPs || 0} of {selectedEvent.targetAttendance || 0}.
                        </p>
                      </div>
                    </div>
                  )}

                  <div className="mb-8">
                    <div className="flex items-center justify-between mb-4">
                      <h2 className="text-xl font-light text-stone-900">Marketing Checklist</h2>
                      <span className="text-sm text-stone-600 font-medium">{getChecklistCompletion(selectedEvent.checklist)} complete</span>
                    </div>
                    <div className="space-y-2">
                      {marketingChecklist.map(item => (
                        <label key={item.id} className="flex items-start sm:items-center gap-3 p-3 hover:bg-stone-50 rounded-md cursor-pointer transition-colors">
                          <input
                            type="checkbox"
                            checked={selectedEvent.checklist[item.id] || false}
                            onChange={() => toggleChecklistItem(selectedEvent.id, item.id)}
                            className="w-5 h-5 text-amber-600 rounded focus:ring-amber-400"
                          />
                          <span className={`flex-1 ${selectedEvent.checklist[item.id] ? 'line-through text-gray-400' : 'text-stone-800'} ${item.special ? 'text-sm italic' : ''}`}>
                            {item.label}
                          </span>
                        </label>
                      ))}
                    </div>
                  </div>

                  <div className="mb-8">
                    <h2 className="text-xl font-light text-stone-900 mb-4">Event Details</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-stone-900 mb-2">Time</label>
                        <input
                          type="time"
                          value={normalizeTimeForInput(selectedEvent.time) || ''}
                          onChange={(e) => updateEventField(selectedEvent.id, 'time', e.target.value)}
                          className="w-full px-4 py-2 border border-stone-200 rounded-md focus:ring-2 focus:ring-amber-400 focus:border-transparent bg-white"
                          placeholder="Event time"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-stone-900 mb-2">Goals</label>
                        <input
                          type="text"
                          value={selectedEvent.goals || ''}
                          onChange={(e) => updateEventField(selectedEvent.id, 'goals', e.target.value)}
                          className="w-full px-4 py-2 border border-stone-200 rounded-md focus:ring-2 focus:ring-amber-400 focus:border-transparent bg-white"
                          placeholder="What is this event aiming to achieve?"
                        />
                      </div>
                      <div className="md:col-span-2">
                        <label className="block text-sm font-medium text-stone-900 mb-2">Outcomes</label>
                        <textarea
                          value={selectedEvent.outcomes || ''}
                          onChange={(e) => updateEventField(selectedEvent.id, 'outcomes', e.target.value)}
                          rows={3}
                          className="w-full px-4 py-2 border border-stone-200 rounded-md focus:ring-2 focus:ring-amber-400 focus:border-transparent bg-white"
                          placeholder="Key outcomes or takeaways"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="mb-8">
                    <h2 className="text-xl font-light text-stone-900 mb-4">Budget & Promotion</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-stone-900 mb-2">Advertising</label>
                        <input
                          type="text"
                          value={selectedEvent.advertising || ''}
                          onChange={(e) => updateEventField(selectedEvent.id, 'advertising', e.target.value)}
                          className="w-full px-4 py-2 border border-stone-200 rounded-md focus:ring-2 focus:ring-amber-400 focus:border-transparent bg-white"
                          placeholder="Channels, partners, or placements"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-stone-900 mb-2">Volunteers</label>
                        <input
                          type="text"
                          value={selectedEvent.volunteers || ''}
                          onChange={(e) => updateEventField(selectedEvent.id, 'volunteers', e.target.value)}
                          className="w-full px-4 py-2 border border-stone-200 rounded-md focus:ring-2 focus:ring-amber-400 focus:border-transparent bg-white"
                          placeholder="Names or count"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-stone-900 mb-2">Total Spent</label>
                        <input
                          type="number"
                          value={selectedEvent.totalSpent || ''}
                          onChange={(e) => updateEventField(selectedEvent.id, 'totalSpent', e.target.value)}
                          className="w-full px-4 py-2 border border-stone-200 rounded-md focus:ring-2 focus:ring-amber-400 focus:border-transparent bg-white"
                          placeholder="0"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-stone-900 mb-2">Total Earned</label>
                        <input
                          type="number"
                          value={selectedEvent.totalEarned || ''}
                          onChange={(e) => updateEventField(selectedEvent.id, 'totalEarned', e.target.value)}
                          className="w-full px-4 py-2 border border-stone-200 rounded-md focus:ring-2 focus:ring-amber-400 focus:border-transparent bg-white"
                          placeholder="0"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="mb-8">
                    <label className="block text-sm font-medium text-stone-900 mb-2">Current RSVPs / Tickets</label>
                    <input
                      type="number"
                      value={selectedEvent.currentRSVPs}
                      onChange={(e) => updateEventField(selectedEvent.id, 'currentRSVPs', e.target.value)}
                      className="w-full px-4 py-2 border border-stone-200 rounded-md focus:ring-2 focus:ring-amber-400 focus:border-transparent bg-white"
                      placeholder="Update attendance count"
                    />
                  </div>

                  <div className="mb-8">
                    <label className="block text-sm font-medium text-stone-900 mb-2">Notes</label>
                    <textarea
                      value={selectedEvent.notes}
                      onChange={(e) => updateEventField(selectedEvent.id, 'notes', e.target.value)}
                      rows={4}
                      className="w-full px-4 py-2 border border-stone-200 rounded-md focus:ring-2 focus:ring-amber-400 focus:border-transparent bg-white"
                      placeholder="Ongoing thoughts and planning notes..."
                    />
                  </div>

                  <div className="border-t border-stone-200 pt-8">
                    <h2 className="text-xl font-light text-stone-900 mb-4">Post-Event Reflection</h2>
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-stone-900 mb-2">Actual Attendance</label>
                        <input
                          type="number"
                          value={selectedEvent.postEventAttendance}
                          onChange={(e) => updateEventField(selectedEvent.id, 'postEventAttendance', e.target.value)}
                          className="w-full px-4 py-2 border border-stone-200 rounded-md focus:ring-2 focus:ring-amber-400 focus:border-transparent bg-white"
                          placeholder="Final attendance count"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-stone-900 mb-2">Reflection Notes</label>
                        <textarea
                          value={selectedEvent.postEventNotes}
                          onChange={(e) => updateEventField(selectedEvent.id, 'postEventNotes', e.target.value)}
                          rows={4}
                          className="w-full px-4 py-2 border border-stone-200 rounded-md focus:ring-2 focus:ring-amber-400 focus:border-transparent bg-white"
                          placeholder="What worked well? What would you change? Key takeaways..."
                        />
                      </div>
                    </div>
                  </div>

                  <div className="mt-8 flex justify-end">
                    <button
                      onClick={() => deleteEvent(selectedEvent.id)}
                      className="px-4 py-2 border border-stone-300 text-stone-700 rounded-md hover:bg-stone-100 transition-colors"
                    >
                      Delete Event
                    </button>
                  </div>
                </>
              )}

              {activeTab === 'planning' && (
                <div className="mb-8 space-y-6">
                  <div className="bg-white rounded-lg border border-stone-200 shadow-sm p-6">
                    <label className="block text-sm font-medium text-stone-900 mb-2">Planning Notes</label>
                    <textarea
                      value={selectedEvent.planningNotes || ''}
                      onChange={(e) => updateEventField(selectedEvent.id, 'planningNotes', e.target.value)}
                      rows={4}
                      className="w-full px-4 py-2 border border-stone-200 rounded-md focus:ring-2 focus:ring-amber-400 focus:border-transparent bg-white"
                      placeholder="General info, reminders, or planning thoughts..."
                    />
                  </div>

                  <div className="p-6 bg-gradient-to-br from-stone-50 to-stone-100 rounded-lg border border-stone-200 shadow-sm">
                    <div className="flex justify-between items-center mb-3">
                      <span className="text-sm font-medium text-stone-900">Event Planning Progress</span>
                      <span className="text-sm font-medium text-stone-700">{planningProgress}%</span>
                    </div>
                    <div className="flex items-center gap-4 mb-4">
                      <div className="flex-1 h-3 bg-white rounded-full overflow-hidden shadow-inner">
                        <div
                          className="h-full bg-gradient-to-r from-amber-400 via-amber-500 to-amber-400 transition-all duration-500"
                          style={{ width: `${Math.min(planningProgress, 100)}%` }}
                        />
                      </div>
                      <span className="text-lg font-light text-stone-900">{planningProgress}%</span>
                    </div>
                    <div className="text-sm text-stone-700 mb-4">
                      {getPlanningCompletion(selectedEvent.planningChecklist)} planning tasks
                    </div>

                    <div className="space-y-3">
                      {planningChecklist.map(item => {
                        const entry = (selectedEvent.planningChecklist || {})[item.id] || { done: false, note: '' };
                        return (
                          <div key={item.id} className="flex flex-col sm:flex-row sm:items-center gap-3 rounded-md bg-white p-3 border border-stone-200">
                            <label className="flex items-center gap-3">
                              <input
                                type="checkbox"
                                checked={entry.done || false}
                                onChange={() => togglePlanningItem(selectedEvent.id, item.id)}
                                className="w-5 h-5 text-amber-600 rounded focus:ring-amber-400"
                              />
                              <span className={`text-sm ${entry.done ? 'line-through text-gray-400' : 'text-stone-800'}`}>
                                {item.label}
                              </span>
                            </label>
                            <input
                              type="text"
                              value={entry.note || ''}
                              onChange={(e) => updatePlanningNote(selectedEvent.id, item.id, e.target.value)}
                              className="flex-1 px-3 py-2 border border-stone-200 rounded-md focus:ring-2 focus:ring-amber-400 focus:border-transparent bg-white text-sm"
                              placeholder="Notes"
                            />
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }
  return (
    <div className="min-h-screen bg-gradient-to-br from-stone-50 via-stone-100 to-amber-50 p-4 sm:p-6">
      <div className="max-w-6xl mx-auto">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between mb-8">
          <div>
            <h1 className="text-4xl font-light text-stone-900 mb-2">North Star House</h1>
            <p className="text-stone-700">Event Management</p>
          </div>
          <button
            onClick={() => setShowNewEventForm(true)}
            className="flex items-center justify-center gap-2 px-6 py-3 bg-[#886c44] text-white rounded-md hover:bg-[#755a38] transition-all shadow-md w-full md:w-auto"
          >
            <Plus size={20} />
            New Event
          </button>
        </div>

        {showNewEventForm && (
          <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center p-4 sm:p-6 z-50">
            <div className="bg-gradient-to-br from-white to-stone-50 rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6 sm:p-8 border border-stone-200">
              <h2 className="text-2xl font-light text-stone-900 mb-6">Create New Event</h2>
              
                <div className="space-y-6">
                  <div>
                    <label className="block text-sm font-medium text-stone-900 mb-2">Event Name</label>
                    <input
                    type="text"
                    value={newEvent.name}
                    onChange={(e) => setNewEvent({ ...newEvent, name: e.target.value })}
                    className="w-full px-4 py-2 border border-stone-200 rounded-md focus:ring-2 focus:ring-amber-400 focus:border-transparent bg-white"
                    placeholder="Event name"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-stone-900 mb-2">Date</label>
                  <input
                    type="date"
                    value={newEvent.date}
                    onChange={(e) => setNewEvent({ ...newEvent, date: e.target.value, isTBD: false })}
                    disabled={newEvent.isTBD}
                    className="w-full px-4 py-2 border border-stone-200 rounded-md focus:ring-2 focus:ring-amber-400 focus:border-transparent disabled:bg-gray-100 bg-white"
                  />
                  <label className="flex items-center gap-2 mt-2">
                    <input
                      type="checkbox"
                      checked={newEvent.isTBD}
                      onChange={(e) => setNewEvent({ ...newEvent, isTBD: e.target.checked, date: '' })}
                      className="w-4 h-4 text-amber-600 rounded focus:ring-amber-400"
                    />
                    <span className="text-sm text-stone-700">Date TBD</span>
                  </label>
                </div>

                <div>
                  <label className="block text-sm font-medium text-stone-900 mb-2">Time</label>
                  <input
                    type="time"
                    value={newEvent.time}
                    onChange={(e) => setNewEvent({ ...newEvent, time: e.target.value })}
                    className="w-full px-4 py-2 border border-stone-200 rounded-md focus:ring-2 focus:ring-amber-400 focus:border-transparent bg-white"
                    placeholder="Event time"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-stone-900 mb-2">Goals</label>
                  <input
                    type="text"
                    value={newEvent.goals}
                    onChange={(e) => setNewEvent({ ...newEvent, goals: e.target.value })}
                    className="w-full px-4 py-2 border border-stone-200 rounded-md focus:ring-2 focus:ring-amber-400 focus:border-transparent bg-white"
                    placeholder="What is this event aiming to achieve?"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-stone-900 mb-2">Outcomes</label>
                  <textarea
                    value={newEvent.outcomes}
                    onChange={(e) => setNewEvent({ ...newEvent, outcomes: e.target.value })}
                    rows={3}
                    className="w-full px-4 py-2 border border-stone-200 rounded-md focus:ring-2 focus:ring-amber-400 focus:border-transparent bg-white"
                    placeholder="Key outcomes or takeaways"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-stone-900 mb-2">Advertising</label>
                  <input
                    type="text"
                    value={newEvent.advertising}
                    onChange={(e) => setNewEvent({ ...newEvent, advertising: e.target.value })}
                    className="w-full px-4 py-2 border border-stone-200 rounded-md focus:ring-2 focus:ring-amber-400 focus:border-transparent bg-white"
                    placeholder="Channels, partners, or placements"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-stone-900 mb-2">Total Spent</label>
                  <input
                    type="number"
                    value={newEvent.totalSpent}
                    onChange={(e) => setNewEvent({ ...newEvent, totalSpent: e.target.value })}
                    className="w-full px-4 py-2 border border-stone-200 rounded-md focus:ring-2 focus:ring-amber-400 focus:border-transparent bg-white"
                    placeholder="0"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-stone-900 mb-2">Total Earned</label>
                  <input
                    type="number"
                    value={newEvent.totalEarned}
                    onChange={(e) => setNewEvent({ ...newEvent, totalEarned: e.target.value })}
                    className="w-full px-4 py-2 border border-stone-200 rounded-md focus:ring-2 focus:ring-amber-400 focus:border-transparent bg-white"
                    placeholder="0"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-stone-900 mb-2">Volunteers</label>
                  <input
                    type="text"
                    value={newEvent.volunteers}
                    onChange={(e) => setNewEvent({ ...newEvent, volunteers: e.target.value })}
                    className="w-full px-4 py-2 border border-stone-200 rounded-md focus:ring-2 focus:ring-amber-400 focus:border-transparent bg-white"
                    placeholder="Names or count"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-stone-900 mb-2">Target Attendance</label>
                  <input
                    type="number"
                    value={newEvent.targetAttendance}
                    onChange={(e) => setNewEvent({ ...newEvent, targetAttendance: e.target.value })}
                    className="w-full px-4 py-2 border border-stone-200 rounded-md focus:ring-2 focus:ring-amber-400 focus:border-transparent bg-white"
                    placeholder="Expected number of attendees"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-stone-900 mb-2">Current RSVPs / Tickets</label>
                  <input
                    type="number"
                    value={newEvent.currentRSVPs}
                    onChange={(e) => setNewEvent({ ...newEvent, currentRSVPs: e.target.value })}
                    className="w-full px-4 py-2 border border-stone-200 rounded-md focus:ring-2 focus:ring-amber-400 focus:border-transparent bg-white"
                    placeholder="Current count"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-stone-900 mb-2">Flyer / Event Image</label>
                  <div className="flex items-center gap-4">
                    <label className="flex items-center gap-2 px-4 py-2 border border-stone-200 rounded-md cursor-pointer hover:bg-stone-50 transition-colors">
                      <Upload size={18} className="text-stone-600" />
                      <span className="text-sm text-stone-800">Upload Image</span>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleImageUpload}
                        className="hidden"
                      />
                    </label>
                    {newEvent.flyerImage && (
                      <img src={newEvent.flyerImage} alt="Preview" className="h-16 w-16 object-cover rounded-md border border-stone-200 shadow-sm" />
                    )}
                  </div>
                </div>

                <div className="flex flex-col-reverse sm:flex-row gap-3 pt-4">
                  <button
                    onClick={handleCreateEvent}
                    disabled={!newEvent.name}
                    className="flex-1 px-6 py-3 bg-[#886c44] text-white rounded-md hover:bg-[#755a38] disabled:bg-gray-300 disabled:cursor-not-allowed transition-all shadow-md"
                  >
                    Create Event
                  </button>
                  <button
                    onClick={() => setShowNewEventForm(false)}
                    className="px-6 py-3 border border-stone-300 text-stone-800 rounded-md hover:bg-stone-50 transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {events.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-lg border border-stone-200 shadow-sm">
            <Calendar size={48} className="mx-auto text-stone-300 mb-4" />
            <p className="text-stone-700 mb-2">No events yet</p>
            <p className="text-sm text-stone-500">Create your first event to get started</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5">
            {events.map(event => {
              const daysUntil = calculateDaysUntil(event.date);
              const progress = getChecklistProgress(event.checklist);
              const isPastEvent = daysUntil !== null && daysUntil < 0;
              const planningProgress = getPlanningProgress(event.planningChecklist);

              return (
                <div
                  key={event.id}
                  onClick={() => setSelectedEvent(event)}
                  className="bg-white rounded-lg shadow-md border border-stone-200 overflow-hidden cursor-pointer hover:shadow-lg hover:border-amber-400 transition-all"
                >
                  {event.flyerImage && (
                    <div className="w-full h-40 bg-gradient-to-br from-stone-100 to-amber-100">
                      <img
                        src={event.flyerImage}
                        alt={event.name}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  )}
                  <div className="p-5">
                    <h3 className="text-lg font-medium text-stone-900 mb-2">{event.name}</h3>
                    <div className="flex items-center justify-between text-sm text-stone-700 mb-3">
                      <div className="flex items-center gap-2">
                        <Calendar size={14} />
                      <span>
                        {event.isTBD
                          ? 'TBD'
                          : `${formatDateDisplay(event.date)}${event.time ? ` · ${formatTimeDisplay(event.time)}` : ''}`}
                      </span>
                      </div>
                      {daysUntil !== null && !isPastEvent && (
                        <span className="text-xs text-stone-500">
                          {daysUntil} days
                        </span>
                      )}
                    </div>

                    {!isPastEvent && (
                      <div className="mt-3 space-y-2 text-xs text-stone-600">
                        {(event.targetAttendance || event.currentRSVPs) && (
                          <div className="flex items-center justify-between">
                            <span>Goal / Current</span>
                            <span className="font-medium text-stone-800">
                              {event.targetAttendance || 0} / {event.currentRSVPs || 0}
                            </span>
                          </div>
                        )}
                        <div className="flex items-center justify-between">
                          <span>Marketing progress</span>
                          <span className="font-medium text-stone-800">{progress}%</span>
                        </div>
                        <div className="h-2 bg-stone-100 rounded-full overflow-hidden shadow-inner">
                          <div
                            className="h-full bg-gradient-to-r from-amber-400 via-amber-500 to-amber-400 transition-all duration-500"
                            style={{ width: `${Math.min(progress, 100)}%` }}
                          />
                        </div>
                        <div className="text-[11px] text-stone-500">
                          {getChecklistCompletion(event.checklist)} tasks
                        </div>
                        <div className="flex items-center justify-between">
                          <span>Event planning progress</span>
                          <span className="font-medium text-stone-800">{planningProgress}%</span>
                        </div>
                        <div className="h-2 bg-stone-100 rounded-full overflow-hidden shadow-inner">
                          <div
                            className="h-full bg-gradient-to-r from-amber-400 via-amber-500 to-amber-400 transition-all duration-500"
                            style={{ width: `${Math.min(planningProgress, 100)}%` }}
                          />
                        </div>
                        <div className="text-[11px] text-stone-500">
                          {getPlanningCompletion(event.planningChecklist)} tasks
                        </div>
                      </div>
                    )}

                    {isPastEvent && (
                      <div className="text-xs text-stone-500">Past event</div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default EventManagementApp;




















