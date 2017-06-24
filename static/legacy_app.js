"use strict";
/* jshint browser: true */
/* jshint devel: true */
/* jshint esversion: 6 */

// Templates
const component = {

  // Login page.
  login: function() {

    let html = `<section class="section is-large">
                  <div class="columns">
                    <div class="column is-4 is-offset-4">

                        <div class="card">
                          <div class="card-content">

                            <div class="field">
                              <p class="control">
                                <input id="nickname" class="input has-text-centered" type="text" placeholder="Playername" value="">
                              </p>
                            </div>

                            <div class="field is-grouped">
                              <p class="control is-expanded">
                                <a class="button is-fullwidth" id="xbox">XBOX</a>
                              </p>
                              <p class="control is-expanded">
                                <a class="button is-fullwidth" id="ps4">PLAYSTATION</a>
                              </p>
                            </div>

                            <div class="field">
                              <p class="control">
                                <a class="button is-primary is-fullwidth" id="loginButton">Login</a>
                              </p>
                            </div>

                          </div>
                        </div>

                        <article class="message is-light">
                          <div class="message-body has-text-centered">
                            This is a legacy version.
                          </div>
                        </article>

                    </div>
                  </div>
                </section>`;

    return(html);

  },

  // Header section.
  heroHeader: function() {

    const NICKNAME = data.nickname;
    const PAGES = data.pages;

    function genHeroHead(nickname) {

      let html = `<div class="hero-head">
                      <header class="nav">
                          <div class="container">

                              <div class="nav-left">
                                  <span class="nav-item">

                                      <strong> ${ nickname } </strong>

                                  </span>
                              </div>

                              <div class="nav-right">
                                  <span class="nav-item">
                                      <a class="button is-primary is-inverted" onclick="ctrl.logout();">Logout</a>
                                  </span>
                              </div>

                          </div>
                      </header>
                  </div>`;

      return(html);




    }

    function genHeroFoot(pages) {

      let string = '';
      pages.forEach((page) => {

        string += '<li';

        if (page.active === true) {
          string += ' class="is-active"';
        }

        string += '><a onclick="' + page.onclick + '">' + page.label + '</a></li>';
      });


      let html = `<div class="hero-foot">
                      <nav class="tabs is-boxed">
                        <div class="container">
                          <ul>

                            ${ string }

                          </ul>
                        </div>
                      </nav>
                  </div>`;

      return(html);
    }


    let html = '<section class="hero is-primary is-bold">' + genHeroHead(NICKNAME) + genHeroFoot(PAGES) + '</section>';

    return(html);

  },
  nav: function() {

    const TABS = data.tabs;

    let string = '';
    TABS.forEach((tab) => {
      string += '<a class="nav-item is-tab';

      if (tab.active === true) {
        string += ' is-active';
      }

      string += '" onclick="' + tab.onclick + '">' + tab.label + '</a>';
    });


    let html = `<nav class="nav has-shadow">
                  <div class="container">
                    <div class="nav-left">

                      ${string}

                    </div>
                  </div>
                </nav>`;

    return(html);
  },

  // Controls section for Profile and Time Series
  controls: function() {

    let html = `<div class='container' style='margin-top: 15px; margin-bottom: 15px;'>
                  ${ this.filters('tiers') }
                  ${ this.filters('class') }
                  ${ this.resetButton() }
                  ${ this.refreshButton() }
                </div>`;
    return(html);

  },
  filters: function(type) {
    // Type is either 'tiers' or 'class'.

    const ITEMS = data.filters.filter((item) => item.type == type);
    let string = '';

    function isActive(bool) {
      if (bool === true) {
        return(' is-active');
      } else {
        return('');
      }
    }

    for (let item of ITEMS) {

      let onclick = `onclick="ctrl.filters.actToggle('${ item.id }');"`;

      string += `<div class="column">

                    <a class="button is-small is-light is-fullwidth${ isActive(item.active) }" id="${ item.id }" ${ onclick }>${ item.label }</a>

                </div>`;
    }

    let html = `<div class="columns is-gapless is-mobile is-multiline is-marginless">
                  ${ string }
                </div>`;
    return(html);
  },
  resetButton: function() {
    let html = `<div class="field">
                  <a class="button is-warning is-small is-fullwidth" onclick="ctrl.filters.reset();">Reset Filters</a>
                </div>`;
    return(html);
  },
  refreshButton: function() {
    let html = `<div class='level'>

                  <a class="button is-primary is-fullwidth" id="refreshButton">Refresh</a>

                </div>`;
    return(html);
  },

  // Profile page.
  dashboard: function() {

    let string = '';

    string += '<div class="container">';
    string += this.level();
    string += this.panels();
    string += '</div>';

    return(string);

  },
  level: function() {

    function getArrowTag(recentNumber, alltimeNumber) {

      let symbol = '';
      let color = '';

      if (recentNumber > alltimeNumber) {
          //Arrow up.
          symbol = '&#9650';
          color = '#89b891';
      } else if (recentNumber < alltimeNumber) {
          // Arrow down.
          symbol = '&#9660';
          color = '#c28080';
      } else {
          // Arrow straight.
          symbol = '&#9654';
      }

      let html = `<p class="title" style=\'color: ${ color };\'>${ symbol }</p>`;

      return(html);
    }

    function getWn8Color(wn8Score) {

      let color = 'BLACK';

      let scale = [
        [-999,  299,    'DARKRED'],
        [300,   449,    'ORANGERED'],
        [450,   649,    'DARKORANGE'],
        [650,   899,    'GOLD'],
        [900,   1199,   'YELLOWGREEN'],
        [1200,  1599,   'LIME'],
        [1600,  1999,   'DEEPSKYBLUE'],
        [2000,  2449,   'DODGERBLUE'],
        [2450,  2899,   'MEDIUMSLATEBLUE'],
        [2900,  99999,  'REBECCAPURPLE']
      ];

      for (let item of scale) {
        if ((wn8Score >= item[0]) && (wn8Score <= item[1])) {
          color = item[2];
        }
      }

      return(color);
    }

    const WR_SCORE = data.profile.all_time.wr;
    const WN8_SCORE = data.profile.all_time.wn8;
    const PERC_SCORE = data.profile.all_time.total_perc;

    const WR_TAG = getArrowTag(data.profile.recent.wr, data.profile.all_time.wr);
    const WN8_TAG = getArrowTag(data.profile.recent.wn8, data.profile.all_time.wn8);
    const PERC_TAG = getArrowTag(data.profile.recent.total_perc, data.profile.all_time.total_perc);

    let html = `<nav class="level is-mobile">
                  <div class="level-item has-text-centered">
                    <div>
                      <p class="heading">WINRATE</p>
                      <p class="title"> ${ WR_SCORE } %</p>
                      ${ WR_TAG }
                    </div>
                  </div>
                  <div class="level-item has-text-centered">
                    <div>
                      <p class="heading">WN8</p>
                      <p class="title"> ${ WN8_SCORE } <span style="color: ${ getWn8Color(WN8_SCORE) }">&#9733;</span></p>
                      ${ WN8_TAG }
                    </div>
                  </div>
                  <div class="level-item has-text-centered">
                    <div>
                      <p class="heading">PERCENTILE</p>
                      <p class="title"> ${ PERC_SCORE } %</p>
                      ${ PERC_TAG }
                    </div>
                  </div>
                </nav>`;

    return(html);

  },
  panels: function() {

    let html = `<div class='columns'>
                  <div class='column is-6'>

                    <nav class="panel">
                      <p class="panel-heading has-text-centered">
                        WN8
                      </p>
                      <div class="panel-block">
                        <canvas id="WN8Canvas" width="100" height="40"></canvas>
                      </div>
                    </nav>

                  </div>
                  <div class='column is-6'>

                    <nav class="panel">
                      <p class="panel-heading has-text-centered">
                        Total Percentile
                      </p>
                      <div class="panel-block">
                        <canvas id="PercCanvas" width="100" height="40"></canvas>
                      </div>
                    </nav>

                  </div>
                </div>`;
    return(html);

  },

  inDetail: function() {

    const tableData = [
      {label: 'Win Rate',                 attr: 'wr',         addon: ' %'},
      {label: 'WN8',                      attr: 'wn8',        addon: ''},
      {label: 'Total Percentile',         attr: 'total_perc', addon: ' %'},
      {label: 'Accuracy',                 attr: 'acc',        addon: ' %'},
      {label: 'Damage Caused',            attr: 'dmgc',       addon: ''},
      {label: 'Radio Assist',             attr: 'rass',       addon: ''},
      {label: 'Damage Received',          attr: 'dmgr',       addon: ''},
      {label: 'Kills / Deaths',           attr: 'k_d',        addon: ''},
      {label: 'Damage Caused / Received', attr: 'dmgc_dmgr',  addon: ''}
    ];

    function getArrowTag(recentNumber, alltimeNumber) {

      let symbol = '';
      let color = '';

      if (recentNumber > alltimeNumber) {
          //Arrow up.
          symbol = '&#9650';
          color = '#89b891';
      } else if (recentNumber < alltimeNumber) {
          // Arrow down.
          symbol = '&#9660';
          color = '#c28080';
      } else {
          // Arrow straight.
          symbol = '&#9654';
      }

      let html = `<span style=\'color: ${ color };\'>${ symbol }</span>`;

      return(html);
    }

    let string = '';
    tableData.forEach((item) => {

      const RECENT = data.profile.recent[item.attr];
      const ALL_TIME = data.profile.all_time[item.attr];

      string += `<tr>
                  <td> ${ getArrowTag(RECENT, ALL_TIME) } </td>
                  <td> ${ item.label } </td>
                  <td> ${ ALL_TIME + item.addon } </td>
                  <td> ${ RECENT + item.addon } </td>
                </tr>`;
    });

    let html = `<div class="container">
                  <div class="tile is-ancestor">
                      <div class="tile is-parent is-6">
                          <div class="tile is-child box is-12">
                              <canvas id="RadChCanvas" width="100" height="70"></canvas>
                          </div>
                      </div>
                      <div class="tile is-parent is-6">
                          <div class="tile is-child box is-12">

                              <table class="table">
                                  <thead>
                                      <tr>
                                          <td></td>
                                          <td></td>
                                          <td>All time</td>
                                          <td>Recent</td>
                                      </tr>
                                  </thead>

                                  <tbody>

                                    ${ string }

                                  </tbody>

                              </table>
                          </div>
                      </div>
                  </div>
              </div>`;

    return(html);

  },

  // Vehicles page.
  vControls: function() {
    let html = `<div class='container' style='margin-top: 15px; margin-bottom: 15px;'>
                  ${ this.vSelectors() }
                  ${ this.filters('tiers') }
                  ${ this.filters('class') }
                  ${ this.filterBy50() }
                  ${ this.refreshButton() }
                </div>`;
    return(html);
  },
  vSelectors: function() {

    const ITEMS = data.vSelectors;
    const ONCLICK = 'ctrl.vSelectors.toggle';
    let string = '';

    function isActive(bool) {
      if (bool === true) {
        return(' is-active');
      } else {
        return('');
      }
    }

    for (let x = 0; x < ITEMS.length; x+=3) {
      string += `<div class="column">

                    <a class="button is-small is-light is-fullwidth${ isActive(ITEMS[x].active) }" id="${ ITEMS[x].id }" onclick="${ ONCLICK }('${ ITEMS[x].id }')">${ ITEMS[x].label }</a>

                    <a class="button is-small is-light is-fullwidth${ isActive(ITEMS[x+1].active) }" id="${ ITEMS[x+1].id }" onclick="${ ONCLICK }('${ ITEMS[x+1].id }')">${ ITEMS[x+1].label }</a>

                    <a class="button is-small is-light is-fullwidth${ isActive(ITEMS[x+2].active) }" id="${ ITEMS[x+2].id }" onclick="${ ONCLICK }('${ ITEMS[x+2].id }')">${ ITEMS[x+2].label }</a>

                  </div>`;
    }

    let html = `<div class="columns is-gapless is-mobile is-multiline">
                  ${ string }
                </div>`;

    return(html);
  },
  filterBy50: function() {

    let active = '';
    if (data.filterBy50 === true) {
      active = ' is-active';
    }

    let html = `<div class="field">
                  <a class="button is-light is-small is-fullwidth${ active }" id="filterBy50" onclick="ctrl.filterBy50();">Filter by at least 50 battles</a>
                </div>`;
    return(html);
  },

  // Time Series page.
  timeSeries: function() {

    let html = `<div class='container'>
                  <canvas id='ChCanvas' width='400' height='150'></canvas>
                </div>`;

    return(html);
  },

  // Session tracker
  stControls: function() {

    let html = `<div class='container' style='margin-top: 15px; margin-bottom: 15px;'>
                  ${ this.snapshots() }
                  ${ this.refreshButton() }
                </div>`;
    return(html);

  },
  snapshots: function() {

    // Return nothing if property doesnt exist.
    if (data.sessionTracker === null) {
      return('');
    }

    const SNAPSHOTS = data.sessionTracker.snapshots;
    const DATA_OBJ = 'sessionTracker';

    let string = '';
    SNAPSHOTS.forEach((timestamp) => {
      let label = Math.round((Date.now() / 1000 - timestamp) / 60 / 60 / 24);
      let onclick = `data.timestamp = ${ timestamp }; data.${ DATA_OBJ } = null; app.draw();`;

      string += `<div class="column">
                  <p class="control">
                    <a class="button is-light is-fullwidth" onclick="${ onclick }">${ String(label) + ' days ago' }</a>
                  </p>
                </div>`;
    });

    // In case there are 0 snapshots.
    if (SNAPSHOTS.length === 0) {
      string = `<div class="column">
                  <div class="notification">
                    There are currently no snapshots available for comparison, but your today's data is saved. Come back tomorrow to see how your recent performace compares to your all-time stats in the tanks that you played.
                  </div>
                </div>`;
    }

    let html = `<div class="columns is-mobile is-multiline">
                  ${ string }
                </div>`;

    return(html);
  },
  sessionTracker: function(sTankID) {

    const ELEMENT_ID = 'sessionTracker';
    const TANKS = data.sessionTracker.session_tanks;
    const SELECTED_TANK = TANKS.filter((tank) => String(tank.tank_id) == sTankID)[0];

    let links = '';
    TANKS.forEach((tank) => {
      let active = '';
      if (String(tank.tank_id) == sTankID) {
        active = 'class=\'is-active\'';
      }
      let onclick = `app.refresh('${ tank.tank_id }')`;
      links += `<li><a ${ active } id="${ tank.tank_id }" onclick="${ onclick }"> ${ tank.tank_name } </a></li>`;
    });

    let html = `<div id='${ ELEMENT_ID }' class="container">
                  <div class="tile is-ancestor">

                    <div class="tile is-parent is-2">
                      <div class="tile is-child box">
                        <aside class="menu">
                          <p class="menu-label">Tanks</p>
                          <ul class="menu-list">

                            ${ links }

                          </ul>
                        </aside>
                      </div>
                    </div>

                    <div class="tile is-parent is-5">
                      <div class="tile is-child box is-12">
                        <canvas id="RadChCanvas" width="100" height="100"></canvas>
                      </div>
                    </div>

                    <div class="tile is-parent is-5">
                      <div id="TableParent" class="tile is-child box is-12">

                        ${ this.stTable(SELECTED_TANK) }

                      </div>
                    </div>

                  </div>
                </div>`;

    return(html);

  },
  stTable: function(oTank) {

    let thead = oTank.tank_name + " Battles: " + oTank.session.battles + "  Wins: " + oTank.session.wins;

    let tableRows = [
      ["Accuracy",           oTank.session.acc,      oTank.all.acc],
      ["Damage Caused",      oTank.session.dmgc,     oTank.all.dmgc],
      ["Radio Assist",       oTank.session.rass,     oTank.all.rass],
      ["Experience",         oTank.session.exp,      oTank.all.exp],
      ["Damage Received",    oTank.session.dmgr,     oTank.all.dmgr],
      ["Lifetime",           oTank.session.lifetime, oTank.all.lifetime],
      ["DPM",                oTank.session.dpm,      oTank.all.dpm],
      ["WN8",                oTank.session.wn8,     oTank.all.wn8]
    ];

    function convertTime(seconds) {
        if (seconds >= 60) {
          const M = parseInt(seconds / 60);
          const S = parseInt(seconds - M * 60);
          return(String(M) + 'm ' + String(S) + 's');
        } else {
          return(String(seconds) + 's');
        }
    }

    let tbody = '';
    tableRows.forEach((row) => {
      switch(row[0]) {
        // Percent with 2 decimals.
        case 'Accuracy':
          row[1] = String(Math.round(row[1] * 100) / 100) + ' %';
          row[2] = String(Math.round(row[2] * 100) / 100) + ' %';
          break;
        case 'Lifetime':
          row[1] = convertTime(row[1]);
          row[2] = convertTime(row[2]);
          break;
        // Integer.
        default:
          row[1] = Math.round(row[1]);
          row[2] = Math.round(row[2]);
          break;
      }
      tbody += `<tr>
                  <td>${ row[0] }</td><td>${ row[1] }</td><td>${ row[2] }</td>
                </tr>`;
    });

    let html = `<table class='table'>
                  <thead>
                    <tr>
                      <th colspan='3'>
                        ${ thead }
                      </th>
                    </tr>
                    <tr>
                      <th>Averages</th>
                      <th>Session</th>
                      <th>All time</th>
                    </tr>
                  </thead>
                  <tbody>
                    ${ tbody }
                  </tbody>
                </table>`;
    return(html);
  },

  // About page
  about: function() {
    const HTML = `<section class='section'><div class='container content'>

                    <p>
                      Interested in the future of this website? Contribute to the development on
                      <a href='https://github.com/IDDT/wot-console-stats'>GitHub</a>
                    </p>

                    <p>
                      Interested in WN8 calculation algorithm?
                      <a href='https://github.com/IDDT/wot-console-playerbase-analysis'>Here it is</a>

                      <br>
                      <a href='https://github.com/IDDT/wot-console-playerbase-analysis/tree/master/wn8_results'>WN8 comparison charts</a>

                      <br>
                      <a href='https://github.com/IDDT/wot-console-playerbase-analysis/blob/master/data/processed/wn8console.json'>WN8 values in JSON</a>
                    </p>

                    <p>
                      Latest percentiles and WN8 table update: 30 APR 2017
                    </p>

                    <p>
                      Have a question? Found a bug? Send a message to my
                      <a href='http://forum-console.worldoftanks.com/index.php?/user/turboparrot666-1076121407/'>WoT Console forum profile</a> or open an issue in the respective repository.
                    </p>

                  </div></section>`;
    return(HTML);
  }
};

