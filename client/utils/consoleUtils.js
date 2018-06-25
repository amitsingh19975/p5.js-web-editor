import {
  EXTERNAL_LINK_REGEX
} from '../../server/utils/fileUtils';

import warnLightUrl from '../images/console-warn-light.svg';
import warnDarkUrl from '../images/console-warn-dark.svg';
import errorLightUrl from '../images/console-error-light.svg';
import errorDarkUrl from '../images/console-error-dark.svg';
import debugLightUrl from '../images/console-debug-light.svg';
import debugDarkUrl from '../images/console-debug-dark.svg';
import infoLightUrl from '../images/console-info-light.svg';
import infoDarkUrl from '../images/console-info-dark.svg';

export const hijackConsole = `var iframeWindow = window;
  var originalConsole = iframeWindow.console;
  iframeWindow.console = {};
  
  var methods = [
    'debug', 'clear', 'error', 'info', 'log', 'warn'
  ];
  
  var consoleBuffer = [];
  var LOGWAIT = 500;
  
  methods.forEach( function(method) {
    iframeWindow.console[method] = function() {
      originalConsole[method].apply(originalConsole, arguments);
  
      var args = Array.from(arguments);
      args = args.map(function(i) {
        // catch objects
        return (typeof i === 'string') ? i : JSON.stringify(i);
      });
  
      consoleBuffer.push({
        method: method,
        arguments: args,
        source: 'sketch'
      });
    };
  });
  
  setInterval(function() {
    if (consoleBuffer.length > 0) {
      window.parent.postMessage(consoleBuffer, '*');
      consoleBuffer.length = 0;
    }
  }, LOGWAIT);`;

export const hijackConsoleErrorsScript = (offs) => {
  const s = `
    function getScriptOff(line) {
      var offs = ${offs};
      var l = 0;
      var file = "";
      for (var i=0; i<offs.length; i++) {
        var n = offs[i][0];
        if (n < line && n > l) {
          l = n;
          file = offs[i][1];
        }
      }
      return [line - l, file];
    }
    // catch reference errors, via http://stackoverflow.com/a/12747364/2994108
    window.onerror = function (msg, url, lineNumber, columnNo, error) {
        var string = msg.toLowerCase();
        var substring = "script error";
        var data = {};
        if (url.match(${EXTERNAL_LINK_REGEX}) !== null && error.stack){
          var errorNum = error.stack.split("about:srcdoc:")[1].split(":")[0];
          var fileInfo = getScriptOff(errorNum);
          data = msg + " (" + fileInfo[1] + ": line " + fileInfo[0] + ")";
        } else {
          var fileInfo = getScriptOff(lineNumber);
          data = msg + " (" + fileInfo[1] + ": line " + fileInfo[0] + ")";
        }
        window.parent.postMessage([{
          method: "error",
          arguments: data,
          source: fileInfo[1]
        }], "*");
      return false;
    };
  `;
  return s;
};

export const startTag = '@fs-';

export const getAllScriptOffsets = (htmlFile) => {
  const offs = [];
  let found = true;
  let lastInd = 0;
  let ind = 0;
  let endFilenameInd = 0;
  let filename = '';
  let lineOffset = 0;
  while (found) {
    ind = htmlFile.indexOf(startTag, lastInd);
    if (ind === -1) {
      found = false;
    } else {
      endFilenameInd = htmlFile.indexOf('.js', ind + startTag.length + 3);
      filename = htmlFile.substring(ind + startTag.length, endFilenameInd);
      // the length of hijackConsoleErrorsScript is 33 lines
      lineOffset = htmlFile.substring(0, ind).split('\n').length + 33;
      offs.push([lineOffset, filename]);
      lastInd = ind + 1;
    }
  }
  return offs;
};

export const CONSOLE_FEED_WITHOUT_ICONS = {
  LOG_WARN_ICON: 'none',
  LOG_ERROR_ICON: 'none',
  LOG_DEBUG_ICON: 'none',
  LOG_INFO_ICON: 'none'
};

export const CONSOLE_FEED_LIGHT_STYLES = {
  BASE_BACKGROUND_COLOR: '',
  LOG_ERROR_BACKGROUND: 'hsl(0, 100%, 97%)',
  LOG_ERROR_COLOR: '#D11518',
  LOG_ERROR_BORDER: 'hsl(0, 100%, 92%)',
  LOG_WARN_BACKGROUND: 'hsl(50, 100%, 95%)',
  LOG_WARN_COLOR: '#FAAF00',
  LOG_WARN_BORDER: 'hsl(50, 100%, 88%)',
  LOG_INFO_COLOR: '#7D7D7D',
  LOG_DEBUG_COLOR: '#007BBB',
  LOG_COLOR: 'rgb(128, 128, 128)',
  LOG_WARN_ICON: `url(${warnLightUrl})`,
  LOG_ERROR_ICON: `url(${errorLightUrl})`,
  LOG_DEBUG_ICON: `url(${debugLightUrl})`,
  LOG_INFO_ICON: `url(${infoLightUrl})`
};

export const CONSOLE_FEED_DARK_STYLES = {
  BASE_BACKGROUND_COLOR: '',
  BASE_COLOR: 'white',
  OBJECT_NAME_COLOR: 'white',
  OBJECT_VALUE_NULL_COLOR: 'hsl(230, 100%, 80%)',
  OBJECT_VALUE_UNDEFINED_COLOR: 'hsl(230, 100%, 80%)',
  OBJECT_VALUE_REGEXP_COLOR: 'hsl(230, 100%, 80%)',
  OBJECT_VALUE_STRING_COLOR: 'hsl(230, 100%, 80%)',
  OBJECT_VALUE_SYMBOL_COLOR: 'hsl(230, 100%, 80%)',
  OBJECT_VALUE_NUMBER_COLOR: 'hsl(230, 100%, 80%)',
  OBJECT_VALUE_BOOLEAN_COLOR: 'hsl(230, 100%, 80%)',
  OBJECT_VALUE_FUNCTION_KEYWORD_COLOR: 'hsl(230, 100%, 80%)',
  LOG_ERROR_BACKGROUND: 'hsl(0, 100%, 8%)',
  LOG_ERROR_COLOR: '#df3a3d',
  LOG_WARN_BACKGROUND: 'hsl(50, 100%, 10%)',
  LOG_WARN_COLOR: '#f5bc38',
  LOG_INFO_COLOR: '#a3a3a3',
  LOG_DEBUG_COLOR: '#0c99e2',
  LOG_WARN_ICON: `url(${warnDarkUrl})`,
  LOG_ERROR_ICON: `url(${errorDarkUrl})`,
  LOG_DEBUG_ICON: `url(${debugDarkUrl})`,
  LOG_INFO_ICON: `url(${infoDarkUrl})`
};

export const CONSOLE_FEED_CONTRAST_STYLES = CONSOLE_FEED_DARK_STYLES;