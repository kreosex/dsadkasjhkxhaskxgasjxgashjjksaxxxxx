// Channel data
let channels = [];

// Get unique categories
let categories = [];

// JSON verilerini localStorage'dan yükleme veya fetch etme
async function loadChannelData() {
	const cachedData = localStorage.getItem('channelData');
	const lastUpdate = localStorage.getItem('channelDataTimestamp');
	const now = new Date().getTime();

	// 24 saat = 86400000 milisaniye
	const CACHE_DURATION = 86400000;

	// Cache geçerli mi kontrol et
	if (cachedData && lastUpdate && (now - parseInt(lastUpdate) < CACHE_DURATION)) {
		channels = JSON.parse(cachedData);
		categories = [...new Set(channels.map(channel => channel.category))];
		init();
		return;
	}

	// Cache geçersizse veya yoksa yeni veri çek
	try {
		const response = await fetch('https://raw.githubusercontent.com/kreosex/zz_temp_v19x_asu83kq9r3_channels_config.blob/refs/heads/main/emptyDataChanx.json', {
			cache: 'no-store'
		});
		const data = await response.json();

		// Verileri localStorage'a kaydet
		localStorage.setItem('channelData', JSON.stringify(data));
		localStorage.setItem('channelDataTimestamp', now.toString());

		channels = data;
		categories = [...new Set(channels.map(channel => channel.category))];
		init();
	} catch (error) {
		console.error('Kanallar yüklenirken hata oluştu:', error);
		const channelsContainer = document.getElementById('channels');
		if (channelsContainer) {
			channelsContainer.innerHTML = `
				<div class="error-message">
					<i class="fas fa-exclamation-circle"></i>
					<p>Kanallar yüklenirken bir hata oluştu. Lütfen sayfayı yenileyin veya daha sonra tekrar deneyin.</p>
				</div>
			`;
		}
	}
}

// Uygulama başladığında verileri yükle
loadChannelData();

// View management
let currentCategory = null;

function showView(viewId) {
	document.querySelectorAll('.view').forEach(view => view.classList.remove('active'));
	document.getElementById(viewId).classList.add('active');
}

// Section Management
function switchSection(sectionId) {
	// Aktif nav-item'ı güncelle
	document.querySelectorAll('.nav-item').forEach(item => {
		item.classList.remove('active');
	});
	const activeNavItem = document.querySelector(`.nav-item[onclick="switchSection('${sectionId}')"]`);
	if (activeNavItem) {
		activeNavItem.classList.add('active');
	}

	// Yan menü için aktif durumu güncelle
	document.querySelectorAll('.menu-item').forEach(item => {
		item.classList.remove('active');
	});
	const activeMenuItem = document.querySelector(`.menu-item[onclick="switchSection('${sectionId}')"]`);
	if (activeMenuItem) {
		activeMenuItem.classList.add('active');
	}

	// Eğer özel yayın bölümünden başka bir bölüme geçiliyorsa player'ı durdur
	if (sectionId !== 'custom-stream') {
		const customPlayerContainer = document.getElementById('custom-player-container');
		if (customPlayerContainer) {
			const video = customPlayerContainer.querySelector('video');
			if (video) {
				// Video elementini durdur
				video.pause();
				video.src = '';
				video.load();
			}
			// HLS instance'ı varsa temizle
			if (window.customHls) {
				window.customHls.destroy();
				window.customHls = null;
			}
			// Player container'ı temizle ve gizle
			customPlayerContainer.innerHTML = '';
			customPlayerContainer.classList.remove('active');
			// Input'u temizle
			const streamUrl = document.getElementById('streamUrl');
			if (streamUrl) {
				streamUrl.value = '';
			}
		}
	}

	// Tüm section'ları gizle
	document.querySelectorAll('.section').forEach(section => {
		section.classList.remove('active');
	});

	// Seçilen section'ı göster
	const selectedSection = document.getElementById(`${sectionId}-section`);
	if (selectedSection) {
		selectedSection.classList.add('active');

		// Sadece coming soon sections için gecikmeli animasyon uygula
		if (['movies', 'series'].includes(sectionId)) {
			const comingSoonElement = selectedSection.querySelector('.coming-soon');
			if (comingSoonElement) {
				comingSoonElement.style.opacity = '0';
				comingSoonElement.style.transform = 'translateY(20px)';

				setTimeout(() => {
					comingSoonElement.style.opacity = '1';
					comingSoonElement.style.transform = 'translateY(0)';
				}, 200);
			}
		}
	}

	if (sectionId === 'movies') {
		initializeMovies();
	}
}

// Coming Soon Alert
function showComingSoonAlert() {
	const alert = document.createElement('div');
	alert.className = 'coming-soon-alert';
	alert.innerHTML = `
<div class="alert-content">
<i class="fas fa-clock"></i>
<p>Bu özellik yakında eklenecek!</p>
</div>
`;
	document.body.appendChild(alert);

	// Remove alert after animation
	setTimeout(() => {
		alert.classList.add('fade-out');
		setTimeout(() => {
			document.body.removeChild(alert);
		}, 300);
	}, 2000);
}

// Add styles for the alert and search
const style = document.createElement('style');
style.textContent = `
.coming-soon-alert {
position: fixed;
top: 50%;
left: 50%;
transform: translate(-50%, -50%);
background: rgba(0, 0, 0, 0.8);
color: white;
padding: 1rem 2rem;
border-radius: 25px;
z-index: 2000;
animation: fadeIn 0.3s ease;
}

.coming-soon-alert.fade-out {
opacity: 0;
transition: opacity 0.3s ease;
}

.alert-content {
display: flex;
align-items: center;
gap: 1rem;
}

.alert-content i {
font-size: 1.2rem;
}

@keyframes fadeIn {
from { opacity: 0; transform: translate(-50%, -40%); }
to { opacity: 1; transform: translate(-50%, -50%); }
}

.search-box {
display: flex;
align-items: center;
background: var(--card-bg);
border-radius: 25px;
padding: 0.5rem 1rem;
box-shadow: 0 2px 5px rgba(0,0,0,0.1);
margin: 0 1rem;
}

.search-box i {
color: var(--text-color);
margin-right: 0.5rem;
}

#channelSearch {
border: none;
background: none;
outline: none;
flex: 1;
font-size: 1rem;
color: var(--text-color);
padding: 0.5rem;
}

#channelSearch::placeholder {
color: var(--text-muted);
}

.channels-grid {
display: grid;
grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
gap: 1rem;
padding: 1rem;
}

.no-results {
grid-column: 1 / -1;
text-align: center;
padding: 2rem;
color: var(--text-muted);
font-size: 1.1rem;
}

/* Theme Transition Styles */
.theme-transitioning * {
transition: background-color 0.3s ease, color 0.3s ease, box-shadow 0.3s ease !important;
}
`;
document.head.appendChild(style);