// Chart functions.
const chart = {
  // Profile page
  OpenWN8Ch: function() {
        new Chart(document.getElementById("WN8Canvas"), {
            type: 'line',
            data:  {
                labels: data.profile.xlabels,
                datasets: [{
                    label: 'WN8',
                    fill: true,
                    backgroundColor: "hsla(200, 25%, 63%, 0.1)",
                    borderColor: "hsl(200, 25%, 63%)",
                    pointBackgroundColor: "hsl(200, 25%, 63%)",
                    pointBorderColor: "#ffffff",
                    pointHoverBackgroundColor: "#ffffff",
                    pointHoverBorderColor: "hsl(200, 25%, 63%)",
                    data: data.profile.wn8_totals,
                }]
            },
            options: {
                legend: {
                    display: false
                },
                scales: {
                    yAxes: [{
                        ticks: {
                            callback: function(label, index, labels) {
                                return Math.round(label);
                            }
                        }
                    }]
                }
            }
        });
    },
  OpenPercCh: function() {
      new Chart(document.getElementById("PercCanvas"), {
          type: 'line',
          data:  {
              labels: data.profile.xlabels,
              datasets: [{
                  label: 'Total Percentile',
                  fill: true,
                  backgroundColor: "hsla(130, 25%, 63%, 0.1)",
                  borderColor: "hsl(130, 25%, 63%)",
                  pointBackgroundColor: "hsl(130, 25%, 63%)",
                  pointBorderColor: "#ffffff",
                  pointHoverBackgroundColor: "#ffffff",
                  pointHoverBorderColor: "hsl(130, 25%, 63%)",
                  data: data.profile.percentiles_totals,
              }],
          },
          options: {
              legend: {
                  display: false,
              },
              scales: {
                  yAxes: [{
                      ticks: {
                          callback: function(label, index, labels) {
                              return Math.round(label*100)/100;
                          }
                      },
                  }],
              },
          },
      });
    },
  OpenRadCh: function() {
      new Chart(document.getElementById("RadChCanvas"), {
          type: 'radar',
          data:  {
              labels: ['Accuracy', 'Damage Caused', 'Radio Assist', 'WinRate', 'Damage Received (inv)'],
              datasets: [{
                  label: 'Recent Percentiles',
                  fill: true,
                  backgroundColor: "hsla(0, 35%, 63%, 0.2)",
                  borderColor: "hsl(0, 35%, 63%)",
                  pointBackgroundColor: "hsl(0, 35%, 63%)",
                  pointBorderColor: "#ffffff",
                  pointHoverBackgroundColor: "#ffffff",
                  pointHoverBorderColor: "hsl(0, 35%, 63%)",
                  data: [
                      data.profile.recent.percentiles.acc,
                      data.profile.recent.percentiles.dmgc,
                      data.profile.recent.percentiles.rass,
                      data.profile.recent.percentiles.wr,
                      data.profile.recent.percentiles.dmgr
                  ],
              },
              {
                  label: 'All Time Percentiles',
                  fill: true,
                  backgroundColor: "hsla(200, 25%, 63%, 0.1)",
                  borderColor: "hsl(200, 25%, 63%)",
                  pointBackgroundColor: "hsl(200, 25%, 63%)",
                  pointBorderColor: "#ffffff",
                  pointHoverBackgroundColor: "#ffffff",
                  pointHoverBorderColor: "hsl(200, 25%, 63%)",
                  data: [
                      data.profile.all_time.percentiles.acc,
                      data.profile.all_time.percentiles.dmgc,
                      data.profile.all_time.percentiles.rass,
                      data.profile.all_time.percentiles.wr,
                      data.profile.all_time.percentiles.dmgr
                  ],
              }]
          },
          options: {
              scale: {
                  ticks: {
                      beginAtZero: true
                  }
              }
          }
      });
    },

  // Time Series
  timeSeriesPerc: function() {
    new Chart(document.getElementById("ChCanvas"), {
      type: 'line',
      data:  {
          labels: data.timeSeries.xlabels.slice(1),
          datasets: [{
              label: 'Accuracy',
              fill: false,
              borderColor: 'hsl(0, 25%, 63%)',
              backgroundColor: 'hsla(0, 25%, 63%, 0.2)',
              pointBorderColor: 'hsl(0, 25%, 63%)',
              pointBackgroundColor: 'hsl(0, 25%, 63%)',
              pointRadius: 4,
              pointHoverRadius: 6,
              data: data.timeSeries.percentiles_change.map((Obj) => { return(Obj.acc); })
          },{
              label: 'Damage Caused',
              fill: false,
              borderColor: 'hsl(228, 25%, 63%)',
              backgroundColor: 'hsla(228, 25%, 63%, 0.2)',
              pointBorderColor: 'hsl(228, 25%, 63%)',
              pointBackgroundColor: 'hsl(228, 25%, 63%)',
              pointRadius: 4,
              pointHoverRadius: 6,
              data: data.timeSeries.percentiles_change.map((Obj) => { return(Obj.dmgc); })
          },{
              label: 'Radio Assist',
              fill: false,
              borderColor: 'hsl(197, 25%, 63%)',
              backgroundColor: 'hsla(197, 25%, 63%, 0.2)',
              pointBorderColor: 'hsl(197, 25%, 63%)',
              pointBackgroundColor: 'hsl(197, 25%, 63%)',
              pointRadius: 4,
              pointHoverRadius: 6,
              data: data.timeSeries.percentiles_change.map((Obj) => { return(Obj.rass); })
          },{
              label: 'WinRate',
              fill: false,
              borderColor: 'hsl(127, 25%, 63%)',
              backgroundColor: 'hsla(127, 25%, 63%, 0.2)',
              pointBorderColor: 'hsl(127, 25%, 63%)',
              pointBackgroundColor: 'hsl(127, 25%, 63%)',
              pointRadius: 4,
              pointHoverRadius: 6,
              data: data.timeSeries.percentiles_change.map((Obj) => { return(Obj.wr); })
          },{
              label: 'Damage Received (inv)',
              fill: false,
              borderColor: 'hsl(60, 25%, 63%)',
              backgroundColor: 'hsla(60, 25%, 63%, 0.2)',
              pointBorderColor: 'hsl(60, 25%, 63%)',
              pointBackgroundColor: 'hsl(60, 25%, 63%)',
              pointRadius: 4,
              pointHoverRadius: 6,
              data: data.timeSeries.percentiles_change.map((Obj) => { return(Obj.dmgr); })
          }],
      },
      options: {
          scales: {
              yAxes: [{
                  ticks: {
                      callback: function(label, index, labels) {
                          return label+'%';
                      }
                  },
              }],
          }
      }
    });
  },
  timeSeriesWN8: function() {
    new Chart(document.getElementById("ChCanvas"), {
      type: 'line',
      data: {
          labels: data.timeSeries.xlabels.slice(1),
          datasets: [
              {
                  label: "WN8 Daily",
                  fill: false,
                  backgroundColor: "hsla(0, 35%, 63%, 0.2)",
                  borderColor: "hsl(0, 35%, 63%)",
                  pointBackgroundColor: "hsl(0, 35%, 63%)",
                  pointBorderColor: "#ffffff",
                  pointHoverBackgroundColor: "#ffffff",
                  pointHoverBorderColor: "hsl(0, 35%, 63%)",
                  data: data.timeSeries.wn8_change,
              },
              {
                  label: "WN8 Total",
                  fill: true,
                  backgroundColor: "hsla(195, 20%, 63%, 0.1)",
                  borderColor: "hsl(195, 20%, 63%)",
                  pointBackgroundColor: "hsl(195, 20%, 63%)",
                  pointBorderColor: "#ffffff",
                  pointHoverBackgroundColor: "#ffffff",
                  pointHoverBorderColor: "hsl(195, 20%, 63%)",
                  data: data.timeSeries.wn8_totals,
              }
          ]
      },
      options: {},
    });
  },

  stRadar: function(oTank) {
    new Chart(document.getElementById("RadChCanvas"), {
      type: 'radar',
      data: {
        labels: ["Accuracy", "Damage Caused", "Radio Assist", "Experience", "Damage Received (inv)"],
        datasets: [{
          label: "Selected period",
          backgroundColor: "hsla(0, 35%, 63%, 0.2)",
          borderColor: "hsl(0, 35%, 63%)",
          pointBackgroundColor: "hsl(0, 35%, 63%)",
          pointBorderColor: "#ffffff",
          pointHoverBackgroundColor: "#ffffff",
          pointHoverBorderColor: "hsl(0, 35%, 63%)",
          data: oTank.session.radar
        },
        {
          label: "All time",
          backgroundColor: "hsla(195, 20%, 63%, 0.1)",
          borderColor: "hsl(195, 20%, 63%)",
          pointBackgroundColor: "hsl(195, 20%, 63%)",
          pointBorderColor: "#ffffff",
          pointHoverBackgroundColor: "#ffffff",
          pointHoverBorderColor: "hsl(195, 20%, 63%)",
          data: oTank.all.radar
        }]
      },
      options: {
        scale: {
          ticks: {
            beginAtZero: true
          }
        }
      }
    });
  }

};

