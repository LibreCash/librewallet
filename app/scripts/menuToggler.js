(function() {
	var toggler = document.querySelector('.nav-toggler');
	var menu = document.querySelector('.nav-scroll--mobile');
	var body = document.querySelector('body');

	toggler.addEventListener('click', function() {
		menu.classList.toggle('visible');
	}, false);

	body.addEventListener('click', function(e) {
			if (menu.classList.contains('visible')) {
				if (e.target.id !== 'nav-toggler') {
				menu.classList.toggle('visible');
			}
		}
	}, false);
})();