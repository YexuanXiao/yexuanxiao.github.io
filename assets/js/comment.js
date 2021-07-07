---
    layout: null
---
'use strict';
let googleUser = {}
let auth2
let signgoogle = document.createElement('button')
function initNew() {
    gapi.load('auth2', function () {
        auth2 = gapi.auth2.init({
            client_id: '985156538502-oba0b7a7bsrb55kprjaugdcrr2kquc11.apps.googleusercontent.com',
            cookiepolicy: 'single_host_origin'
        })
        function setIsSign() {
            signgoogle.parentNode.removeChild(signgoogle)
            signgoogle = null
            signgoogle = document.createElement('button')
            signgoogle.type = 'button'
            signgoogle.className = 'signgoogle vbtn'
            document.body.querySelector('.vpanel>.vwrap>.vrow>.text-right').appendChild(signgoogle)
            signgoogle.innerText = '登出 Google'
            let nick = document.body.querySelector('input[name=nick]')
            let mail = document.body.querySelector('input[name=mail]')
            nick.value = auth2.currentUser.get().getBasicProfile().getName()
            mail.value = auth2.currentUser.get().getBasicProfile().getEmail()
            nick.dispatchEvent(new CustomEvent('change'))
            mail.dispatchEvent(new CustomEvent('change'))
            signgoogle.addEventListener('click', () => {
                gapi.auth2.getAuthInstance().signOut()
            }
            )
        }
        setTimeout(() => {
            if (auth2.isSignedIn.get()) {
                setIsSign()
            } else {
                signgoogle.innerText = 'Google 登录'
                auth2.attachClickHandler(signgoogle, {},
                    function (googleUser) {
                        setIsSign()
                    }, function (error) {
                        console.error(JSON.stringify(error, undefined, 2))
                    })
            }
        }, 1000)
    })
}
setTimeout(() => {
    loadScript('//cdn.jsdelivr.net/npm/leancloud-storage@4.11.0/dist/av-min.js', () => {
        loadScript('//cdn.jsdelivr.net/npm/valine@1.4.14/dist/Valine.min.js', () => {
            document.body.querySelector('.post-text').appendChild(document.createElement('hr'))
            const element = document.createElement('div')
            element.id = 'comments'
            document.body.querySelector('.post-text').appendChild(element)
            const comment = new Valine({
                av: AV,
                el: '#comments',
                app_id: '{{ site.valine.appid }}',
                app_key: '{{ site.valine.appkey }}',
                placeholder: '{{ site.valine.placeholder }}',
                recordIP: '{{ site.valine.recordIP }}',
                enableQQ: '{{ site.valine.enableQQ }}',
            })
            loadScript('//apis.google.com/js/api:client.js', () => {
                signgoogle.type = 'button'
                signgoogle.className = 'signgoogle vbtn'
                document.body.querySelector('.vpanel>.vwrap>.vrow>.text-right').appendChild(signgoogle)
                initNew()
            })
        })
    })
}, 100)