// Simple onclick controls.
const ctrl = {
  logout: function() {

    document.getElementsByTagName('body')[0].innerHTML = '';

    data.nickname = null;
    data.server = null;
    data.accountID = null;
    data.profile = null;
    data.vehicles = null;
    data.timeSeries = null;
    data.sessionTracker = null;
    data.wn8Estimates = null;
    data.filterBy50 = false;
    data.timestamp = 0;

    page.login();
  },

  filters: {
    toggle: function(sID) {

      for (let item of data.filters) {

        if (item.id !== sID) { continue; }

        let button = document.getElementById(sID);

        if (item.active === true) {
          item.active = false;
          button.classList.remove('is-active');
        } else {
          item.active = true;
          button.classList.add('is-active');
        }
      }
    },
    actToggle: function(sID) {
      for (let item of data.filters) {

        if (item.id !== sID) { continue; }

        let button = document.getElementById(sID);

        if (item.active === true) {
          item.active = false;
          button.classList.remove('is-active');
        } else {
          item.active = true;
          button.classList.add('is-active');
        }
      }
      app.refresh();
    },
    reset: function() {
      data.filters.forEach((item) => {
        item.active = true;
        document.getElementById(item.id).classList.add('is-active');
      });
    app.refresh();
    }
  },

  vSelectors: {
    toggle: function(sID) {
      for (let item of data.vSelectors) {

        if (item.id !== sID) { continue; }

        let button = document.getElementById(sID);

        if (item.active === true) {
          button.classList.remove('is-active');
          item.active = false;
        } else {
          button.classList.add('is-active');
          item.active = true;
        }
        break;
      }
      app.refresh();
    }
  },

  filterBy50: function() {
    let button = document.getElementById('filterBy50');
    if (data.filterBy50 === false) {
      data.filterBy50 = true;
      button.classList.add('is-active');
    } else {
      data.filterBy50 = false;
      button.classList.remove('is-active');
    }
    app.refresh();
  }
};