// Theme Management
function initTheme() {
	const themeToggle = document.getElementById('themeToggle');
	const savedTheme = localStorage.getItem('theme') || 'light';

	// Set initial theme
	document.documentElement.setAttribute('data-theme', savedTheme);

	if (themeToggle) {
		themeToggle.checked = savedTheme === 'dark';

		themeToggle.addEventListener('change', function () {
			const newTheme = this.checked ? 'dark' : 'light';
			document.documentElement.setAttribute('data-theme', newTheme);
			localStorage.setItem('theme', newTheme);

			// Add animation class for smooth transition
			document.body.classList.add('theme-transitioning');
			setTimeout(() => {
				document.body.classList.remove('theme-transitioning');
			}, 300);
		});
	}
}

// Initialize the application
function init() {
	createCategoryCards();
	setupVideoPlayer();
	showView('categories-view');
	switchSection('tv');
	initTheme(); // Initialize theme
	loadTheme();
}

// Create category cards
function createCategoryCards() {
	const categoriesContainer = document.getElementById('categories');
	categoriesContainer.innerHTML = ''; // Container'ı temizle

	// Add Favorites category first
	const favoritesCard = document.createElement('div');
	favoritesCard.className = 'category-card';
	favoritesCard.onclick = () => showFavoriteChannels();

	favoritesCard.innerHTML = `
<div class="category-icon">
	<i class="fas fa-heart"></i>
</div>
<div class="category-name">Favoriler</div>
`;

	categoriesContainer.appendChild(favoritesCard);

	// Add other categories
	categories.forEach(category => {
		const card = document.createElement('div');
		card.className = 'category-card';
		card.onclick = () => handleCategoryClick(category);

		const icon = getCategoryIcon(category);

		card.innerHTML = `
<div class="category-icon">
	<i class="${icon}"></i>
</div>
<div class="category-name">${category.charAt(0).toUpperCase() + category.slice(1)}</div>
`;

		categoriesContainer.appendChild(card);
	});
}

// Get appropriate icon for category
function getCategoryIcon(category) {
	const icons = {
		spor: 'fas fa-futbol',
		ulusal: 'fas fa-tv',
		tarım: 'fas fa-tractor',
		haber: 'fas fa-newspaper',
		belgesel: 'fas fa-film',
		sinema: 'fas fa-video',
		din: 'fas fa-mosque',
		çocuk: 'fas fa-child',
		müzik: 'fas fa-music',
		ekonomi: 'fas fa-money-bill'
	};
	return icons[category] || 'fas fa-tv';
}

// Show channels for selected category
function showChannels(category) {
	currentCategory = category;
	document.getElementById('current-category').textContent = category.charAt(0).toUpperCase() + category.slice(1);

	const sportsNotice = document.getElementById('sports-notice');
	if (category === 'spor') {
		sportsNotice.style.display = 'flex';
	} else {
		sportsNotice.style.display = 'none';
	}

	const channelsContainer = document.getElementById('channels');
	channelsContainer.innerHTML = '';

	// Add search input
	const searchContainer = document.createElement('div');
	searchContainer.className = 'search-container';
	searchContainer.innerHTML = `
<div class="search-box">
<i class="fas fa-search"></i>
<input type="text" id="channelSearch" placeholder="Kanal ara...">
</div>
`;
	channelsContainer.appendChild(searchContainer);

	// Create channels container
	const channelsGrid = document.createElement('div');
	channelsGrid.className = 'channels-grid';
	channelsContainer.appendChild(channelsGrid);

	// Filter and display channels
	const filteredChannels = channels.filter(channel => channel.category === category);

	function displayChannels(searchText = '') {
		channelsGrid.innerHTML = '';
		const searchLower = searchText.toLowerCase();

		const matchedChannels = filteredChannels.filter(channel =>
			channel.name.toLowerCase().includes(searchLower)
		);

		if (matchedChannels.length === 0) {
			channelsGrid.innerHTML = '<div class="no-results">Kanal bulunamadı</div>';
			return;
		}

		matchedChannels.forEach(channel => {
			const channelCard = document.createElement('div');
			channelCard.className = 'channel-card';

			const isFavorite = favoriteChannels.some(fav => fav.stream_url === channel.stream_url);

			channelCard.innerHTML = `
		<img src="${channel.logo}" alt="${channel.name}" class="channel-logo" onerror="handleImageError(this)">
	<div class="channel-name">${channel.name}</div>
		<button class="favorite-btn ${isFavorite ? 'active' : ''}" data-channel='${JSON.stringify(channel)}'>
			<i class="fas fa-heart"></i>
		</button>
	`;

			// Kanal kartına tıklama olayı
			channelCard.querySelector('.favorite-btn').addEventListener('click', function (e) {
				e.stopPropagation();
				const channelData = JSON.parse(this.getAttribute('data-channel'));
				toggleFavorite(e, channelData);
			});

			channelCard.addEventListener('click', () => playChannel(channel));

			channelsGrid.appendChild(channelCard);
		});
	}

	// Initial display
	displayChannels();

	// Add search event listener
	const searchInput = document.getElementById('channelSearch');
	searchInput.addEventListener('input', (e) => {
		displayChannels(e.target.value);
	});

	showView('channels-view');
}

// Setup video player (using iframes now)
function setupVideoPlayer() {
	// Empty function since we're using iframes now
}

