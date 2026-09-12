var handlerKey = '__spStudyCoursesDownloadHandler';

if (window[handlerKey]) {
  window.removeEventListener('message', window[handlerKey]);
}

window[handlerKey] = function (event) {
  var payload = event && event.data;
  if (!payload || payload.source !== 'sp-study-courses' || payload.type !== 'DOWNLOAD_ICS') return;
  if (typeof payload.filename !== 'string' || typeof payload.data !== 'string') return;
  if (!/\.(ics|csv|json)$/i.test(payload.filename) || payload.data.length > 2 * 1024 * 1024) return;
  if (payload.type === 'DOWNLOAD_ICS' && !payload.data.startsWith('BEGIN:VCALENDAR')) return;
  PluginAPI.downloadFile(payload.filename, payload.data);
};

window.addEventListener('message', window[handlerKey]);