// Router
const page = {
  login: function() {
    app = new viewLogin();
    app.draw();
    googleTrack('Login');
  },
  profile: function() {
    app = new viewProfile();
    app.draw();
    googleTrack('Profile');
  },
  vehicles: function() {
    app = new viewVehicles();
    app.draw();
    googleTrack('Vehicles');
  },
  timeSeries: function() {
    app = new viewTimeSeries();
    app.draw();
    googleTrack('Time Series');
  },
  sessionTracker: function() {
    app = new viewSessionTracker();
    app.draw();
    googleTrack('Session Tracker');
  },
  estimates: function() {
    app = new viewEstimates();
    app.draw();
    googleTrack('Estimates');
  },
  about: function() {
    app = new viewAbout();
    app.draw();
    googleTrack('About');
  }
};

// Data
let data = {

  nickname: null,
  server: null,
  accountID: null,

  profile: null,
  vehicles: null,
  timeSeries: null,
  sessionTracker: null,
  wn8Estimates: null,

  filterBy50: false,

  timestamp: 0,

  filters: [
    {label: 'Tier 1',        type: 'tiers', active: true, id: '1',          onclick: 'ctrl.filters.toggle(\'1\')'},
    {label: 'Tier 2',        type: 'tiers', active: true, id: '2',          onclick: 'ctrl.filters.toggle(\'2\')'},
    {label: 'Tier 3',        type: 'tiers', active: true, id: '3',          onclick: 'ctrl.filters.toggle(\'3\')'},
    {label: 'Tier 4',        type: 'tiers', active: true, id: '4',          onclick: 'ctrl.filters.toggle(\'4\')'},
    {label: 'Tier 5',        type: 'tiers', active: true, id: '5',          onclick: 'ctrl.filters.toggle(\'5\')'},
    {label: 'Tier 6',        type: 'tiers', active: true, id: '6',          onclick: 'ctrl.filters.toggle(\'6\')'},
    {label: 'Tier 7',        type: 'tiers', active: true, id: '7',          onclick: 'ctrl.filters.toggle(\'7\')'},
    {label: 'Tier 8',        type: 'tiers', active: true, id: '8',          onclick: 'ctrl.filters.toggle(\'8\')'},
    {label: 'Tier 9',        type: 'tiers', active: true, id: '9',          onclick: 'ctrl.filters.toggle(\'9\')'},
    {label: 'Tier 10',       type: 'tiers', active: true, id: '10',         onclick: 'ctrl.filters.toggle(\'10\')'},
    {label: 'Light Tanks',   type: 'class', active: true, id: 'lightTank',  onclick: 'ctrl.filters.toggle(\'lightTank\')'},
    {label: 'Medium Tanks',  type: 'class', active: true, id: 'mediumTank', onclick: 'ctrl.filters.toggle(\'mediumTank\')'},
    {label: 'Heavy Tanks',   type: 'class', active: true, id: 'heavyTank',  onclick: 'ctrl.filters.toggle(\'heavyTank\')'},
    {label: 'AT-SPG',        type: 'class', active: true, id: 'AT-SPG',     onclick: 'ctrl.filters.toggle(\'AT-SPG\')'},
    {label: 'SPG',           type: 'class', active: true, id: 'SPG',        onclick: 'ctrl.filters.toggle(\'SPG\')'}
  ],
  vSelectors: [
    {label: 'WinRate', active: true, id: 'wr'},
    {label: 'Battles', active: false, id: 'battles'},
    {label: 'WN8',     active: true, id: 'wn8'},

    {label: 'Avg Dmg',   active: false, id: 'avg_dmg'},
    {label: 'Avg Frags', active: false, id: 'avg_frags'},
    {label: 'Avg Exp',   active: false, id: 'avg_exp'},

    {label: 'Avg DPM', active: true, id: 'avg_dpm'},
    {label: 'Avg FPM', active: false, id: 'avg_fpm'},
    {label: 'Avg EPM', active: false, id: 'avg_epm'},

    {label: 'Dmg Percentile', active: false, id: 'dmg_perc'},
    {label: 'WR Percentile',  active: true, id: 'wr_perc'},
    {label: 'Exp Percentile', active: false, id: 'exp_perc'},

    {label: 'Penetrated/Hits caused', active: false, id: 'pen_hits_ratio'},
    {label: 'Bounced/Hits received',  active: false, id: 'bounced_hits_ratio'},
    {label: 'Survived',               active: false, id: 'survived'},

    {label: 'Total Lifetime',   active: false, id: 'total_time_m'},
    {label: 'Average Lifetime', active: false, id: 'avg_lifetime_s'},
    {label: 'Last battle time', active: false, id: 'last_time'},
  ],
  pages: [
    {label: 'Profile',         active: false, onclick: 'page.profile();'},
    {label: 'Vehicles',        active: false, onclick: 'page.vehicles();'},
    {label: 'Time Series',     active: false, onclick: 'page.timeSeries();'},
    {label: 'Session Tracker', active: false, onclick: 'page.sessionTracker();'},
    {label: 'WN8 Estimates',   active: false, onclick: 'page.estimates();'},
    {label: 'About',           active: false, onclick: 'page.about();'}
  ],
  tabs: [
    {label: 'Sample tab 1', active: false, onclick: 'sampleFunction();'},
    {label: 'Sample tab 2', active: false, onclick: 'sampleFunction();'}
  ],

};