// Play selected channel
function playChannel(channel) {
	currentChannel = channel;
	const currentChannelElement = document.getElementById('current-channel');
	if (currentChannelElement) {
		currentChannelElement.textContent = channel.name;
	}

	const playerContainer = document.getElementById('player-container');
	if (!playerContainer) return;

	// Önce mevcut player'ı temizle
	if (window.currentHls) {
		window.currentHls.destroy();
		window.currentHls = null;
	}
	playerContainer.innerHTML = '';

	try {
		if (channel.useHlsPlayer) {
			const video = document.createElement('video');
			video.id = 'video';
			video.controls = true;
			video.style.width = '100%';
			video.style.height = '100%';
			playerContainer.appendChild(video);

			if (Hls.isSupported()) {
				const hls = new Hls({
					debug: false,
					maxBufferLength: 30,
					maxMaxBufferLength: 600,
					maxBufferSize: 60 * 1000 * 1000,
					maxBufferHole: 0.5,
					manifestLoadingTimeOut: 10000,
					manifestLoadingMaxRetry: 5,
					manifestLoadingRetryDelay: 1000,
					manifestLoadingMaxRetryTimeout: 64000,
					fragLoadingTimeOut: 10000,
					fragLoadingMaxRetry: 5,
					fragLoadingRetryDelay: 1000,
					fragLoadingMaxRetryTimeout: 64000,
					autoStartLoad: true,
					startPosition: -1,
					defaultAudioCodec: undefined,
					enableWorker: true,
					enableSoftwareAES: true,
					startLevel: 0,
					levelLoadingTimeOut: 10000,
					levelLoadingMaxRetry: 4,
					levelLoadingRetryDelay: 1000,
					levelLoadingMaxRetryTimeout: 64000
				});

				window.currentHls = hls; // Global referans için kaydet
				hls.loadSource(channel.stream_url);
				hls.attachMedia(video);

				// Hata yönetimi
				hls.on(Hls.Events.ERROR, function (event, data) {
					if (data.fatal) {
						switch (data.type) {
							case Hls.ErrorTypes.NETWORK_ERROR:
								console.log('Ağ hatası, yeniden bağlanılıyor...');
								hls.startLoad();
								break;
							case Hls.ErrorTypes.MEDIA_ERROR:
								console.log('Medya hatası, kurtarılmaya çalışılıyor...');
								hls.recoverMediaError();
								break;
							default:
								// Diğer fatal hatalarda yeniden başlat
								console.log('Kritik hata, player yeniden başlatılıyor...');
								hls.destroy();
								initPlayer();
								break;
						}
					} else {
						// Fatal olmayan hataları görmezden gel
						console.log('Önemsiz hata, oynatmaya devam ediliyor...');
					}
				});

				// Manifest yüklendiğinde
				hls.on(Hls.Events.MANIFEST_PARSED, function () {
					video.play().catch(function (error) {
						console.log('Otomatik oynatma başlatılamadı:', error);
					});
				});

				// Medya ekleme hatası
				hls.on(Hls.Events.MEDIA_ATTACHED, function () {
					console.log('Media attached');
				});

				function initPlayer() {
					hls.loadSource(channel.stream_url);
					hls.attachMedia(video);
				}

			} else if (video.canPlayType('application/vnd.apple.mpegurl')) {
				video.src = channel.stream_url;
				video.addEventListener('loadedmetadata', function () {
					video.play();
				});
				video.addEventListener('error', function (e) {
					console.log('Video hatası:', e);
					// Hata durumunda yeniden dene
					setTimeout(() => {
						video.src = channel.stream_url;
						video.load();
						video.play();
					}, 2000);
				});
			} else {
				throw new Error('HLS is not supported on this device');
			}
		} else {
			const iframe = document.createElement('iframe');
			iframe.src = channel.stream_url;
			iframe.style.border = 'none';
			iframe.style.width = '100%';
			iframe.style.height = '100%';
			iframe.allowFullscreen = true;
			iframe.setAttribute('allowfullscreen', '');
			iframe.setAttribute('webkitallowfullscreen', '');
			iframe.setAttribute('mozallowfullscreen', '');
			iframe.style.backgroundColor = document.documentElement.getAttribute('data-theme') === 'dark' ? '#1a1a1a' : '#ffffff';
			playerContainer.appendChild(iframe);
		}
	} catch (error) {
		handleVideoError(error);
	}

	showView('player-view');
}

// Navigation functions
function showCategories() {
	showView('categories-view');
}

function backToChannels() {
	// HLS player'ı temizle
	if (window.currentHls) {
		window.currentHls.destroy();
		window.currentHls = null;
	}

	// Video elementini temizle
	const video = document.getElementById('video');
	if (video) {
		video.pause();
		video.removeAttribute('src');
		video.load();
	}

	// Player container'ı temizle
	const playerContainer = document.getElementById('player-container');
	if (playerContainer) {
		playerContainer.innerHTML = '';
	}

	if (currentCategory) {
		showView('channels-view');
	} else {
		showCategories();
	}
}

// Theme management
function toggleTheme() {
	const body = document.body;
	const themeToggle = document.getElementById('themeToggle');
	const iframes = document.querySelectorAll('iframe');

	body.classList.add('theme-transitioning');

	const newTheme = themeToggle.checked ? 'dark' : 'light';
	const bgColor = newTheme === 'dark' ? '#1a1a1a' : '#ffffff';

	if (newTheme === 'dark') {
		body.classList.add('dark-theme');
		localStorage.setItem('theme', 'dark');
	} else {
		body.classList.remove('dark-theme');
		localStorage.setItem('theme', 'light');
	}

	// İframe'lerin arka plan rengini güncelle
	iframes.forEach(iframe => {
		iframe.style.backgroundColor = bgColor;
		if (iframe.srcdoc) {
			iframe.srcdoc = iframe.srcdoc.replace(
				/background-color: #[0-9a-fA-F]{6}/,
				`background-color: ${bgColor}`
			);
		}
	});

	setTimeout(() => {
		body.classList.remove('theme-transitioning');
	}, 300);
}

// Load saved theme preference
function loadTheme() {
	const savedTheme = localStorage.getItem('theme');
	const themeToggle = document.getElementById('themeToggle');

	if (savedTheme === 'dark') {
		document.body.classList.add('dark-theme');
		themeToggle.checked = true;
	}
}

