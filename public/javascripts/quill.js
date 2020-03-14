var imported = document.createElement('script');
imported.src = 'https://cdn.quilljs.com/1.3.6/quill.js';
document.head.appendChild(imported);

var quill = new Quill('#editor', { 'snow' });