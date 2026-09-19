var handlerKey = '__spStudyCoursesDownloadHandler';
var pluginId = 'study-courses';

if (window[handlerKey]) {
  window.removeEventListener('message', window[handlerKey]);
}

// Only this plugin's own iframes may trigger a download. The origin is not a
// stable identity check here: packaged builds run from file:, where the origin a
// frame reports is browser-dependent, so compare the concrete contentWindow.
function isOwnIframe(source) {
  if (!source) return false;
  var frames = document.querySelectorAll('iframe[data-plugin-id="' + pluginId + '"]');
  for (var index = 0; index < frames.length; index++) {
    if (frames[index].contentWindow === source) return true;
  }
  return false;
}

window[handlerKey] = function (event) {
  if (!event || !isOwnIframe(event.source)) return;
  var payload = event.data;
  if (!payload || payload.source !== 'sp-study-courses' || !['DOWNLOAD_ICS', 'DOWNLOAD_TEXT'].includes(payload.type)) return;
  if (typeof payload.filename !== 'string' || typeof payload.data !== 'string') return;
  if (!/\.(ics|csv|json)$/i.test(payload.filename) || payload.data.length > 2 * 1024 * 1024) return;
  if (payload.type === 'DOWNLOAD_ICS' && !payload.data.startsWith('BEGIN:VCALENDAR')) return;
  if (typeof PluginAPI.downloadFile === 'function') PluginAPI.downloadFile(payload.filename, payload.data);
};

window.addEventListener('message', window[handlerKey]);
