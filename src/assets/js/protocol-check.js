var isApp = document.URL.indexOf('http://') === -1 && document.URL.indexOf('https://') === -1 && location.hostname != "localhost" && location.hostname != "127.0.0.1";
if (!isApp && location.hostname != "localhost" && location.hostname != "127.0.0.1" && window.location.protocol == "http:") {
    window.location.href = window.location.href.replace('http:', 'https:');
}