// Views
class view {
  // Select active elements for future rendering.
  selectHeader(sHeaderText) {
    data.pages.forEach((page) => {
      page.active = false;
      if (page.label == sHeaderText) {
        page.active = true;
      }
    });
  }
  selectTab(sTabText) {

    data.tabs.forEach((tab) => {
      tab.active = false;
      if (tab.label == sTabText) {
        tab.active = true;
      }
    });

    if ((typeof(sTabText) == 'undefined') && (data.tabs.length > 0)) {
      data.tabs[0].active = true;
    }
  }

  // Assemble URL to talk with the host.
  getURL(sDataObj) {

    // Convert data.filters to string.
    const TEMP_FILTERS = data.filters.filter((x) => x.active === true).map((x) => x.id);
    const FILTERS = '&' + TEMP_FILTERS.join('&');

    // Get the url.
    let type;
    switch (sDataObj) {
        case 'profile':
            type = 'profile';
            break;
        case 'vehicles':
            type = 'vehicles';
            break;
        case 'timeSeries':
            type = 'time_series';
            break;
        case 'sessionTracker':
            type = 'session_tracker';
            break;
        case 'wn8Estimates':
            type = 'wn8_estimates';
            break;
        default:
            type = 'error';
            break;
    }

    let url = '/api/' + type + '/' + data.server + '/' + data.accountID + '/' + data.timestamp + '/' + FILTERS + '/';
    return(url);
}