// Error handling functions
function handleVideoError(error) {
	console.error('Video playback error:', error);
	const playerContainer = document.getElementById('player-container');
	if (playerContainer) {
		playerContainer.innerHTML = `
	<div class="error-message">
		<i class="fas fa-exclamation-circle"></i>
		<p>Video yüklenirken bir hata oluştu. Lütfen daha sonra tekrar deneyin.</p>
	</div>
`;
	}
}

function handleImageError(img) {
	if (img) {
		img.onerror = null;
		img.src = 'https://via.placeholder.com/150?text=Resim+Yüklenemedi';
	}
}

// Initialize when DOM is loaded with error handling
document.addEventListener('DOMContentLoaded', function () {
	try {
		init();
		// İlk yüklemede TV section'ını göster
		switchSection('tv');
	} catch (error) {
		console.error('Initialization error:', error);
	}
});

// Gizlilik hakları modal işlemleri
document.querySelector('.settings-item:nth-child(3)').addEventListener('click', function () {
	const modal = document.getElementById('privacy-modal');
	modal.style.display = 'block';
	setTimeout(() => {
		modal.classList.add('active');
	}, 10);
});

document.querySelector('.close-modal').addEventListener('click', function () {
	const modal = document.getElementById('privacy-modal');
	modal.classList.remove('active');
	setTimeout(() => {
		modal.style.display = 'none';
	}, 300);
});

// Modal dışına tıklandığında kapatma
document.getElementById('privacy-modal').addEventListener('click', function (e) {
	if (e.target === this) {
		this.classList.remove('active');
		setTimeout(() => {
			this.style.display = 'none';
		}, 300);
	}
});

// Favorites Management
let favoriteChannels = JSON.parse(localStorage.getItem('favoriteChannels')) || [];

function toggleFavorite(event, channel) {
	event.stopPropagation();
	const button = event.currentTarget;

	// Favorileri localStorage'dan al
	let favorites = JSON.parse(localStorage.getItem('favoriteChannels') || '[]');

	// Kanalın favori durumunu kontrol et (stream_url'e göre)
	const isFavorite = favorites.some(fav => fav.stream_url === channel.stream_url);

	if (isFavorite) {
		// Favorilerden çıkar
		favorites = favorites.filter(fav => fav.stream_url !== channel.stream_url);
		button.classList.remove('active');
		showToast(`${channel.name} favorilerden çıkarıldı`);
	} else {
		// Favorilere ekle
		favorites.push(channel);
		button.classList.add('active');
		showToast(`${channel.name} favorilere eklendi`);
	}

	// Favorileri güncelle
	localStorage.setItem('favoriteChannels', JSON.stringify(favorites));
	favoriteChannels = favorites;
}

function showFavoriteChannels() {
	const favorites = JSON.parse(localStorage.getItem('favoriteChannels') || '[]');

	if (favorites.length === 0) {
		showNoFavoritesPopup();
		return;
	}

	currentCategory = 'Favoriler';
	document.getElementById('current-category').textContent = 'Favoriler';

	const channelsContainer = document.getElementById('channels');
	channelsContainer.innerHTML = '';

	// Add search input
	const searchContainer = document.createElement('div');
	searchContainer.className = 'search-container';
	searchContainer.innerHTML = `
<div class="search-box">
	<i class="fas fa-search"></i>
	<input type="text" id="channelSearch" placeholder="Kanal ara...">
</div>
`;
	channelsContainer.appendChild(searchContainer);

	// Create channels container
	const channelsGrid = document.createElement('div');
	channelsGrid.className = 'channels-grid';
	channelsContainer.appendChild(channelsGrid);

	function displayFavorites(searchText = '') {
		channelsGrid.innerHTML = '';
		const searchLower = searchText.toLowerCase();

		const matchedChannels = favorites.filter(channel =>
			channel.name.toLowerCase().includes(searchLower)
		);

		if (matchedChannels.length === 0) {
			channelsGrid.innerHTML = '<div class="no-results">Kanal bulunamadı</div>';
			return;
		}

		matchedChannels.forEach(channel => {
			const channelCard = document.createElement('div');
			channelCard.className = 'channel-card';

			channelCard.innerHTML = `
		<img src="${channel.logo}" alt="${channel.name}" class="channel-logo" onerror="handleImageError(this)">
		<div class="channel-name">${channel.name}</div>
		<button class="favorite-btn active" data-channel='${JSON.stringify(channel)}'>
			<i class="fas fa-heart"></i>
		</button>
	`;

			channelCard.querySelector('.favorite-btn').addEventListener('click', function (e) {
				e.stopPropagation();
				const channelData = JSON.parse(this.getAttribute('data-channel'));
				toggleFavorite(e, channelData);

				// Favorilerden çıkarıldıysa kartı kaldır
				if (!this.classList.contains('active')) {
					channelCard.remove();
					// Eğer hiç favori kalmadıysa popup'ı göster
					if (favoriteChannels.length === 0) {
						showNoFavoritesPopup();
					}
				}
			});

			channelCard.addEventListener('click', () => playChannel(channel));

			channelsGrid.appendChild(channelCard);
		});
	}

	// Initial display
	displayFavorites();

	// Add search event listener
	const searchInput = document.getElementById('channelSearch');
	searchInput.addEventListener('input', (e) => {
		displayFavorites(e.target.value);
	});

	showView('channels-view');
}

// Popup functions
function showNoFavoritesPopup() {
	const overlay = document.getElementById('noFavoritesOverlay');
	const popup = document.getElementById('noFavoritesPopup');

	overlay.classList.add('show');
	popup.classList.add('show');

	// Kategoriler görünümüne geri dön
	showView('categories-view');
}

function closeNoFavoritesPopup() {
	const overlay = document.getElementById('noFavoritesOverlay');
	const popup = document.getElementById('noFavoritesPopup');

	overlay.classList.remove('show');
	popup.classList.remove('show');
}

// Overlay'a tıklandığında da popup'ı kapat
document.getElementById('noFavoritesOverlay').addEventListener('click', closeNoFavoritesPopup);

