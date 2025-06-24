import React, { useState, useEffect, useContext } from 'react';
import { getRequest, postRequest } from '../Requests';
import { CurrentUser } from './App';

function formatDateTime(dateString) {
  const options = {
    day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit', hour12: false
  };
  return new Date(dateString).toLocaleString('he-IL', options);
}

function Messages() {
  const { currentUser } = useContext(CurrentUser);
  const selectedRole = localStorage.getItem('selectedRole');
  const [view, setView] = useState('inbox');
  const [messages, setMessages] = useState([]);
  const [formData, setFormData] = useState({
    title: '',
    message: '',
    recipient_emails: ''
  });
  const [targetGroup, setTargetGroup] = useState(''); // 'coaches' or 'clients'
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
console.log(messages);

  useEffect(() => {
    if (view === 'inbox' && currentUser) {
      setLoading(true);
      setError('');
      getRequest(`messages/${currentUser.id}?role=${selectedRole}`)
        .then(result => {
          if (result.succeeded) {
            setMessages(result.data);
          } else {
            setError(result.error || 'שגיאה בטעינת ההודעות');
          }
        })
        .catch(() => setError('שגיאה בטעינת ההודעות'))
        .finally(() => setLoading(false));
    }
  }, [view, currentUser, selectedRole]);

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

    if (!title || !message || (selectedRole === 'secretary' && !recipient_emails)) {
      setError('אנא מלא את כל השדות.');
      return;
    }

    try {
      let recipients = [];

      if (selectedRole === 'client' || selectedRole === 'coach') {
        recipients.push({
          id: 4,
          role: 'secretary'
        });
      } else if (selectedRole === 'secretary') {
        if (recipient_emails === 'ALL') {
          const roleToQuery = targetGroup === 'coaches' ? 'coach' : 'client';
          const result = await getRequest(`users/by-role/${roleToQuery}`);
          if (!result.succeeded) throw new Error('שגיאה באחזור המשתמשים');
          console.log(result.data.data);
          
          recipients = result.data.data.map(u => ({ id: u.id, role: roleToQuery }));
        } else {
          const emailList = recipient_emails.split(',').map(e => e.trim());
          const result = await postRequest(`users/by-emails`, { emails: emailList });
          if (!result.succeeded || !result.data || result.data.length === 0) {
            console.log(result);
            
            setError('לא נמצאו משתמשים מתאימים למיילים שהוזנו');
            return;
          }
          recipients = result.data.data.map(u => ({ id: u.id, role: targetGroup === 'coaches' ? 'coach' : 'client' }));
        }
      }

      for (const r of recipients) {
        await postRequest('messages', {
          sender_id: currentUser.id,
          sender_role: selectedRole,
          recipient_id: r.id,
          recipient_role: r.role,
          title,
          message
        });
      }

      setSuccessMsg('ההודעה נשלחה בהצלחה!');
      resetForm();
    } catch (err) {
      console.error(err);
      setError('שליחת ההודעה נכשלה');
    }
  }

  return (
    <div>
      <h1>ניהול הודעות</h1>
      <div style={{ marginBottom: '1rem' }}>
        <button onClick={() => setView('inbox')} disabled={view === 'inbox'}>הודעות נכנסות</button>
        <button onClick={() => setView('send')} disabled={view === 'send'}>שליחת הודעה</button>
      </div>

      {view === 'inbox' && (
        <>
          {loading && <p>טוען הודעות...</p>}
          {error && <p style={{ color: 'red' }}>{error}</p>}
          {!loading && messages.length === 0 && <p>אין הודעות להצגה.</p>}
          <ul>
            {messages.map(msg => (
              <li key={msg.id} style={{ marginBottom: '1rem', border: '1px solid #ccc', padding: '0.5rem' }}>
                <strong>כותרת:</strong> {msg.title} <br />
                <strong>הודעה:</strong> {msg.message} <br />
                <strong>נשלח בתאריך:</strong> {formatDateTime(msg.created_at)}
              </li>
            ))}
          </ul>
        </>
      )}

      {view === 'send' && (
        <form onSubmit={handleSendMessage} style={{ maxWidth: '500px' }}>
          {error && <p style={{ color: 'red' }}>{error}</p>}
          {successMsg && <p style={{ color: 'green' }}>{successMsg}</p>}

          {selectedRole === 'secretary' && (
            <>
              <button type="button" onClick={() => setTargetGroup('clients')}>שליחה למתאמנים</button>
              <button type="button" onClick={() => setTargetGroup('coaches')}>שליחה למאמנים</button>
              {targetGroup && (
                <>
                  <label>
                    כתובות מייל (מופרדות בפסיקים): <br />
                    <input
                      name="recipient_emails"
                      value={formData.recipient_emails}
                      onChange={handleInputChange}
                      required
                    />
                  </label>
                  <br />
                  <button type="button" onClick={() => setFormData(f => ({ ...f, recipient_emails: 'ALL' }))}>
                    שליחה לכל {targetGroup === 'coaches' ? 'המאמנים' : 'המתאמנים'}
                  </button>
                </>
              )}
            </>
          )}

          <label>
            כותרת: <br />
            <select
              name="title"
              value={formData.title}
              onChange={handleInputChange}
              required
            >
              <option value="" disabled>בחר כותרת</option>
              {(selectedRole === 'client' || selectedRole === 'coach') && (
                <option value="תלונה על שיעור">תלונה על שיעור</option>
              )}
              {selectedRole === 'coach' && (
                <option value="הודעה על ביטול שיעור">הודעה על ביטול שיעור</option>
              )}
              {selectedRole === 'secretary' && (
                <>
                  <option value="הודעה כללית">הודעה כללית</option>
                  <option value="עדכון מערכת">עדכון מערכת</option>
                </>
              )}
            </select>
          </label>
          <br />

          <label>
            הודעה: <br />
            <textarea
              name="message"
              value={formData.message}
              onChange={handleInputChange}
              required
              rows={5}
            />
          </label>
          <br />

          <button type="submit">שלח הודעה</button>
        </form>
      )}
    </div>
  );
}

export default Messages;
