const blessed = require('reblessed');
const JSONdb = require('simple-json-db');

const COLOR_TEXT = '#4af626';
const COLOR_BLACK = '#000';
const COLOR_GRAY1 = '#333';
const COLOR_GRAY2 = '#666';
const baseContainerOpt = {
  top: 0,
  left: 0,
  width: '40%',
  height: '50%',
  tags: true,
  border: { type: 'line' },
  style: {
    fg: 'white',
    border: { fg: COLOR_GRAY1 },
  }
};
const defaultListStyle = { 
  item: { fg: 'white', bg: 'black' }, 
  selected: { fg: '#999', bg: COLOR_GRAY2 }, 
  border: { fg: COLOR_GRAY2 },
  focus: { border: { fg: COLOR_TEXT }, selected: { bg: COLOR_TEXT, fg: COLOR_BLACK } }
};
const defaultListbarStyle = {
  bg: COLOR_BLACK,
  item: { bg: COLOR_GRAY1 },
  selected: { bg: COLOR_GRAY2, fg: '#999' },
  focus: { bg: COLOR_BLACK, item: { bg: COLOR_BLACK }, selected: { bg: COLOR_TEXT, fg: COLOR_BLACK } },
};
const PanelsType = {
  API: 1,
  ENDPOINT: 2,
  SERVER: 3,
  BODY: 4,
};
const RequestTypes = ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'HEAD'];
const defaultHeaders = {
  Accept: '*/*',
  'Accept-Encoding': 'gzip, deflate, br',
  Connection: 'keep-alive',
};

// -------------------
// -- RQ BOX ---------
class RQBaseBox {
  constructor(mainApp, title, options) {
    this.mainApp = mainApp;
    this.title = title;
    this.options = options;
    this.box = null;
  }
  getBox() {
    if (!this.box) {
      this.createBox();
    }
    return this.box;
  }
  createBoxContent() {}
  createBox() {
    this.box = blessed.box(this.options);
    const title = blessed.Text({
      content: this.title,
      top: -1,
      left: 1,
      style: { fg: COLOR_TEXT },
    });
    this.box.append(title);
    this.createBoxContent();
  }
}

// -----------------------------
// -- RQ LIST TEMPLATE ---------
class RQBaseList extends RQBaseBox {
  constructor(mainApp, title, DBKey, options) {
    super(mainApp, title, options);
    this.DBKey = DBKey;
    const dataList = this.mainApp.getDBItem(this.DBKey) || [];
    if (Array.isArray(dataList)){ this.dataList = [...dataList]; }
    else { this.dataList = []; }
    this.question = this.button = this.input = this.list = this.inputLabel = null;
    this.buttonLabel = 'button'; 
  }
  makeListItems(data) {
    const newData = [];
    data.map((item, index)=> newData.push(` ${index + 1}: ${item}`));
    return newData;
  }
  makeQuestion() {
    this.question = blessed.Question({
      keys: true,
      vi: true,
    });
    this.box.append(this.question);
  }
  refreshCounter() {
    const index = this.dataList.length ? this.list.selected+1 : 0;
    this.counter.setContent(`[${index}/${this.dataList.length}]`);
  }
  setNewItem(val) {
    if(val) {
      this.dataList.push(val);
      this.list.clearItems()
      this.list.setItems(this.makeListItems(this.dataList));
      this.mainApp.setDBItem(this.DBKey, this.dataList);
      this.mainApp.render();
    }
  }
  addInput() {
    if(!this.input) {
      this.inputLabel = blessed.Text({
        top: 1,
        style: { fg: COLOR_TEXT },
        content: 'name:',
      })
      this.box.append(this.inputLabel);

      this.input = blessed.Textbox({ 
        top: 1, 
        left: 5,
        style: {
          fg: '#fff',
          bg: '#222',
        },
        inputOnFocus: true,
      });
      this.input.on('submit', (val) => {
        this.setNewItem(val);
        this.removeInput();
      });
      this.input.on('cancel', () => this.removeInput());
      this.box.insertAfter(this.input, this.button);
      this.input.focus();
      this.list.top = 2;
      this.mainApp.render();
    }
  }
  removeInput() {
    this.box.remove(this.input);
    this.box.remove(this.inputLabel);
    this.input = this.inputLabel = null;
    this.list.top = 1;
    this.mainApp.render();
  }
  selectItem(index) { console.log('item index selected', index); }
  deleteItem(index) { console.log('item index delete', index); }
  deleteDone(index) {
    this.list.removeItem(index);
    this.dataList.splice(index, 1);
    this.mainApp.setDBItem(this.DBKey, [...this.dataList]);
    this.mainApp.render();
  }
  createBoxContent() {
    this.button = blessed.Button({
      content: this.buttonLabel,
      top: 0,
      height: 1,
      width: '50%',
      left: '25%',
      align: 'center',
      style: { fg: COLOR_TEXT, bg: COLOR_BLACK, focus: { fg: COLOR_BLACK, bg: COLOR_TEXT } },
    });
    this.button.key(['enter'], this.addInput.bind(this));
    this.box.append(this.button);

    this.list = blessed.List({
      top: 1,
      keys: true,
      vi: true,
      items: this.makeListItems(this.dataList),
      border: 'line',
      style: JSON.parse(JSON.stringify(defaultListStyle)),
      invertSelected: true,
    });
    this.list.on('select', (_item, index) => this.selectItem(index));
    this.list.on('select item', () => {
      this.refreshCounter();
    }); 
    this.list.on('focus', () => {
      if(!this.dataList.length) {
        this.mainApp.screen.focusNext();
      }
    })
    this.list.key(['d'], () => this.deleteItem(this.list.selected));
    this.box.append(this.list);

    this.counter = blessed.Text({
      bottom: 0,
      right: 1,
      content: '[0/0]',
      style: { fg: COLOR_GRAY2 },
    });
    this.refreshCounter();
    this.box.append(this.counter);

    this.makeQuestion();
  }
}

