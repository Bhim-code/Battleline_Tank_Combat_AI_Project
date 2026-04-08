if (!requireAuth()) throw new Error('Not authenticated');

const user = getUser();
document.getElementById('profileName').textContent = user?.name || 'Commander';
document.getElementById('profileEmail').textContent = user?.email || '';
document.getElementById('logoutBtn').addEventListener('click', logout);

(async function loadProfile() {
  try {
    const profile = await apiGetProfile();
    document.getElementById('statJoined').textContent = new Date(profile.createdAt).toLocaleDateString('en-GB');
  } catch (err) {
    console.error(err);
  }
})();
