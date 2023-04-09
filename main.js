const blessed = require('reblessed');
const JSONdb = require('simple-json-db');

const COLOR_TEXT = '#4af626';
const baseContainerOpt = {
  top: 0,
  left: 0,
  width: '40%',
  height: '50%',
  tags: true,
  border: { type: 'line' },
  style: {
    fg: 'white',
    border: { fg: '#333' },
  }
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
    // this.dataList = [...dataList];
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
  // focusBox() { 
  //   this.box.style.border.fg = COLOR_TEXT; 
  //   this.mainApp.render();
  // }
  createBoxContent() {
    this.button = blessed.Button({
      content: this.buttonLabel,
      top: 0,
      height: 1,
      width: '50%',
      left: '25%',
      align: 'center',
      style: { fg: COLOR_TEXT, bg: '#000', focus: { fg: '#000', bg: COLOR_TEXT } },
    });
    this.button.key(['enter'], this.addInput.bind(this));
    this.box.append(this.button);

    this.list = blessed.List({
      top: 1,
      keys: true,
      vi: true,
      items: this.makeListItems(this.dataList),
      border: 'line',
      style: { 
        item: { fg: 'white', bg: 'black' }, 
        selected: { fg: '#000', bg: '#4af626' }, 
        border: { fg: '#666' },
      },
      invertSelected: true,
      pick: (a, b) => this.mainApp.screen.debug('pick', a, b),
    });
    this.list.on('select', (_item, index) => this.selectItem(index));
    this.list.on('select item', () => {
      this.refreshCounter();
    }); 
    this.list.on('focus', () => {
      if(!this.dataList.length) {
        this.mainApp.screen.focusNext();
        // this.list.style.border.fg = '#333';
      }
    })
    this.list.key(['d'], () => this.deleteItem(this.list.selected));
    this.box.append(this.list);

    this.counter = blessed.Text({
      bottom: 0,
      right: 0,
      content: `[${this.list.selected+1}/${this.dataList.length}]`,
      style: { fg: '#666' },
    });
    this.box.append(this.counter);

    this.makeQuestion();
  }
}

// -----------------------
// -- RQ API BOX ---------
class RQApiBox extends RQBaseList {
  constructor(mainApp, options) {
    super(mainApp, `APIs(${PanelsType.API})`, 'API', options);
    this.buttonLabel = 'add API';
  }
  createBoxContent() {
    super.createBoxContent();
    // this.button.on('focus', () => this.focusBox());
    // this.list.on('focus', () => this.focusBox());
  }
  selectItem(index) {
    this.mainApp.setActiveAPI(this.dataList[index]);
    this.mainApp.containers.endpoints.button.focus();
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
    super(mainApp, `Endpoints(${PanelsType.ENDPOINT})`, 'ENDPOINTS', options);
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
        // this.counter.setContent(`[${this.list.selected+1}/${this.dataList.length}]`);
      }
    }
    this.counter.setContent(`[${this.list.selected+1}/${this.dataList.length}]`);
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
      // this.list.addItem(val);
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
      this.list.style.border.fg = '#666';
      // this.box.border.fg = '#333';
    } else {
      // this.box.border.fg = COLOR_TEXT;
    }
    this.mainApp.render();
  }
  createBoxContent() {
    super.createBoxContent();
    this.button.on('focus', () => this.redirectFocus());
    this.list.on('focus', () => this.redirectFocus());
  }
}

// --------------------
// -- RQ SERVER BOX ---
class RQServerBox extends RQBaseList {
  constructor(mainApp, options) {
    super(mainApp, `Server(${PanelsType.SERVER})`, 'HTTP_CONF', options);
  }
  createBoxContent() {
    const rItems = {};
    RequestTypes.map((r, i) => {
      rItems[r] = (i) => console.log(i, 'listbar digga');
    })
    this.requests = blessed.Listbar({
      top: 0,
      items: rItems,
      keys: true,
      vi: true,
      height: 1,
      // border: 'line',
      // width: '100%',
      lockKeys: true,
      grabKeys: true,
      style: {
        fg: COLOR_TEXT,
        bg: '#000',
        item: { bg: '#000', focus: { bg: 'blue' } },
        selected: { bg: COLOR_TEXT, fg: '#000' },
      }
      // padding: 0,
    });
    this.box.append(this.requests);
    // this.requests.focus();
    // const typeChilds = [];
    // RequestTypes.map(item => {
    //   typeChilds.push(blessed.RadioButton({
    //     content: item,
    //     style: { fg: COLOR_TEXT, bg: '#000' },
    //   }));
    // });

    // this.requests = blessed.RadioSet({
    //   keys: true,
    //   vi: true,
    //   children: typeChilds,
    // }); 
    // this.box.append(this.requests);
    // this.list = blessed.Listbar({
    //    
    // });
    // const t = blessed.Text({top:1, content:'hjovno'});
    // this.box.append(t);
  }
}

// ------------------
// -- RQ BODY BOX ---
class RQBodyBox extends RQBaseBox {
  constructor(mainApp, options) {
    super(mainApp, `Request body(${PanelsType.BODY})`, options);
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
      debug: true,
    });
    this.db = new JSONdb('./db.json', { jsonSpaces: 2 });
    // this.activeBox = PanelsType.API;
    this.activeAPI = null;

    this.makeContainters();
    this.makeFooter();
    this.render();
    this.link();
  }
  setActiveAPI(api) {
    this.activeAPI = api;
    this.containers.endpoints.setActiveAPI(api);
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
      height: '40%'
    });
    this.containers.body = new RQBodyBox(this, {
      ...baseContainerOpt,
      top: '40%',
      left: '40%',
      width: '60%',
      height: '60%'
    });

    for(const box of Object.values(this.containers)) {
      this.screen.append(box.getBox());
    }
    // this.containers.apis.button.focus();
    this.containers.serverSetings.requests.focus();
  }
  makeFooter() {
    this.footer = blessed.Text({
      content: 'Baked by @Chleba [d]:delete, [tab,<,>]:switch focus, [esc]:back/exit',
      bottom: 0,
      left: 2,
      style: { fg: '#666', },
    });
    this.screen.append(this.footer);
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
    // this.screen.key(['<', '>'], (_a, key) => {
    //   if(key.full === '<') { this.screen.focusPrevious(); }
    //   if(key.full === '>') { this.screen.focusNext(); }
    // });
    // this.screen.key(Object.values(PanelsType), (_, key) => {
    //   console.log(key, 'panel switch');
    // })
    this.screen.on('element focus', (cur, old) => {
      if (old.border) old.style.border.fg = '#666';
      if (cur.border) cur.style.border.fg = 'green';
      this.screen.render();
    });
  }
}

new RQMan();