// -----------------------
// -- RQ API BOX ---------
class RQApiBox extends RQBaseList {
  constructor(mainApp, options) {
    super(mainApp, `APIs[${PanelsType.API}]`, 'API', options);
    this.buttonLabel = 'add API';
  }
  selectItem(index) {
    this.mainApp.setActiveAPI(this.dataList[index]);
  }
  deleteDone(index) {
    const api = this.dataList[index];
    const endpointDBKey = this.mainApp.containers.endpoints.DBKey
    const endpoints = this.mainApp.getDBItem(endpointDBKey);
    if (endpoints) {
      const newEndpoints = JSON.parse(JSON.stringify(endpoints));
      if(api in newEndpoints) {
        delete newEndpoints[api];
        this.mainApp.setDBItem(endpointDBKey, newEndpoints);
      }
    }
    super.deleteDone(index);
  }
  deleteItem(index) {
    this.question.ask(`Delete API:${this.dataList[index]} with all endpoints?`, (_, answer) => {
      if(answer) {
        this.deleteDone(index); 
      }
    });
  }
}

// -----------------------
// -- RQ ENDPOINTS BOX ---
class RQEndpointsBox extends RQBaseList {
  constructor(mainApp, options) {
    super(mainApp, `Endpoints[${PanelsType.ENDPOINT}]`, 'ENDPOINTS', options);
    this.buttonLabel = 'add endpoint';
  }
  setActiveAPI(api) {
    this.list.setLabel(`API: ${api}`);
    const data = this.mainApp.getDBItem(this.DBKey);
    this.list.clearItems();
    this.dataList = [];
    if(data) {
      if(api in data) {
        this.dataList = [...data[api]];
        this.list.setItems(this.makeListItems(this.dataList));
      }
    }
    this.refreshCounter();
  }
  selectItem(index) {
    this.mainApp.setActiveEndpoint(this.dataList[index]);
  }
  deleteDone(index) {
    this.list.removeItem(index);
    this.dataList.splice(index, 1);
    const data = this.mainApp.getDBItem(this.DBKey);
    data[this.mainApp.activeAPI] = [...this.dataList];
    this.mainApp.setDBItem(this.DBKey, JSON.parse(JSON.stringify(data)));
    this.mainApp.render();
  }
  deleteItem(index) {
    this.question.ask(`Delete Endpoint:${this.dataList[index]}?`, (_, answer) => {
      if(answer) {
        this.deleteDone(index); 
      }
    });
  }
  setNewItem(val) {
    if(val) {
      const api = this.mainApp.activeAPI;
      const data = this.mainApp.getDBItem(this.DBKey);
      let newData = {};
      if(data) {
        if (api in data) {
          data[api].push(val);
        } else {
          data[api] = [val];
        }
        newData = data;
      } else {
        newData[api] = [val];
      }
      this.dataList.push(val);
      this.list.clearItems();
      this.list.setItems(this.makeListItems(this.dataList));
      this.mainApp.setDBItem(this.DBKey, newData);
      this.mainApp.render();
    }
  }
  redirectFocus() {
    if(!this.mainApp.activeAPI){
      this.mainApp.screen.focusPush(this.mainApp.containers.apis.button);
    }
    this.mainApp.render();
  }
  createBoxContent() {
    super.createBoxContent();
    this.button.on('focus', () => this.redirectFocus());
    this.list.on('focus', () => this.redirectFocus());
  }
}

