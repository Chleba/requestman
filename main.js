#!/usr/bin/env node

import { homedir } from 'os';
import https from 'https';
import clipboard from "node-clipboardy";
import axios from "axios";
import blessed from "reblessed";
import JSONdb from "simple-json-db";

import {
  COLOR_GRAY2,
  baseContainerOpt,
  PanelsType,
  RequestTypes,
} from "./src/conf.js";
import RQApiBox from "./src/apiBox.js";
import RQEndpointsBox from "./src/endpointsBox.js";
import RQServerBox from "./src/serverBox.js";
import RQBodyBox from "./src/bodyBox.js";

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
    const dbPath = process.platform !== 'win32' ? `${homedir()}/.rqmandb.json` : 'C:/\/\/.rqmandb.json'; 
    this.db = new JSONdb(dbPath, { jsonSpaces: 2 });
    this.activeAPI = null;
    this.activeEndpoint = null;
    this.activeConf = null;
    this.requestStatus = false;

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
  setActiveEndpoint(endpoint) {
    this.activeEndpoint = endpoint;
    this.containers.serverSettings.setActiveEndpoint(this.activeAPI, this.activeEndpoint);
  }
  setServerConf(conf) {
    this.activeConf = conf;
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
    this.containers.serverSettings = new RQServerBox(this, {
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
    this.containers.apis.button.focus();
    // this.containers.serverSettings.menu.focus();
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
  sendRequest() {
    if(this.requestStatus) { return; }
    this.requestStatus = true;
    this.containers.body.setResponseState('Loading..');
    const { method, url, headers } = this.activeConf;
    axios({
      // -- unsecure ssl
      httpsAgent: new https.Agent({ rejectUnauthorized: false }),
      // -- rest of the request from App
      method: RequestTypes[method],
      baseURL: `${url}`,
      url: `${this.activeEndpoint}`,
      headers: headers,
    }).then(response => {
        this.requestStatus = false;
        this.containers.body.addResponse(response, {...this.activeConf});
      }).catch(e => {
        this.requestStatus = false;
        this.containers.body.addResponse(e, {...this.activeConf});
      }); 
  }
  link() {
    this.screen.key(['q', 'C-c'], () => process.exit(0));
    this.screen.key(['tab', 'S-tab'], (_ch, key) => {
      return key.shift
        ? this.screen.focusPrevious()
        : this.screen.focusNext();
    });
    this.screen.key(['s'], () => this.sendRequest());
    this.screen.key(['c'], () => {
      if(this.containers.body.responseText) {
        clipboard.writeSync(this.containers.body.responseText.content);
      }
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
          this.containers.serverSettings.menu.focus();
          break;
        case PanelsType.BODY:
          if(this.containers.body.responseText) {
            this.containers.body.responseText.focus()
          }
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

