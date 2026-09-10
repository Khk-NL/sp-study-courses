var handlerKey = '__spStudyCoursesDownloadHandler';

if (window[handlerKey]) {
  window.removeEventListener('message', window[handlerKey]);
}

window[handlerKey] = function (event) {
  var payload = event && event.data;
  if (!payload || payload.source !== 'sp-study-courses' || payload.type !== 'DOWNLOAD_ICS') return;
  if (typeof payload.filename !== 'string' || typeof payload.data !== 'string') return;
  if (!payload.filename.endsWith('.ics') || payload.data.length > 2 * 1024 * 1024) return;
  if (!payload.data.startsWith('BEGIN:VCALENDAR')) return;
  PluginAPI.downloadFile(payload.filename, payload.data);
};

window.addEventListener('message', window[handlerKey]);