  // Add onclick event.
  activateRefreshButton(sDataObj, onclickFunc) {
    document.getElementById('refreshButton').addEventListener('click', function() {
      data[sDataObj] = null;
      onclickFunc();
    });
  }

}
class viewLogin extends view {
  draw() {

    let body = document.getElementsByTagName('body')[0];
    body.innerHTML = component.login();


    // Handling server buttons.
    let xbox = document.getElementById('xbox');
    let ps4 = document.getElementById('ps4');

    xbox.addEventListener('click', function() {
      data.server = 'xbox';
      xbox.classList.add('is-active');
      ps4.classList.remove('is-active');
    });

    ps4.addEventListener('click', function() {
      data.server = 'ps4';
      ps4.classList.add('is-active');
      xbox.classList.remove('is-active');
    });


    // Handling login button.
    let loginButton = document.getElementById('loginButton');
    loginButton.addEventListener('click', function() {


      loginButton.classList.add('is-loading');

      let nickname = document.getElementById("nickname").value;
      let server = data.server;
      data.nickname = nickname;

      // Server not specified handler.
      if (server === null) {
        loginButton.classList.remove('is-loading');
        alert('No server specified');
        return;
      }

      // Getting the url.
      let url;
      if (server == 'xbox') {
        url = "https://api-xbox-console.worldoftanks.com/wotx/account/list/?application_id=demo&search=" + nickname;
      } else {
        url = "https://api-ps4-console.worldoftanks.com/wotx/account/list/?application_id=demo&search=" + nickname;
      }

      // Fetching
      fetch(url)
        .then(function(response) {
          return response.json();
        })
        .then(function(j) {
          loginButton.classList.remove('is-loading');

          if ((j.status == 'ok') && (j.meta.count > 0)) {
            data.nickname = j.data[0].nickname;
            data.accountID = j.data[0].account_id;
            page.profile();
          } else if ((j.status == 'ok') && (j.meta.count === 0)) {
            alert('No such player found');
          } else if (j.status == 'error') {
            alert(j.error.message);
          }
        })
        .catch(function(error) {
          loginButton.classList.remove('is-loading');
          alert('There has been a problem with your fetch operation: ' + error.message);
        });

    });
  }
}
class viewProfile extends view {
  draw(sTabID) {

    const DATA_OBJ = 'profile';

    this.selectHeader('Profile');
    data.tabs = [
      {label: 'Dashboard', active: false, onclick: 'app.draw(\'Dashboard\');'},
      {label: 'In-Detail', active: false, onclick: 'app.draw(\'In-Detail\');'}
    ];
    this.selectTab(sTabID);


    let body = document.getElementsByTagName('body')[0];
    body.innerHTML = component.heroHeader() + component.nav() + component.controls();

    if (data[DATA_OBJ] === null) {
      let url = this.getURL(DATA_OBJ);
      let button = document.getElementById('refreshButton');
      button.classList.add('is-loading');
      fetch(url)
        .then(function(response) {
          return response.json();
        })
        .then(function(j) {
          button.classList.remove('is-loading');
          data[DATA_OBJ] = j.data;
          app.draw();
        })
        .catch(function(error) {
          button.classList.remove('is-loading');
          alert('There has been a problem with your fetch operation: ' + error.message);
        });
    } else if (sTabID == 'In-Detail') {
      body.innerHTML += component.inDetail();
      chart.OpenRadCh();
    }
    // Default tab.
    else {
      body.innerHTML += component.dashboard();
      chart.OpenPercCh();
      chart.OpenWN8Ch();
    }

    // Activating onclick events.
    this.activateRefreshButton('profile', page.profile);
  }
  refresh() {
    // Dummy
  }
}
class viewVehicles extends view {

  draw() {

    this.selectHeader('Vehicles');
    data.tabs = [];

    let body = document.getElementsByTagName('body')[0];
    body.innerHTML = component.heroHeader() + component.nav() + component.vControls();

    if (data.vehicles === null) {
      let url = this.getURL('vehicles');
      let button = document.getElementById('refreshButton');
      button.classList.add('is-loading');
      fetch(url)
        .then(function(response) {
          return response.json();
        })
        .then(function(j) {
          button.classList.remove('is-loading');
          data.vehicles = j.data;
          app.draw();
        })
        .catch(function(error) {
          button.classList.remove('is-loading');
          alert('There has been a problem with your fetch operation: ' + error.message);
        });
    } else {
      this.refresh();
    }
    // Activating onclick events.
    this.activateRefreshButton('vehicles', page.vehicles);
  }

  refresh(sHeaderID) {

    const TABLE_ID = 'table';

    // Removing the table.
    let element = document.getElementById(TABLE_ID);
    if (element !== null) {
        element.parentNode.removeChild(element);
    }

    this.makeArray(sHeaderID);
    document.getElementsByTagName('body')[0].innerHTML += this.makeTable(TABLE_ID);
    this.activateRefreshButton('vehicles', page.vehicles);
  }

  // Makes filtered array without headers.
  makeArray(sHeaderID) {

    const ACTIVE_SELECTORS = data.vSelectors.filter((x) => x.active === true).map((x) => x.id);
    this.headers = ['name'].concat(ACTIVE_SELECTORS);

    // Creating filtered array with tank names appended as first cell.
    let unsortedArray = [];
    data.vehicles.forEach((row) => {
      if (this.isFilteredOut(row) === false) {
        let tempList = [row.short_name];
        ACTIVE_SELECTORS.forEach((cell) => {
          tempList.push(row[cell]);
        });
        unsortedArray.push(tempList);
      }
    });


    // Looking for column to sort based on header id.
    let column_to_sort = 0;
    for(let h = 0; h < this.headers.length; h++) {
        if (this.headers[h] == sHeaderID) {
            column_to_sort = h;
            break;
        }
    }

    // Sorting.
    this.array = unsortedArray.sort(function(a,b) {
        return b[column_to_sort] - a[column_to_sort];
    });
  }

