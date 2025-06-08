const BASE_URL = 'http://localhost:5000';  // שים לב כאן את הפורט הנכון של השרת שלך

// שליחת בקשה עם אפשרות לרענן טוקן במקרה של 401 או 403
async function refreshTokenIfNeeded(response) {
  if (response.status !== 401 && response.status !== 403) return null;

  const res = await fetch(`${BASE_URL}/refresh-token`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',  // שליחת הקוקי HttpOnly
  });

  if (!res.ok) {
    localStorage.removeItem('token');
    return null;
  }

  const data = await res.json();
  localStorage.setItem('token', data.accessToken);
  return data.accessToken;
}

async function sendRequestWithRefresh(method, url, body = null) {
  const makeFetch = async (token) => {
    console.log(`${BASE_URL}/${url}`);
    console.log(token);
    
    return fetch(`${BASE_URL}/${url}`, {
      method,
      headers: {
        'Content-Type': 'application/json',
        ...(token && { 'Authorization': `Bearer ${token}` }),
      },
      credentials: 'include',
      ...(body ? { body: JSON.stringify(body) } : {}),
    });
  };

  let token = localStorage.getItem('token');
  let response = await makeFetch(token);

  if (!response.ok) {
    const newToken = await refreshTokenIfNeeded(response);
    if (newToken) {
      response = await makeFetch(newToken);
    }
  }

  const result = {
    succeeded: response.ok,
    error: '',
    data: null,
  };

  if (response.ok) {
    // כאן הוספתי את הקריאה לתוכן JSON בתגובה מוצלחת
    try {
      result.data = await response.json();
    } catch {
      result.data = null;
    }
  } else {
    try {
      const errorData = await response.json();
      result.error = errorData.message || 'משהו השתבש. נסה שוב.';
    } catch {
      result.error = 'משהו השתבש. נסה שוב.';
    }
  }

  return result;
}


// פעולות CRUD
export async function getRequest(url) {
  return await sendRequestWithRefresh('GET', url);
}

export async function postRequest(url, body) {
  return await sendRequestWithRefresh('POST', url, body);
}

export async function putRequest(url, body) {
  return await sendRequestWithRefresh('PUT', url, body);
}

export async function patchRequest(url, body) {
  return await sendRequestWithRefresh('PATCH', url, body);
}

export async function deleteRequest(url) {
  return await sendRequestWithRefresh('DELETE', url);
}
