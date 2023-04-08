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
      style: { fg: COLOR_TEXT, bg: '#000' },
    });
    this.box.append(title);
    this.createBoxContent();
  }
}

// -----------------------------
// -- RQ LIST TEMPLATE ---------
class RQBaseListApi extends RQBaseBox {
  constructor(mainApp, title, DBKey, options) {
    super(mainApp, title, options);
    this.DBKey = DBKey;
    const dataList = this.mainApp.getDBItem(this.DBKey) || [];
    this.dataList = [...dataList];
    this.button = this.input = this.list = this.inputLabel = null;
  }
  setNewAPI(val) { console.log(val, 'set new item'); }
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
        this.setNewAPI(val);
        this.removeInput();
      });
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
}

// -----------------------
// -- RQ API BOX ---------
class RQApiBox extends RQBaseListApi {
  constructor(mainApp, options) {
    super(mainApp, 'APIs', 'API', options);
  }
  setNewAPI(val) {
    if(val) {
      this.list.addItem(val);
      this.dataList.push(val);
      this.mainApp.setDBItem(this.DBKey, this.dataList);
      this.mainApp.render();
    }
  }
  createBoxContent() {
    this.button = blessed.Button({
      content: 'new API',
      top: 0,
      height: 1,
      align: 'center',
      style: { fg: COLOR_TEXT, bg: '#000', focus: { fg: '#000', bg: COLOR_TEXT } },
    });
    this.button.key(['enter'], this.addInput.bind(this));
    this.box.append(this.button);
    this.button.focus();

    this.list = blessed.List({
      top: 1,
      keys: true,
      vi: true,
      items: [...this.dataList],
      border: 'line',
      style: { 
        item: { fg: 'white', bg: 'black' }, 
        selected: { fg: '#000', bg: '#4af626' }, 
        border: { fg: '#4af626' },
      },
      invertSelected: true,
    });
    this.list.on('select', (_item, index) => {
      console.log(index, 'selected');
    });
    this.box.append(this.list);
  }
}

// -----------------------
// -- RQ ENDPOINTS BOX ---
class RQEndpointsBox extends RQBaseListApi {
  constructor(mainApp, options) {
    super(mainApp, 'Endpoints', 'ENDPOINTS', options);
  }
  createBoxContent() {
    this.button = blessed.Button({
      content: 'new endpoint',
      top: 0,
      height: 1,
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
        border: { fg: '#4af626' },
      },
      invertSelected: true,
    });
    // this.list.focus();
    this.list.on('select', (_item, index) => {
      console.log(index, 'selected');
    });
    this.box.append(this.list);
  }
}

// --------------------
// -- RQ SERVER BOX ---
class RQServerBox extends RQBaseBox {
  constructor(mainApp, options) {
    super(mainApp, 'Server', options);
  }
}

// ------------------
// -- RQ BODY BOX ---
class RQBodyBox extends RQBaseBox {
  constructor(mainApp, options) {
    super(mainApp, 'Request body', options);
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
    this.render();
    this.link();
  }

  getDBItem(key) {
    const val = this.db.get(key);
    // console.log(val, key, 'jepka');
    return val ?? null;
  }

  setDBItem(key, val) {
    if(key && val) {
      // console.log('NEWITEM', val, key);
      this.db.set(key, val);
    }
  }

  makeContainters() {
    this.containers.apis = new RQApiBox(this, {
      ...baseContainerOpt,
    }).getBox();
    this.containers.endpoints = new RQEndpointsBox(this, {
      ...baseContainerOpt,
      top: '50%'
    }).getBox();
    this.containers.serverSetings = new RQServerBox(this, {
      ...baseContainerOpt,
      left: '40%',
      width: '60%',
      height: '30%'
    }).getBox();
    this.containers.body = new RQBodyBox(this, {
      ...baseContainerOpt,
      top: '30%',
      left: '40%',
      width: '60%',
      height: '70%'
    }).getBox();

    for(const box of Object.values(this.containers)) {
      this.screen.append(box);
    }
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








// // Create a screen object.
// const screen = blessed.screen({
//   smartCSR: true
// });

// screen.title = 'my window title';

// // Create a box perfectly centered horizontally and vertically.
// var box = blessed.box({
//   top: 'center',
//   left: 'center',
//   width: '50%',
//   height: '50%',
//   content: 'Hello {bold}world{/bold}!',
//   tags: true,
//   border: {
//     type: 'line'
//   },
//   style: {
//     fg: 'white',
//     bg: 'magenta',
//     border: {
//       fg: '#f0f0f0'
//     },
//     hover: {
//       bg: 'green'
//     }
//   }
// });

// // Append our box to the screen.
// screen.append(box);

// // Add a png icon to the box
// var icon = blessed.image({
//   parent: box,
//   top: 0,
//   left: 0,
//   type: 'overlay',
//   width: 'shrink',
//   height: 'shrink',
//   file: __dirname + '/my-program-icon.png',
//   search: false
// });

// // If our box is clicked, change the content.
// box.on('click', function(data) {
//   box.setContent('{center}Some different {red-fg}content{/red-fg}.{/center}');
//   screen.render();
// });

// // If box is focused, handle `enter`/`return` and give us some more content.
// box.key('enter', function(ch, key) {
//   box.setContent('{right}Even different {black-fg}content{/black-fg}.{/right}\n');
//   box.setLine(1, 'bar');
//   box.insertLine(1, 'foo');
//   screen.render();
// });

// // Quit on Escape, q, or Control-C.
// screen.key(['escape', 'q', 'C-c'], function(ch, key) {
//   return process.exit(0);
// });

// // Focus our element.
// box.focus();

// // Render the screen.
// screen.render();


// import { terminal } from 'terminal-kit';

// class RQMan {
//   constructor() {
//     this.renderTable();
//     this._link();
//     // this.createDocument();
//   }

//   _link() {
//     // terminal.on('key', (e:any) => this.keyInput(e));
//     terminal.on('key', (e:any) => this.keyInput(e));
//     terminal.on('terminal', (e:any) => this.terminalInput(e));
//   }

//   terminalInput(e:any) {
//     console.log(e);
//   }

//   keyInput(e:string) {
//     console.log(e);
//     if (e === 'CTRL_C') {
//       process.exit(0);
//     }
//   }

//   createDocument() {
//     // this.doc = terminal.docu
//   }

//   renderTable() {
//     // terminal.red('Hello word!');

//     terminal.fullscreen(true);
//     terminal.grabInput(true);
//     terminal.table( [
//         [ 'header #1' , 'header #2' , 'header #3' ] ,
//         [ 'row #1' , 'a much bigger cell, a much bigger cell, a much bigger cell... ' , 'cell' ] ,
//         [ 'row #2' , 'cell' , 'a medium cell' ] ,
//         [ 'row #3' , 'cell' , 'cell' ] ,
//         [ 'row #4' , 'cell\nwith\nnew\nlines' , '^YThis ^Mis ^Ca ^Rcell ^Gwith ^Bmarkup^R^+!' ]
//       ] , {
//         hasBorder: true,
//         contentHasMarkup: true,
//         borderChars: 'dotted',
//         borderAttr: { color: 'blue' } ,
//         textAttr: { bgColor: 'default' } ,
//         firstCellTextAttr: { bgColor: 'blue' } ,
//         firstRowTextAttr: { bgColor: 'yellow' } ,
//         firstColumnTextAttr: { bgColor: 'red' } ,
//         fit: true   // Activate all expand/shrink + wordWrap
//       }
//     ) ;
//   }
// }

// new RQMan(); 

