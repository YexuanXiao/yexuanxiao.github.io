if (window.gapi !== undefined) {
	let auth2;
	let signgoogle = document.createElement('button');
	signgoogle.type = 'button';
	signgoogle.className = 'signgoogle vbtn';
	document.body.querySelector('.vpanel>.vwrap>.vrow>.text-right').appendChild(signgoogle);
	gapi.load('auth2', () => {
		auth2 = gapi.auth2.init({
			client_id: '985156538502-oba0b7a7bsrb55kprjaugdcrr2kquc11.apps.googleusercontent.com',
			cookiepolicy: 'single_host_origin'
		});
		const setIsSign = () => {
			signgoogle.parentNode.removeChild(signgoogle);
			signgoogle = null;
			signgoogle = document.createElement('button');
			signgoogle.type = 'button';
			signgoogle.className = 'signgoogle vbtn';
			document.body.querySelector('.vpanel>.vwrap>.vrow>.text-right').appendChild(signgoogle);
			signgoogle.innerText = '登出 Google';
			const nick = document.body.querySelector('input[name=nick]');
			const mail = document.body.querySelector('input[name=mail]');
			nick.value = auth2.currentUser.get().getBasicProfile().getName();
			mail.value = auth2.currentUser.get().getBasicProfile().getEmail();
			nick.dispatchEvent(new CustomEvent('change'));
			mail.dispatchEvent(new CustomEvent('change'));
			signgoogle.addEventListener('click', () => {
				gapi.auth2.getAuthInstance().signOut();
				signgoogle.innerText = 'Google 登录';
				nick.value = '';
				main.value = '';
			});
		}
		// set an asynchronous delay for the function to execute after init auth2
		setTimeout(() => {
			if (auth2.isSignedIn.get()) {
				setIsSign();
			} else {
				signgoogle.innerText = 'Google 登录';
				auth2.attachClickHandler(signgoogle, {},
					function (googleUser) {
						setIsSign();
					}, function (error) {
						console.error(JSON.stringify(error, undefined, 2));
					});
			}
		}, 1000);
	});
}