function showToast(message, type = 'info') {
	const toast = document.createElement('div');
	toast.className = `toast toast-${type}`;

	const icon = document.createElement('i');
	switch (type) {
		case 'error':
			icon.className = 'fas fa-exclamation-circle';
			break;
		case 'warning':
			icon.className = 'fas fa-exclamation-triangle';
			break;
		case 'success':
			icon.className = 'fas fa-check-circle';
			break;
		default:
			icon.className = 'fas fa-info-circle';
	}

	toast.innerHTML = `
${icon.outerHTML}
<span>${message}</span>
`;

	document.body.appendChild(toast);

	// Animate in
	setTimeout(() => toast.classList.add('show'), 100);

	// Remove after 3 seconds
	setTimeout(() => {
		toast.classList.remove('show');
		setTimeout(() => toast.remove(), 300);
	}, 3000);
}

// Initialize toast styles if they haven't been added yet
if (!document.getElementById('toastStyles')) {
	const toastStyles = document.createElement('style');
	toastStyles.id = 'toastStyles';
	toastStyles.textContent = `
.toast {
position: fixed;
bottom: 20px;
left: 50%;
transform: translateX(-50%) translateY(100px);
background: white;
color: #333;
padding: 12px 24px;
border-radius: 8px;
box-shadow: 0 4px 12px rgba(0,0,0,0.15);
display: flex;
align-items: center;
gap: 8px;
z-index: 10000;
opacity: 0;
transition: all 0.3s ease;
}

.toast.show {
transform: translateX(-50%) translateY(0);
opacity: 1;
}

.toast i {
font-size: 1.2rem;
}

.toast-error {
background: #dc3545;
color: white;
}

.toast-warning {
background: #ffc107;
color: #333;
}

.toast-success {
background: #28a745;
color: white;
}

body.dark-theme .toast {
background: #2a2a2a;
color: #fff;
}
`;
	document.head.appendChild(toastStyles);
}

// Custom Stream Playback
function playCustomStream() {
	const streamUrl = document.getElementById('streamUrl').value.trim();
	const playerContainer = document.getElementById('custom-player-container');

	if (!streamUrl) {
		showToast('Lütfen bir yayın adresi girin', 'error');
		return;
	}

	if (!streamUrl.toLowerCase().endsWith('.m3u8')) {
		showToast('Sadece M3U8 formatındaki adresler desteklenmektedir', 'error');
		return;
	}

	// Clear previous player
	playerContainer.innerHTML = '';

	try {
		const video = document.createElement('video');
		video.id = 'custom-video';
		video.controls = true;
		video.style.width = '100%';
		video.style.height = '100%';

		playerContainer.appendChild(video);
		playerContainer.classList.add('active');

		if (Hls.isSupported()) {
			// Önceki HLS instance'ı varsa temizle
			if (window.customHls) {
				window.customHls.destroy();
			}

			window.customHls = new Hls({
				debug: false,
				maxBufferLength: 30,
				maxMaxBufferLength: 600,
				maxBufferSize: 60 * 1000 * 1000,
				maxBufferHole: 0.5,
				manifestLoadingTimeOut: 10000,
				manifestLoadingMaxRetry: 5,
				manifestLoadingRetryDelay: 1000,
				manifestLoadingMaxRetryTimeout: 64000,
				fragLoadingTimeOut: 10000,
				fragLoadingMaxRetry: 5,
				fragLoadingRetryDelay: 1000,
				fragLoadingMaxRetryTimeout: 64000,
				autoStartLoad: true,
				startPosition: -1,
				defaultAudioCodec: undefined,
				enableWorker: true,
				enableSoftwareAES: true,
				startLevel: 0,
				levelLoadingTimeOut: 10000,
				levelLoadingMaxRetry: 4,
				levelLoadingRetryDelay: 1000,
				levelLoadingMaxRetryTimeout: 64000
			});

			window.customHls.loadSource(streamUrl);
			window.customHls.attachMedia(video);

			window.customHls.on(Hls.Events.ERROR, function (event, data) {
				if (data.fatal) {
					switch (data.type) {
						case Hls.ErrorTypes.NETWORK_ERROR:
							showToast('Ağ hatası, yeniden bağlanılıyor...', 'warning');
							window.customHls.startLoad();
							break;
						case Hls.ErrorTypes.MEDIA_ERROR:
							showToast('Medya hatası, kurtarılmaya çalışılıyor...', 'warning');
							window.customHls.recoverMediaError();
							break;
						default:
							showToast('Yayın başlatılamadı. Lütfen adresi kontrol edin.', 'error');
							playerContainer.classList.remove('active');
							break;
					}
				}
			});

			window.customHls.on(Hls.Events.MANIFEST_PARSED, function () {
				video.play().catch(function (error) {
					showToast('Otomatik oynatma başlatılamadı', 'warning');
				});
			});

		} else if (video.canPlayType('application/vnd.apple.mpegurl')) {
			video.src = streamUrl;
			video.addEventListener('loadedmetadata', function () {
				video.play();
			});
			video.addEventListener('error', function (e) {
				showToast('Video yüklenirken hata oluştu', 'error');
				playerContainer.classList.remove('active');
			});
		} else {
			showToast('HLS player bu cihazda desteklenmiyor', 'error');
			playerContainer.classList.remove('active');
		}
	} catch (error) {
		showToast('Yayın başlatılırken bir hata oluştu', 'error');
		playerContainer.classList.remove('active');
	}
}

// VPN Warning Popup Functions
function showVpnWarning() {
	// Eğer kullanıcı bir daha gösterme seçeneğini işaretlediyse, direkt kanalları göster
	if (localStorage.getItem('dontShowVpnWarning') === 'true') {
		showChannels('spor');
		return;
	}

	const popup = document.getElementById('vpnWarningPopup');
	popup.classList.add('show');
}

function closeVpnWarning() {
	const popup = document.getElementById('vpnWarningPopup');
	const dontShowAgain = document.getElementById('vpnDontShowAgain');

	// Eğer checkbox işaretliyse, tercihi localStorage'a kaydet
	if (dontShowAgain.checked) {
		localStorage.setItem('dontShowVpnWarning', 'true');
	}

	popup.classList.remove('show');
	showChannels('spor'); // Spor kanallarını göster
}

