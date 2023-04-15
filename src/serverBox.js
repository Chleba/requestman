import blessed from "reblessed";
import { 
  COLOR_GRAY1, 
  COLOR_GRAY2, 
  COLOR_BLACK, 
  COLOR_TEXT,
  PanelsType,
  RequestTypes,
  defaultListbarStyle,
  defaultHeaders,
} from "./conf.js";
import RQBaseList from "./baseList.js";

class RQServerBox extends RQBaseList {
  constructor(mainApp, options) {
    super(mainApp, `Server[${PanelsType.SERVER}]`, 'SERVERCONF', options);
  }
  setActiveEndpoint(api, endpoint){
    const data = this.mainApp.getDBItem(this.DBKey);
    this.dataList = {
      url: '',
      method: -1,
      headers: defaultHeaders,
    };
    if(data) {
      if(api in data) {
        if(endpoint in data[api]){
          this.dataList = {...data[api][endpoint]};
        }
      }
    }
    this.setContentData();
    this.menu.focus();
  }
  makeMenuBox(label) {
    return blessed.Box({
      label: label,
      border: 'line',
      top: 0,
      style: { border: { fg: COLOR_GRAY2 } },
    });
  }
  clearMenuContent() {
    for(const child of this.menuContent.children) {
      this.menuContent.remove(child);
    }
  }
  setContentData() {
    this.base.urlInput.setContent(this.dataList.url);
    this.base.methodButton.setContent(RequestTypes[this.dataList.method] || '?');
    // this.base.methodList.selectTab(this.dataList.method);
    this.mainApp.setServerConf(this.dataList);
    this.mainApp.render();
  }
  saveServerConf() {
    const { activeAPI, activeEndpoint } = this.mainApp;
    const data = this.mainApp.getDBItem(this.DBKey);
    let newData = {}
    if(data) {
      newData = {...data};
      if(activeAPI in newData) {
        newData[activeAPI][activeEndpoint] = {...this.dataList};
      } else {
        newData[activeAPI] = {}
        newData[activeAPI][activeEndpoint] = {...this.dataList};
      }
    } else {
      newData[activeAPI] = {}
      newData[activeAPI][activeEndpoint] = {...this.dataList};
    }
    this.mainApp.setDBItem(this.DBKey, JSON.parse(JSON.stringify(newData)));
    this.setContentData();
  }
  selectMethod(index, _value) {
    this.dataList.method = index;
    this.saveServerConf();
    this.base.methodList.toggle();
  }
  setURL(value) {
    this.dataList.url = value;
    this.saveServerConf();
  }
  showBase() {
    this.clearMenuContent();
    if(!this.base) {
      const rItems = {};
      RequestTypes.map((r, i) => {
        rItems[r] = this.selectMethod.bind(this, i, r);
      });
      this.base = {
        box: this.makeMenuBox('BASE'),
        urlLabel: blessed.Text({
          content: 'IP/URL:',
          style: { fg: COLOR_TEXT },
          top: 0,
        }),
        urlInput: blessed.Textbox({ 
          top: 0, 
          left: 7,
          height: 1,
          style: { fg: '#fff', bg: '#222', focus: { bg: COLOR_BLACK, fg: COLOR_TEXT } },
          keys: true,
          vi: true,
          content: this.dataList.url,
          // inputOnFocus: true,
        }),
        methodLabel: blessed.Text({
          content: 'Method:',
          style: { fg: COLOR_TEXT },
          top: 1,
        }),
        methodButton: blessed.Button({
          top: 1,
          left: 7,
          width: 10,
          height: 1,
          // content: 'GET',
          content: RequestTypes[this.dataList.method] || '?',
          align: 'center',
          key: true,
          vi: true,
          style: { 
            bg: COLOR_GRAY1, 
            fg: COLOR_TEXT,
            focus: { bg: COLOR_TEXT, fg: COLOR_BLACK },
          }
        }),
        methodList: blessed.Listbar({
          top: 2,
          items: rItems,
          height: 1,
          style: defaultListbarStyle, 
        })
      };
      for(let i in this.base) {
        if(i !== 'box') { this.base.box.append(this.base[i]); }
      }
      this.base.methodList.toggle();
      this.mainApp.render();
      this.base.methodList.on('blur', () => this.base.methodList.hide());
      this.base.methodList.key(['left', 'right', 'enter'], (_, key) => {
        if(key.full === 'left') { this.base.methodList.moveLeft(); }
        if(key.full === 'right') { this.base.methodList.moveRight(); }
        if(key.full === 'enter') { 
          this.base.methodList.items[this.base.methodList.selected]['_'].cmd.callback(); 
        }
        this.mainApp.render();
      });
      this.base.methodButton.key(['enter'], () => {
        this.base.methodList.toggle();
        // if(this.dataList.method) { this.base.methodList.selectTab(this.dataList.method); }
        this.base.methodList.focus();
        this.mainApp.render();
      });
      this.base.urlInput.on('submit', (value) => this.setURL(value));
    }
    this.menuContent.append(this.base.box);
  }
  showParams() {
    this.menuContent.children = [];
    const b = this.makeMenuBox('PARAMS');
    this.menuContent.append(b);
  }
  showHeaders() {
    this.menuContent.children = [];
    const b = this.makeMenuBox('HEADERS');
    this.menuContent.append(b);
  }
  showBody() {
    this.menuContent.children = [];
    const b = this.makeMenuBox('BODY');
    this.menuContent.append(b);
  }
  createBoxContent() {
    const infoText = blessed.Text({ 
      content: '[s]:send', 
      bottom: -1,
      right: 0,
      style: { fg: COLOR_GRAY2 } 
    });
    this.box.append(infoText);

    const mItems = {
      BASE: () => this.showBase(),
      PARAMS: () => this.showParams(),
      HEADERS: () => this.showHeaders(),
      BODY: () => this.showBody(),
    };
    this.menu = blessed.Listbar({
      top: 0,
      items: mItems,
      height: 1,
      autoCommandKeys: false,
      style: {
        bg: COLOR_BLACK,
        item: { bg: COLOR_GRAY1 },
        selected: { bg: COLOR_GRAY2, fg: '#999' },
        focus: { bg: COLOR_BLACK, item: { bg: COLOR_BLACK }, selected: { bg: COLOR_TEXT, fg: COLOR_BLACK } },
      }
    });
    this.menu.key(['left', 'right', 'enter'], (_, key) => {
      if(key.full === 'left') { this.menu.moveLeft(); }
      if(key.full === 'right') { this.menu.moveRight(); }
      if(key.full === 'enter') { this.menu.items[this.menu.selected]['_'].cmd.callback(); }
      this.mainApp.render();
    });
    this.box.append(this.menu);
    this.menuContent = blessed.Box({ top: 1 });
    this.box.append(this.menuContent);
    // -- first select
    this.menu.on('focus', () => this.redirectFocus());
    mItems.BASE();
  }
  redirectFocus() {
    if(!this.mainApp.activeEndpoint){
      this.mainApp.screen.focusPush(this.mainApp.containers.endpoints.button);
    }
    this.mainApp.render();
  }
}

export default RQServerBox;
