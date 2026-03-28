// ValCrown Login Logic

async function init() {
  await API.init();
}

function showError(message) {
  const el = document.getElementById('login-error');
  el.textContent = message;
  el.classList.add('show');
}

function hideError() {
  const el = document.getElementById('login-error');
  el.classList.remove('show');
}

function setLoading(loading) {
  const btn = document.getElementById('login-btn');
  if (loading) {
    btn.innerHTML = '<span class="spinner"></span>';
    btn.disabled = true;
  } else {
    btn.innerHTML = 'Sign In';
    btn.disabled = false;
  }
}

async function handleLogin() {
  hideError();

  const email = document.getElementById('email').value.trim();
  const password = document.getElementById('password').value;

  if (!email || !password) {
    showError('Please enter your email and password.');
    return;
  }

  if (!email.includes('@')) {
    showError('Please enter a valid email address.');
    return;
  }

  setLoading(true);

  try {
    const deviceVid = await DeviceID.get();
    const result = await API.login(email, password, deviceVid);

    if (result.ok) {
      // Login successful
      window.valcrown.loginSuccess({
        accessToken: result.data.accessToken,
        refreshToken: result.data.refreshToken,
        user: result.data.user,
        license: result.data.license,
      });
    } else {
      // Show specific error messages
      const error = result.data.error || 'Login failed';

      if (result.status === 403 && result.data.code === 'NO_LICENSE') {
        showError('No active license found. Click "Buy ValCrown" below to get started.');
      } else if (result.status === 403 && result.data.code === 'DEVICE_MISMATCH') {
        showError('This license is activated on another device. Contact support@valcrown.com to transfer.');
      } else if (result.status === 401) {
        showError('Invalid email or password. Please try again.');
      } else if (result.status === 403 && result.data.error?.includes('banned')) {
        showError('Your account has been suspended. Contact support@valcrown.com.');
      } else {
        showError(error);
      }

      setLoading(false);
    }
  } catch (err) {
    showError('Cannot connect to ValCrown servers. Check your internet connection.');
    setLoading(false);
  }
}

// Allow pressing Enter to login
document.addEventListener('keypress', (e) => {
  if (e.key === 'Enter') handleLogin();
});

// Initialize
init();