// Kategori tıklama fonksiyonunu güncelle
function handleCategoryClick(category) {
	if (category === 'spor') {
		showVpnWarning();
	} else {
		showChannels(category);
	}
}

// TMDB API Configuration
const TMDB_API_KEY = '4e012d6a950f5501f23ee3e7f1e548d4';
const TMDB_BASE_URL = 'https://api.themoviedb.org/3';
const TMDB_IMAGE_BASE_URL = 'https://image.tmdb.org/t/p/w500';

let currentPage = 1;
let currentSearchQuery = '';
let isLoading = false;
let selectedGenre = '';
let selectedYear = '';
let selectedSort = 'popularity.desc';

// Initialize movies when switching to movies section
async function initializeMovies() {
	// Reset filters and search
	currentPage = 1;
	currentSearchQuery = '';
	document.getElementById('movieSearch').value = '';

	// Initialize genre filter
	await loadGenres();

	// Initialize year filter
	initializeYearFilter();

	// Load initial movies
	loadMovies();

	// Add event listeners
	setupMovieEventListeners();
}

// Load movie genres from TMDB
async function loadGenres() {
	try {
		const response = await fetch(`${TMDB_BASE_URL}/genre/movie/list?api_key=${TMDB_API_KEY}&language=tr-TR`);
		const data = await response.json();

		const genreSelect = document.getElementById('genreFilter');
		data.genres.forEach(genre => {
			const option = document.createElement('option');
			option.value = genre.id;
			option.textContent = genre.name;
			genreSelect.appendChild(option);
		});
	} catch (error) {
		console.error('Genre loading error:', error);
	}
}

// Initialize year filter
function initializeYearFilter() {
	const yearSelect = document.getElementById('yearFilter');
	const currentYear = new Date().getFullYear();

	for (let year = currentYear; year >= 1900; year--) {
		const option = document.createElement('option');
		option.value = year;
		option.textContent = year;
		yearSelect.appendChild(option);
	}
}

// Setup event listeners for movies section
function setupMovieEventListeners() {
	const searchInput = document.getElementById('movieSearch');
	const genreFilter = document.getElementById('genreFilter');
	const yearFilter = document.getElementById('yearFilter');
	const sortFilter = document.getElementById('sortFilter');
	const loadMoreBtn = document.getElementById('loadMoreMovies');

	// Search input with debounce
	let debounceTimeout;
	searchInput.addEventListener('input', (e) => {
		clearTimeout(debounceTimeout);
		debounceTimeout = setTimeout(() => {
			currentSearchQuery = e.target.value;
			currentPage = 1;
			loadMovies(true);
		}, 500);
	});

	// Filters
	genreFilter.addEventListener('change', () => {
		selectedGenre = genreFilter.value;
		currentPage = 1;
		loadMovies(true);
	});

	yearFilter.addEventListener('change', () => {
		selectedYear = yearFilter.value;
		currentPage = 1;
		loadMovies(true);
	});

	sortFilter.addEventListener('change', () => {
		selectedSort = sortFilter.value;
		currentPage = 1;
		loadMovies(true);
	});

	// Load more button
	loadMoreBtn.addEventListener('click', () => {
		currentPage++;
		loadMovies(false);
	});
}

// Load movies from TMDB
async function loadMovies(clearGrid = false) {
	if (isLoading) return;
	isLoading = true;

	const moviesGrid = document.getElementById('moviesGrid');
	const loadMoreBtn = document.getElementById('loadMoreMovies');

	if (clearGrid) {
		moviesGrid.innerHTML = '';
	}

	try {
		let url;
		if (currentSearchQuery) {
			url = `${TMDB_BASE_URL}/search/movie?api_key=${TMDB_API_KEY}&language=tr-TR&query=${encodeURIComponent(currentSearchQuery)}&page=${currentPage}`;
		} else {
			url = `${TMDB_BASE_URL}/discover/movie?api_key=${TMDB_API_KEY}&language=tr-TR&sort_by=${selectedSort}&page=${currentPage}`;

			if (selectedGenre) {
				url += `&with_genres=${selectedGenre}`;
			}
			if (selectedYear) {
				url += `&primary_release_year=${selectedYear}`;
			}
		}

		const response = await fetch(url);
		const data = await response.json();

		if (data.results.length === 0 && clearGrid) {
			moviesGrid.innerHTML = '<div class="no-results">Film bulunamadı</div>';
			loadMoreBtn.style.display = 'none';
			return;
		}

		data.results.forEach(movie => {
			const movieCard = createMovieCard(movie);
			moviesGrid.appendChild(movieCard);
		});

		loadMoreBtn.style.display = data.page < data.total_pages ? 'block' : 'none';
	} catch (error) {
		console.error('Movie loading error:', error);
		if (clearGrid) {
			moviesGrid.innerHTML = '<div class="error-message">Filmler yüklenirken bir hata oluştu</div>';
		}
	} finally {
		isLoading = false;
	}
}

// Create movie card element
function createMovieCard(movie) {
	const card = document.createElement('div');
	card.className = 'movie-card';

	const releaseYear = movie.release_date ? new Date(movie.release_date).getFullYear() : 'Belirsiz';
	const rating = movie.vote_average ? movie.vote_average.toFixed(1) : 'N/A';

	card.innerHTML = `
		<div class="movie-poster">
			<img src="${movie.poster_path ? TMDB_IMAGE_BASE_URL + movie.poster_path : 'https://via.placeholder.com/300x450?text=Poster+Yok'}" 
				 alt="${movie.title}" 
				 loading="lazy">
		</div>
		<div class="movie-info">
			<div class="movie-title">${movie.title}</div>
			<div class="movie-meta">
				<div class="movie-rating">
					<i class="fas fa-star"></i>
					<span>${rating}</span>
				</div>
				<div class="movie-year">${releaseYear}</div>
			</div>
		</div>
	`;

	card.addEventListener('click', () => showMovieDetails(movie));

	return card;
}

