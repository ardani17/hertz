(function () {
  'use strict';

  const dataNode = document.getElementById('dashboard-data');
  const root = document.getElementById('dashboard-root');
  const accountSwitcher = document.getElementById('account-switcher');
  const monthSelector = document.getElementById('month-selector');
  const generatedAt = document.getElementById('generated-at');
  const SVG_NS = 'http://www.w3.org/2000/svg';
  const PAGE_SIZE = 12;

  let dashboardData = { accounts: [] };
  try {
    dashboardData = JSON.parse(dataNode.textContent || '{"accounts":[]}');
  } catch (error) {
    dashboardData = { accounts: [], parseError: error.message };
  }

  const state = {
    accountId: null,
    monthKey: null,
    page: 1,
  };

  function asNumber(value) {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : 0;
  }

  function money(value) {
    const num = asNumber(value);
    const sign = num > 0 ? '+' : '';
    return sign + num.toFixed(2);
  }

  function percent(value) {
    return asNumber(value).toFixed(1) + '%';
  }

  function moneyClass(value) {
    const num = asNumber(value);
    if (num > 0) return 'good';
    if (num < 0) return 'bad';
    return 'warn';
  }

  function list(value) {
    return Array.isArray(value) ? value : [];
  }

  function el(tag, options, children) {
    const node = document.createElement(tag);
    const opts = options || {};
    if (opts.className) node.className = opts.className;
    if (opts.text !== undefined) node.textContent = String(opts.text);
    if (opts.htmlTitle !== undefined) node.title = String(opts.htmlTitle);
    if (opts.value !== undefined) node.value = String(opts.value);
    if (opts.disabled !== undefined) node.disabled = Boolean(opts.disabled);
    if (opts.selected !== undefined) node.selected = Boolean(opts.selected);
    if (opts.type) node.type = opts.type;
    if (opts.ariaLabel) node.setAttribute('aria-label', opts.ariaLabel);
    if (opts.colSpan) node.colSpan = opts.colSpan;
    if (opts.onClick) node.addEventListener('click', opts.onClick);
    for (const child of list(children)) {
      node.append(child && child.nodeType ? child : document.createTextNode(String(child ?? '')));
    }
    return node;
  }

  function svg(tag, attrs, children) {
    const node = document.createElementNS(SVG_NS, tag);
    for (const [key, value] of Object.entries(attrs || {})) {
      node.setAttribute(key, String(value));
    }
    for (const child of list(children)) node.append(child);
    return node;
  }

  function metric(label, value, className, note, sparkline) {
    const children = [
      el('p', { className: 'label', text: label }),
      el('div', { className: 'metric-value num ' + (className || ''), text: value }),
    ];
    if (note) children.push(el('p', { className: 'small', text: note }));
    if (sparkline) children.push(sparkline);
    return el('article', { className: 'panel metric-card' }, children);
  }

  function getAccount() {
    const accounts = list(dashboardData.accounts);
    return accounts.find((account) => account.id === state.accountId) || accounts[0] || null;
  }

  function getMonth(account) {
    const months = list(account && account.months);
    return months.find((month) => month.key === state.monthKey) || months[0] || null;
  }

  function linePath(points) {
    if (!points.length) return '';
    if (points.length === 1) return 'M ' + points[0].x + ' ' + points[0].y;
    let path = 'M ' + points[0].x + ' ' + points[0].y;
    for (let index = 0; index < points.length - 1; index += 1) {
      const current = points[index];
      const next = points[index + 1];
      const controlX = (current.x + next.x) / 2;
      path += ' Q ' + controlX + ' ' + current.y + ', ' + next.x + ' ' + next.y;
    }
    return path;
  }

  function sparkline(values, tone) {
    const clean = list(values).map(asNumber).filter(Number.isFinite);
    if (!clean.length) return el('div', { className: 'small', text: 'Belum cukup data' });

    const width = 220;
    const height = 58;
    const pad = 5;
    const min = Math.min(...clean);
    const max = Math.max(...clean);
    const range = max - min || 1;
    const step = clean.length === 1 ? 0 : (width - pad * 2) / (clean.length - 1);
    const points = clean.map((value, index) => ({
      x: pad + step * index,
      y: pad + ((max - value) / range) * (height - pad * 2),
    }));
    const colors = tone === 'bad'
      ? ['rgba(255, 107, 138, 0.18)', '#ff6b8a']
      : tone === 'good'
        ? ['rgba(85, 214, 190, 0.18)', '#55d6be']
        : ['rgba(90, 167, 255, 0.16)', '#5aa7ff'];
    const polyPoints = points.map((point) => point.x + ',' + point.y).join(' ');
    const area = pad + ',' + (height - pad) + ' ' + polyPoints + ' ' + (width - pad) + ',' + (height - pad);

    return svg('svg', { class: 'sparkline', viewBox: '0 0 ' + width + ' ' + height, preserveAspectRatio: 'none' }, [
      svg('polyline', { points: area, fill: colors[0], stroke: 'none' }),
      svg('polyline', { points: polyPoints, fill: 'none', stroke: colors[1], 'stroke-width': 2.4, 'stroke-linecap': 'round' }),
    ]);
  }

  function trendChart(month) {
    const positions = list(month.positions);
    if (!positions.length) return el('div', { className: 'empty-state', text: 'Belum ada posisi tertutup di bulan ini.' });

    let cumulative = 0;
    const width = 920;
    const height = 320;
    const padX = 46;
    const padY = 28;
    const points = positions.map((position, index) => {
      cumulative += asNumber(position.net_profit);
      return {
        index: index + 1,
        cumulative,
        net: asNumber(position.net_profit),
        openTime: position.open_time || '',
        symbol: position.symbol || '',
        side: position.side || '',
        lot: asNumber(position.lot),
      };
    });
    const values = points.map((point) => point.cumulative);
    const min = Math.min(...values, 0);
    const max = Math.max(...values, 0);
    const range = max - min || 1;
    const step = points.length === 1 ? 0 : (width - padX * 2) / (points.length - 1);
    const plotted = points.map((point, index) => ({
      ...point,
      x: padX + step * index,
      y: padY + ((max - point.cumulative) / range) * (height - padY * 2),
    }));
    const path = linePath(plotted);
    const zeroY = padY + ((max - 0) / range) * (height - padY * 2);
    const areaPath = path + ' L ' + (width - padX) + ' ' + zeroY + ' L ' + padX + ' ' + zeroY + ' Z';
    const tickEvery = Math.max(1, Math.ceil(plotted.length / 7));
    const ticks = plotted.filter((_, index) => index % tickEvery === 0 || index === plotted.length - 1);

    const defs = svg('defs', {}, [
      svg('linearGradient', { id: 'trendFill', x1: 0, x2: 0, y1: 0, y2: 1 }, [
        svg('stop', { offset: '0%', 'stop-color': '#5aa7ff', 'stop-opacity': 0.26 }),
        svg('stop', { offset: '100%', 'stop-color': '#5aa7ff', 'stop-opacity': 0.02 }),
      ]),
    ]);

    const children = [
      defs,
      svg('rect', { x: 0, y: 0, width, height, rx: 10, fill: 'rgba(8,17,31,0.74)' }),
      svg('line', { x1: padX, y1: zeroY, x2: width - padX, y2: zeroY, stroke: 'rgba(155,184,224,0.22)', 'stroke-dasharray': '4 5' }),
      svg('path', { d: areaPath, fill: 'url(#trendFill)' }),
      svg('path', { d: path, fill: 'none', stroke: '#5aa7ff', 'stroke-width': 4, 'stroke-linecap': 'round', 'stroke-linejoin': 'round' }),
    ];

    plotted.forEach((point) => {
      const circle = svg('circle', {
        cx: point.x,
        cy: point.y,
        r: 4.5,
        fill: point.net >= 0 ? '#55d6be' : '#ff6b8a',
        stroke: '#07111f',
        'stroke-width': 2,
      }, []);
      const title = svg('title');
      title.textContent = '#' + point.index + ' | ' + point.openTime + ' | ' + point.symbol + ' ' + point.side + ' ' + point.lot.toFixed(2) + ' | Net ' + money(point.net) + ' | Cum ' + money(point.cumulative);
      circle.append(title);
      children.push(circle);
    });

    ticks.forEach((point) => {
      const label = svg('text', { x: point.x, y: height - 9, 'text-anchor': 'middle', fill: '#9fb0ca', 'font-size': 11 });
      label.textContent = '#' + point.index;
      children.push(label);
    });

    return svg('svg', { class: 'trend-svg', viewBox: '0 0 ' + width + ' ' + height, preserveAspectRatio: 'none' }, children);
  }

  function trendStats(month) {
    const positions = list(month.positions);
    if (!positions.length) return el('div');
    const cumulative = positions.map((position) => asNumber(position.cumulative_net));
    const last = cumulative[cumulative.length - 1] || 0;
    const peak = Math.max(...cumulative);
    const low = Math.min(...cumulative);
    const avg = positions.reduce((sum, position) => sum + asNumber(position.net_profit), 0) / Math.max(1, positions.length);
    return el('div', { className: 'trend-stats' }, [
      metric('Last close', money(last), moneyClass(last)),
      metric('Peak', money(peak), 'good'),
      metric('Deepest pullback', money(low), 'bad'),
      metric('Avg / trade', money(avg), moneyClass(avg)),
    ]);
  }

  function pnlCalendar(month) {
    const days = list(month.dailyBreakdown);
    if (!days.length) return el('div', { className: 'empty-state', text: 'Belum ada data harian.' });

    const parts = String(month.key || '').split('-').map(Number);
    const year = parts[0];
    const monthNum = parts[1];
    const firstWeekday = new Date(year, monthNum - 1, 1).getDay();
    const daysInMonth = new Date(year, monthNum, 0).getDate();
    const dayMap = new Map(days.map((day) => [Number(String(day.date).slice(-2)), day]));
    const maxAbs = Math.max(...days.map((day) => Math.abs(asNumber(day.net))), 1);
    const weekNames = ['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab'];
    const cells = [];

    for (let index = 0; index < firstWeekday; index += 1) {
      cells.push(el('div', { className: 'day-cell empty' }));
    }

    for (let day = 1; day <= daysInMonth; day += 1) {
      const item = dayMap.get(day);
      const cell = el('div', { className: 'day-cell' }, [el('div', { className: 'day-num', text: day })]);
      if (!item) {
        cell.append(el('div', { className: 'day-pnl muted', text: '0.00' }), el('div', { className: 'day-trades', text: '0 posisi' }));
      } else {
        const net = asNumber(item.net);
        const heat = Math.min(0.42, 0.08 + Math.abs(net) / maxAbs * 0.28);
        const tone = net >= 0 ? '85, 214, 190' : '255, 107, 138';
        cell.style.background = 'linear-gradient(180deg, rgba(' + tone + ',' + heat + '), rgba(8,17,31,0.72))';
        cell.style.borderColor = 'rgba(' + tone + ', 0.35)';
        cell.append(
          el('div', { className: 'day-pnl num ' + moneyClass(net), text: money(net) }),
          el('div', { className: 'day-trades', text: asNumber(item.count) + ' posisi' }),
        );
      }
      cells.push(cell);
    }

    return el('div', {}, [
      el('div', { className: 'calendar-head' }, weekNames.map((name) => el('div', { text: name }))),
      el('div', { className: 'calendar-grid' }, cells),
    ]);
  }

  function table(headers, rows, emptyText) {
    const thead = el('thead', {}, [
      el('tr', {}, headers.map((header) => el('th', { text: header }))),
    ]);
    const tbodyRows = rows.length
      ? rows.map((row) => el('tr', {}, row.map((cell) => cell && cell.nodeType ? cell : el('td', { text: cell }))))
      : [el('tr', {}, [el('td', { colSpan: headers.length, className: 'muted', text: emptyText || 'Belum ada data' })])];
    return el('div', { className: 'table-wrap' }, [el('table', {}, [thead, el('tbody', {}, tbodyRows)])]);
  }

  function td(text, className) {
    return el('td', { text: text, className: className || '' });
  }

  function renderSwitcher(account) {
    accountSwitcher.replaceChildren(...list(dashboardData.accounts).map((item) => {
      const isActive = item.id === account.id;
      const summary = item.overallSummary || {};
      const button = el('button', {
        className: 'account-btn' + (isActive ? ' active' : ''),
        type: 'button',
        ariaLabel: 'Pilih akun ' + (item.label || item.login),
        onClick: () => {
          state.accountId = item.id;
          state.monthKey = null;
          state.page = 1;
          render();
        },
      }, [
        el('span', { className: 'account-topline' }, [
          el('span', { className: 'account-label', text: item.label || item.login }),
          el('span', { className: 'account-status', text: isActive ? 'Selected' : (item.status || 'Tracked') }),
        ]),
        el('strong', { className: 'account-login num', text: item.login || item.id }),
        el('span', { className: 'account-mini-grid' }, [
          el('span', {}, [el('small', { text: 'Balance' }), el('b', { className: 'num ' + moneyClass(summary.estimated_balance), text: money(summary.estimated_balance) })]),
          el('span', {}, [el('small', { text: 'Net P/L' }), el('b', { className: 'num ' + moneyClass(summary.net_profit), text: money(summary.net_profit) })]),
          el('span', {}, [el('small', { text: 'Trades' }), el('b', { className: 'num', text: asNumber(summary.total_closed_positions).toFixed(0) })]),
        ]),
      ]);
      return button;
    }));
  }

  function renderMonths(account, activeMonth) {
    const months = list(account.months);
    monthSelector.replaceChildren(...months.map((month) => el('option', {
      value: month.key,
      selected: activeMonth && month.key === activeMonth.key,
      text: month.label || month.key,
    })));
    monthSelector.disabled = !months.length;
  }

  function renderProfile(account) {
    const profile = account.profile || {};
    const rows = [
      ['Trader profile', profile.traderProfile],
      ['Real loss budget', profile.realLossBudget],
      ['Buying power', profile.buyingPower],
      ['Account structure', profile.accountStructure],
      ['Main instrument', profile.mainInstrument],
      ['Main issues', profile.mainIssues],
      ['Overall positions', account.overallSummary && account.overallSummary.total_closed_positions],
      ['Overall net P/L', money(account.overallSummary && account.overallSummary.net_profit)],
    ];
    return el('ul', { className: 'profile-list' }, rows.map((row) => el('li', {}, [
      el('span', { text: row[0] }),
      el('span', { className: row[0].includes('P/L') ? 'num ' + moneyClass(account.overallSummary && account.overallSummary.net_profit) : '', text: row[1] || '-' }),
    ])));
  }

  function renderDaily(month) {
    const rows = list(month.dailyBreakdown).map((day) => [
      td(day.date, 'num'),
      td(asNumber(day.count).toFixed(0), 'num'),
      td(money(day.net), 'num ' + moneyClass(day.net)),
      td(percent(day.winRate), 'num'),
      td(asNumber(day.maxLot).toFixed(2), 'num ' + (asNumber(day.maxLot) >= 0.1 ? 'bad' : '')),
      td(day.read || '-'),
    ]);
    return table(['Date', 'Positions', 'Net P/L', 'Win rate', 'Max lot', 'Read'], rows, 'Belum ada breakdown harian.');
  }

  function renderSymbols(month) {
    const rows = list(month.bySymbol).map((item) => [
      td(item.symbol || '-', ''),
      td(asNumber(item.count).toFixed(0), 'num'),
      td(money(item.net), 'num ' + moneyClass(item.net)),
      td(percent(item.winRate), 'num'),
      td(asNumber(item.maxLot).toFixed(2), 'num ' + (asNumber(item.maxLot) >= 0.1 ? 'bad' : '')),
    ]);
    return table(['Symbol', 'Positions', 'Net P/L', 'Win rate', 'Max lot'], rows, 'Belum ada data simbol.');
  }

  function renderCashflow(month) {
    const rows = list(month.balanceEvents).map((event) => [
      td(event.time || '-', 'num'),
      td(event.type || '-', ''),
      td(money(event.amount), 'num ' + moneyClass(event.amount)),
      td(event.comment || '-', ''),
    ]);
    return table(['Time', 'Flow', 'Amount', 'Comment'], rows, 'Belum ada funding atau withdrawal bulan ini.');
  }

  function renderPositions(account, month) {
    const all = list(month.recentPositions);
    const totalPages = Math.max(1, Math.ceil(all.length / PAGE_SIZE));
    state.page = Math.min(Math.max(1, state.page), totalPages);
    const start = (state.page - 1) * PAGE_SIZE;
    const pageRows = all.slice(start, start + PAGE_SIZE);
    const from = all.length ? start + 1 : 0;
    const to = Math.min(all.length, start + pageRows.length);

    const rows = pageRows.map((pos) => [
      td(pos.sequence || '-', 'num'),
      td((account.label || account.login) + ' / ' + (account.login || '-'), ''),
      td(pos.open_time || '-', 'num'),
      td(pos.symbol || '-', ''),
      td(pos.side || '-', ''),
      td(asNumber(pos.lot).toFixed(2), 'num'),
      td(money(pos.net_profit), 'num ' + moneyClass(pos.net_profit)),
      td(money(pos.cumulative_net), 'num ' + moneyClass(pos.cumulative_net)),
    ]);

    const prev = el('button', { className: 'page-btn', type: 'button', text: 'Prev', disabled: state.page <= 1, onClick: () => { state.page -= 1; render(); } });
    const next = el('button', { className: 'page-btn', type: 'button', text: 'Next', disabled: state.page >= totalPages, onClick: () => { state.page += 1; render(); } });

    return el('div', {}, [
      el('div', { className: 'table-toolbar' }, [
        el('p', { className: 'muted', text: from + '-' + to + ' dari ' + all.length + ' posisi' }),
        el('div', { className: 'pagination' }, [prev, next]),
      ]),
      table(['#', 'Account', 'Open time', 'Symbol', 'Side', 'Lot', 'Net P/L', 'Cumulative'], rows, 'Belum ada posisi tertutup.'),
    ]);
  }

  function renderTradeList(title, items, kind) {
    return el('section', { className: 'panel pad' }, [
      el('h2', { text: title }),
      el('ul', { className: 'plain-list' }, (list(items).length ? list(items) : [{ open_time: 'Belum ada data', symbol: '', side: '', lot: 0, net_profit: 0 }]).map((item) => {
        const value = item.symbol
          ? [item.open_time, item.symbol, item.side, asNumber(item.lot).toFixed(2), money(item.net_profit)].filter(Boolean).join(' | ')
          : item.open_time;
        return el('li', { className: kind ? kind : '', text: value });
      })),
    ]);
  }

  function renderDashboard(account, month) {
    const summary = month.summary || {};
    const overall = account.overallSummary || {};
    const tradeCurve = list(month.positions).map((position) => asNumber(position.cumulative_net));
    const dailyCurve = list(month.dailyBreakdown).map((day) => asNumber(day.net));
    let cashRunning = 0;
    const cashCurve = list(month.balanceEvents).map((event) => {
      cashRunning += asNumber(event.amount);
      return cashRunning;
    });
    const monthCashflow = list(month.balanceEvents).reduce((sum, event) => sum + asNumber(event.amount), 0);
    const worstDay = list(month.dailyBreakdown).slice().sort((a, b) => asNumber(a.net) - asNumber(b.net))[0];

    root.replaceChildren(el('div', { className: 'dashboard-grid' }, [
      el('section', { className: 'summary-grid' }, [
        el('article', { className: 'panel primary-panel' }, [
          el('div', { className: 'panel-head' }, [
            el('div', {}, [
              el('p', { className: 'label', text: 'Account' }),
              el('h2', { text: account.label || account.login }),
              el('p', { className: 'muted num', text: 'Login ' + (account.login || '-') }),
            ]),
            el('span', { className: 'status-chip', text: account.status || 'Tracked' }),
          ]),
          el('div', {}, [
            el('p', { className: 'label', text: 'Estimated balance' }),
            el('div', { className: 'metric-value num ' + moneyClass(overall.estimated_balance), text: money(overall.estimated_balance) }),
            el('p', { className: 'small', text: 'Funding ' + money(overall.balance_adjustments_total) + ' | Realized P/L ' + money(overall.net_profit) }),
            sparkline(tradeCurve, asNumber(overall.net_profit) >= 0 ? 'good' : 'bad'),
          ]),
        ]),
        metric('Month net P/L', money(summary.net_profit), moneyClass(summary.net_profit), 'Closed ' + asNumber(summary.total_closed_positions).toFixed(0) + ' positions', sparkline(dailyCurve, asNumber(summary.net_profit) >= 0 ? 'good' : 'bad')),
        metric('Win rate', percent(summary.win_rate), 'warn', asNumber(summary.winning_positions).toFixed(0) + ' win / ' + asNumber(summary.losing_positions).toFixed(0) + ' loss'),
        metric('Cashflow', money(monthCashflow), moneyClass(monthCashflow), 'Deposit ' + money(summary.deposit_total) + ' | WD ' + money(-1 * asNumber(summary.withdrawal_total)), sparkline(cashCurve.length ? cashCurve : [0], monthCashflow >= 0 ? 'warn' : 'bad')),
      ]),
      el('section', { className: 'summary-grid' }, [
        metric('Median lot', asNumber(summary.median_lot).toFixed(2), '', 'Lot tengah bulan aktif'),
        metric('Max lot', asNumber(summary.max_lot).toFixed(2), asNumber(summary.max_lot) >= 0.1 ? 'bad' : '', 'Puncak size posisi'),
        metric('Worst day', worstDay ? worstDay.date : '-', 'bad', worstDay ? money(worstDay.net) + ' from ' + asNumber(worstDay.count).toFixed(0) + ' positions' : 'Belum ada data'),
        metric('Loss streak', asNumber(summary.max_loss_streak).toFixed(0), asNumber(summary.max_loss_streak) >= 5 ? 'bad' : 'warn', 'Consecutive closed positions'),
      ]),
      el('section', { className: 'split-grid' }, [
        el('article', { className: 'panel pad' }, [el('h2', { text: 'Profile snapshot' }), renderProfile(account)]),
        el('article', { className: 'panel pad' }, [
          el('h2', { text: 'Current read' }),
          el('ul', { className: 'plain-list' }, list(month.quickRead).map((item) => el('li', { text: item }))),
          el('p', { className: 'footer-note', text: account.footer || '' }),
        ]),
      ]),
      el('section', { className: 'viz-grid' }, [
        el('article', { className: 'panel pad chart-shell' }, [el('h2', { text: 'Cumulative PnL' }), trendStats(month), trendChart(month)]),
        el('article', { className: 'panel pad' }, [el('h2', { text: 'PnL calendar' }), pnlCalendar(month)]),
      ]),
      el('section', { className: 'table-grid' }, [
        el('article', { className: 'panel pad' }, [el('h2', { text: 'Daily breakdown' }), renderDaily(month)]),
        el('article', { className: 'panel pad' }, [el('h2', { text: 'By symbol' }), renderSymbols(month)]),
      ]),
      el('section', { className: 'panel pad' }, [el('h2', { text: 'Funding and withdrawal' }), renderCashflow(month)]),
      el('section', { className: 'panel pad' }, [el('h2', { text: 'Recent closed positions' }), renderPositions(account, month)]),
      el('section', { className: 'table-grid' }, [
        renderTradeList('Discipline alerts', list(month.disciplineFlags).length ? month.disciplineFlags.map((flag) => ({ open_time: flag })) : [], ''),
        el('div', { className: 'dashboard-grid' }, [
          renderTradeList('Best wins', month.topWins, 'good'),
          renderTradeList('Worst losses', month.topLosses, 'bad'),
        ]),
      ]),
    ]));
  }

  function render() {
    if (dashboardData.parseError) {
      root.replaceChildren(el('div', { className: 'empty-state', text: 'Data dashboard tidak bisa dibaca: ' + dashboardData.parseError }));
      return;
    }

    const accounts = list(dashboardData.accounts);
    if (!accounts.length) {
      root.replaceChildren(el('div', { className: 'empty-state', text: 'Belum ada histori akun yang berhasil diparse.' }));
      accountSwitcher.replaceChildren();
      monthSelector.replaceChildren();
      return;
    }

    const account = getAccount();
    state.accountId = account.id;
    const month = getMonth(account);
    renderSwitcher(account);
    renderMonths(account, month);

    if (!month) {
      root.replaceChildren(el('div', { className: 'empty-state', text: 'Akun ini belum punya data bulanan.' }));
      return;
    }

    state.monthKey = month.key;
    try {
      renderDashboard(account, month);
    } catch (error) {
      root.replaceChildren(el('div', { className: 'empty-state', text: 'Dashboard render failed: ' + (error && error.message ? error.message : String(error)) }));
      throw error;
    }
  }

  generatedAt.textContent = dashboardData.generatedAt
    ? 'Generated ' + new Date(dashboardData.generatedAt).toLocaleString('id-ID')
    : 'Generated time unavailable';

  monthSelector.addEventListener('change', (event) => {
    state.monthKey = event.target.value;
    state.page = 1;
    render();
  });

  try {
    render();
  } catch (error) {
    root.replaceChildren(el('div', { className: 'empty-state', text: 'Dashboard boot failed: ' + (error && error.message ? error.message : String(error)) }));
    throw error;
  }

  if (asNumber(dashboardData.autoReloadSeconds) > 0) {
    window.setInterval(() => window.location.reload(), asNumber(dashboardData.autoReloadSeconds) * 1000);
  }
}());