  // Returns "true" when the tank is not allowed by filters.
  isFilteredOut(oTank) {

      //// Filtering.
      if (data.filterBy50 === true) {
          if (oTank.battles < 50) {
              return(true);
          }
      }

      const ACTIVE = data.filters.filter((x) => x.active === true);
      const ACTIVE_TIERS = ACTIVE.filter((x) => x.type == 'tiers').map((x) => x.id );
      const ACTIVE_CLASSES = ACTIVE.filter((x) => x.type == 'class').map((x) => x.id );

      // Tank tier.
      if (!ACTIVE_TIERS.includes(String(oTank.tier))) {
          return(true);
      }

      // Tank class.
      if (!ACTIVE_CLASSES.includes(oTank.type)) {
          return(true);
      }
      return(false);
  }

  // array, formatCell -> getCell -> makeTable
  getCell(y, x) {

    const HEADERS_DICT = {
        "name": "Tank",

        "wr": "WinRate",
        "battles": "Battles",
        "wn8": "WN8",

        "avg_dmg": "Avg DMG",
        "avg_frags": "Avg Frags",
        "avg_exp": "Avg EXP",

        "avg_dpm": "Avg DPM",
        "avg_fpm": "Avg FPM",
        "avg_epm": "Avg EPM",

        "dmg_perc": "DMG Perc",
        "wr_perc": "WR Perc",
        "exp_perc": "EXP Perc",

        "pen_hits_ratio": "Penned",
        "bounced_hits_ratio": "Bounced",
        "survived": "Survived",

        "total_time_m": "Total Lifetime",
        "avg_lifetime_s": "Avg Lifetime",
        "last_time": "Last Battle"
    };

    // If header.
    if (y == 'header') {
      return(HEADERS_DICT[this.headers[x]]);
    }
    // If footer.
    else if (y == 'footer') {
      if (x === 0) {
        return('Average');
      }
      const ARRAY = this.array.map((item) => item[x]);
      const SUM = ARRAY.reduce((total, val) => total + val);
      const VALUE = SUM / ARRAY.length;
      return(this.formatCell(VALUE, x));
    }
    // If cell.
    else {
      const VALUE = this.array[y][x];
      return(this.formatCell(VALUE, x));
    }
  }

  // headers -> formatCell -> getCell
  formatCell(fValue, x) {

    const MONTHS_DICT = {
          "1": "Jan",
          "2": "Feb",
          "3": "Mar",
          "4": "Apr",

          "5": "May",
          "6": "Jun",
          "7": "Jul",

          "8": "Aug",
          "9": "Sep",
          "10": "Oct",

          "11": "Nov",
          "12": "Dec"
      };

    let output;
    switch (this.headers[x]) {
      // Percent with two decimals.
      case 'wr':
        output = Math.round(fValue * 100) / 100 + " %";
        break;
      case 'pen_hits_ratio':
      case 'bounced_hits_ratio':
      case 'survived':
        output = Math.round(fValue * 1000) / 10 + " %";
        break;
      // Integer.
      case 'wn8':
      case 'battles':
      case 'avg_dmg':
      case 'avg_exp':
      case 'avg_dpm':
      case 'avg_epm':
      case 'dmg_perc':
      case 'wr_perc':
      case 'exp_perc':
        output = Math.round(fValue);
        break;
      // Float with two decimals.
      case 'avg_frags':
      case 'avg_fpm':
        output = Math.round(fValue * 100) / 100;
        break;
      // Minutes.
      case 'total_time_m':
        output = Math.round(fValue) + 'm';
        break;
      // Minutes and seconds.
      case 'avg_lifetime_s':
        var minutes = parseInt(fValue / 60);
        var seconds = parseInt(fValue - minutes * 60);
        output = minutes + 'm ' + seconds + 's';
        break;
      // Last battle time.
      case 'last_time':
        var time = new Date(fValue * 1000);
        output = MONTHS_DICT[String(time.getMonth() + 1)] + ' ' + String(time.getDate());
        break;
      // Default.
      default:
        output = fValue;
    }
    return(output);
  }

  // getCell -> makeTable -> draw
  makeTable(sTableID) {

    const HEADERS = this.headers;

    let thead = '';
    let tfoot = '';
    for (let h=0; h<HEADERS.length; h++) {
      let onclick = `app.refresh('${ HEADERS[h] }');`;
      thead += `<th><a onclick="${ onclick }">${ this.getCell('header', h) }</a></th>`;
      tfoot += `<th>${ this.getCell('footer', h) }</th>`;
    }

    let tbody = '';
    for (let r = 0; r < this.array.length; r++) {
      let cells = '';
      for (let c = 0; c < this.array[r].length; c++) {
          cells += `<td> ${ this.getCell(r, c) } </td>`;
      }
      tbody += `<tr> ${ cells } </tr>`;
    }
    let html = `<div id='${ sTableID }' class='container'>
                <table class='table is-bordered is-narrow is-striped'>
                  <thead>
                    <tr>

                      ${ thead }

                    </tr>
                  </thead>

                  <tbody>

                    ${ tbody }

                  </tbody>

                  <tfoot>
                    <tr>

                      ${ tfoot }

                    </tr>
                  </tfoot>
                </table>
                </div>`;
    return(html);
  }

}
class viewTimeSeries extends view {

  draw(sTabID) {

    const DATA_OBJ = 'timeSeries';
    data.tabs = [
      {label: 'Daily Percentiles', active: false, onclick: 'app.draw(\'Daily Percentiles\');'},
      {label: 'WN8', active: false, onclick: 'app.draw(\'WN8\');'}
    ];

    this.selectHeader('Time Series');
    this.selectTab(sTabID);

    let body = document.getElementsByTagName('body')[0];
    body.innerHTML = component.heroHeader() + component.nav() + component.controls() + component.timeSeries();

    if (data[DATA_OBJ] === null) {
      let url = this.getURL(DATA_OBJ);
      let button = document.getElementById('refreshButton');
      button.classList.add('is-loading');
      fetch(url)
        .then(function(response) {
          return response.json();
        })
        .then(function(j) {
          button.classList.remove('is-loading');
          data[DATA_OBJ] = j.data;
          app.draw();
        })
        .catch(function(error) {
          button.classList.remove('is-loading');
          alert('There has been a problem with your fetch operation: ' + error.message);
        });
    } else if (sTabID == 'WN8') {
      chart.timeSeriesWN8();
    } else {
      chart.timeSeriesPerc();
    }
    // Activating onclick events.
    this.activateRefreshButton(DATA_OBJ, page.timeSeries);
  }