// ----------------------------------
// -- RQ SERVER BOX -----------------
class RQServerBox extends RQBaseList {
  constructor(mainApp, options) {
    super(mainApp, `Server[${PanelsType.SERVER}]`, 'SERVERCONF', options);
  }
  setActiveEndpoint(api, endpoint){
    const data = this.mainApp.getDBItem(this.DBKey);
    this.dataList = {
      url: '',
      method: '?'
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

// ------------------
// -- RQ BODY BOX ---
class RQBodyBox extends RQBaseBox {
  constructor(mainApp, options) {
    super(mainApp, `Request body[${PanelsType.BODY}]`, options);
  }
  setServerConf(conf) {
    this.method.setContent(RequestTypes[conf.method] || '?');
    this.url.setContent(conf.url);
    this.endpoint.setContent(this.mainApp.activeEndpoint);
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
  }
}

// -----------------
// -- REQUEST MAN --
class RQMan {
  constructor() {
    this.containers = {};
    this.screen = blessed.screen({
      smartCSR: true,
      title: 'RequestMan',
      keys: true,
      vi: true,
      // debug: true,
    });
    this.db = new JSONdb('./db.json', { jsonSpaces: 2 });
    this.activeAPI = null;
    this.activeEndpoint = null;

    this.makeContainters();
    this.makeFooter();
    this.render();
    this.link();
  }
  setActiveAPI(api) {
    this.activeAPI = api;
    this.containers.endpoints.setActiveAPI(api);
    this.containers.endpoints.button.focus();
  }
  setActiveEndpoint(endpoint){
    this.activeEndpoint = endpoint;
    this.containers.serverSetings.setActiveEndpoint(this.activeAPI, this.activeEndpoint);
  }
  setServerConf(conf) {
    this.containers.body.setServerConf(conf);
  }
  getDBItem(key) {
    const val = this.db.get(key);
    return val ?? null;
  }
  setDBItem(key, val) {
    if(key && val) {
      this.db.set(key, val);
    }
  }
  makeContainters() {
    this.containers.apis = new RQApiBox(this, {
      ...baseContainerOpt,
    });
    this.containers.endpoints = new RQEndpointsBox(this, {
      ...baseContainerOpt,
      top: '50%'
    });
    this.containers.serverSetings = new RQServerBox(this, {
      ...baseContainerOpt,
      left: '40%',
      width: '60%',
      height: '50%'
    });
    this.containers.body = new RQBodyBox(this, {
      ...baseContainerOpt,
      top: '50%',
      left: '40%',
      width: '60%',
      height: '50%'
    });

    for(const box of Object.values(this.containers)) {
      this.screen.append(box.getBox());
    }
    // -- first focus
    // this.containers.apis.button.focus();
    this.containers.serverSetings.menu.focus();
  }
  makeFooter() {
    const footerAuthor = blessed.Text({
      content: 'Baked by @Chleba',
      right: 1,
      bottom: 0,
      style: { fg: COLOR_GRAY2, },
    });
    this.screen.append(footerAuthor);
    const footerInfo = blessed.Text({
      content: '[d]:delete [tab]:focus [esc]:back [q]:exit',
      bottom: 0,
      left: 1,
      style: { fg: COLOR_GRAY2, },
    });
    this.screen.append(footerInfo);
  }
  render() {
    this.screen.render();
  }
  link() {
    this.screen.key(['q', 'C-c'], () => process.exit(0));
    this.screen.key(['tab', 'S-tab'], (_ch, key) => {
      return key.shift
        ? this.screen.focusPrevious()
        : this.screen.focusNext();
    });
    this.screen.key(Object.values(PanelsType), (_, key) => {
      switch(key.full * 1) {
        case PanelsType.API:
          this.containers.apis.button.focus();
          break;
        case PanelsType.ENDPOINT:
          this.containers.endpoints.button.focus();
          break;
        case PanelsType.SERVER:
          this.containers.serverSetings.menu.focus();
          break;
        default: break;
      }
    })
    // this.screen.on('element focus', (cur, old) => {
    //   if (old.border) old.style.border.fg = COLOR_GRAY2;
    //   if (cur.border) cur.style.border.fg = 'green';
    //   this.screen.render();
    // });
  }
}

new RQMan();

