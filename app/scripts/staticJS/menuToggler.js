(function() {
	let 
		toggler = document.querySelector('.nav-toggler'),
		menu = document.querySelector('.nav-scroll--mobile'),
		body = document.querySelector('body');

	toggler.addEventListener('click', () => menu.classList.toggle('visible'), false);
	body.addEventListener('click', (e) => {
		if (menu.classList.contains('visible') && e.target.id !== 'nav-toggler') {
				menu.classList.toggle('visible');
		}
	}, false);
})();