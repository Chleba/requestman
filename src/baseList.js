import blessed from "reblessed";
import { 
  COLOR_TEXT, 
  COLOR_BLACK, 
  COLOR_GRAY2, 
  defaultListStyle 
} from "./conf.js";
import RQBaseBox from "./baseBox.js";

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

export default RQBaseList;
