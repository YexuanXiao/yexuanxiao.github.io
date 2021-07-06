'use strict';
// Copyright 2020 YexuanXiao under the MIT license
(function(){//调整视频大小

	const postText = document.body.querySelectorAll('.post-text');
	const postTextWidth = postText.offsetWidth;
	var videoHeight = postTextWidth * 9 / 16;


	if ((/Android|iPhone/i.test(navigator.userAgent))) {
	};
	if (window.matchMedia('(max-width: 768px)').matches) {
		bilivideo();
	};

	function bilivideo() {
		const elements = document.getElementsByClassName('bilivideo');
		Array.prototype.forEach.call(elements, function (element) {
			element.style.height = videoHeight + 'px';
			element.style.margin = '.5em 0 .5em 0';
		});
	}

})();