  refresh() {
    //Dummy
  }
}
class viewSessionTracker extends view {
  draw(sTabID) {

    const DATA_OBJ = 'sessionTracker';
    data.tabs = [];

    this.selectHeader('Session Tracker');

    let body = document.getElementsByTagName('body')[0];
    body.innerHTML = component.heroHeader() + component.nav() + component.stControls();

    if (data[DATA_OBJ] === null) {
      let url = this.getURL(DATA_OBJ);
      let button = document.getElementById('refreshButton');
      button.classList.add('is-loading');
      fetch(url)
        .then(function(response) {
          return response.json();
        })
        .then(function(j) {
          button.classList.remove('is-loading');
          data[DATA_OBJ] = j.data;
          app.draw();
        })
        .catch(function(error) {
          button.classList.remove('is-loading');
          alert('There has been a problem with your fetch operation: ' + error.message);
        });
    } else {
      // If exists, but empty.
      if ((data[DATA_OBJ].hasOwnProperty('session_tanks')) && (data[DATA_OBJ].session_tanks.length === 0)) {
        alert('No tanks were played');
      }

      // If exists, but not empty.
      if ((data[DATA_OBJ].hasOwnProperty('session_tanks')) && (data[DATA_OBJ].session_tanks.length > 0)) {
        app.refresh();
      }
    }
    // Activating onclick events.
    this.activateRefreshButton(DATA_OBJ, page.sessionTracker);
  }
  refresh(sTankID) {

    const ELEMENT_ID = 'sessionTracker';

    let body = document.getElementsByTagName('body')[0];
    let element = document.getElementById(ELEMENT_ID);

    if (element !== null) {
        element.parentNode.removeChild(element);
    }

    if (typeof(sTankID) == 'undefined') {
      sTankID = String(data.sessionTracker.session_tanks[0].tank_id);
    }

    body.innerHTML += component.sessionTracker(sTankID);

    let tank = data.sessionTracker.session_tanks.filter((x) => String(x.tank_id) == sTankID)[0];
    chart.stRadar(tank);
  }
}
class viewEstimates extends view {

  draw(sTabID) {

    const DATA_OBJ = 'wn8Estimates';
    data.tabs = [
      {label: 'WN8 Target Damage', active: false, onclick: 'app.draw(\'WN8 Target Damage\');'},
      {label: 'WN8 Player Values', active: false, onclick: 'app.draw(\'WN8 Player Values\');'}
    ];

    this.selectHeader('WN8 Estimates');
    this.selectTab(sTabID);

    let body = document.getElementsByTagName('body')[0];
    body.innerHTML = component.heroHeader() + component.nav() + component.controls();

    if (data[DATA_OBJ] === null) {
      let url = this.getURL(DATA_OBJ);
      let button = document.getElementById('refreshButton');
      button.classList.add('is-loading');
      fetch(url)
        .then(function(response) {
          return response.json();
        })
        .then(function(j) {
          button.classList.remove('is-loading');
          data[DATA_OBJ] = j.data;
          app.draw();
        })
        .catch(function(error) {
          button.classList.remove('is-loading');
          alert('There has been a problem with your fetch operation: ' + error.message);
        });
    } else {
      this.refresh();
    }
  }

  refresh(sHeaderID) {

    const TABLE_ID = 'table';
    const CURRENT_TAB = data.tabs.filter((x) => x.active === true).map((x) => x.label)[0];

    // Removing the table if exists.
    let element = document.getElementById(TABLE_ID);
    if (element !== null) {
        element.parentNode.removeChild(element);
    }

    // Preparing the data.
    if (CURRENT_TAB == 'WN8 Target Damage') {
      this.genTargetDamageArray();
    } else if (CURRENT_TAB == 'WN8 Player Values') {
      this.genWn8Stats();
    }

    this.sortCells(sHeaderID);

    let body = document.getElementsByTagName('body')[0];
    body.innerHTML += this.generateTable();

    // Activating onclick events.
    const DATA_OBJ = 'wn8Estimates';
    this.activateRefreshButton(DATA_OBJ, page.estimates);
  }

  // 1st tab.
  genTargetDamageArray() {

    const DATA = data.wn8Estimates;

    this.unsortedArray = [];
    this.headers = ["Tank", "300", "450", "650", "900", "1200", "1600", "2000", "2450", "2900", "Your Damage"];

    // Iterating through tanks.
    for(let item of DATA) {
      if (this.isFilteredOut(item) === false) {
        // Adding tank name by default.
        let row = [item.short_name];
        // Iterating through "dmgTargets".
        for(let target of item.dmgTargets) {
            row.push(target);
        }
        row.push(Math.round(item.Damage));
        this.unsortedArray.push(row);
      }
    }
  }
  // 2nd tab
  genWn8Stats() {

    const DATA = data.wn8Estimates;

    this.unsortedArray = [];
    this.headers = ["Tank", "WinRate", "expWinRate", "Damage", "expDamage", "Frag", "expFrag", "Def", "expDef", "Spot", "expSpot"];

    const DATA_IDS = ["WinRate", "expWinRate", "Damage", "expDamage", "Frag", "expFrag", "Def", "expDef", "Spot", "expSpot"];

    for(let item of DATA) {
      if (this.isFilteredOut(item) === false) {
        // Adding tank name by default.
        let row = [item.short_name];
        // Iterate through headers.
        for(let id of DATA_IDS) {
            let cell = item[id];
            row.push(Math.round(cell * 100) / 100);
        }
        this.unsortedArray.push(row);
      }
    }
  }

  // Returns "true" when the tank is not allowed by filters.
  isFilteredOut(oTank) {

      const ACTIVE = data.filters.filter((x) => x.active === true);
      const ACTIVE_TIERS = ACTIVE.filter((x) => x.type == 'tiers').map((x) => x.id );
      const ACTIVE_CLASSES = ACTIVE.filter((x) => x.type == 'class').map((x) => x.id );

      // Tank tier.
      if (!ACTIVE_TIERS.includes(String(oTank.tier))) {
          return(true);
      }

      // Tank class.
      if (!ACTIVE_CLASSES.includes(oTank.type)) {
          return(true);
      }
      return(false);
  }

  sortCells(sHeaderID) {
    // Looking for column to sort.
    let columnToSort = 0;
    for(let h = 0; h < this.headers.length; h++) {
        if (this.headers[h] == sHeaderID) {
            columnToSort = h;
            break;
        }
    }
    // Sorting.
    this.sortedArray = this.unsortedArray.sort(function(a,b) {
        return b[columnToSort] - a[columnToSort];
    });
  }
  generateTable() {

    const TABLE_ID = 'table';
    const HEADERS = this.headers;
    const DATA = this.sortedArray;

    let thead = '';
    HEADERS.forEach((header) => {
      let onclick = `onclick="app.refresh('${ header }')"`;
      thead += `<th><a ${ onclick }> ${ header } </a></th>`;
    });

    let tbody = '';
    DATA.forEach((row) => {
      let cellStr = '';
      row.forEach((cell) => {
        cellStr += `<td>${cell}</td>`;
      });
      tbody += `<tr>${ cellStr }</tr>`;
    });

    let html = `<div id='${ TABLE_ID }' class='container'>
                    <table class='table'>
                      <thead>
                        <tr>

                          ${ thead }

                        </tr>
                      </thead>
                      <tbody>

                        ${ tbody }

                      </tbody>
                    </table>
                  </div>`;
    return(html);
  }
}
class viewAbout extends view {

  draw(sTabID) {

    data.tabs = [];
    this.selectHeader('About');
    let body = document.getElementsByTagName('body')[0];
    body.innerHTML = component.heroHeader() + component.nav() + component.about();
  }
}

// Update Google Analytics
function googleTrack(sPageName) {
  if (typeof(ga) == 'function') {
    ga('set', 'page', sPageName);
    ga('send', 'pageview');
  }
}

// Initializing.
var app;
page.login();