// Show movie details (to be implemented)
async function showMovieDetails(movie) {
	const popup = document.getElementById('movieDetailPopup');
	const loading = popup.querySelector('.movie-loading');

	// Show popup with loading state
	popup.classList.add('show');
	loading.style.display = 'flex';

	try {
		// Film stream verilerini localStorage'dan kontrol et
		let streamData;
		const cachedStreamData = localStorage.getItem('movieStreamData');
		const lastUpdate = localStorage.getItem('movieStreamTimestamp');
		const now = new Date().getTime();
		const CACHE_DURATION = 86400000; // 24 saat

		// Cache geçerli mi kontrol et
		if (cachedStreamData && lastUpdate && (now - parseInt(lastUpdate) < CACHE_DURATION)) {
			streamData = JSON.parse(cachedStreamData);
		} else {
			// Cache geçersizse veya yoksa yeni veri çek
			const streamResponse = await fetch('https://raw.githubusercontent.com/kreosex/aasdsaxa/refs/heads/main/filmler.json');
			streamData = await streamResponse.json();

			// Verileri localStorage'a kaydet
			localStorage.setItem('movieStreamData', JSON.stringify(streamData));
			localStorage.setItem('movieStreamTimestamp', now.toString());
		}

		// String ve number ID'leri karşılaştırmak için toString() kullan
		const movieStream = streamData.find(item => item.id.toString() === movie.id.toString());

		// Store stream URL if available
		if (movieStream) {
			popup.dataset.streamUrl = movieStream.url;
		}

		// Update popup content
		document.getElementById('movieDetailTitle').textContent = movie.title;
		document.getElementById('movieDetailRating').textContent = movie.vote_average.toFixed(1);
		document.getElementById('movieDetailYear').textContent = movie.release_date.split('-')[0];
		document.getElementById('movieDetailVotes').textContent = movie.vote_count.toLocaleString();
		document.getElementById('movieDetailOverview').textContent = movie.overview;

		// Load images
		const backdropUrl = movie.backdrop_path
			? `${TMDB_IMAGE_BASE_URL}${movie.backdrop_path}`
			: `${TMDB_IMAGE_BASE_URL}${movie.poster_path}`;

		document.getElementById('movieBackdrop').src = backdropUrl;
		document.getElementById('movieDetailPoster').src = `${TMDB_IMAGE_BASE_URL}${movie.poster_path}`;

		// Show/hide watch button based on stream availability
		const watchButton = popup.querySelector('.watch-movie-btn');
		watchButton.style.display = movieStream ? 'flex' : 'none';

		// Fragman butonu için event listener ekle
		const trailerBtn = popup.querySelector('.trailer-btn');
		trailerBtn.onclick = () => showMovieTrailer(movie.id);

	} catch (error) {
		console.error('Error loading movie details:', error);
		showToast('Film detayları yüklenirken bir hata oluştu', 'error');
	} finally {
		loading.style.display = 'none';
	}
}

// Close movie detail popup
function closeMovieDetail() {
	const popup = document.getElementById('movieDetailPopup');

	// Stop video playback if exists
	if (window.movieHls) {
		window.movieHls.destroy();
		window.movieHls = null;
	}

	// Remove trailer if exists
	const playerContainer = popup.querySelector('.movie-player-container');
	if (playerContainer) {
		playerContainer.remove();
	}

	const video = popup.querySelector('video');
	if (video) {
		video.pause();
		video.removeAttribute('src');
		video.load();
	}

	// Reset player container
	const moviePlayerContainer = popup.querySelector('.movie-player-container');
	if (moviePlayerContainer) {
		moviePlayerContainer.classList.remove('show');
		moviePlayerContainer.innerHTML = '';
	}

	// Reset detail body
	const detailBody = popup.querySelector('.movie-detail-body');
	if (detailBody) {
		detailBody.classList.remove('with-player');
	}

	popup.classList.remove('show');
	delete popup.dataset.streamUrl;
}

