(function() {
	var toggler = document.querySelector('.nav-toggler');
	console.log('test');
	toggler.addEventListener('click', function() {
		menu.classList.toggle('hidden');
	}, false);
})();