import blessed from "reblessed";
import { 
  COLOR_GRAY1, 
  COLOR_GRAY2, 
  COLOR_BLACK, 
  COLOR_TEXT,
  PanelsType,
  RequestTypes,
  defaultListStyle,
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
  makeContentBoxes() {
    this.makeBase();
    this.makeParams();
    this.makeHeaders();
    this.makeBody();
  }
  makeBase() {
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

      this.menuContent.append(this.base.box);
    }
  }
  makeParams() {
    if(!this.params) {
      this.params = {
        box: this.makeMenuBox('PARAMS'),
        queryKeyLabel: blessed.Text({
          content: 'Key:',
          style: { fg: COLOR_TEXT }
        }),
        queryKey: blessed.Textbox({
          left: 7,
          height: 1,
          keys: true,
          vi: true,
          style: { fg: '#fff', bg: '#222', focus: { bg: COLOR_BLACK, fg: COLOR_TEXT } },
        }),
        queryNameLabel: blessed.Text({
          top: 1,
          content: 'Value:',
          style: { fg: COLOR_TEXT }
        }),
        queryName: blessed.Textbox({
          top: 1,
          left: 7,
          height: 1,
          keys: true,
          vi: true,
          style: { fg: '#fff', bg: '#222', focus: { bg: COLOR_BLACK, fg: COLOR_TEXT } },
        }),
        list: blessed.List({
          border: 'line',
          style: JSON.parse(JSON.stringify(defaultListStyle)),
          invertSelected: true,
        }),
        // listTable: blessed.ListTable({
        //   top: 1,
        //   border: { type: 'line'},
        //   keys: true,
        //   vi: true,
        //   // pad: 0,
        //   // data: this.dataList.params,
        //   data: [
        //     ['a', 'b', 'c'],
        //     ['1', '2', '3'],
        //     ['3', '2', '3'],
        //     ['1', '1', '1'],
        //   ],
        //   noCellBorders: false,
        //   style: {
        //     fg: COLOR_TEXT,
        //     focus: { border: { fg: COLOR_TEXT } },
        //     border: { fg: COLOR_GRAY2 },
        //     header: { fg: 'blue', bold: true, },
        //     cell: { 
        //       fg: COLOR_TEXT, 
        //       selected: {
        //         bg: COLOR_TEXT,
        //         fg: COLOR_GRAY1,
        //       },
        //     }
        //   },
        // }),
      };
      for(let i in this.params) {
        if(i !== 'box') { this.params.box.append(this.params[i]); }
      }
      this.menuContent.append(this.params.box);
    }
  }
  makeHeaders() {

  }
  makeBody() {
    if(!this.body) {
      this.body = {
        box: this.makeMenuBox('BODY'),
        textarea: blessed.Textarea({
          keys: true,
          vi: true,
          value: this.dataList.body,
          style: { fg: '#fff', bg: '#222', focus: { bg: COLOR_BLACK, fg: COLOR_TEXT } }
        }),
      };
      for(let i in this.body) {
        if(i !== 'box') { this.body.box.append(this.body[i]); }
      }
      this.body.textarea.on('action', () => {
        this.setBody(this.body.textarea.getValue());
      });

      this.menuContent.append(this.body.box);
    }
  }
  clearMenuContent() {
    for(const child of this.menuContent.children) {
      child.hide();
      // this.menuContent.remove(child);
    }
  }
  setContentData() {
    if(this.base) {
      this.base.urlInput.setValue(this.dataList.url);
      this.base.methodButton.setContent(RequestTypes[this.dataList.method] || '?');
    }
    if(this.body) {
      this.body.textarea.clearValue();
      this.body.textarea.setValue(this.dataList.body);
    }
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
  setBody(value) {
    this.dataList.body = value;
    this.saveServerConf();
  }
  showBase() {
    this.clearMenuContent();
    this.base.box.show();
    this.mainApp.render();
  }
  showParams() {
    this.clearMenuContent();
    this.params.box.show();
    this.mainApp.render();
  }
  showHeaders() {
    // this.menuContent.children = [];
    // const b = this.makeMenuBox('HEADERS');
    // this.menuContent.append(b);
  }
  showBody() {
    this.clearMenuContent();
    this.body.box.show();
    this.mainApp.render();
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
    // -- create boxes
    this.makeContentBoxes();
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
