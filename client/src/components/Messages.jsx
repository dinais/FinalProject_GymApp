import React, { useState, useEffect, useContext } from 'react';
import {
  Mail, Send, Users, User, Calendar, ChevronDown, ChevronUp, Plus, Inbox
} from 'lucide-react';
import '../css/messages.css';
import { getRequest, postRequest } from '../Requests';
import { CurrentUser } from './App';

function formatDateTime(dateString) {
  const options = {
    day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit', hour12: false
  };
  return new Date(dateString).toLocaleString('en-US', options);
}

function Messages() {
  const { currentUser, currentRole } = useContext(CurrentUser);
  const [view, setView] = useState('inbox');
  const [messages, setMessages] = useState([]);
  const [expandedMessage, setExpandedMessage] = useState(null);
  const [formData, setFormData] = useState({
    title: '',
    message: '',
    recipient_emails: ''
  });
  const [targetGroup, setTargetGroup] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');

  useEffect(() => {
    if (view === 'inbox' && currentUser) {
      setLoading(true);
      setError('');
      getRequest(`messages/${currentUser.id}?role=${currentRole}`)
        .then(result => {
          if (result.succeeded) {
            console.log('Fetched messages:', result.data);

            setMessages(result.data);
          } else {
            setError(result.error || 'Error loading messages');
          }
        })
        .catch(() => setError('Error loading messages'))
        .finally(() => setLoading(false));
    }
  }, [view, currentUser, currentRole]);

  function handleInputChange(e) {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  }

  function resetForm() {
    setFormData({ title: '', message: '', recipient_emails: '' });
    setTargetGroup('');
  }

  async function handleSendMessage(e) {
    e.preventDefault();
    setError('');
    setSuccessMsg('');

    const { title, message, recipient_emails } = formData;

    if (!title || !message || (currentRole === 'secretary' && !recipient_emails)) {
      setError('Please fill in all required fields.');
      return;
    }

    try {
      let recipients = [];

      if (currentRole === 'client' || currentRole === 'coach') {
        recipients.push({
          id: 4,
          role: 'secretary'
        });
      } else if (currentRole === 'secretary') {
        if (recipient_emails === 'ALL') {
          const roleToQuery = targetGroup === 'coaches' ? 'coach' : 'client';
          const result = await getRequest(`users/by-role/${roleToQuery}`);
          if (!result.succeeded) throw new Error('Error fetching users');
          recipients = result.data.data.map(u => ({ id: u.id, role: roleToQuery }));
        } else {
          const emailList = recipient_emails.split(',').map(e => e.trim());
          const result = await postRequest(`users/by-emails`, { emails: emailList });
          if (!result.succeeded || !result.data || result.data.length === 0) {
            setError('No matching users found for the provided emails');
            return;
          }
          recipients = result.data.data.map(u => ({
            id: u.id,
            role: targetGroup === 'coaches' ? 'coach' : 'client'
          }));
        }
      }

      for (const r of recipients) {
        await postRequest('messages', {
          sender_id: currentUser.id,
          sender_role: currentRole,
          recipient_id: r.id,
          recipient_role: r.role,
          title,
          message
        });
      }
      setSuccessMsg('Message sent successfully!');
      resetForm();
    } catch (err) {
      console.error(err);
      setError('Failed to send message');
    }
  }

  const toggleMessageExpansion = (messageId) => {
    setExpandedMessage(expandedMessage === messageId ? null : messageId);
  };

  return (
    <div className="messages-container">
      <div className="background-container"></div>
      <div className="grid-overlay"></div>

      <div className="container">
        <div className="header">
          <h1 className="main-title">
            <Mail className="title-icon" />
            Message Management
          </h1>
          <p className="subtitle">Stay connected with your fitness community</p>
        </div>

        <div className="message-nav">
          <button className={`nav-tab ${view === 'inbox' ? 'active' : ''}`} onClick={() => setView('inbox')}>
            <Inbox className="tab-icon" />
            Inbox
            {messages.length > 0 && <span className="message-count">{messages.length}</span>}
          </button>
          <button className={`nav-tab ${view === 'send' ? 'active' : ''}`} onClick={() => setView('send')}>
            <Send className="tab-icon" />
            Send Message
          </button>
        </div>

        {view === 'inbox' && (
          <div className="inbox-section">
            {loading && <div className="loading-state"><div className="loading-spinner"></div><p>Loading messages...</p></div>}
            {error && <div className="error-message"><p>{error}</p></div>}
            {!loading && messages.length === 0 && (
              <div className="no-messages">
                <Mail className="no-messages-icon" />
                <h3>No Messages</h3>
                <p>You don't have any messages yet.</p>
              </div>
            )}
            <div className="messages-list">
              {messages.map(msg => (
                <div key={msg.id} className="message-card">
                  <div className="message-header" onClick={() => toggleMessageExpansion(msg.id)}>
                    <div className="message-info">
                      <h3 className="message-title">{msg.title}</h3>
                      <div className="message-meta">
                        <span className="sender">From: {msg.Sender.email}</span>
                        <span className="date">
                          <Calendar className="meta-icon" />
                          {formatDateTime(msg.created_at)}
                        </span>
                      </div>
                    </div>
                    <button className="expand-button">
                      {expandedMessage === msg.id ? <ChevronUp /> : <ChevronDown />}
                    </button>
                  </div>
                  {expandedMessage === msg.id && (
                    <div className="message-content">
                      <div className="message-body">
                        <p>{msg.message}</p>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
        {view === 'send' && (
          <div className="send-section">
            <form onSubmit={handleSendMessage} className="message-form">
              {error && <div className="error-message"><p>{error}</p></div>}
              {successMsg && <div className="success-message"><p>{successMsg}</p></div>}
              {currentRole === 'secretary' && (
                <div className="recipient-section">
                  <h3>Select Recipients</h3>
                  <div className="target-group-buttons">
                    <button type="button" className={`group-btn ${targetGroup === 'clients' ? 'active' : ''}`} onClick={() => setTargetGroup('clients')}>
                      <User className="btn-icon" />
                      Send to Clients
                    </button>
                    <button type="button" className={`group-btn ${targetGroup === 'coaches' ? 'active' : ''}`} onClick={() => setTargetGroup('coaches')}>
                      <Users className="btn-icon" />
                      Send to Coaches
                    </button>
                  </div>
                  {targetGroup && (
                    <div className="email-input-section">
                      <label className="form-label">
                        Email Addresses (comma separated):
                        <input
                          type="text"
                          name="recipient_emails"
                          value={formData.recipient_emails}
                          onChange={handleInputChange}
                          className="form-input"
                          placeholder="john@example.com, jane@example.com"
                          required
                        />
                      </label>
                      <button type="button" className="send-all-btn" onClick={() => setFormData(f => ({ ...f, recipient_emails: 'ALL' }))}>
                        <Plus className="btn-icon" />
                        Send to All {targetGroup === 'coaches' ? 'Coaches' : 'Clients'}
                      </button>
                    </div>
                  )}
                </div>
              )}
              <div className="form-group">
                <label className="form-label">
                  Message Title:
                  <select
                    name="title"
                    value={formData.title}
                    onChange={handleInputChange}
                    className="form-select"
                    required
                  >
                    <option value="" disabled>Select a title</option>
                    {(currentRole === 'client' || currentRole === 'coach') && (
                      <option value="Class Complaint">Class Complaint</option>
                    )}
                    {currentRole === 'coach' && (
                      <option value="Class Cancellation Notice">Class Cancellation Notice</option>
                    )}
                    {currentRole === 'secretary' && (
                      <>
                        <option value="General Announcement">General Announcement</option>
                        <option value="System Update">System Update</option>
                      </>
                    )}
                  </select>
                </label>
              </div>
              <div className="form-group">
                <label className="form-label">
                  Message:
                  <textarea
                    name="message"
                    value={formData.message}
                    onChange={handleInputChange}
                    className="form-textarea"
                    rows={6}
                    placeholder="Enter your message here..."
                    required
                  />
                </label>
              </div>
              <button type="submit" className="submit-btn">
                <Send className="btn-icon" />
                Send Message
              </button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}

export default Messages;
