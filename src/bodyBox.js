import blessed from "reblessed";
import { 
  COLOR_TEXT, 
  COLOR_GRAY1, 
  COLOR_GRAY2, 
  COLOR_BLACK,
  PanelsType,
  RequestTypes,
} from "./conf.js";
import RQBaseBox from "./baseBox.js";

class RQBodyBox extends RQBaseBox {
  constructor(mainApp, options) {
    super(mainApp, `Request body[${PanelsType.BODY}]`, options);
  }
  setServerConf(conf) {
    this.method.setContent(RequestTypes[conf.method] || '?');
    this.url.setContent(conf.url);
    this.endpoint.setContent(this.mainApp.activeEndpoint);
  }
  setResponseState(status) {
    let color = 'red';
    if(!isNaN(status)) {
      if(status < 400) { color = 'green'; }
    }
    this.status.style.fg = color;
    this.status.setContent(`[${status}]`);
    this.mainApp.render();
  }
  addResponse(response, _conf) {
    if(this.responseText){ this.bodyBox.remove(this.responseText); }
    this.responseText = blessed.ScrollableText({ 
      content: JSON.stringify(response.data),
      scrollable: true,
      scrollbar: { inverse: true },
      keys: true,
      vi: true,
    });
    this.responseText.on('focus', () => { 
      this.bodyBox.style.border.fg = COLOR_TEXT; 
      this.mainApp.render();
    });
    this.responseText.on('blur', () => { 
      this.bodyBox.style.border.fg = COLOR_GRAY2; 
      this.mainApp.render();
    });
    this.bodyBox.append(this.responseText);
    this.setResponseState(response.status || response.code);
    this.responseText.focus();
  }
  createBoxContent() {
    this.method = blessed.Text({
      content: '?',
      width: '16%',
      align: 'center',
      padding: { left: 1 },
      style: { align: 'center', bg: 'blue', fg: COLOR_BLACK, bold: true, },
      top: 0,
      left: 0,
    });
    this.box.append(this.method);
    this.url = blessed.Text({
      content: '',
      padding: { left: 1 },
      left: '16%',
      width: '34%+1',
      style: { bg: COLOR_GRAY1, fg: '#fff' },
    });
    this.box.append(this.url);
    this.endpoint = blessed.Text({
      content: '',
      left: '50%+1',
      width: '50%-3',
      style: { bg: COLOR_GRAY2, fg: COLOR_TEXT },
    });
    this.box.append(this.endpoint);
    this.bodyBox = blessed.Box({
      top: 1,
      label: 'Body',
      border: 'line',
      style: { border: { fg: COLOR_GRAY2 } },
      keys: true,
      vi: true,
    });
    this.box.append(this.bodyBox);
    this.status = blessed.Text({
      top: -1,
      right: 0,
      style: { fg: 'red' },
      content: '[-]',
    });
    this.box.append(this.status);
    const copyText = blessed.Text({
      bottom: 0,
      right: 1,
      content: '[c]:copy',
      style: { fg: COLOR_GRAY2 },
    });
    this.box.append(copyText);
  }
}

export default RQBodyBox;
