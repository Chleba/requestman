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
    // bg: 'magenta',
    border: { fg: '#333' },
    focus: {
      border: { fg: '#333' }
    }
  }
};
const PanelsType = {
  API: 1,
  ENDPOINT: 2,
  SERVER: 3,
  BODY: 4,
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
    this.dataList = [...dataList];
    this.question = this.button = this.input = this.list = this.inputLabel = null;
    this.buttonLabel = 'button'; 
  }
  makeQuestion() {
    this.question = blessed.Question({
      keys: true,
      vi: true,
    });
    this.box.append(this.question);
  }
  // setNewItem(val) { console.log(val, 'set new item'); }
  setNewItem(val) {
    if(val) {
      this.list.addItem(val);
      this.dataList.push(val);
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
      style: { fg: COLOR_TEXT, bg: '#000', focus: { fg: '#000', bg: COLOR_TEXT } },
    });
    this.button.key(['enter'], this.addInput.bind(this));
    this.box.append(this.button);

    this.list = blessed.List({
      top: 1,
      keys: true,
      vi: true,
      items: [...this.dataList],
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
    // this.list.on('select item', () => console.log('list action')); 
    this.list.on('focus', () => {
      if(!this.dataList.length) {
        this.mainApp.screen.focusNext();
      }
    })
    this.list.key(['d'], () => this.deleteItem(this.list.selected));
    this.box.append(this.list);

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
}

// --------------------
// -- RQ SERVER BOX ---
class RQServerBox extends RQBaseBox {
  constructor(mainApp, options) {
    super(mainApp, `Server(${PanelsType.SERVER})`, options);
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

    this.makeContainters();
    this.makeFooter();
    this.render();
    this.link();
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
    this.containers.apis.button.focus();
    // while(this.screen.focusPop()) {
    //   console.log('focus pop');
    // }
    // this.screen.focusPush(this.containers.apis.button);
    // this.screen.focusPush(this.containers.apis.list);
  }

  makeFooter() {
    this.footer = blessed.Text({
      content: 'Baked by @Chleba [d] - delete item, [tab] - change focus, [esc] - back/exit',
      top: '98%',
      left: 1,
      style: { fg: '#666', underline: true },
    });
    this.screen.append(this.footer);
  }

  render() {
    this.screen.render();
  }

  link() {
    this.screen.key(['q', 'C-c'], () => process.exit(0));
    this.screen.key(['tab'], (_ch, key) => {
      return key.shift
        ? this.screen.focusPrevious()
        : this.screen.focusNext();
    })
    this.screen.on('element focus', (cur, old) => {
      if (old.border) old.style.border.fg = 'default';
      if (cur.border) cur.style.border.fg = 'green';
      this.screen.render();
    });
  }
}

new RQMan();

