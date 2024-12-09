---
    layout: null
---
'use strict';
{
	const page = document.body.querySelector('article.post-text').parentElement;
	page.appendChild(document.createElement('hr'));
	const element = document.createElement('div');
	element.id = 'comments';
	page.appendChild(element);
	window.Comment = new Valine({
		av: AV,
		el: '#comments',
		app_id: '{{ site.valine.appid }}',
		app_key: '{{ site.valine.appkey }}',
		placeholder: '{{ site.valine.placeholder }}',
		recordIP: '{{ site.valine.recordIP }}',
		enableQQ: '{{ site.valine.enableQQ }}',
		pageSize: {% if site.valine.pageSize %}{{ site.valine.pageSize }} {% else %} 10{% endif %},
		avatar: 'retro',
		serverURLs: 'https://' + '{{ site.valine.appid }}'.substring(0, 8) + '.api.lncldglobal.com'
	});
}
