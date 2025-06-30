const chart = LightweightCharts.createChart(document.getElementById('chart'), {
  layout: { background: { color: '#111' }, textColor: '#DDD' },
  grid: { vertLines: { color: '#333' }, horzLines: { color: '#333' } },
  timeScale: { timeVisible: true, barSpacing: 10 },
  crosshair: { mode: 1 },
});

const candles = chart.addCandlestickSeries();
const spreadMA = chart.addLineSeries({ color: 'orange', lineWidth: 2 });

const ema50Series = chart.addLineSeries({ color: 'white', lineWidth: 1 });
const ema100Series = chart.addLineSeries({ color: 'gold', lineWidth: 1 });
const ema200Series = chart.addLineSeries({ color: 'pink', lineWidth: 1 });

const csvUrl = 'https://btc-logger-trxi.onrender.com/data.csv';

fetch(csvUrl)
  .then(res => {
    if (!res.ok) throw new Error(`HTTP error! Status: ${res.status}`);
    return res.text();
  })
  .then(text => {
    const rows = text.trim().split('\n');
    const headers = rows.shift().split(',');

    const tsIndex = headers.indexOf('timestamp');
    const priceIndex = headers.indexOf('price');
    const spreadIndex = headers.indexOf('spread');

    const rawData = [];

    for (let i = 0; i < rows.length; i++) {
      const cells = rows[i].split(',');
      const time = Math.floor(new Date(cells[tsIndex]).getTime() / 1000);
      const price = parseFloat(cells[priceIndex]);
      const spread = parseFloat(cells[spreadIndex]);

      rawData.push({ time, price, spread });
    }

    // Group into 5-minute candles
    const candleData = [];
    const spreadData = [];

    const grouped = {};
    for (const row of rawData) {
      const roundedTime = Math.floor(row.time / 300) * 300; // group by 5 minutes
      if (!grouped[roundedTime]) {
        grouped[roundedTime] = {
          time: roundedTime,
          open: row.price,
          high: row.price,
          low: row.price,
          close: row.price,
          spreads: [row.spread],
        };
      } else {
        grouped[roundedTime].high = Math.max(grouped[roundedTime].high, row.price);
        grouped[roundedTime].low = Math.min(grouped[roundedTime].low, row.price);
        grouped[roundedTime].close = row.price;
        grouped[roundedTime].spreads.push(row.spread);
      }
    }

    for (const t of Object.keys(grouped).sort((a, b) => a - b)) {
      const bar = grouped[t];
      candleData.push({
        time: bar.time,
        open: bar.open,
        high: bar.high,
        low: bar.low,
        close: bar.close,
      });

      const avgSpread =
        bar.spreads.reduce((sum, val) => sum + val, 0) / bar.spreads.length;

      spreadData.push({
        time: bar.time,
        value: avgSpread,
      });
    }

    // EMA calculation function
    function calculateEMA(data, period) {
      const ema = [];
      let multiplier = 2 / (period + 1);
      let prevEma = data[0].value;

      for (let i = 0; i < data.length; i++) {
        const current = data[i].value;
        if (i === 0) {
          ema.push({ time: data[i].time, value: current });
        } else {
          prevEma = (current - prevEma) * multiplier + prevEma;
          ema.push({ time: data[i].time, value: prevEma });
        }
      }

      return ema;
    }

    const ema50 = calculateEMA(spreadData, 50);
    const ema100 = calculateEMA(spreadData, 100);
    const ema200 = calculateEMA(spreadData, 200);

    candles.setData(candleData);
    spreadMA.setData(spreadData);
    ema50Series.setData(ema50);
    ema100Series.setData(ema100);
    ema200Series.setData(ema200);

    chart.timeScale().fitContent();
  })
  .catch(err => {
    console.error('Chart load error:', err);
    alert('Error loading data from CSV. Check console.');
  });
