// X Social App - lace.js
// Adapted for HTML environment

(function() {
  'use strict';

  function injectStyles() {
    const styleId = 'x-social-app-styles';
    if (document.getElementById(styleId)) return;

    const style = document.createElement('style');
    style.id = styleId;
    style.textContent = '#x-social-screen{--x-bg-primary:#000;--x-bg-secondary:#1a1a1a;--x-bg-hover:rgba(255,255,255,0.03);--x-border-color:#2f3336;--x-text-primary:#fff;--x-text-secondary:#71767b;--x-accent:#1d9bf0}#x-social-screen.x-theme-light{--x-bg-primary:#fff;--x-bg-secondary:#f7f9f9;--x-bg-hover:rgba(0,0,0,0.03);--x-border-color:#eff3f4;--x-text-primary:#0f1419;--x-text-secondary:#536471;--x-accent:#1d9bf0}#x-social-screen{width:100%;height:100%;background-color:var(--x-bg-primary);color:var(--x-text-primary);display:none;flex-direction:column;overflow:hidden}#x-social-screen.active{display:flex!important}.x-navbar{display:flex;justify-content:space-around;background-color:var(--x-bg-primary);border-bottom:1px solid var(--x-border-color);padding:12px 0}.x-nav-item{font-size:20px;cursor:pointer;padding:8px 16px;color:var(--x-text-secondary)}.x-nav-item.active{color:var(--x-accent)}.x-content{flex:1;overflow-y:auto;background-color:var(--x-bg-primary)}.tweet-item{padding:16px;border-bottom:1px solid var(--x-border-color);cursor:pointer}.tweet-item:hover{background-color:var(--x-bg-hover)}.tweet-header{display:flex;gap:12px;margin-bottom:8px}.tweet-avatar{width:48px;height:48px;border-radius:50%}.tweet-user-name{font-weight:700;color:var(--x-text-primary)}.tweet-user-handle{color:var(--x-text-secondary);margin-left:4px}.tweet-content{color:var(--x-text-primary);line-height:1.5;margin-bottom:12px}.tweet-actions{display:flex;justify-content:space-around;gap:8px}.tweet-action-btn{display:flex;align-items:center;gap:8px;color:var(--x-text-secondary);cursor:pointer;padding:4px 8px}.x-toast{position:fixed;bottom:80px;left:50%;transform:translateX(-50%);background-color:var(--x-accent);color:white;padding:12px 24px;border-radius:24px;z-index:10000;opacity:0;transition:opacity 0.3s}.x-toast.show{opacity:1}';

    document.head.appendChild(style);
  }

  function createXSocialHTML() {
    const phoneScreen = document.getElementById('phone-screen');
    if (!phoneScreen || document.getElementById('x-social-screen')) return;

    const html = '<div id="x-social-screen" class="screen"><div class="x-navbar"><div class="x-nav-item active" data-page="home">Home</div><div class="x-nav-item" data-page="search">Search</div><div class="x-nav-item" data-page="profile">Profile</div></div><div class="x-content" id="x-content-area"></div></div>';

    phoneScreen.insertAdjacentHTML('beforeend', html);
  }

  function getXDB() {
    if (window.xSocialDB) return window.xSocialDB;

    const xDB = new Dexie('XSocialDB');
    xDB.version(1).stores({
      tweets: '++id, userId, content, createdAt, likes',
      users: 'id, name, handle, avatar, bio',
      settings: 'key, value'
    });

    window.xSocialDB = xDB;
    return xDB;
  }

  async function initializeDefaultData() {
    const db = getXDB();
    const count = await db.users.count();
    if (count > 0) return;

    await db.users.add({
      id: 'main',
      name: 'Me',
      handle: '@me',
      avatar: '',
      bio: 'Welcome to my X profile!'
    });

    await db.tweets.add({
      userId: 'main',
      content: 'This is my first tweet!',
      createdAt: new Date().toISOString(),
      likes: 0
    });

    await db.settings.add({ key: 'theme', value: 'dark' });
  }

  async function renderHomePage() {
    const area = document.getElementById('x-content-area');
    if (!area) return;

    const db = getXDB();
    const tweets = await db.tweets.orderBy('createdAt').reverse().toArray();

    let html = '<div>';
    for (const tweet of tweets) {
      const user = await db.users.get(tweet.userId);
      const safeContent = escapeHTML(tweet.content);
      const userAvatar = user && user.avatar ? user.avatar : 'data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 100 100%22><circle cx=%2250%22 cy=%2250%22 r=%2250%22 fill=%22%23ccc%22/></svg>';
      const userName = user && user.name ? user.name : 'User';
      const userHandle = user && user.handle ? user.handle : '@user';

      html += '<div class="tweet-item"><div class="tweet-header"><img src="' + userAvatar + '" class="tweet-avatar"><div><span class="tweet-user-name">' + userName + '</span><span class="tweet-user-handle">' + userHandle + '</span></div></div><div class="tweet-content">' + safeContent + '</div><div class="tweet-actions"><div class="tweet-action-btn" onclick="window.toggleTweetLike(\'' + tweet.id + '\')">Like ' + (tweet.likes || 0) + '</div></div></div>';
    }
    html += '</div>';
    area.innerHTML = html;
  }

  function renderSearchPage() {
    const area = document.getElementById('x-content-area');
    if (!area) return;
    area.innerHTML = '<div style="padding:40px;text-align:center;color:var(--x-text-secondary)">Search page</div>';
  }

  async function renderProfilePage() {
    const area = document.getElementById('x-content-area');
    if (!area) return;

    const db = getXDB();
    const user = await db.users.get('main');
    const userAvatar = user && user.avatar ? user.avatar : 'data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 100 100%22><circle cx=%2250%22 cy=%2250%22 r=%2250%22 fill=%22%23ccc%22/></svg>';
    const userName = user && user.name ? user.name : 'User';
    const userHandle = user && user.handle ? user.handle : '@user';
    const userBio = user && user.bio ? user.bio : 'No bio yet';

    area.innerHTML = '<div style="padding:20px;color:var(--x-text-primary)"><img src="' + userAvatar + '" style="width:80px;height:80px;border-radius:50%;margin-bottom:12px;cursor:pointer" onclick="window.changeUserAvatar()"><h2>' + userName + '</h2><p style="color:var(--x-text-secondary)">' + userHandle + '</p><p style="margin:12px 0">' + userBio + '</p><button onclick="window.editUserProfile()" style="padding:8px 16px;cursor:pointer;border-radius:20px;border:1px solid var(--x-border-color);background:var(--x-bg-secondary);color:var(--x-text-primary)">Edit Profile</button></div>';
  }

  function switchXPage(page) {
    document.querySelectorAll('.x-nav-item').forEach(function(item) {
      if (item.dataset.page === page) {
        item.classList.add('active');
      } else {
        item.classList.remove('active');
      }
    });

    if (page === 'home') {
      renderHomePage();
    } else if (page === 'search') {
      renderSearchPage();
    } else if (page === 'profile') {
      renderProfilePage();
    }
  }

  async function toggleTweetLike(tweetId) {
    const db = getXDB();
    const tweet = await db.tweets.get(parseInt(tweetId));
    if (!tweet) return;

    tweet.likes = (tweet.likes || 0) + 1;
    await db.tweets.put(tweet);
    showXToast('Liked!');
    renderHomePage();
  }

  async function editUserProfile() {
    const db = getXDB();
    const user = await db.users.get('main');
    if (!user) return;

    const newName = prompt('Enter new name:', user.name);
    if (newName && newName.trim()) {
      user.name = newName.trim();
    }

    const newBio = prompt('Enter new bio:', user.bio);
    if (newBio !== null) {
      user.bio = newBio.trim();
    }

    await db.users.put(user);
    showXToast('Profile updated!');
    renderProfilePage();
  }

  async function changeUserAvatar() {
    const db = getXDB();
    const user = await db.users.get('main');
    if (!user) return;

    const newAvatar = prompt('Enter avatar URL (leave blank for GitHub link):', user.avatar);
    if (newAvatar !== null) {
      user.avatar = newAvatar.trim();
      await db.users.put(user);
      showXToast('Avatar updated!');
      renderProfilePage();
    }
  }

  function showXToast(msg) {
    const oldToast = document.querySelector('.x-toast');
    if (oldToast) {
      oldToast.remove();
    }

    const toast = document.createElement('div');
    toast.className = 'x-toast';
    toast.textContent = msg;
    document.body.appendChild(toast);

    setTimeout(function() {
      toast.classList.add('show');
    }, 10);

    setTimeout(function() {
      toast.classList.remove('show');
      setTimeout(function() {
        toast.remove();
      }, 300);
    }, 2000);
  }

  function escapeHTML(str) {
    if (!str) return '';
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  }

  async function initXSocialApp() {
    console.log('Initializing X Social App...');
    injectStyles();
    createXSocialHTML();
    await initializeDefaultData();

    document.querySelectorAll('.x-nav-item').forEach(function(item) {
      item.addEventListener('click', function() {
        switchXPage(item.dataset.page);
      });
    });

    console.log('X Social App initialized');
  }

  async function renderXSocialScreen() {
    console.log('Rendering X Social Screen');

    if (!document.getElementById('x-social-screen')) {
      await initXSocialApp();
    }

    const screen = document.getElementById('x-social-screen');
    if (screen) {
      screen.classList.add('active');
      switchXPage('home');
    }
  }

  window.renderXSocialScreenProxy = renderXSocialScreen;
  window.toggleTweetLike = toggleTweetLike;
  window.editUserProfile = editUserProfile;
  window.changeUserAvatar = changeUserAvatar;
  window.xSocialSwitchPage = switchXPage;

  console.log('X Social App module loaded');

})();