// Play movie stream
function playMovieStream() {
	const popup = document.getElementById('movieDetailPopup');
	const streamUrl = popup.dataset.streamUrl;
	const detailBody = popup.querySelector('.movie-detail-body');
	const overview = detailBody.querySelector('.movie-overview');

	if (!streamUrl) {
		showToast('Film stream bilgisi bulunamadı', 'error');
		return;
	}

	// Add player container if not exists
	let playerContainer = popup.querySelector('.movie-player-container');
	if (!playerContainer) {
		playerContainer = document.createElement('div');
		playerContainer.className = 'movie-player-container';
		// Açıklamadan sonra ekle
		overview.insertAdjacentElement('afterend', playerContainer);
	}

	// Clear existing player
	if (window.movieHls) {
		window.movieHls.destroy();
		window.movieHls = null;
	}
	playerContainer.innerHTML = '';

	// Get stream data from localStorage to check ifr property
	const streamData = JSON.parse(localStorage.getItem('movieStreamData') || '[]');
	const currentMovie = streamData.find(item => item.url === streamUrl);

	// If ifr is true, use iframe
	if (currentMovie && currentMovie.ifr === true) {
		const iframe = document.createElement('iframe');
		iframe.src = streamUrl;
		iframe.style.width = '100%';
		iframe.style.height = '500px';
		iframe.style.border = 'none';
		iframe.style.backgroundColor = '#000';
		iframe.allowFullscreen = true;
		iframe.setAttribute('allowfullscreen', '');
		iframe.setAttribute('webkitallowfullscreen', '');
		iframe.setAttribute('mozallowfullscreen', '');
		// Gelişmiş güvenlik ayarları
		iframe.setAttribute('sandbox', 'allow-scripts allow-same-origin');
		iframe.setAttribute('referrerpolicy', 'no-referrer');
		iframe.setAttribute('loading', 'lazy');
		iframe.setAttribute('importance', 'high');

		// İframe yüklendikten sonra içeriğini temizle
		iframe.onload = function () {
			try {
				const iframeDoc = iframe.contentDocument || iframe.contentWindow.document;

				// Tüm linkleri devre dışı bırak
				const links = iframeDoc.getElementsByTagName('a');
				for (let i = 0; i < links.length; i++) {
					links[i].removeAttribute('href');
					links[i].style.pointerEvents = 'none';
				}

				// Video elementlerini kontrol et
				const videos = iframeDoc.getElementsByTagName('video');
				for (let i = 0; i < videos.length; i++) {
					const src = videos[i].src.toLowerCase();
					if (src.includes('.mp4')) {
						videos[i].remove();
					}
				}

				// İframe stillerini ekle
				const style = iframeDoc.createElement('style');
				style.textContent = `
					a { pointer-events: none !important; }
					video[src*=".mp4"] { display: none !important; }
					iframe { pointer-events: none !important; }
				`;
				iframeDoc.head.appendChild(style);
			} catch (e) {
				console.log('iframe güvenlik ayarları uygulanırken hata:', e);
			}
		};

		playerContainer.appendChild(iframe);
		playerContainer.classList.add('show');
		detailBody.classList.add('with-player');
		return;
	}

	// Otherwise use HLS player
	try {
		const video = document.createElement('video');
		video.id = 'moviePlayer';
		video.controls = true;
		playerContainer.appendChild(video);

		if (Hls.isSupported()) {
			const hls = new Hls({
				debug: false,
				maxBufferLength: 30,
				maxMaxBufferLength: 600,
				maxBufferSize: 60 * 1000 * 1000,
				maxBufferHole: 0.5,
				manifestLoadingTimeOut: 10000,
				manifestLoadingMaxRetry: 5,
				manifestLoadingRetryDelay: 1000,
				manifestLoadingMaxRetryTimeout: 64000,
				fragLoadingTimeOut: 10000,
				fragLoadingMaxRetry: 5,
				fragLoadingRetryDelay: 1000,
				fragLoadingMaxRetryTimeout: 64000
			});

			window.movieHls = hls;
			hls.loadSource(streamUrl);
			hls.attachMedia(video);

			hls.on(Hls.Events.ERROR, function (event, data) {
				if (data.fatal) {
					switch (data.type) {
						case Hls.ErrorTypes.NETWORK_ERROR:
							showToast('Ağ hatası, yeniden bağlanılıyor...', 'warning');
							hls.startLoad();
							break;
						case Hls.ErrorTypes.MEDIA_ERROR:
							showToast('Medya hatası, kurtarılmaya çalışılıyor...', 'warning');
							hls.recoverMediaError();
							break;
						default:
							showToast('Film oynatılırken bir hata oluştu', 'error');
							break;
					}
				}
			});

			hls.on(Hls.Events.MANIFEST_PARSED, function () {
				video.play().catch(function (error) {
					showToast('Otomatik oynatma başlatılamadı', 'warning');
				});
			});

		} else if (video.canPlayType('application/vnd.apple.mpegurl')) {
			video.src = streamUrl;
			video.addEventListener('loadedmetadata', function () {
				video.play();
			});
		} else {
			showToast('HLS player bu cihazda desteklenmiyor', 'error');
			return;
		}

		// Show player and adjust detail body
		detailBody.classList.add('with-player');
		playerContainer.classList.add('show');

	} catch (error) {
		console.error('Error playing movie:', error);
		showToast('Film oynatılırken bir hata oluştu', 'error');
	}
}

// Close movie detail popup
function closeMovieDetail() {
	const popup = document.getElementById('movieDetailPopup');

	// Stop video playback if exists
	if (window.movieHls) {
		window.movieHls.destroy();
		window.movieHls = null;
	}

	// Remove trailer if exists
	const playerContainer = popup.querySelector('.movie-player-container');
	if (playerContainer) {
		playerContainer.remove();
	}

	const video = popup.querySelector('video');
	if (video) {
		video.pause();
		video.removeAttribute('src');
		video.load();
	}

	// Reset player container
	const moviePlayerContainer = popup.querySelector('.movie-player-container');
	if (moviePlayerContainer) {
		moviePlayerContainer.classList.remove('show');
		moviePlayerContainer.innerHTML = '';
	}

	// Reset detail body
	const detailBody = popup.querySelector('.movie-detail-body');
	if (detailBody) {
		detailBody.classList.remove('with-player');
	}

	popup.classList.remove('show');
	delete popup.dataset.streamUrl;
}

// Add click event listener to close popup when clicking outside
document.getElementById('movieDetailPopup').addEventListener('click', function (e) {
	if (e.target === this) {
		closeMovieDetail();
	}
});

// Fragman fonksiyonları
async function showMovieTrailer(movieId) {
	try {
		const response = await fetch(`${TMDB_BASE_URL}/movie/${movieId}/videos?api_key=${TMDB_API_KEY}&language=tr-TR`);
		const data = await response.json();

		// Önce Türkçe fragman ara
		let trailer = data.results.find(video => video.type === "Trailer" && video.site === "YouTube" && video.iso_639_1 === "tr");

		// Türkçe fragman yoksa İngilizce fragman ara
		if (!trailer) {
			const enResponse = await fetch(`${TMDB_BASE_URL}/movie/${movieId}/videos?api_key=${TMDB_API_KEY}&language=en-US`);
			const enData = await enResponse.json();
			trailer = enData.results.find(video => video.type === "Trailer" && video.site === "YouTube");
		}

		if (trailer) {
			const playerContainer = document.createElement('div');
			playerContainer.className = 'movie-player-container show';
			playerContainer.innerHTML = `
				<iframe 
					width="100%" 
					height="100%" 
					src="https://www.youtube.com/embed/${trailer.key}?autoplay=1&rel=0" 
					frameborder="0" 
					allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
					allowfullscreen
					style="position: absolute; top: 0; left: 0;">
				</iframe>`;

			const detailBody = document.querySelector('.movie-detail-body');
			const overview = detailBody.querySelector('.movie-overview');
			const existingPlayer = detailBody.querySelector('.movie-player-container');

			if (existingPlayer) {
				existingPlayer.remove();
			}

			// Açıklamadan sonra ekle
			overview.insertAdjacentElement('afterend', playerContainer);
		} else {
			showToast('Fragman bulunamadı', 'warning');
		}
	} catch (error) {
		console.error('Fragman yüklenirken hata:', error);
		showToast('Fragman yüklenirken bir hata oluştu', 'error');
	}
}